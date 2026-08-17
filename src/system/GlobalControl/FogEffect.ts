import { Color, PostProcessStage, Viewer } from "cesium";

export interface FogEffectOptions {
  visibility?: number;
  color?: Color;
}

const fogFS = `
uniform sampler2D colorTexture;
uniform float visibility;
uniform vec3 fogColor;
in vec2 v_textureCoordinates;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  v += noise(p * 1.0) * 0.5;
  v += noise(p * 2.0) * 0.25;
  v += noise(p * 4.0) * 0.125;
  v += noise(p * 8.0) * 0.0625;
  return v;
}

void main() {
  vec2 uv = v_textureCoordinates;
  vec3 sceneColor = texture(colorTexture, uv).rgb;

  float t = czm_frameNumber * 0.001;

  // flowing fog noise
  float n = fbm(uv * 8.0 + vec2(t, t * 0.5));
  float n2 = fbm(uv * 5.0 - vec2(t * 0.7, t * 0.3));

  // base fog intensity from visibility
  float fogFactor = visibility * 3.0;

  // add noise variation
  fogFactor *= (0.6 + n * 0.8 + n2 * 0.3);

  // stronger fog toward bottom (ground level)
  float groundFog = smoothstep(0.8, 0.0, uv.y) * 0.3;
  fogFactor += groundFog * visibility;

  // horizon fog (stronger in the middle vertical band)
  float horizonFog = 1.0 - smoothstep(0.3, 0.7, uv.y);
  fogFactor += horizonFog * visibility * 1.5;

  fogFactor = clamp(fogFactor, 0.0, 1.0);

  vec3 finalColor = mix(sceneColor, fogColor, fogFactor);

  // slight desaturation for foggy atmosphere
  float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
  finalColor = mix(vec3(luminance), finalColor, 1.0 - fogFactor * 0.3);

  out_FragColor = vec4(finalColor, 1.0);
}
`;

export default class FogEffect {
  private viewer: Viewer;
  private stage: PostProcessStage | null = null;
  private _visibility: number;
  private _color: Color;

  constructor(viewer: Viewer, options: FogEffectOptions = {}) {
    this.viewer = viewer;
    this._visibility = options.visibility ?? 0.1;
    this._color = options.color ?? new Color(0.8, 0.8, 0.8, 1.0);
    this.init();
  }

  private init() {
    this.stage = new PostProcessStage({
      fragmentShader: fogFS,
      uniforms: {
        visibility: () => this._visibility,
        fogColor: () => this._color,
      },
    });
    this.viewer.scene.postProcessStages.add(this.stage);
  }

  setVisibility(visibility: number) {
    this._visibility = visibility;
  }

  setColor(color: Color) {
    this._color = color;
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
