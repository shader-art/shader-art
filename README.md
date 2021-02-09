# `<shader-art>` component

The `<shader-art>` component is a web component that creates a WebGL canvas, running a shader animation.

## Getting started

```sh
npm i shader-art
```

### JS:

```js
import { ShaderArt } from 'https://cdn.skypack.dev/shader-art';

ShaderArt.register();
```

### CSS:

```css
shader-art {
  display: block;
  width: 100vmin;
  height: 100vmin;
}
```

### HTML:

```html
<shader-art autoplay>
  <script type="vert">
    precision highp float;
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
  </script>

  <script type="frag">
    precision highp float;
    uniform float time;
    uniform vec2 resolution;
    void main() {
      float t = time * 1e-3;
      vec2 p = gl_FragCoord.xy / resolution;
      vec3 color = vec3(1.0, sin(p.x + t * 2.), sin(p.y + t));
      gl_FragColor=vec4(color, 1.0);
    }
  </script>
</shader-art>
```

## Provided uniforms

- `uniform float time`: number of ticks passed
- `uniform vec2 resolution`: resolution of the canvas

## Adding textures

Texture support can be added via a TexturePlugin.

- [Live Demo on CodePen](https://codepen.io/terabaud/pen/xxROeRJ)
