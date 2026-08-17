import { PostProcessStage, Viewer } from "cesium";

export interface RainEffectOptions {
  rainSpeed?: number;
  rainAngle?: number;
}

const rainFS = `
uniform sampler2D colorTexture;
uniform float rainSpeed;
uniform float rainAngle;
in vec2 v_textureCoordinates;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float rainLayer(vec2 uv, float t) {
  vec2 gridSize = vec2(60.0, 10.0);
  vec2 id = floor(uv * gridSize);
  vec2 gv = fract(uv * gridSize) - 0.5;

  vec2 rnd = hash22(id);
  float width = 0.02 + 0.03 * rnd.x;
  float height = 0.3 + 0.7 * rnd.y;

  float yOffset = fract(t * (0.5 + rnd.y) + rnd.x);
  gv.y += yOffset * 2.0 - 0.5;

  float d = abs(gv.x) - width;
  float streak = smoothstep(0.0, -0.01, d);

  streak *= smoothstep(-height, -height * 0.2, gv.y) * smoothstep(height, height * 0.2, gv.y);

  streak *= 0.3 + 0.7 * rnd.x;

  return streak;
}

void main() {
  vec2 uv = v_textureCoordinates;
  vec3 col = texture(colorTexture, uv).rgb;

  float t = czm_frameNumber / 60.0 * rainSpeed;

  float a = rainAngle;
  float ca = cos(a);
  float sa = sin(a);
  vec2 ruv = vec2(ca * (uv.x - 0.5) - sa * (uv.y - 0.5), sa * (uv.x - 0.5) + ca * (uv.y - 0.5)) + 0.5;

  float r = 0.0;
  r += rainLayer(ruv, t);
  r += rainLayer(ruv * 2.0 + 0.3, t * 1.3) * 0.6;
  r += rainLayer(ruv * 0.5 + 0.7, t * 0.7) * 0.8;

  col *= 0.65;
  col = mix(col, vec3(0.35, 0.38, 0.42), 0.12);
  col += vec3(0.6, 0.65, 0.7) * clamp(r, 0.0, 1.0);

  out_FragColor = vec4(col, 1.0);
}
`;

