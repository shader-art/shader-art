# `<shader-art>` component

The `<shader-art>` component is a web component that creates a WebGL canvas, running a shader animation.

## Getting started

```sh
npm i shader-art
```

### JavaScript

```js
import { ShaderArt } from 'https://cdn.skypack.dev/shader-art';

ShaderArt.register();
```

### CSS

You can style your shader-element according to your needs. Just provide a `display: block` (default would be display: inline) and specify a width and height according to your needs.

```css
shader-art {
  display: block;
  width: 100vmin;
  height: 100vmin;
}
```

### HTML

The HTML structure of a shader-art component looks like this:

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

## Using WebGL2

Provide the `#version 300 es` pragma inside your fragment and vertex shader code.

## `<shader-art>` attributes

- `autoplay` immediately starts playing
- `play-state="running|stopped"` get/set current play-state (it is set to running automatically when autoplay is enabled)
- regardless of the `play-state` the component respects the user's `prefers-reduced-motion` settings
- `dpr="auto|number"` get/set device pixel ratio (default is "auto", which uses `window.devicePixelRatio`)

## Provided uniforms

- `uniform float time`: number of ticks passed
- `uniform vec2 resolution`: resolution of the canvas

## Adding textures

Texture support can be added via a TexturePlugin.

You can load the texture plugin by importing the TexturePlugin and adding it to the `ShaderArt.register` call like this:

```js
import { TexturePlugin } from 'https://cdn.skypack.dev/shader-art/plugins/texture-plugin';

ShaderArt.register([() => new TexturePlugin()]);
```

- [Example using textures on CodePen](https://codepen.io/terabaud/pen/xxROeRJ)

## Building your own plugins

You can build your own plugins by implementing this interface:

```js
export interface ShaderArtPlugin {
  name: string;
  setup(
    hostElement: HTMLElement,
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram,
    canvas: HTMLCanvasElement
  ): void | Promise<void>;
  dispose(): void;
}
```

If the setup method returns a promise, the shader-art component will wait until the promise resolves.
