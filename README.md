# `<shader-canvas>` component

The `<shader-canvas>` component is a web component that creates a WebGL canvas, running a shader animation.

## Buffer definitions

By default, shader-canvas provides a `position` buffer, containing 2 triangles filling up the whole clipping space from (-1, -1) to (1, 1).

The `position` buffer can be accessed via the `attribute vec4 position` attribute in the vertex shader.

## Provided uniforms

- `uniform float time`: number of ticks passed
- `uniform vec2 resolution`: resolution of the canvas

## Demos

`npm run dev:demos`
