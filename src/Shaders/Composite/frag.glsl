uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uPixelScale;
uniform float uLevels;
uniform float uMatrixSize;
uniform float uMono;
uniform float uContrast;
uniform float uBrightness;
uniform float uEnabled;

varying vec2 vUv;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x * 0.5 + a.y * a.y * 0.75);
}

vec3 toSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(0.41666)) - 0.055, step(0.0031308, c));
}

void main() {
  if (uEnabled < 0.5) {
    gl_FragColor = vec4(toSRGB(texture2D(uScene, vUv).rgb), 1.0);
    return;
  }

  vec2 pixel = vUv * uResolution;
  vec2 cell = floor(pixel / uPixelScale);

  vec2 snapped = (cell + 0.5) * uPixelScale / uResolution;
  vec3 c = texture2D(uScene, snapped).rgb;

  c = clamp((c - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0);

  float b2 = bayer2(cell);
  float b4 = bayer2(cell * 0.5) * 0.25 + b2;
  float b8 = (bayer2(cell * 0.25) * 0.25 + bayer2(cell * 0.5)) * 0.25 + b2;
  float threshold = uMatrixSize > 6.0 ? b8 : b4;

  float n = max(uLevels - 1.0, 1.0);

  if (uMono > 0.5) {
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = vec3(floor(l * n + threshold) / n);
  } else {
    c = floor(c * n + threshold) / n;
  }

  gl_FragColor = vec4(toSRGB(clamp(c, 0.0, 1.0)), 1.0);
}
