uniform vec3 uColor;
uniform float uTime;
uniform float uUvScale;
uniform float uDotSize;
uniform float uBlur;

varying vec2 vUv;

float circleSd(vec2 uv, float radius) { return length(uv) - radius; }

void main() {
  // vec3 color = uColor;
  vec2 uv = vUv;
  uv *= uUvScale;
  float dist = circleSd(mod(uv, 1.0) - 0.5, uDotSize);
  dist = smoothstep(0.0, uBlur, dist);
  vec3 color = mix(uColor, vec3(0.0), dist);

  gl_FragColor = vec4(color, 1.0);
}
