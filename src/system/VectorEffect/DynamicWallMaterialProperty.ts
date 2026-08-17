import {
  Event as CesiumEvent,
  Color,
  JulianDate,
  Material,
  Viewer,
} from 'cesium'

export interface DynamicWallMaterialPropertyOptions {
  color?: Color
  duration?: number
  viewer: Viewer
}

const DYNAMIC_WALL_SHADER = `
uniform vec4 color;
uniform float time;

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);

  vec2 st = materialInput.st;

  float t = fract(st.t * 3.0 + time);

  float fade = 1.0 - t;
  float alpha = fade * fade;

  float glow = exp(-t * 4.0) * 0.7;

  float finalAlpha = max(alpha * 0.6, glow) * color.a;

  material.diffuse = color.rgb;
  material.alpha = finalAlpha;
  material.emission = color.rgb * glow * 1.5;

  return material;
}
`

export default class DynamicWallMaterialProperty {
  private _definitionChanged: CesiumEvent
  private _color: Color
  private _time: number
  private _materialType: string

  public duration: number

  constructor(options: DynamicWallMaterialPropertyOptions) {
    this._definitionChanged = new CesiumEvent()
    this._color = options.color ?? Color.fromCssColorString('#00ffff').withAlpha(0.7)
    this._time = Date.now()
    this.duration = options.duration ?? 3000
    this._materialType = `DynamicWall_${Math.random().toString(36).substring(2, 9)}`
    this._addMaterialToCache()
  }

  getType(_time?: JulianDate): string {
    return this._materialType
  }

  getValue(_time: JulianDate, result?: any): any {
    if (!result) result = {}
    const now = Date.now()
    result.time = ((now - this._time) % this.duration) / this.duration
    result.color = this._color
    return result
  }

  get isConstant(): boolean {
    return false
  }

  get definitionChanged(): CesiumEvent {
    return this._definitionChanged
  }

  equals(other?: any): boolean {
    return (
      this === other ||
      (other instanceof DynamicWallMaterialProperty &&
        this._color.equals(other._color))
    )
  }

  setColor(color: Color) {
    this._color = color
  }

  private _addMaterialToCache(): void {
    const cache = (Material as any)._materialCache
    if (cache.getMaterial(this._materialType)) {
      return
    }
    cache.addMaterial(this._materialType, {
      fabric: {
        type: this._materialType,
        uniforms: {
          color: this._color,
          time: 0,
        },
        source: DYNAMIC_WALL_SHADER,
      },
      translucent: () => true,
    })
  }
}
