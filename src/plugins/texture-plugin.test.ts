import { ShaderCanvasPlugin } from './shader-canvas-plugin';
import { TexturePlugin, TexturePluginFactory } from './texture-plugin';
import { ShaderCanvas } from '../shader-canvas';
import '../test-utils/browser-shims';

const html = (x: any) => x;

function asynced(fn: (...args: any[]) => void, timeout = 0): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      fn();
      resolve();
    }, timeout);
  });
}

const testTexture = (
  name = 'texture',
  src = 'https://placekitten.com/128/128',
  idx = 0
) => `<sc-texture
  src="${src}"
  name="${name}"
  idx="${idx}"
  wrap-s="clamp-to-edge"
  wrap-t="clamp-to-edge"
  min-filter="nearest"
  mag-filter="nearest"
></sc-texture>`;

const vertexShader = html`
  <script type="vert">
    precision highp float;
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
  </script>
`;

const fragmentShader = html`
  <script type="frag">
    precision highp float;
    uniform vec2 resolution;
    unifrom texture2D texture;
    void main() {
      vec2 p = gl_FragCoord.xy / resolution;
      gl_FragColor = texture2D(texture, p);
    }
  </script>
`;

const createShaderCanvas = (html: string): ShaderCanvas => {
  const element = document.createElement('shader-canvas');
  element.setAttribute('autoplay', '');
  element.innerHTML = html;
  document.body.appendChild(element);
  return element as ShaderCanvas;
};

class ImageMockOnLoad extends Image {
  constructor(width?: number, height?: number) {
    super(width, height);
  }
  _src = '';
  set src(value: string) {
    /* TODO doesnt work :( */
    this._src = value;
    // mimic image CDN behavior, a url ending with /:width/:height
    // returns an image with the according width and height
    const sizeRoute = /(\d+)\/(\d+)\/?$/;
    setTimeout(() => {
      const matches = value.match(sizeRoute);
      if (matches) {
        this.width = parseInt(matches[1], 10);
        this.height = parseInt(matches[2], 10);
      }
      const ev = new Event('load');
      this.dispatchEvent(ev);
    }, 50);
  }

  get src() {
    return this._src;
  }
}

describe('TexturePlugin tests', () => {
  const originalImage = global.Image;

  beforeAll(() => {
    global.Image = ImageMockOnLoad;
    ShaderCanvas.register([TexturePluginFactory]);
  });

  afterAll(() => {
    global.Image = originalImage;
  });

  test('shader-canvas has loaded the TexturePlugin', () => {
    expect(ShaderCanvas.plugins).toContain(TexturePluginFactory);
  });

  test('test if the test environment supports loading images', async () => {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.src = 'https://placekitten.com/128/128';
      img.onload = () => {
        resolve();
      };
      img.onerror = () => {
        reject();
      };
    });
  });

  test('test if the test environment supports MutationObserver', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    let mutated = false;
    const observer = new MutationObserver(() => {
      mutated = true;
    });
    observer.observe(div, { subtree: true, childList: true });
    const p = document.createElement('p');
    p.textContent = 'Hi';
    div.appendChild(p);
    await asynced(() => {}, 0);
    expect(mutated).toBe(true);
  });

  test('shader-canvas creation', () => {
    const element = createShaderCanvas(
      testTexture() + vertexShader + fragmentShader
    );
    expect(element).toBeDefined();
    expect(element.canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(
      element.activePlugins.map((p: ShaderCanvasPlugin) => p.name)
    ).toContain('TexturePlugin');
  });

  test('shader-canvas defines a texture', async () => {
    const element = createShaderCanvas(
      testTexture() + vertexShader + fragmentShader
    );
    const texturePlugin = element.activePlugins.find(
      (p) => p.name === 'TexturePlugin'
    );
    expect(texturePlugin).toBeDefined();
    expect(texturePlugin).toBeInstanceOf(TexturePlugin);
    await (<TexturePlugin>texturePlugin).whenImagesLoaded();
    const textureState = (<TexturePlugin>texturePlugin)?.textureState;
    expect(Object.keys(textureState)).toContain('texture');
  });

  test('shader-canvas defines a texture, and then updates it when the src attrib is changed', async () => {
    const element = createShaderCanvas(
      testTexture() + vertexShader + fragmentShader
    );
    const texturePlugin = element.activePlugins.find(
      (p) => p.name === 'TexturePlugin'
    );
    expect(texturePlugin).toBeDefined();
    expect(texturePlugin).toBeInstanceOf(TexturePlugin);
    await (<TexturePlugin>texturePlugin).whenImagesLoaded();
    const textureState = (<TexturePlugin>texturePlugin)?.textureState;
    expect(Object.keys(textureState)).toContain('texture');

    const scTexture = element.querySelector('sc-texture');
    expect(scTexture).toBeDefined();
    scTexture?.setAttribute('src', 'https://lorempicsum.com/128/128');
    await asynced(() => {}, 0);
    expect((<TexturePlugin>texturePlugin).imagesLoaded).toBe(false);
    await (<TexturePlugin>texturePlugin).whenImagesLoaded();
    const newTextureState = (<TexturePlugin>texturePlugin)?.textureState;
    expect(Object.keys(newTextureState)).toContain('texture');
    expect(newTextureState.texture.src).toBe('https://lorempicsum.com/128/128');
  });

  test('shader-canvas defines a texture and then loads another one when the dom is modified afterwards', async () => {
    const element = createShaderCanvas(vertexShader + fragmentShader);
    const texturePlugin = element.activePlugins.find(
      (p) => p.name === 'TexturePlugin'
    );
    expect(texturePlugin).toBeDefined();
    expect(texturePlugin).toBeInstanceOf(TexturePlugin);
    await (<TexturePlugin>texturePlugin).whenImagesLoaded();
    const scTexture = document.createElement('sc-texture');

    scTexture.setAttribute('src', 'https://placekitten.com/128/128');
    scTexture.setAttribute('name', 'texture');
    scTexture.setAttribute('idx', '0');
    element.appendChild(scTexture);
    await asynced(() => {}, 0);
    expect((<TexturePlugin>texturePlugin).imagesLoaded).toBe(false);
    await (<TexturePlugin>texturePlugin).whenImagesLoaded();
    const textureState = (<TexturePlugin>texturePlugin)?.textureState;
    expect(Object.keys(textureState)).toContain('texture');
  });

  afterEach(() => {
    const sc = document.querySelector('shader-canvas');
    if (sc) {
      sc.remove();
    }
  });
});
