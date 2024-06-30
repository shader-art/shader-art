import { ShaderArtPlugin } from '@shader-art/plugin-base';

import { prefersReducedMotion } from './mediaquery';
import { Stopwatch } from './stopwatch';
import { h, fragment, renderTree } from './jsx-factory';
import styles from 'inline:./shader-art.css';

export type ShaderArtBuffer = {
	buffer: WebGLBuffer;
	recordSize: number;
	attribLoc: number;
	data: Float32Array;
};

const HEADER = 'precision highp float;';
const DEFAULT_VERT =
	HEADER + 'attribute vec4 position;void main(){gl_Position=position;}';
const DEFAULT_FRAG = HEADER + 'void main(){gl_FragColor=vec4(1.,0,0,1.);}';

export class ShaderArt extends HTMLElement {
	buffers: Record<string, ShaderArtBuffer> = {};
	prefersReducedMotion: MediaQueryList;
	canvas: HTMLCanvasElement | null = null;
	initialized = false;
	gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
	program: WebGLProgram | null = null;
	frame = -1;
	count = 0;
	fragShader: WebGLShader | null = null;
	vertShader: WebGLShader | null = null;
	watch: Stopwatch;
	activePlugins: ShaderArtPlugin[] = [];
	
	controlsContainer: HTMLElement|null = null;
	playButton: HTMLButtonElement|null = null;
	pauseButton: HTMLButtonElement|null = null;

	constructor() {
		super();
		this.prefersReducedMotion = prefersReducedMotion();
		this.onResize = this.onResize.bind(this);
		this.renderLoop = this.renderLoop.bind(this);
		this.onChangeReducedMotion = this.onChangeReducedMotion.bind(this);
		this.frame = -1;
		this.watch = new Stopwatch();
	}

	static plugins: (() => ShaderArtPlugin)[] = [];

	static register(plugins: (() => ShaderArtPlugin)[] = []): void {
		ShaderArt.plugins = plugins;
		if (typeof customElements.get('shader-art') === 'undefined') {
			customElements.define('shader-art', ShaderArt);
		}
	}

	static get observedAttributes(): string[] {
		return ['play-state', 'autoplay', 'controls'];
	}

	connectedCallback(): void {
		if (!this.gl) {
			this.setup();
		}
	}

	disconnectedCallback(): void {
		this.dispose();
	}

	attributeChangedCallback(name: string): void {
		if (name === 'play-state' && this.gl) {
			this._updatePlaystate();
		}
		if (name === 'autoplay' && this.gl && this.prefersReducedMotion.matches === false) {
			this.playState = 'running';
		}
		if (name === 'controls') {
			this._updateControls();
		}
	}

	play = () => {
		this.playState = 'running';
	}

	pause = () => {
		this.playState = 'stopped';
	}

	get fragCode(): string {
		const fragScript = this.querySelector('[type="text/frag"], [type=frag]');
		return (fragScript?.textContent || DEFAULT_FRAG).trim();
	}

	get vertCode(): string {
		const vertScript = this.querySelector('[type="text/vert"], [type=vert]');
		return (vertScript?.textContent || DEFAULT_VERT).trim();
	}

	get webgl2(): boolean {
		return this.fragCode.includes('#version 300 es');
	}

