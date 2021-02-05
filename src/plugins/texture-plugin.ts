import { ShaderCanvasPlugin } from './shader-canvas-plugin';

export type ShaderCanvasTexture = {
  src: string;
  idx: number;
  name: string;
  options?: Record<string, any>;
};

class TexturePlugin implements ShaderCanvasPlugin {
  register(): void {}

  /**
   * upload textures to GPU
   *
   * @param textures
   */
  private uploadTextures(textureElements: HTMLElement[]) {
    const textures = textureElements.map((item) => {
      const attribs: Record<string, string>[] = [...item.attributes]
        .filter((attr) => ['idx', 'src', 'name'].indexOf(attr.name) === -1)
        .map((attr) => ({
          [attr.name]: attr.value,
        }));
      const options: Record<string, any> = Object.assign.apply(null, [
        {},
        ...attribs,
      ]);

      return {
        idx: parseInt(item.getAttribute('idx') || 'NaN', 10),
        src: item.getAttribute('src') || '',
        name: item.getAttribute('name') || '',
        options,
      };
    });
  }
}
