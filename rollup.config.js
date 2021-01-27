import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/shader-canvas.ts',
  output: [
    {
      file: 'dist/shader-canvas.esm.js',
      format: 'es',
    },
    {
      file: 'dist/shader-canvas.umd.js',
      format: 'umd',
      name: 'ShaderCanvasLib',
    },
  ],
  plugins: [typescript()],
};
