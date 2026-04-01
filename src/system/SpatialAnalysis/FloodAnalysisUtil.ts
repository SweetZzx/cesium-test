import {
    CallbackProperty,
    Cartesian3,
    Color,
    CustomDataSource,
    Entity,
    PolygonHierarchy,
    Viewer
} from "cesium"

/**
 * 淹没分析工具类
 * 通过动态拉伸Polygon的extrudedHeight实现水面上升的淹没模拟效果
 */
export default class FloodAnalysisUtil {
    private viewer: Viewer | undefined
    private dataSource: CustomDataSource | null = null
    private timer: ReturnType<typeof setInterval> | null = null
    private waterEntity: Entity | undefined

    constructor(viewer: Viewer | undefined) {
        this.viewer = viewer
        this.dataSource = new CustomDataSource("floodAnalysis")
        this.viewer?.dataSources.add(this.dataSource)
    }

    /**
     * 执行淹没分析
     * @param startHeight 初始水面高度（米）
     * @param targetHeight 目标水面高度（米）
     * @param speed 淹没速度（米/秒）
     * @param polygonCoords 目标区域顶点坐标数组
     */
    flood(
        startHeight: number,
        targetHeight: number,
        speed: number,
        polygonCoords: Cartesian3[] | undefined
    ): void {
        // 清理之前的淹没效果
        this.remove()

        if (!polygonCoords || polygonCoords.length < 3) {
            console.warn("淹没分析：多边形坐标无效")
            return
        }

        // 计算每帧增加的高度（setInterval 50ms）
        const heightPerTick = speed * 0.05

        this.waterEntity = this.dataSource!.entities.add({
            polygon: {
                hierarchy: new PolygonHierarchy(polygonCoords),
                material: Color.fromCssColorString("rgba(0, 123, 229, 0.5)"),
                extrudedHeight: new CallbackProperty(() => {
                    return this.waterEntity?.properties?.currentHeight?.getValue() ?? startHeight
                }, false)
            },
            properties: {
                currentHeight: startHeight
            }
        })

        this.timer = setInterval(() => {
            const h = this.waterEntity?.properties?.currentHeight.getValue() as number
            if (h >= targetHeight) {
                if (this.timer) {
                    clearInterval(this.timer)
                    this.timer = null
                }
                return
            }
            this.waterEntity?.properties?.currentHeight.setValue(h + heightPerTick)
        }, 50)
    }

    /**
     * 清理淹没分析效果
     */
    remove(): void {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
        }
        this.dataSource?.entities.removeAll()
    }

    /**
     * 销毁工具实例
     */
    destroy(): void {
        this.remove()
        if (this.dataSource && this.viewer) {
            this.viewer.dataSources.remove(this.dataSource)
        }
        this.dataSource = null
        this.waterEntity = undefined
    }
}
