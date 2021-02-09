#!/bin/sh
tsc -t esnext --moduleResolution node -d --emitDeclarationOnly --outFile dist/shader-canvas.d.ts src/shader-canvas.ts
tsc -t esnext --moduleResolution node -d --emitDeclarationOnly --outFile dist/plugins/texture-plugin.d.ts src/plugins/texture-plugin.ts
