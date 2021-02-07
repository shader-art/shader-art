import { loadImage } from '../utils/image-loader';
import { ShaderCanvasPlugin } from './shader-canvas-plugin';

export interface ShaderCanvasTexture {
  src: string;
  idx: number;
  name: string;
  options?: Record<string, string>;
}

export interface ShaderCanvasTextureState extends ShaderCanvasTexture {
  image: HTMLImageElement;
  uniformLoc: WebGLUniformLocation | null;
  texture: WebGLTexture | null;
}

export class TexturePlugin implements ShaderCanvasPlugin {
  initialized = false;
  observer: MutationObserver | null = null;

  textureState: Record<string, ShaderCanvasTextureState> = {};

  hostElement: HTMLElement | null = null;
  gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  program: WebGLProgram | null = null;
  canvas: HTMLCanvasElement | null = null;

  constructor() {}

  public setup(
    hostElement: HTMLElement,
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram,
    canvas: HTMLCanvasElement
  ) {
    this.hostElement = hostElement;
    this.gl = gl;
    this.program = program;
    this.canvas = canvas;
    // The texture plugin looks for <sc-texture> elements
    this.observer = new MutationObserver((mutations) => {
      const enter: ShaderCanvasTexture[] = [];
      const update: ShaderCanvasTexture[] = [];
      for (const mutation of mutations) {
        if (mutation.target instanceof HTMLElement) {
          if (mutation.type === 'attributes') {
            // a texture got updated
            update.push(this.getTextureMetaData(mutation.target));
          }
          if (mutation.type === 'childList') {
            // a new texture was added
            enter.push(this.getTextureMetaData(mutation.target));
          }
          this.uploadTextures(enter, update);
        }
      }
    });
    this.observer.observe(this.hostElement, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ['src'],
    });
    const enter = [
      ...this.hostElement.querySelectorAll('sc-texture'),
    ].map((element) => this.getTextureMetaData(element as HTMLElement));
    this.uploadTextures(enter, []);
  }

  public dispose() {
    if (!this.gl) {
      return;
    }
    for (const tex of Object.values(this.textureState)) {
      if (tex.texture !== null) {
        this.gl.deleteTexture(tex.texture);
      }
    }
    this.textureState = {};
    this.observer?.disconnect();
  }

  private getTextureMetaData(element: HTMLElement): ShaderCanvasTexture {
    const attribs: Record<string, string>[] = [...element.attributes]
      .filter((attr) => ['idx', 'src', 'name'].indexOf(attr.name) === -1)
      .map((attr) => ({
        [attr.name]: attr.value,
      }));
    const options: Record<string, string> = Object.assign.apply(null, [
      {},
      ...attribs,
    ]);

    return {
      idx: parseInt(element.getAttribute('idx') || '0', 10),
      src: element.getAttribute('src') || '',
      name: element.getAttribute('name') || '',
      options,
    };
  }

  private loadTextures(
    textures: ShaderCanvasTexture[]
  ): Promise<Record<string, HTMLImageElement>> {
    return new Promise<Record<string, HTMLImageElement>>((resolve, reject) => {
      const queue = [];
      const textureImages: Record<string, HTMLImageElement> = {};
      for (const texture of textures) {
        if (!textureImages[texture.src]) {
          queue.push(
            loadImage(texture.src)
              .then((image) => {
                textureImages[texture.src] = image;
              })
              .catch((err) => {
                reject(err);
              })
          );
        }
      }
      Promise.all(queue).then(() => {
        resolve(textureImages);
      });
    });
  }

  private applyTextureOptions(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    options?: Record<string, string>
  ) {
    if (!options) {
      return;
    }
    for (const [key, value] of Object.entries(options)) {
      const screamKey = 'TEXTURE_' + key.toUpperCase().replace(/\-/g, '_');
      const screamValue = value.toUpperCase().replace(/\-/g, '_');
      if (screamKey in gl && screamValue in gl) {
        //@ts-ignore indexing WebGL parameters by string
        gl.texParameteri(gl.TEXTURE_2D, gl[screamKey], gl[screamValue]);
      }
    }
  }

  /**
   * upload textures to GPU
   *
   * @param textures
   */
  private uploadTextures(
    enter: ShaderCanvasTexture[],
    update: ShaderCanvasTexture[]
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const { gl, program } = this;
      if (!gl || !program) {
        reject(new Error('gl context not initialized'));
        return;
      }
      this.loadTextures([...enter, ...update])
        .then((textureImages) => {
          enter.map((item) => {
            const image = textureImages[item.src];
            const texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + item.idx);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            this.applyTextureOptions(gl, item.options);
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              image
            );
            // Set a uniform variable containing the texture index
            const uniformLoc = gl.getUniformLocation(program, 'myTexture');
            gl.uniform1i(item.name, item.idx);
            this.textureState[item.name] = {
              ...item,
              image,
              uniformLoc,
              texture,
            };
          });
          update.map((item) => {
            const image = textureImages[item.src];
            const oldTexture = this.textureState[item.name].texture;
            const oldImage = this.textureState[item.name].image;
            if (
              image.width === oldImage.width &&
              image.height === oldImage.height
            ) {
              gl.activeTexture(gl.TEXTURE0 + item.idx);
              gl.bindTexture(gl.TEXTURE_2D, oldTexture);
              gl.texSubImage2D(
                gl.TEXTURE_2D,
                0,
                0,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
              );
            } else {
              if (oldTexture !== null) {
                gl.deleteTexture(oldTexture);
              }
              const texture = gl.createTexture();
              gl.activeTexture(gl.TEXTURE0 + item.idx);
              gl.bindTexture(gl.TEXTURE_2D, texture);
              this.applyTextureOptions(gl, item.options);
              gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
              );
              this.textureState[item.name].texture = texture;
            }
            this.textureState[item.name].image = image;
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
