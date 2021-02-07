import { prefersReducedMotion } from './mediaquery';
import { ShaderCanvasPlugin } from './plugins/shader-canvas-plugin';
import { TexturePlugin } from './plugins/texture-plugin';
import { Stopwatch } from './stopwatch';

export type ShaderCanvasBuffer = {
  buffer: WebGLBuffer;
  recordSize: number;
  attribLoc: number;
  data: Float32Array;
};

export type ShaderCanvasTexture = {
  src: string;
  idx: number;
  name: string;
  options?: Record<string, any>;
};

const HEADER = 'precision highp float;';
const DEFAULT_VERT =
  HEADER + 'attribute vec4 position;void main(){gl_Position=position;}';
const DEFAULT_FRAG = HEADER + 'void main(){gl_FragColor=vec4(1.,0,0,1.);}';

export class ShaderCanvas extends HTMLElement {
  buffers: Record<string, ShaderCanvasBuffer> = {};
  prefersReducedMotion: MediaQueryList;
  canvas: HTMLCanvasElement | null;
  gl: WebGLRenderingContext | WebGL2RenderingContext | null;
  program: WebGLProgram | null;
  frame: number = -1;
  count: number = 0;
  fragCode: string = '';
  vertCode: string = '';
  fragShader: WebGLShader | null;
  vertShader: WebGLShader | null;
  watch: Stopwatch;
  activePlugins: ShaderCanvasPlugin[];

  constructor() {
    super();
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.prefersReducedMotion = prefersReducedMotion();
    this.fragShader = null;
    this.vertShader = null;
    this.activePlugins = [];
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
    this.onChangeReducedMotion = this.onChangeReducedMotion.bind(this);
    this.frame = -1;
    this.watch = new Stopwatch();
  }

  static plugins = [TexturePlugin];

  static register() {
    if (typeof customElements.get('shader-canvas') === 'undefined') {
      customElements.define('shader-canvas', ShaderCanvas);
    }
  }

  static get observedAttributes() {
    return ['play-state', 'autoplay'];
  }

  connectedCallback() {
    if (!this.gl) {
      this.setup();
    }
  }

