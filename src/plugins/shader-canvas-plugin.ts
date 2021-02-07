export interface ShaderCanvasPluginBase {
  new (): ShaderCanvasPlugin;
}

export interface ShaderCanvasInterface {
  registerPlugin(plugin: ShaderCanvasPluginBase): void;
}

export interface ShaderCanvasPlugin {
  name: string;

  setup(
    hostElement: HTMLElement,
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram,
    canvas: HTMLCanvasElement
  ): void;
  dispose(): void;
}

declare global {
  interface Window {
    ShaderCanvasPlugins: Record<string, ShaderCanvasPluginBase>;
  }
}
