precision highp float;
uniform vec2 resolution;
uniform float time;
const float PI = 3.141592654;
const float gridSize = 10.;
const float fishGrid = 12.;
    
vec2 coords() {
  vec2 p = gl_FragCoord.xy / resolution - .5;
  float aspect = resolution.x / resolution.y;
  p.x *= aspect;
  return p;
}
    
vec2 rotate(vec2 p, float a) {
  return vec2(p.x * cos(a) - p.y * sin(a),
              p.x * sin(a) + p.y * cos(a));
}

// function from https://www.shadertoy.com/view/3ll3zr
float sdHeart(in vec2 p, float s) {
  p /= s;
  vec2 q = p;
  q.x *= 0.5 + .5 * q.y;
  q.y -= abs(p.x) * .63;
  return (length(q) - .7) * s;
}
    
float sdCircle(in vec2 p, float r) {
  return length(p) - r;
}

float sdStar(in vec2 p, in float r, in int n, in float m)
{
    // next 4 lines can be precomputed for a given shape
    float an = 3.141593/float(n);
    float en = 3.141593/m;  // m is between 2 and n
    vec2  acs = vec2(cos(an),sin(an));
    vec2  ecs = vec2(cos(en),sin(en)); // ecs=vec2(0,1) for regular polygon,

    float bn = mod(atan(p.x,p.y),2.0*an) - an;
    p = length(p)*vec2(cos(bn),abs(sin(bn)));
    p -= r*acs;
    p += ecs*clamp( -dot(p,ecs), 0.0, r*acs.y/ecs.y);
    return length(p)*sign(p.x);
}

float distanceField(vec2 p) {
  // return sdHeart(p, 9.0 + 2.5 * sin(time * 1e-3));
  float t = time * 1e-3 * 20.;
  
  return sdStar(rotate(mod(p, gridSize) - vec2(gridSize*.5) - vec2(sin(floor(p.y / gridSize) * gridSize + t * .03) * .7, sin(floor(p.x / gridSize) * gridSize + t * .05) * .3), t * .002 + floor(p.y / gridSize) * .2 + floor(p.x / gridSize) * .3), 4., 5, 3.5 + .1 
* floor(p.x / gridSize) + sin(t * .1) * .2) + sin(4. * p.x * .5 + time * 2e-3) * cos(p.y * .5 + time * 2e-3) * .05;
}
    
float bubblesDF(vec2 p) {
  float grid = 3.;
  float t = time * 1e-4;
  float xi = floor(p.x / grid) * grid;
  float yi = floor(p.y / grid) * grid;
  vec2 p1 = vec2(sin(yi * .4 + t * 2.), cos(xi + t * 3.)) * grid * .25;
  return sdCircle(mod(p, grid) - grid * .5 - p1, .5 + .2 * sin(t + xi)) + sin(p.x * 2.) * cos(p.y * 3.) * .1;
}

float subtract(float a, float b) {
  return max(-a, b);
}

vec2 fishCoords(vec2 p) {
  float grid = fishGrid;
  float rot = 45. * PI / 180.;
  vec2 motion = vec2(time * 1e-3, 0.);
  float xi = floor(p.x / grid) * grid;
  float yi = floor(p.y / grid) * grid;
  return rotate(mod(rotate(p - motion, rot), grid) - (grid) * .5, -rot);
}
    
float fishDF(vec2 p) {
  vec2 p0 = fishCoords(p);
  float df = 9999.;
  df = min(df, sdCircle(p0 * vec2(1.5, 1.) - vec2(.3, 0), 1.));
  df = subtract(sdCircle(p0 * vec2(1.5, 1.) - vec2(-.8, 0), 1.), df);
  df = min(df, sdCircle(p0 - vec2(2., 0), 1.4));
  return df + sin(p.x) * cos(p.y * 2.) * .1;
}    
    
vec3 clownFishTexture(vec2 p) {
  vec2 p0 = fishCoords(p);
  float y = sdCircle(p0 - vec2(2.7, .2), .2);
  float x = -.3 + sin(p.x * 2. - time * 2e-3 + cos(p.y * 1.2));
  vec3 stripedOrange = vec3(.8, .3, .0) + smoothstep(0., .3, x);
  vec3 black = vec3(0.);
  
  return mix(black, stripedOrange, smoothstep(0., .1, y));
}
    
vec3 shade(in vec2 p) {
  vec2 p00 = coords();
  vec2 p0 = p00 + vec2(sin(1. + time * 2e-4) * sin(p00.x * 10. + time * 1e-4) * .2, 0.);
  float sdf = distanceField(p);
  float sdfBubbles = bubblesDF(p);
  vec3 fg = vec3(.2 + sin(floor(p.x/gridSize) * gridSize), .3+ .2 * sin(floor(p.y/gridSize) * gridSize), .5) * .7 
              + .5;
  vec3 bg = vec3(0., .1, .2) + vec3(0, .1, .1) * smoothstep(0., .05, clamp(sin(p0.x * 10. + p0.y * 20. + time * 3e-4), 0., 1.));
  float star = smoothstep(0., .1, sdf);
  float fish = smoothstep(0., .1, fishDF(p00 * 27.));
  vec3 fishFg = clownFishTexture(p00 * 27.);
  vec3 bg2 = vec3(0, .1, .1) * smoothstep(0., .05, clamp(sin(p0.x * 5. + p0.y * 8.) * sin(2. + p0.x * 8. + p0.y * 16.), 0., 1.));
  vec3 bg3 = smoothstep(0., .1, -sdfBubbles) * vec3(.1);
  return mix(fg, mix(fishFg, bg, fish), star) + bg2 + bg3;
}

void main () {
  vec2 p0 = coords() - vec2(0., sin(time * 2e-5));
  vec2 p = rotate(p0, 45. * PI / 180.);
  vec3 col = shade(p * 27.);
  gl_FragColor = vec4(col, 1.0);
}