  disconnectedCallback() {
    this.dispose();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'play-state' && this.gl) {
      this._updatePlaystate();
    }
    if (name === 'autoplay' && this.gl) {
      this.playState = 'running';
    }
  }

  get devicePixelRatio() {
    return (
      parseFloat(this.getAttribute('dpr') || '') || window.devicePixelRatio
    );
  }

  set playState(state: 'running' | 'stopped') {
    this.setAttribute('play-state', state);
  }

  get playState(): 'running' | 'stopped' {
    return this.getAttribute('play-state') === 'stopped'
      ? 'stopped'
      : 'running';
  }

  set autoPlay(value: boolean) {
    if (value) {
      this.setAttribute('autoplay', '');
    } else {
      this.removeAttribute('autoplay');
    }
  }

  get autoPlay(): boolean {
    return this.hasAttribute('autoplay');
  }

  private _updatePlaystate() {
    const { prefersReducedMotion } = this;
    if (
      (this.playState === 'stopped' || prefersReducedMotion.matches) &&
      this.frame > -1
    ) {
      const frame = this.frame;
      this.frame = -1;
      cancelAnimationFrame(frame);
      this.watch.stop();
    }
    if (
      this.playState === 'running' &&
      prefersReducedMotion.matches === false &&
      this.frame === -1
    ) {
      this.frame = requestAnimationFrame(this.renderLoop);
      this.watch.start();
    }
  }

  /**
   * Called when the window is resized.
   */
  onResize() {
    const { canvas, gl, program } = this;
    const width = this.clientWidth;
    const height = this.clientHeight;
    const dpr = this.devicePixelRatio;
    if (canvas && gl && program) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      const uResolution = gl.getUniformLocation(program, 'resolution');
      gl.uniform2fv(uResolution, [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      ]);
      this.render();
    }
  }

  setMouse(x: number, y: number) {
    const { gl, program } = this;
    if (gl && program) {
      const uMouse = gl.getUniformLocation(program, 'mouse');
      gl.uniform2fv(uMouse, [x, y]);
    }
  }

  onMouseMove(e: MouseEvent) {
    const aspectRatio = this.clientWidth / this.clientHeight;
    this.setMouse(
      (e.clientX / this.clientWidth - 0.5) * aspectRatio,
      0.5 - e.clientY / this.clientHeight
    );
  }

  onChangeReducedMotion() {
    this._updatePlaystate();
  }

  private createShader(type: number, code: string): WebGLShader | null {
    const { gl } = this;
    if (!gl) {
      return null;
    }
    const sh = gl.createShader(type);
    if (!sh) {
      return null;
    }
    gl.shaderSource(sh, code);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(sh);
    }
    return sh;
  }

  private addBuffer(
    name: string,
    recordSize: number,
    data: Float32Array
  ): void {
    const { gl, program } = this;
    if (!gl || !program) {
      throw Error('addBuffer failed: gl context not initialized.');
    }
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw Error('gl.createBuffer failed.');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const attribLoc = gl.getAttribLocation(program, name);
    this.buffers[name] = { buffer, data, attribLoc, recordSize };
    gl.enableVertexAttribArray(attribLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribLoc, recordSize, gl.FLOAT, false, 0, 0);
  }

  private createBuffers() {
    const bufferScripts = [...this.querySelectorAll('[type=buffer]')];
    this.buffers = {};
    let count = -1;
    bufferScripts.forEach((container) => {
      const name = container.getAttribute('name') || 'position';
      const recordSize =
        parseInt(container.getAttribute('data-size') || '1', 10) || 1;
      const data = new Float32Array(
        JSON.parse((container.textContent || '').trim())
      );
      count = Math.max(count, (data.length / recordSize) | 0);
      this.addBuffer(name, recordSize, data);
    });
    if (typeof this.buffers.position === 'undefined') {
      // add a position buffer if no position buffer provided.
      this.addBuffer(
        'position',
        2,
        new Float32Array([-1, -1, -1, 1, 1, -1, 1, -1, 1, 1, -1, 1])
      );
      count = 6; // 6 2D coords for 2 triangles.
    }
    this.count = count;
  }

  render() {
    const { gl, program, watch } = this;
    if (!gl || !program) {
      throw Error('render failed: gl context not initialized.');
    }
    const uTime = gl.getUniformLocation(program, 'time');
    const time = watch.elapsedTime;
    gl.uniform1f(uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, this.count);
  }

  private renderLoop() {
    this.render();
    this.frame = requestAnimationFrame(this.renderLoop);
  }

  private createPrograms() {
    const { gl } = this;
    if (!gl) {
      throw Error('render failed: gl context not initialized.');
    }
    const fragScript = this.querySelector('[type=frag]');
    const vertScript = this.querySelector('[type=vert]');

    this.fragCode = fragScript?.textContent || DEFAULT_FRAG;
    this.vertCode = vertScript?.textContent || DEFAULT_VERT;

    const program = gl.createProgram();
    if (!program) {
      throw Error('createProgram failed.');
    }
    this.program = program;
    this.gl = gl;

    this.fragShader = this.createShader(gl.FRAGMENT_SHADER, this.fragCode);
    this.vertShader = this.createShader(gl.VERTEX_SHADER, this.vertCode);
    if (!this.fragShader || !this.vertShader) {
      throw Error('createShader failed.');
    }
    gl.attachShader(program, this.fragShader);
    gl.attachShader(program, this.vertShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(program);
    }
    gl.useProgram(program);
  }

  private setup() {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    this.canvas = canvas;
    this.appendChild(this.canvas);
    //@ts-ignore
    this.gl =
      this.canvas.getContext('webgl') ||
      this.canvas.getContext('experimental-webgl');
    this.createPrograms();
    this.createBuffers();
    for (const Plugin of ShaderCanvas.plugins) {
      if (this.canvas && this.gl && this.program) {
        const plug = new Plugin();
        this.activePlugins.push(plug);
        plug.setup(this, this.gl, this.program, this.canvas);
      }
    }
    this.onResize();
    window.addEventListener('resize', this.onResize, false);
    window.addEventListener('mousemove', this.onMouseMove, false);
    this.prefersReducedMotion = prefersReducedMotion();
    this.render();
    if (this.autoPlay) {
      this.playState = 'running';
    }
    this.prefersReducedMotion?.addEventListener(
      'change',
      this.onChangeReducedMotion,
      false
    );
  }

  reinitialize() {
    this.deleteProgramAndBuffers();
    this.createPrograms();
    this.createBuffers();
    this.onResize();
  }

  private deleteProgramAndBuffers() {
    if (!this.gl) {
      throw Error('no gl context initialized');
    }
    Object.entries(this.buffers).forEach(([_name, buf]) => {
      if (this.gl) {
        this.gl.deleteBuffer(buf.buffer);
      }
    });
    this.gl.deleteProgram(this.program);
  }

  private dispose() {
    if (this.frame > -1) {
      cancelAnimationFrame(this.frame);
    }
    this.frame = -1;
    if (this.prefersReducedMotion) {
      this.prefersReducedMotion.removeEventListener(
        'change',
        this.onChangeReducedMotion,
        false
      );
    }
    this.watch.reset();
    for (const activePlug of this.activePlugins) {
      activePlug.dispose();
    }
    window.removeEventListener('resize', this.onResize, false);
    window.removeEventListener('mousemove', this.onMouseMove, false);
    this.deleteProgramAndBuffers();

    if (this.gl) {
      const loseCtx = this.gl.getExtension('WEBGL_lose_context');
      if (loseCtx && typeof loseCtx.loseContext === 'function') {
        loseCtx.loseContext();
      }
      this.gl = null;
    }

    if (this.canvas) {
      this.removeChild(this.canvas);
      this.canvas = null;
    }

    this.buffers = {};
  }
}

ShaderCanvas.register();
