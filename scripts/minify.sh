#!/bin/sh
npx terser dist/shader-canvas.esm.js --compress --mangle > dist/shader-canvas.esm.min.js
npx terser dist/shader-canvas.umd.js --compress --mangle > dist/shader-canvas.umd.min.js
npx terser dist/plugins/texture-plugin.esm.js --compress --mangle > dist/plugins/texture-plugin.esm.min.js
npx terser dist/plugins/texture-plugin.umd.js --compress --mangle > dist/plugins/texture-plugin.umd.min.js