	get devicePixelRatio(): number {
		return Math.min(
			parseFloat(this.getAttribute('dpr') || '1'),
			window.devicePixelRatio
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

	private _updatePlaystate(): void {
		if (
			(this.playState === 'stopped') &&
			this.frame > -1
		) {
			const frame = this.frame;
			this.frame = -1;
			cancelAnimationFrame(frame);
			this.watch.stop();
		}
		if (
			this.playState === 'running' &&
			this.frame === -1
		) {
			this.frame = requestAnimationFrame(this.renderLoop);
			this.watch.start();
		}
	}

	/**
	 * Called when the window is resized.
	 */
	onResize(): void {
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

	onChangeReducedMotion(): void {
		if (this.prefersReducedMotion.matches) {
			this.pause();
		}
		if (this.prefersReducedMotion.matches === false && this.autoPlay) {
			this.play();
		}
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

	private createBuffers(): void {
		const bufferScripts = [...this.querySelectorAll('[type="text/buffer"], [type=buffer]')];
		this.buffers = {};
		let count = -1;
		bufferScripts.forEach((container) => {
			const name = container.getAttribute('id') || container.getAttribute('name') || 'position';
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

	render(): void {
		const { gl, program, watch, initialized, canvas } = this;
		if (!gl || !program || !initialized || !canvas) {
			return;
				}
		const uTime = gl.getUniformLocation(program, 'time');
		const time = watch.elapsedTime * 1e-3;
		for (const plugin of this.activePlugins) {
			if (plugin.onFrame) {
				plugin.onFrame(this, gl, program, canvas);
			}
		}
		gl.uniform1f(uTime, time);
		gl.drawArrays(gl.TRIANGLES, 0, this.count);
	}

	private renderLoop(): void {
		this.render();
		this.frame = requestAnimationFrame(this.renderLoop);
	}

	private createPrograms(): void {
		const { gl } = this;
		if (!gl) {
			throw Error('render failed: gl context not initialized.');
		}
		const shaders = {
			fragmentShader: this.fragCode,
			vertexShader: this.vertCode,
		};
		for (const plugin of this.activePlugins) {
			if (plugin.onBeforeCompileShader) {
				plugin.onBeforeCompileShader(shaders);
			}
		}
		const program = gl.createProgram();
		if (!program) {
			throw Error('createProgram failed.');
		}
		this.program = program;
		this.fragShader = this.createShader(
			gl.FRAGMENT_SHADER,
			shaders.fragmentShader
		);
		this.vertShader = this.createShader(gl.VERTEX_SHADER, shaders.vertexShader);
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

	private setup(): void {
		if (this.gl && !this.gl.isContextLost()) {
			return;
		}
		this.attachShadow({mode: 'open'});
		const stylesheet = new CSSStyleSheet();
		stylesheet.replaceSync(styles);
		this.shadowRoot!.adoptedStyleSheets = [stylesheet];
		const canvas = document.createElement('canvas');
		this.canvas = canvas;
		this.shadowRoot!.appendChild(this.canvas);
		if (this.webgl2) {
			this.gl = this.canvas.getContext('webgl2');
		} else {
			this.gl =
				this.canvas.getContext('webgl') ||
				(this.canvas.getContext('experimental-webgl') as WebGLRenderingContext);
		}

		if (!this.gl) {
			throw new Error('WebGL not supported');
		}
		this.activatePlugins();
		this.createPrograms();
		this.createBuffers();
		this.prefersReducedMotion = prefersReducedMotion();

		this.setupActivePlugins().then(() => {
			this.initialized = true;
			this.onResize();
		});

		this.addEventListeners();
		if (this.autoPlay) {
			this.playState = 'running';
		}
	}

	private addEventListeners(): void {
		window.addEventListener('resize', this.onResize, false);
		this.prefersReducedMotion?.addEventListener(
			'change',
			this.onChangeReducedMotion,
			false
		);
	}

	private deactivatePlugins(): void {
		for (const activePlug of this.activePlugins) {
			activePlug.dispose();
		}
	}

	private activatePlugins(): void {
		for (const pluginFactory of ShaderArt.plugins) {
			const plugin = pluginFactory();
			if (!this.activePlugins.find((item) => item.name === plugin.name)) {
				this.activePlugins.push(plugin);
			}
		}
	}

	/**
	 * Calls the setup method on each plugin
	 * @returns a Promise
	 */
	private setupActivePlugins(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.gl || !this.program || !this.canvas) {
				reject(Error('WebGL not initialized'));
				return;
			}
			const queue: Promise<void>[] = [];
			for (const plugin of this.activePlugins) {
				const retVal = plugin.setup(this, this.gl, this.program, this.canvas);
				if (retVal instanceof Promise) {
					queue.push(retVal);
				}
			}
			Promise.all(queue)
				.then(() => {
					resolve();
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	reinitialize(): void {
		this.deactivatePlugins();
		this.deleteProgramAndBuffers();
		this.createPrograms();
		this.createBuffers();
		this.activatePlugins();
		this.onResize();
	}

	private deleteProgramAndBuffers(): void {
		if (!this.gl) {
			throw Error('no gl context initialized');
		}
		Object.entries(this.buffers).forEach(([_, buf]) => {
			if (this.gl) {
				this.gl.deleteBuffer(buf.buffer);
			}
		});
		this.gl.deleteProgram(this.program);
	}

	private createControls() {
		const fragment = new DocumentFragment();
		renderTree(fragment,
			<button type="button" class="play">
				<span aria-hidden="true">▶</span>
				<span>Play</span>
			</button>
		);
		this.shadowRoot?.appendChild(fragment);
		this.controls = this.shadowRoot.querySelector('.controls')
		this.playButton = this.shadowRoot.querySelector('button.play');
		this.stopButton = this.shadowRoot.querySelector('button.pause');
		this.playButton!.addEventListener('click', this.play, false);
		this.pauseButton!.addEventListener('click', this.pause, false);
	}
	
	private removeControls() {
		this.playButton?
			.removeEventListener('click',this.play, false );
		this.pauseButton?
			.removeEventListener('click', this.pause, false);
		this.controls?.remove();
		
		this.playButton = null;
		this.pauseButton = null;
		this.controls = null;
	}

	private dispose(): void {
		if (this.frame > -1) {
			cancelAnimationFrame(this.frame);
		}
		this.frame = -1;
		this.initialized = false;
		if (this.prefersReducedMotion) {
			this.prefersReducedMotion.removeEventListener(
				'change',
				this.onChangeReducedMotion,
				false
			);
		}
		this.watch.reset();
		this.deactivatePlugins();
		window.removeEventListener('resize', this.onResize, false);
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
