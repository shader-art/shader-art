#!/bin/sh
npx terser dist/shader-art.esm.js --compress --mangle > dist/shader-art.esm.min.js
npx terser dist/shader-art.umd.js --compress --mangle > dist/shader-art.umd.min.js
npx terser dist/plugins/texture-plugin.esm.js --compress --mangle > dist/plugins/texture-plugin.esm.min.js
npx terser dist/plugins/texture-plugin.umd.js --compress --mangle > dist/plugins/texture-plugin.umd.min.js