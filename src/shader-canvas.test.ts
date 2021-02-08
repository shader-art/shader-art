import { ShaderCanvasPlugin } from './plugins/shader-canvas-plugin';
import './shader-canvas';
import { ShaderCanvas } from './shader-canvas';
import './test-utils/browser-shims';
import {
  setMediaQuery,
  resetMediaQueryListeners,
} from './test-utils/browser-shims';

class DummyPlugin implements ShaderCanvasPlugin {
  name = 'DummyPlugin';
  registered = false;

  setup(): void {
    this.registered = true;
  }

  dispose(): void {
    this.registered = false;
  }
}

describe('shader-canvas tests without any configuration', () => {
  beforeAll(() => ShaderCanvas.register([() => new DummyPlugin()]));

  beforeEach(() => {
    resetMediaQueryListeners();
    const element = document.createElement('shader-canvas');
    element.setAttribute('autoplay', '');
    document.body.appendChild(element);
  });

  afterEach(() => {
    const element = document.querySelector('shader-canvas');
    if (element) {
      element.remove();
    }
  });

  test('shader-canvas creates a canvas element', () => {
    const element = document.querySelector('shader-canvas');
    expect(element).toBeDefined();
    const canvas = element?.querySelector('canvas');
    expect(canvas).toBeDefined();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  test('shader-canvas creates a WebGLRenderingContext', () => {
    const element = document.querySelector('shader-canvas');
    expect(element).toBeDefined();
    const shaderCanvasElement = <ShaderCanvas>element;
    expect(shaderCanvasElement.gl).toBeInstanceOf(WebGLRenderingContext);
  });

  test('shader-canvas registers specified plugins', () => {
    const element = document.querySelector('shader-canvas');
    expect(element).toBeDefined();
    const shaderCanvasElement = <ShaderCanvas>element;
    const dummyPlugin = shaderCanvasElement.activePlugins.find(
      (p) => p.name === 'DummyPlugin'
    );
    expect(dummyPlugin).toBeDefined();
    expect(dummyPlugin).toBeInstanceOf(DummyPlugin);
    expect((<DummyPlugin>dummyPlugin)?.registered).toBe(true);
  });

  test('shader-canvas creates a position buffer', () => {
    const element = document.querySelector('shader-canvas');
    expect(element).toBeDefined();
    const shaderCanvasElement = <ShaderCanvas>element;
    expect(shaderCanvasElement.buffers).toBeDefined();
    expect(shaderCanvasElement.buffers.position).toBeDefined();
    // by default, shader-canvas creates buffer data
    // containing 6 values with recordSize 2 providing coordinates for two triangles
    // filling the canvas
    expect(shaderCanvasElement.buffers.position.recordSize).toBe(2);
    expect(shaderCanvasElement.buffers.position.data.length).toBe(12);
  });

  test('shader-canvas creates a position buffer', () => {
    const element = document.querySelector('shader-canvas');
    expect(element).toBeDefined();
    const shaderCanvasElement = <ShaderCanvas>element;
    expect(shaderCanvasElement.buffers).toBeDefined();
    expect(shaderCanvasElement.buffers.position).toBeDefined();
    // by default, shader-canvas creates buffer data
    // containing 6 values with recordSize 2 providing coordinates for two triangles
    // filling the canvas
    expect(shaderCanvasElement.buffers.position.recordSize).toBe(2);
    expect(shaderCanvasElement.buffers.position.data.length).toBe(12);
  });

  test('shader-canvas prefers-reduced-motion stops animation', () => {
    const element = document.querySelector('shader-canvas');
    expect(element).toBeDefined();
    const shaderCanvasElement = <ShaderCanvas>element;
    expect(shaderCanvasElement.playState).toBe('running');

    // enable reduced motion
    setMediaQuery(true);
    expect(shaderCanvasElement.watch.running).toBe(false);

    // disable reduced motion
    setMediaQuery(false);
    expect(shaderCanvasElement.watch.running).toBe(true);
  });

  test('shader-canvas renders without crashing', () => {
    const element = document.querySelector('shader-canvas');
    expect(element).toBeDefined();
    const shaderCanvasElement = <ShaderCanvas>element;
    expect(() => {
      shaderCanvasElement.render();
    }).not.toThrow();
  });
});

describe('shader-canvas tests with buffers, vertex and fragment shader', () => {
  beforeEach(() => {
    resetMediaQueryListeners();
    const element = document.createElement('shader-canvas');
    element.setAttribute('dpr', '1');
    element.innerHTML = `
      <script type="buffer" name="position" data-size="2">[-1, -1, -1, 1, 1, -1]</script>
      <script type="buffer" name="luckynumber">[1,2,3]</script>
      <script type="vert">void main(){ gl_Position = position; }</script>
      <script type="frag">void main(){ gl_FragColor = vec4(1.,0,0,1.); }</script>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    const element = document.querySelector('shader-canvas');
    if (element) {
      element.remove();
    }
  });

  test('shader-canvas creates a WebGLRenderingContext', () => {
    const element = document.querySelector('shader-canvas');
    expect(element).toBeDefined();
    const shaderCanvasElement = <ShaderCanvas>element;
    expect(shaderCanvasElement.gl).toBeInstanceOf(WebGLRenderingContext);
  });

  test('shader-canvas creates a position buffer and a luckynumber buffer', () => {
    const element = document.querySelector('shader-canvas');
    expect(element).toBeDefined();
    const shaderCanvasElement = <ShaderCanvas>element;
    expect(shaderCanvasElement.buffers).toBeDefined();
    expect(shaderCanvasElement.buffers.position).toBeDefined();
    expect(shaderCanvasElement.buffers.luckynumber).toBeDefined();
    expect(shaderCanvasElement.buffers.position.recordSize).toBe(2);
    expect(shaderCanvasElement.buffers.position.data.length).toBe(6);
    expect(shaderCanvasElement.buffers.luckynumber.recordSize).toBe(1);
    expect(shaderCanvasElement.buffers.luckynumber.data.length).toBe(3);
    expect(shaderCanvasElement.count).toBe(3);
  });
});