const rainWithLightningFS = `
uniform sampler2D colorTexture;
uniform float rainSpeed;
uniform float rainAngle;
in vec2 v_textureCoordinates;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float noise1D(float x) {
  float i = floor(x);
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash11(i), hash11(i + 1.0), f);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float perlinNoise(vec2 p) {
  return noise2D(p) * 0.5 + noise2D(p * 2.0) * 0.25 + noise2D(p * 4.0) * 0.125;
}

float rainLayer(vec2 uv, float t) {
  vec2 gridSize = vec2(60.0, 10.0);
  vec2 id = floor(uv * gridSize);
  vec2 gv = fract(uv * gridSize) - 0.5;

  vec2 rnd = hash22(id);
  float width = 0.02 + 0.03 * rnd.x;
  float height = 0.3 + 0.7 * rnd.y;

  float yOffset = fract(t * (0.5 + rnd.y) + rnd.x);
  gv.y += yOffset * 2.0 - 0.5;

  float d = abs(gv.x) - width;
  float streak = smoothstep(0.0, -0.01, d);

  streak *= smoothstep(-height, -height * 0.2, gv.y) * smoothstep(height, height * 0.2, gv.y);

  streak *= 0.3 + 0.7 * rnd.x;

  return streak;
}

float segmentDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

vec3 renderLightning(vec2 uv, float time) {
  float interval = 0.2;
  float x = time + 0.1;
  float i = floor(x / interval);
  float f = x / interval - i;

  float threshold = 0.35;
  float n = hash11(i);

  // only some intervals produce lightning
  float t = step(threshold, n);
  float d = max(0.0, n - threshold) / (1.0 - threshold);
  float o = step(1.0 - d, t - f);

  vec3 lightning = vec3(0.0);

  if (o > 0.5) {
    float seed = i;

    // bolt start position (top)
    float startX = hash11(seed + 10.0) * 1.0 - 0.5;
    vec2 pos = vec2(startX, 0.5);
    vec2 dir = vec2(0.0, -1.0);

    float boltWidth = 0.005;
    float glow = 0.0;
    float core = 0.0;

    // build jagged bolt path
    float segCount = 12.0;
    for (float s = 0.0; s < segCount; s += 1.0) {
      float progress = s / segCount;
      float segLen = 0.9 / segCount;

      // random jag offset
      float jx = (hash11(seed * 17.0 + s * 3.7) - 0.5) * 0.18 * (1.0 - progress * 0.5);

      vec2 nextPos = pos + vec2(jx, -segLen);

      float dist = segmentDist(uv, pos, nextPos);

      // bright core
      core += smoothstep(boltWidth, 0.0, dist) * (1.0 - progress * 0.4);

      // glow
      glow += smoothstep(0.06, 0.0, dist) * 0.3 * (1.0 - progress * 0.5);

      // branch
      if (hash11(seed * 31.0 + s * 7.3) > 0.55 && s > 2.0) {
        vec2 branchDir = vec2((hash11(seed * 43.0 + s * 11.0) - 0.5) * 0.4, -1.0);
        branchDir = normalize(branchDir);
        vec2 branchEnd = pos + branchDir * 0.15;

        float bdist = segmentDist(uv, pos, branchEnd);
        core += smoothstep(boltWidth * 0.6, 0.0, bdist) * 0.5;
        glow += smoothstep(0.03, 0.0, bdist) * 0.15;
      }

      pos = nextPos;
    }

    // bright flash around bolt
    float flashGlow = glow * 3.0 + core * 0.5;

    lightning = vec3(0.7, 0.75, 1.0) * core
              + vec3(0.3, 0.35, 0.6) * glow
              + vec3(0.15, 0.17, 0.25) * flashGlow;

    // fade out flash over interval
    lightning *= smoothstep(1.0, 0.3, f);
  }

  return lightning;
}

void main() {
  vec2 uv = v_textureCoordinates;
  vec3 col = texture(colorTexture, uv).rgb;

  float t = czm_frameNumber / 60.0 * rainSpeed;
  float time = czm_frameNumber / 120.0;

  // rain
  float a = rainAngle;
  float ca = cos(a);
  float sa = sin(a);
  vec2 ruv = vec2(ca * (uv.x - 0.5) - sa * (uv.y - 0.5), sa * (uv.x - 0.5) + ca * (uv.y - 0.5)) + 0.5;

  float r = 0.0;
  r += rainLayer(ruv, t);
  r += rainLayer(ruv * 2.0 + 0.3, t * 1.3) * 0.6;
  r += rainLayer(ruv * 0.5 + 0.7, t * 0.7) * 0.8;

  // darken more for thunderstorm
  col *= 0.5;
  col = mix(col, vec3(0.3, 0.32, 0.38), 0.15);
  col += vec3(0.6, 0.65, 0.7) * clamp(r, 0.0, 1.0);

  // lightning
  vec3 lightning = renderLightning(uv, time);

  // global flash brightening
  float flashIntensity = max(lightning.r, max(lightning.g, lightning.b));
  col = col + lightning * 2.0;
  col += vec3(0.2, 0.22, 0.3) * flashIntensity;

  out_FragColor = vec4(col, 1.0);
}
`;

export default class RainEffect {
  private viewer: Viewer;
  private stage: PostProcessStage | null = null;
  private _rainSpeed: number;
  private _rainAngle: number;
  private _lightningEnabled = false;

  constructor(viewer: Viewer, options: RainEffectOptions = {}) {
    this.viewer = viewer;
    this._rainSpeed = options.rainSpeed ?? 1.0;
    this._rainAngle = options.rainAngle ?? 0.0;
    this.createStage(rainFS);
  }

  private createStage(fs: string) {
    this.stage = new PostProcessStage({
      fragmentShader: fs,
      uniforms: {
        rainSpeed: () => this._rainSpeed,
        rainAngle: () => this._rainAngle,
      },
    });
    this.viewer.scene.postProcessStages.add(this.stage);
  }

  setRainSpeed(speed: number) {
    this._rainSpeed = speed;
  }

  setRainAngle(angle: number) {
    this._rainAngle = angle;
  }

  setShowThunderLightning(show: boolean) {
    if (this._lightningEnabled === show) return;
    this._lightningEnabled = show;

    const enabled = this.stage?.enabled ?? false;
    if (this.stage) {
      this.viewer.scene.postProcessStages.remove(this.stage);
      this.stage = null;
    }

    const fs = show ? rainWithLightningFS : rainFS;
    this.createStage(fs);
    this.stage!.enabled = enabled;
  }

  get lightningEnabled() {
    return this._lightningEnabled;
  }

  show() {
    if (this.stage) {
      this.stage.enabled = true;
    }
  }

  hide() {
    if (this.stage) {
      this.stage.enabled = false;
    }
  }

  get isShowing() {
    return this.stage?.enabled ?? false;
  }

  destroy() {
    if (this.stage) {
      this.viewer.scene.postProcessStages.remove(this.stage);
      this.stage = null;
    }
  }
}
