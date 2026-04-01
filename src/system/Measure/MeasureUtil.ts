import { Cartesian3, Cartographic, Ellipsoid, sampleTerrainMostDetailed } from "cesium"
import { MeasureLogger } from "./MeasureLogger"

const TAG = 'MeasureUtil'

/** 量算结果 */
export interface MeasureResult {
    rawValue: number   // 原始值（米/平方米）
    formatted: string  // 格式化字符串
}

export class MeasureUtil {

    private static instance: MeasureUtil
    private viewer: unknown

    private constructor(viewer: unknown) {
        this.viewer = viewer
        MeasureLogger.info(TAG, 'MeasureUtil 实例已创建', { viewer: !!viewer })
    }

    static getInstance(viewer?: unknown): MeasureUtil {
        if (!MeasureUtil.instance && viewer) {
            MeasureUtil.instance = new MeasureUtil(viewer)
        }
        return MeasureUtil.instance
    }

    /**
     * 计算两点空间直线距离
     */
    calculateSpaceDistance(pos1: Cartesian3, pos2: Cartesian3): MeasureResult {
        const distance = Cartesian3.distance(pos1, pos2)
        MeasureLogger.debug(TAG, 'calculateSpaceDistance', {
            pos1: { x: pos1.x, y: pos1.y, z: pos1.z },
            pos2: { x: pos2.x, y: pos2.y, z: pos2.z },
            distance
        })
        return {
            rawValue: distance,
            formatted: this.formatDistance(distance)
        }
    }

    /**
     * 计算两点贴地距离（异步，采样地形）
     */
    async calculateGroundDistance(pos1: Cartesian3, pos2: Cartesian3): Promise<MeasureResult> {
        MeasureLogger.enter(TAG, 'calculateGroundDistance', {
            pos1: { x: pos1.x, y: pos1.y, z: pos1.z },
            pos2: { x: pos2.x, y: pos2.y, z: pos2.z }
        })
        const carto1 = Ellipsoid.WGS84.cartesianToCartographic(pos1)
        const carto2 = Ellipsoid.WGS84.cartesianToCartographic(pos2)

        if (!carto1 || !carto2) {
            MeasureLogger.warn(TAG, 'calculateGroundDistance: cartographic 转换失败，返回 0')
            return { rawValue: 0, formatted: "0m" }
        }

        // 沿线段插值采样点
        const granularity = 0.0001 // 约每11米一个采样点
        const positions = this.interpolateCartographic(carto1, carto2, granularity)
        MeasureLogger.debug(TAG, 'calculateGroundDistance: 插值点数', { count: positions.length })

        let totalDistance = 0

        // 采样地形高度
        const terrainProvider = (this.viewer as { terrainProvider?: unknown })?.terrainProvider
        if (terrainProvider) {
            try {
                const updatedPositions = await sampleTerrainMostDetailed(
                    terrainProvider as Parameters<typeof sampleTerrainMostDetailed>[0],
                    positions as Cartographic[]
                )
                MeasureLogger.debug(TAG, 'calculateGroundDistance: 地形采样成功', {
                    sampleCount: updatedPositions.length
                })
                for (let i = 1; i < updatedPositions.length; i++) {
                    const p1 = Cartesian3.fromRadians(
                        updatedPositions[i - 1].longitude,
                        updatedPositions[i - 1].latitude,
                        updatedPositions[i - 1].height
                    )
                    const p2 = Cartesian3.fromRadians(
                        updatedPositions[i].longitude,
                        updatedPositions[i].latitude,
                        updatedPositions[i].height
                    )
                    totalDistance += Cartesian3.distance(p1, p2)
                }
            } catch (err) {
                // 地形采样失败，回退到椭球面距离
                MeasureLogger.warn(TAG, 'calculateGroundDistance: 地形采样失败，回退到椭球面距离', { error: String(err) })
                totalDistance = this.calculateEllipsoidDistance(carto1, carto2)
            }
        } else {
            MeasureLogger.debug(TAG, 'calculateGroundDistance: 无 terrainProvider，使用椭球面距离')
            totalDistance = this.calculateEllipsoidDistance(carto1, carto2)
        }

        MeasureLogger.exit(TAG, 'calculateGroundDistance', { totalDistance })
        return {
            rawValue: totalDistance,
            formatted: this.formatDistance(totalDistance)
        }
    }

