import typescript from '@rollup/plugin-typescript';

export default [
  {
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
  },
  {
    input: 'src/plugins/texture-plugin.ts',
    output: [
      {
        file: 'dist/plugins/texture-plugin.esm.js',
        format: 'es',
      },
      {
        file: 'dist/plugins/texture-plugin.umd.js',
        format: 'umd',
        name: 'TexturePluginLib',
      },
    ],
    plugins: [typescript()],
  },
];
