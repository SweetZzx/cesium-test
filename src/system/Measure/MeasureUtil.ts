import { Cartesian3, Cartographic, Ellipsoid, sampleTerrainMostDetailed } from "cesium"

/** 量算结果 */
export interface MeasureResult {
    rawValue: number
    formatted: string
}

export class MeasureUtil {

    private static instance: MeasureUtil
    private viewer: unknown

    private constructor(viewer: unknown) {
        this.viewer = viewer
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
        return {
            rawValue: distance,
            formatted: this.formatDistance(distance)
        }
    }

    /**
     * 计算两点贴地距离（异步，采样地形）
     */
    async calculateGroundDistance(pos1: Cartesian3, pos2: Cartesian3): Promise<MeasureResult> {
        const carto1 = Ellipsoid.WGS84.cartesianToCartographic(pos1)
        const carto2 = Ellipsoid.WGS84.cartesianToCartographic(pos2)

        if (!carto1 || !carto2) {
            return { rawValue: 0, formatted: "0m" }
        }

        const granularity = 0.0001
        const positions = this.interpolateCartographic(carto1, carto2, granularity)

        let totalDistance = 0

        const terrainProvider = (this.viewer as { terrainProvider?: unknown })?.terrainProvider
        if (terrainProvider) {
            try {
                const updatedPositions = await sampleTerrainMostDetailed(
                    terrainProvider as Parameters<typeof sampleTerrainMostDetailed>[0],
                    positions as Cartographic[]
                )
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
            } catch {
                totalDistance = this.calculateEllipsoidDistance(carto1, carto2)
            }
        } else {
            totalDistance = this.calculateEllipsoidDistance(carto1, carto2)
        }

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
        if (positions.length < 3) {
            return {
                area: { rawValue: 0, formatted: "0m²" },
                perimeter: { rawValue: 0, formatted: "0m" }
            }
        }

        let area = 0
        for (let i = 0; i < positions.length; i++) {
            const j = (i + 1) % positions.length
            const cross = Cartesian3.cross(positions[i], positions[j], new Cartesian3())
            area += Cartesian3.magnitude(cross)
        }
        area = area / 2

        let perimeter = 0
        for (let i = 0; i < positions.length; i++) {
            const j = (i + 1) % positions.length
            perimeter += Cartesian3.distance(positions[i], positions[j])
        }

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

    private calculateEllipsoidDistance(
        carto1: { longitude: number; latitude: number },
        carto2: { longitude: number; latitude: number }
    ): number {
        const p1 = Cartesian3.fromRadians(carto1.longitude, carto1.latitude, 0)
        const p2 = Cartesian3.fromRadians(carto2.longitude, carto2.latitude, 0)
        return Cartesian3.distance(p1, p2)
    }
}
