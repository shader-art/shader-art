precision highp float;
attribute vec4 position;
varying vec4 vPos;

void main() {
  vPos = position;
  gl_Position = position;
}