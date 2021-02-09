export type ShaderArtPluginFactory = () => ShaderArtPlugin;

export interface ShaderArtPlugin {
  name: string;
  setup(
    hostElement: HTMLElement,
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram,
    canvas: HTMLCanvasElement
  ): void | Promise<void>;
  dispose(): void;
}
