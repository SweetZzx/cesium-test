import {
    Cartesian2,
    Cartesian3,
    Color,
    HeightReference,
    Label,
    LabelCollection,
    LabelStyle,
    PolylineGraphics,
    PolygonGraphics,
    PolygonHierarchy,
    VerticalOrigin,
    Viewer,
    CallbackProperty
} from "cesium"
import { BaseMeasure } from "./BaseMeasure"
import EventDispatcher from "../EventDispatcher/EventDispatcher"
import { MeasureUtil } from "./MeasureUtil"

/**
 * 面积/周长量测
 * 面积采用向量叉积方式计算，周长类似距离量测
 *
 * 【重要】：使用 LabelCollection 原始图元替代 Entity Label
 * 原因：vite-plugin-cesium 打包后 Cesium 内部的 LabelCollection 构造函数引用丢失，
 * 导致 Entity.Label → LabelVisualizer → EntityCluster.getLabel 链路崩溃。
 * LabelCollection 是 Primitive，不走 Entity/EntityCluster 系统，完美规避此问题。
 */
export class AreaMeasure extends BaseMeasure {
    private measureUtil: MeasureUtil

    // 存储面积标注的 Label 对象
    private areaLabelObject: Label | null = null

    // LabelCollection Primitive（图元，不走 Entity 系统）
    private labelCollection: LabelCollection

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher)
        this.measureUtil = MeasureUtil.getInstance(viewer)
        this.minPointCount = 3
        this.labelCollection = new LabelCollection({ scene: viewer.scene })
        viewer.scene.primitives.add(this.labelCollection)
    }

    protected buildFinalEntity() {
        return this.viewer.entities.add({
            polygon: new PolygonGraphics({
                hierarchy: new PolygonHierarchy(this.getPositions()),
                material: Color.LIME.withAlpha(0.3),
                outline: true,
                outlineColor: Color.LIME,
                heightReference: HeightReference.CLAMP_TO_GROUND
            })
        })
    }

    protected buildTempEntity() {
        if (this.pointEntities.length < 1 || !this.tempCursor) return undefined
        return this.viewer.entities.add({
            polyline: new PolylineGraphics({
                positions: new CallbackProperty(() => [...this.getPositions(), this.tempCursor!], false),
                width: 2,
                material: Color.YELLOW.withAlpha(0.6),
                clampToGround: true
            })
        })
    }

    private clearAreaLabel(): void {
        if (this.areaLabelObject) {
            this.labelCollection.remove(this.areaLabelObject)
            this.areaLabelObject = null
        }
    }

    clearEntities(): void {
        this.clearAreaLabel()
        super.clearEntities()
    }

    destroy(): void {
        this.clearAreaLabel()
        if (this.labelCollection && this.viewer) {
            this.labelCollection.removeAll()
            this.viewer.scene.primitives.remove(this.labelCollection)
        }
        super.destroy()
    }

    protected addPoint(position: Cartesian3): void {
        // 先添加落点标记（只有 point，无 label）
        const point = this.viewer.entities.add({
            id: "measure_point_entity_" + Date.now(),
            position,
            point: {
                pixelSize: 10,
                color: Color.YELLOW,
                heightReference: HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        })
        this.pointEntities.push(point)

        const positions = this.getPositions()
        if (positions.length >= 3) {
            // 点数达到3个时，实时计算面积和周长
            void this.measureUtil.calculatePolygonAreaPerimeter(positions).then((result) => {
                // 先清除旧标注
                this.clearAreaLabel()

                // 用 LabelCollection 添加面积标注
                this.areaLabelObject = this.labelCollection.add({
                    position,
                    text: `面积: ${result.area.formatted}\n周长: ${result.perimeter.formatted}`,
                    font: '18px sans-serif',
                    fillColor: Color.LIME,
                    outlineColor: Color.BLACK,
                    outlineWidth: 2,
                    style: LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: VerticalOrigin.BOTTOM,
                    horizontalOrigin: 0,
                    pixelOffset: new Cartesian2(20, -20),
                    heightReference: HeightReference.NONE,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                })
            })
        }
    }

    finish(): void {
        super.finish()
        // 不清除面积标注，保留在地图上显示
    }
}
