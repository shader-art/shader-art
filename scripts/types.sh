#!/bin/sh
tsc -t esnext --moduleResolution node -d --emitDeclarationOnly --outFile dist/shader-art.d.ts src/shader-art.ts
tsc -t esnext --moduleResolution node -d --emitDeclarationOnly --outFile dist/plugins/texture-plugin.d.ts src/plugins/texture-plugin.ts
