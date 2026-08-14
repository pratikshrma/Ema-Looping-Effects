uniform vec2 uResolution;
uniform float uPixelScale;
uniform float uLevels;
uniform float uMatrixSize;
uniform float uMono;
uniform float uContrast;
uniform float uBrightness;
uniform float uEnabled;

// Must stay a pure function of screen position. Random or time-varying noise
// dithering would break every loop while leaving the geometry correct.
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x * 0.5 + a.y * a.y * 0.75);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (uEnabled < 0.5) {
    outputColor = inputColor;
    return;
  }

  vec2 pixel = uv * uResolution;
  vec2 cell = floor(pixel / uPixelScale);

  vec2 snapped = (cell + 0.5) * uPixelScale / uResolution;
  vec3 c = texture2D(inputBuffer, snapped).rgb;

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

  outputColor = vec4(clamp(c, 0.0, 1.0), inputColor.a);
}
