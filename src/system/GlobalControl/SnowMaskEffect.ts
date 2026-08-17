import { Cartesian3, Cesium3DTileset, CustomShader, UniformType } from "cesium";
import Model3dtile from "../ModelRelated/Model3dtile";

export interface SnowMaskOptions {
  snowLevel?: number;
  snowColor?: Cartesian3;
}

export default class SnowMaskEffect {
  private tileSet: Cesium3DTileset;
  private _snowColor: Cartesian3;
  private _snowLevel: number;
  private _enabled: boolean = false;

  constructor(
    tileSet: Cesium3DTileset,
    _model: Model3dtile,
    options: SnowMaskOptions = {}
  ) {
    this.tileSet = tileSet;
    this._snowLevel = options.snowLevel ?? 1.0;
    this._snowColor = options.snowColor ?? new Cartesian3(0.95, 0.98, 1.0);
  }

  private createSnowShader(): CustomShader {
    return new CustomShader({
      uniforms: {
        u_snowColor: {
          type: UniformType.VEC3,
          value: this._snowColor,
        },
        u_snowLevel: {
          type: UniformType.FLOAT,
          value: this._snowLevel,
        },
      },
      fragmentShaderText: `
        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
          vec3 normalEC = normalize(fsInput.attributes.normalEC);
          vec3 positionEC = fsInput.attributes.positionEC;

          // 将法线和位置从视空间转换到世界空间
          vec3 normalWC = normalize(mat3(czm_inverseView) * normalEC);
          vec4 posWC = czm_inverseView * vec4(positionEC, 1.0);
          vec3 up = normalize(posWC.xyz);

          // 积雪因子：面朝上的表面积雪多
          float snowDot = dot(normalWC, up);
          float threshold = -0.1 + (1.0 - u_snowLevel) * 0.5;
          float snowFactor = smoothstep(threshold, threshold + 0.4, snowDot);

          // 基于位置的噪声变化，让积雪更自然
          float n = fract(sin(dot(floor(posWC.xy * 2.0), vec2(12.9898, 78.233))) * 43758.5453);
          snowFactor *= (0.8 + n * 0.2);

          // 混合积雪颜色
          material.diffuse = mix(material.diffuse, u_snowColor, snowFactor);

          // 积雪区域稍微提亮
          material.diffuse += snowFactor * 0.05;
        }
      `,
    });
  }

  private updateSnowShader() {
    if (!this._enabled) {
      this.tileSet.customShader = undefined as any;
      return;
    }
    this.tileSet.customShader = this.createSnowShader();
  }

  showSnowMask(show: boolean) {
    this._enabled = show;
    this.updateSnowShader();
  }

  setSnowLevel(level: number) {
    this._snowLevel = level;
    if (this._enabled) this.updateSnowShader();
  }

  setSnowColor(color: Cartesian3) {
    this._snowColor = color;
    if (this._enabled) this.updateSnowShader();
  }

  get isEnabled() {
    return this._enabled;
  }

  destroy() {
    this.tileSet.customShader = undefined as any;
  }
}
