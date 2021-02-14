import { ShaderArtPlugin } from '@shader-art/plugin-base';
import './shader-art';
import { ShaderArt } from './shader-art';
import './test-utils/browser-shims';
import {
  setMediaQuery,
  resetMediaQueryListeners,
} from './test-utils/browser-shims';

class DummyPlugin implements ShaderArtPlugin {
  name = 'DummyPlugin';
  registered = false;

  setup(): void {
    this.registered = true;
  }

  dispose(): void {
    this.registered = false;
  }
}

describe('shader-art tests without any configuration', () => {
  beforeAll(() => ShaderArt.register([() => new DummyPlugin()]));

  beforeEach(() => {
    resetMediaQueryListeners();
    const element = document.createElement('shader-art');
    element.setAttribute('autoplay', '');
    document.body.appendChild(element);
  });

  afterEach(() => {
    const element = document.querySelector('shader-art');
    if (element) {
      element.remove();
    }
  });

  test('shader-art creates a canvas element', () => {
    const element = document.querySelector('shader-art');
    expect(element).toBeDefined();
    const canvas = element?.querySelector('canvas');
    expect(canvas).toBeDefined();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  test('shader-art creates a WebGLRenderingContext', () => {
    const element = document.querySelector('shader-art');
    expect(element).toBeDefined();
    const shaderArtElement = <ShaderArt>element;
    expect(shaderArtElement.gl).toBeInstanceOf(WebGLRenderingContext);
  });

  test('shader-art registers specified plugins', () => {
    const element = document.querySelector('shader-art');
    expect(element).toBeDefined();
    const shaderArtElement = <ShaderArt>element;
    const dummyPlugin = shaderArtElement.activePlugins.find(
      (p) => p.name === 'DummyPlugin'
    );
    expect(dummyPlugin).toBeDefined();
    expect(dummyPlugin).toBeInstanceOf(DummyPlugin);
    expect((<DummyPlugin>dummyPlugin)?.registered).toBe(true);
  });

  test('shader-art creates a position buffer', () => {
    const element = document.querySelector('shader-art');
    expect(element).toBeDefined();
    const shaderArtElement = <ShaderArt>element;
    expect(shaderArtElement.buffers).toBeDefined();
    expect(shaderArtElement.buffers.position).toBeDefined();
    // by default, shader-art creates buffer data
    // containing 6 values with recordSize 2 providing coordinates for two triangles
    // filling the canvas
    expect(shaderArtElement.buffers.position.recordSize).toBe(2);
    expect(shaderArtElement.buffers.position.data.length).toBe(12);
  });

  test('shader-art creates a position buffer', () => {
    const element = document.querySelector('shader-art');
    expect(element).toBeDefined();
    const shaderArtElement = <ShaderArt>element;
    expect(shaderArtElement.buffers).toBeDefined();
    expect(shaderArtElement.buffers.position).toBeDefined();
    // by default, shader-art creates buffer data
    // containing 6 values with recordSize 2 providing coordinates for two triangles
    // filling the canvas
    expect(shaderArtElement.buffers.position.recordSize).toBe(2);
    expect(shaderArtElement.buffers.position.data.length).toBe(12);
  });

  test('shader-art prefers-reduced-motion stops animation', () => {
    const element = document.querySelector('shader-art');
    expect(element).toBeDefined();
    const shaderArtElement = <ShaderArt>element;
    expect(shaderArtElement.playState).toBe('running');

    // enable reduced motion
    setMediaQuery(true);
    expect(shaderArtElement.watch.running).toBe(false);

    // disable reduced motion
    setMediaQuery(false);
    expect(shaderArtElement.watch.running).toBe(true);
  });

  test('shader-art renders without crashing', () => {
    const element = document.querySelector('shader-art');
    expect(element).toBeDefined();
    const shaderArtElement = <ShaderArt>element;
    expect(() => {
      shaderArtElement.render();
    }).not.toThrow();
  });
});

describe('shader-art tests with buffers, vertex and fragment shader', () => {
  beforeEach(() => {
    resetMediaQueryListeners();
    const element = document.createElement('shader-art');
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
    const element = document.querySelector('shader-art');
    if (element) {
      element.remove();
    }
  });

  test('shader-art creates a WebGLRenderingContext', () => {
    const element = document.querySelector('shader-art');
    expect(element).toBeDefined();
    const shaderArtElement = <ShaderArt>element;
    expect(shaderArtElement.gl).toBeInstanceOf(WebGLRenderingContext);
  });

  test('shader-art creates a position buffer and a luckynumber buffer', () => {
    const element = document.querySelector('shader-art');
    expect(element).toBeDefined();
    const shaderArtElement = <ShaderArt>element;
    expect(shaderArtElement.buffers).toBeDefined();
    expect(shaderArtElement.buffers.position).toBeDefined();
    expect(shaderArtElement.buffers.luckynumber).toBeDefined();
    expect(shaderArtElement.buffers.position.recordSize).toBe(2);
    expect(shaderArtElement.buffers.position.data.length).toBe(6);
    expect(shaderArtElement.buffers.luckynumber.recordSize).toBe(1);
    expect(shaderArtElement.buffers.luckynumber.data.length).toBe(3);
    expect(shaderArtElement.count).toBe(3);
  });
});
