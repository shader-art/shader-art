export interface ShaderCanvasPlugin {
  setup(
    hostElement: HTMLElement,
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram,
    canvas: HTMLCanvasElement
  ): void;
  dispose(): void;
}
