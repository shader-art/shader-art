# `<shader-art>` component

The `<shader-art>` component is a web component that creates a WebGL canvas, running a shader animation.

## Buffer definitions

By default, shader-art provides a `position` buffer, containing 2 triangles filling up the whole clipping space from (-1, -1) to (1, 1).

The `position` buffer can be accessed via the `attribute vec4 position` attribute in the vertex shader.

## Adding shaders

```html
<shader-art>
  <script type="vert">
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
  </script>
  <script type="frag">
    void main() {
      gl_FragColor = vec4(1., 0., 0., 1.);
    }
  </script>
</shader-art>
```

## Adding textures

(work in progress here)

```html
<shader-art>
  <texture
    src="https://placekitten.com/128/128"
    name="kitten"
    stretch-x
    stretch-y
  ></texture>
  <script type="frag">
    uniform sampler2D kitten;
  </script>
</shader-art>
```

## Provided uniforms

- `uniform float time`: number of ticks passed
- `uniform vec2 resolution`: resolution of the canvas

## Demos

`npm run dev:demos`
