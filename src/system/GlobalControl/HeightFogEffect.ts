import { Cartesian3, Color, PostProcessStage, Viewer } from "cesium";

export interface HeightFogOptions {
  enabled?: boolean;
  fogColor?: [number, number, number];
  fogHeight?: number;
  globalDensity?: number;
}

export default class HeightFogEffect {
  private viewer: Viewer;
  private stage: PostProcessStage | null = null;
  private _opt: Required<HeightFogOptions>;

  constructor(viewer: Viewer, opt: HeightFogOptions = {}) {
    this.viewer = viewer;
    this._opt = {
      enabled: opt.enabled ?? true,
      fogColor: opt.fogColor ?? [0.8, 0.82, 0.84],
      fogHeight: opt.fogHeight ?? 1000,
      globalDensity: opt.globalDensity ?? 0.6,
    };

    viewer.scene.fog.enabled = false;

    this.stage = new PostProcessStage({
      fragmentShader: heightFogFS,
      uniforms: this.buildUniforms(),
    });
    viewer.scene.postProcessStages.add(this.stage);
  }

  private buildUniforms() {
    return {
      u_cameraHeight: () =>
        this.viewer.camera.positionCartographic.height,
      u_earthRadiusOnCamera: () =>
        Cartesian3.magnitude(this.viewer.camera.positionWC) -
        this.viewer.camera.positionCartographic.height,
      u_fogColor: () => new Color(...this._opt.fogColor, 1.0),
      u_fogHeight: () => this._opt.fogHeight,
      u_globalDensity: () => this._opt.globalDensity,
    };
  }

  update(patch: Partial<HeightFogOptions>) {
    Object.assign(this._opt, patch);
    if (this.stage) {
      this.stage.enabled = this._opt.enabled;
    }
  }

  show() {
    if (this.stage) this.stage.enabled = true;
    this._opt.enabled = true;
  }

  hide() {
    if (this.stage) this.stage.enabled = false;
    this._opt.enabled = false;
  }

  get isShowing() {
    return this.stage?.enabled ?? false;
  }

  destroy() {
    if (this.stage) {
      this.viewer.scene.postProcessStages.remove(this.stage);
      this.stage = null;
    }
    this.viewer.scene.fog.enabled = true;
  }
}

const heightFogFS = `
uniform sampler2D colorTexture;
uniform float u_cameraHeight;
uniform float u_earthRadiusOnCamera;
uniform vec3 u_fogColor;
uniform float u_fogHeight;
uniform float u_globalDensity;
in vec2 v_textureCoordinates;

void main() {
  vec2 uv = v_textureCoordinates;
  vec3 sceneColor = texture(colorTexture, uv).rgb;

  float R = max(u_earthRadiusOnCamera, 6371000.0);
  float H = max(u_fogHeight, 1.0);

  // 将屏幕坐标转换为视空间射线方向
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 rayClip = vec4(ndc, -1.0, 1.0);
  vec4 rayEye = czm_inverseProjection * rayClip;
  vec3 rayDir = normalize(vec3(rayEye.xy, -1.0));

  // 射线在垂直方向的分量（负值=朝下，正值=朝上）
  float rayY = rayDir.y;

  // 计算射线穿过雾层的路径长度
  float fogPath = 0.0;
  float camH = max(u_cameraHeight, 0.0);

  if (camH <= H) {
    // 相机在雾层内部
    if (rayY > 0.01) {
      // 射线向上，穿出雾顶
      fogPath = (H - camH) / rayY;
    } else if (rayY < -0.01) {
      // 射线向下，穿到地面
      fogPath = camH / (-rayY);
    } else {
      // 大致水平，长路径
      fogPath = H * 3.0;
    }
  } else {
    // 相机在雾层上方
    if (rayY < -0.01) {
      // 射线向下穿过雾层
      float entryDist = (camH - H) / (-rayY);
      float exitDist = camH / (-rayY);
      fogPath = max(exitDist - entryDist, 0.0);
    }
    // 向上的射线不经过雾层
  }

  // 标准化雾路径并应用密度
  float fogAmount = fogPath * u_globalDensity / (H * 2.0);

  // 地面附近加强雾效果
  float groundFog = pow(max(1.0 - uv.y, 0.0), 2.0) * u_globalDensity * 0.4;
  float heightDecay = exp(-camH / H);
  groundFog *= heightDecay;

  fogAmount = clamp(fogAmount + groundFog, 0.0, 1.0);

  // 混合雾颜色
  vec3 finalColor = mix(sceneColor, u_fogColor, fogAmount);

  // 去饱和度增加真实感
  float lum = dot(finalColor, vec3(0.299, 0.587, 0.114));
  finalColor = mix(finalColor, vec3(lum), fogAmount * 0.25);

  out_FragColor = vec4(finalColor, 1.0);
}
`;
