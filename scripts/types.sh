#!/bin/sh
npx tsc -t esnext --moduleResolution node -d --emitDeclarationOnly --outFile dist/shader-art.d.ts src/shader-art.ts
npx tsc -t esnext --moduleResolution node -d --emitDeclarationOnly --outFile dist/plugins/texture-plugin.d.ts src/plugins/texture-plugin.ts