    /**
     * 计算多边形面积和周长
     */
    async calculatePolygonAreaPerimeter(positions: Cartesian3[]): Promise<{
        area: MeasureResult
        perimeter: MeasureResult
    }> {
        MeasureLogger.enter(TAG, 'calculatePolygonAreaPerimeter', { count: positions.length })
        if (positions.length < 3) {
            MeasureLogger.warn(TAG, 'calculatePolygonAreaPerimeter: 点数不足，返回 0')
            return {
                area: { rawValue: 0, formatted: "0m²" },
                perimeter: { rawValue: 0, formatted: "0m" }
            }
        }

        // 计算面积：使用向量叉积
        let area = 0

        // 在笛卡尔坐标系中计算平面面积（近似）
        for (let i = 0; i < positions.length; i++) {
            const j = (i + 1) % positions.length
            const v1 = positions[i]
            const v2 = positions[j]
            const cross = Cartesian3.cross(v1, v2, new Cartesian3())
            area += Cartesian3.magnitude(cross)
        }
        area = area / 2
        MeasureLogger.debug(TAG, 'calculatePolygonAreaPerimeter: 面积计算完成', { area })

        // 计算周长
        let perimeter = 0
        for (let i = 0; i < positions.length; i++) {
            const j = (i + 1) % positions.length
            perimeter += Cartesian3.distance(positions[i], positions[j])
        }
        MeasureLogger.debug(TAG, 'calculatePolygonAreaPerimeter: 周长计算完成', { perimeter })

        MeasureLogger.exit(TAG, 'calculatePolygonAreaPerimeter')
        return {
            area: {
                rawValue: area,
                formatted: this.formatArea(area)
            },
            perimeter: {
                rawValue: perimeter,
                formatted: this.formatDistance(perimeter)
            }
        }
    }

    /**
     * 计算两点间水平距离
     */
    calculateHorizontalDistance(pos1: Cartesian3, pos2: Cartesian3): MeasureResult {
        const carto1 = Ellipsoid.WGS84.cartesianToCartographic(pos1)
        const carto2 = Ellipsoid.WGS84.cartesianToCartographic(pos2)
        if (!carto1 || !carto2) return { rawValue: 0, formatted: "0m" }

        const p1 = Cartesian3.fromRadians(carto1.longitude, carto1.latitude, 0)
        const p2 = Cartesian3.fromRadians(carto2.longitude, carto2.latitude, 0)
        const distance = Cartesian3.distance(p1, p2)
        return { rawValue: distance, formatted: this.formatDistance(distance) }
    }

    /**
     * 计算两点间垂直距离
     */
    calculateVerticalDistance(pos1: Cartesian3, pos2: Cartesian3): MeasureResult {
        const carto1 = Ellipsoid.WGS84.cartesianToCartographic(pos1)
        const carto2 = Ellipsoid.WGS84.cartesianToCartographic(pos2)
        if (!carto1 || !carto2) return { rawValue: 0, formatted: "0m" }

        const distance = Math.abs(carto1.height - carto2.height)
        return { rawValue: distance, formatted: this.formatDistance(distance) }
    }

    /**
     * 格式化距离
     */
    formatDistance(value: number): string {
        if (value < 1000) {
            return value.toFixed(2) + "m"
        }
        return (value / 1000).toFixed(3) + "km"
    }

    /**
     * 格式化结果（通用）
     */
    formatResult(value: number): MeasureResult {
        return {
            rawValue: value,
            formatted: this.formatDistance(value)
        }
    }

    /**
     * 格式化面积
     */
    formatArea(value: number): string {
        if (value < 1000000) {
            return value.toFixed(2) + "m²"
        }
        return (value / 1000000).toFixed(3) + "km²"
    }

    // --- 私有方法 ---

    /** 沿经纬度插值 */
    private interpolateCartographic(
        start: { longitude: number; latitude: number; height: number },
        end: { longitude: number; latitude: number; height: number },
        granularity: number
    ): { longitude: number; latitude: number; height: number }[] {
        const positions: { longitude: number; latitude: number; height: number }[] = []
        const diffLon = end.longitude - start.longitude
        const diffLat = end.latitude - start.latitude
        const totalAngle = Math.sqrt(diffLon * diffLon + diffLat * diffLat)
        const count = Math.max(2, Math.ceil(totalAngle / granularity))

        for (let i = 0; i <= count; i++) {
            const t = i / count
            positions.push({
                longitude: start.longitude + diffLon * t,
                latitude: start.latitude + diffLat * t,
                height: start.height + (end.height - start.height) * t
            })
        }
        return positions
    }

    /** 椭球面距离 */
    private calculateEllipsoidDistance(
        carto1: { longitude: number; latitude: number },
        carto2: { longitude: number; latitude: number }
    ): number {
        const p1 = Cartesian3.fromRadians(carto1.longitude, carto1.latitude, 0)
        const p2 = Cartesian3.fromRadians(carto2.longitude, carto2.latitude, 0)
        return Cartesian3.distance(p1, p2)
    }
}
