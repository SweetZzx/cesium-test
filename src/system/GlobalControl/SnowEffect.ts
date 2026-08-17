import { PostProcessStage, Viewer } from "cesium";

export interface SnowEffectOptions {
  snowSize?: number;
  snowSpeed?: number;
}

const snowFS = `
uniform sampler2D colorTexture;
uniform float snowSize;
uniform float snowSpeed;
in vec2 v_textureCoordinates;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float snowLayer(vec2 uv, float t, float scale) {
  vec2 gridSize = vec2(scale);
  vec2 id = floor(uv * gridSize);
  vec2 gv = fract(uv * gridSize) - 0.5;

  float rnd = hash(id);
  float rnd2 = hash(id + 43.0);

  // size variation per flake
  float flakeSize = 0.03 + 0.06 * rnd;

  // fall offset
  float fall = fract(t * (0.3 + rnd2 * 0.4) + rnd);
  gv.y += fall * 2.0 - 0.5;

  // gentle horizontal sway
  float sway = sin(t * 2.0 + rnd * 6.28) * 0.12 * (0.5 + rnd2);
  gv.x += sway;

  // soft circular flake
  float d = length(gv);
  float flake = smoothstep(flakeSize, flakeSize * 0.3, d);

  // brightness variation
  flake *= 0.5 + 0.5 * rnd2;

  return flake;
}

void main() {
  vec2 uv = v_textureCoordinates;
  vec3 col = texture(colorTexture, uv).rgb;

  float t = czm_frameNumber / 120.0 * snowSpeed;
  float sz = snowSize;

  // multi-layer snow for depth and density
  float s = 0.0;
  s += snowLayer(uv, t, sz * 1.0);
  s += snowLayer(uv + 0.15, t * 0.8, sz * 1.5);
  s += snowLayer(uv - 0.1, t * 1.2, sz * 0.7);
  s += snowLayer(uv + 0.33, t * 0.6, sz * 2.0) * 0.5;

  // brighten scene slightly for snowy atmosphere
  col = mix(col, vec3(1.0), 0.06);

  // overlay white snowflakes
  col = mix(col, vec3(1.0), clamp(s, 0.0, 1.0));

  out_FragColor = vec4(col, 1.0);
}
`;

export default class SnowEffect {
  private viewer: Viewer;
  private stage: PostProcessStage | null = null;
  private _snowSize: number;
  private _snowSpeed: number;

  constructor(viewer: Viewer, options: SnowEffectOptions = {}) {
    this.viewer = viewer;
    this._snowSize = options.snowSize ?? 5.0;
    this._snowSpeed = options.snowSpeed ?? 1.0;
    this.init();
  }

  private init() {
    this.stage = new PostProcessStage({
      fragmentShader: snowFS,
      uniforms: {
        snowSize: () => this._snowSize,
        snowSpeed: () => this._snowSpeed,
      },
    });
    this.viewer.scene.postProcessStages.add(this.stage);
  }

  setSnowSize(size: number) {
    this._snowSize = size;
  }

  setSnowSpeed(speed: number) {
    this._snowSpeed = speed;
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
