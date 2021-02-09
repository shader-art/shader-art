import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: 'src/shader-art.ts',
    output: [
      {
        file: 'dist/shader-art.esm.js',
        format: 'es',
      },
      {
        file: 'dist/shader-art.umd.js',
        format: 'umd',
        name: 'ShaderArtLib',
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
