import {
  Cartesian3,
  Color,
  Material,
  Primitive,
  PolylineGeometry,
  PolylineMaterialAppearance,
  GeometryInstance,
  Viewer,
} from 'cesium'
import { getBezierPoints } from '../Utils/MathCalculateUtil'
import CoordinatesUtil from '../Utils/CoordinatesUtil'

export interface ICityPosition {
  name: string
  position: Cartesian3
}

export interface MigrationLineOptions {
  color?: Color
  percentage?: number
  speed?: number
}

const MIGRATION_LINE_SHADER = `
uniform vec4 color;
uniform float percentage;
uniform float offset;

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);

  vec2 st = materialInput.st;
  float s = fract(st.s - offset);

  float alpha = 0.0;
  if (s < percentage) {
    float t = s / percentage;
    alpha = t * t * (3.0 - 2.0 * t);
  }

  float headGlow = 0.0;
  float headStart = percentage * 0.8;
  if (s > headStart && s < percentage) {
    float ht = (s - headStart) / (percentage - headStart);
    headGlow = ht * ht;
  }

  vec3 finalColor = color.rgb * (1.0 + headGlow * 0.8);

  material.diffuse = finalColor;
  material.alpha = alpha * color.a;
  material.emission = finalColor * alpha * 1.2;

  return material;
}
`

export default class MigrationLine {
  private viewer: Viewer
  private primitives: Primitive[] = []
  private material: Material | null = null
  private _color: Color
  private _percentage: number
  private _offset = 0
  private _speed: number
  private _animationListener: ((...args: any[]) => void) | null = null
  private _isShowing = false

  constructor(viewer: Viewer, options: MigrationLineOptions = {}) {
    this.viewer = viewer
    this._color = options.color ?? Color.fromCssColorString('#00ffff')
    this._percentage = options.percentage ?? 0.4
    this._speed = options.speed ?? 0.005
  }

  private generateCurvePositions(start: Cartesian3, end: Cartesian3): Cartesian3[] {
    const startLonLat = CoordinatesUtil.Cartesian2Wgs84Lonlat(start)
    const endLonLat = CoordinatesUtil.Cartesian2Wgs84Lonlat(end)

    const midLon = (startLonLat[0] + endLonLat[0]) / 2
    const midLat = (startLonLat[1] + endLonLat[1]) / 2

    const dx = endLonLat[0] - startLonLat[0]
    const dy = endLonLat[1] - startLonLat[1]
    const dist = Math.sqrt(dx * dx + dy * dy)
    const arcHeight = Math.max(dist * 30000, 80000)

    const bezierPoints = getBezierPoints([startLonLat, [midLon, midLat], endLonLat])

    return bezierPoints.map((p, i) => {
      const t = i / (bezierPoints.length - 1)
      const h = arcHeight * 4 * t * (1 - t)
      return Cartesian3.fromDegrees(p[0], p[1], h)
    })
  }

  show(start: ICityPosition, ends: ICityPosition[]) {
    this.destroy()

    this.material = new Material({
      fabric: {
        type: 'MigrationLineMaterial_' + Date.now(),
        uniforms: {
          color: this._color,
          percentage: this._percentage,
          offset: this._offset,
        },
        source: MIGRATION_LINE_SHADER,
      },
    })

    const appearance = new PolylineMaterialAppearance({
      material: this.material,
      translucent: true,
    })

    ends.forEach((end) => {
      const positions = this.generateCurvePositions(start.position, end.position)

      const geometry = new PolylineGeometry({
        positions,
        width: 5,
      })

      const instance = new GeometryInstance({
        geometry,
      })

      const primitive = new Primitive({
        geometryInstances: instance,
        appearance,
        asynchronous: false,
      })

      this.primitives.push(primitive)
      this.viewer.scene.primitives.add(primitive)
    })

    this._isShowing = true
    this.startAnimation()
  }

  private startAnimation() {
    this._animationListener = () => {
      this._offset += this._speed
      if (this._offset > 1.0) this._offset -= 1.0

      if (this.material) {
        this.material.uniforms.offset = this._offset
      }
    }
    this.viewer.scene.preUpdate.addEventListener(this._animationListener)
  }

  setColor(color: Color) {
    this._color = color
    if (this.material) {
      this.material.uniforms.color = color
    }
  }

  setPercentage(percentage: number) {
    this._percentage = percentage
    if (this.material) {
      this.material.uniforms.percentage = percentage
    }
  }

  setSpeed(speed: number) {
    this._speed = speed
  }

  get isShowing() {
    return this._isShowing
  }

  destroy() {
    if (this._animationListener) {
      this.viewer.scene.preUpdate.removeEventListener(this._animationListener)
      this._animationListener = null
    }

    this.primitives.forEach((primitive) => {
      this.viewer.scene.primitives.remove(primitive)
    })
    this.primitives = []
    this.material = null
    this._isShowing = false
    this._offset = 0
  }
}
