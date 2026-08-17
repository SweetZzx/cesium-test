import * as turf from '@turf/turf'
import { Cartesian3, Color, Entity, HeightReference, Viewer } from 'cesium'
import TurfUtil from '../TurfUtil'
import CoordinatesUtil from '../CoordinatesUtil'

export type BufferGeometryType = 'point' | 'line' | 'polygon'

export interface BufferOptions {
  radius: number
  units: turf.Units
  steps?: number
}

export interface BufferResult {
  positions: Cartesian3[]
  area: number
  perimeter: number
}

export default class BufferUtil {

  static toTurfFeature(
    positions: Cartesian3[],
    geometryType: BufferGeometryType
  ) {
    switch (geometryType) {
      case 'point':
        return TurfUtil.Cartesian2TurfPoint(positions[0])
      case 'line':
        return TurfUtil.Cartesians2TurfLinestring(positions)
      case 'polygon':
        return TurfUtil.Cartesians2TurfPolygon(positions)
      default:
        throw new Error(`不支持的几何类型: ${geometryType}`)
    }
  }

  static createBuffer(
    positions: Cartesian3[],
    geometryType: BufferGeometryType,
    options: BufferOptions
  ): BufferResult | null {
    if (positions.length === 0) return null

    const feature = BufferUtil.toTurfFeature(positions, geometryType)

    const buffered = turf.buffer(feature, options.radius, {
      units: options.units,
      steps: options.steps ?? 64,
    })

    if (!buffered) return null

    const coords = buffered.geometry.coordinates[0] as number[][]
    const bufferPositions = coords.map((p) =>
      CoordinatesUtil.LonLat2Cartesian(p, undefined)
    )

    const area = turf.area(buffered)
    const perimeterCoords = coords.map((c: number[]) => c.slice(0, 2) as [number, number])
    perimeterCoords.push(perimeterCoords[0])
    const perimeter = turf.length(turf.lineString(perimeterCoords), { units: 'meters' })

    return {
      positions: bufferPositions,
      area,
      perimeter,
    }
  }

  static renderBuffer(
    viewer: Viewer,
    positions: Cartesian3[],
    fillColor: Color = Color.fromCssColorString('rgba(0, 200, 255, 0.3)'),
    outlineColor: Color = Color.fromCssColorString('rgba(0, 200, 255, 0.8)')
  ): Entity {
    return viewer.entities.add({
      polygon: {
        hierarchy: positions,
        material: fillColor,
        outline: true,
        outlineColor,
        outlineWidth: 2,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    })
  }

  static renderSource(
    viewer: Viewer,
    positions: Cartesian3[],
    geometryType: BufferGeometryType
  ): Entity | null {
    switch (geometryType) {
      case 'point':
        return viewer.entities.add({
          position: positions[0],
          point: {
            pixelSize: 10,
            color: Color.YELLOW,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        })
      case 'line':
        return viewer.entities.add({
          polyline: {
            positions: positions,
            width: 3,
            material: Color.YELLOW,
            clampToGround: true,
          },
        })
      case 'polygon':
        return viewer.entities.add({
          polygon: {
            hierarchy: positions,
            material: Color.YELLOW.withAlpha(0.4),
            outline: true,
            outlineColor: Color.YELLOW,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
        })
      default:
        return null
    }
  }

  static formatArea(sqm: number): string {
    if (sqm >= 1_000_000) {
      return `${(sqm / 1_000_000).toFixed(3)} km²`
    }
    return `${sqm.toFixed(2)} m²`
  }

  static formatPerimeter(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(3)} km`
    }
    return `${meters.toFixed(2)} m`
  }
}
