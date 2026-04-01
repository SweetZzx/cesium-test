import {
    Cartesian2,
    Cartesian3,
    Color,
    HeightReference,
    Label,
    LabelCollection,
    LabelStyle,
    PolylineGraphics,
    VerticalOrigin,
    Viewer,
    CallbackProperty
} from "cesium"
import { BaseMeasure } from "./BaseMeasure"
import EventDispatcher from "../EventDispatcher/EventDispatcher"
import { MeasureUtil } from "./MeasureUtil"

/**
 * 距离量测
 * 每点击一个点记录与上一点的距离以及总线段距离
 * 空间距离同步计算，贴地距离异步采样地形
 *
 * 【重要】：使用 LabelCollection 原始图元替代 Entity Label
 * 原因：vite-plugin-cesium 打包后 Cesium 内部的 LabelCollection 构造函数引用丢失，
 * 导致 Entity.Label → LabelVisualizer → EntityCluster.getLabel 链路崩溃。
 * LabelCollection 是 Primitive，不走 Entity/EntityCluster 系统，完美规避此问题。
 */
export class DistanceMeasure extends BaseMeasure {
    private measureUtil: MeasureUtil
    private totalSpace = 0
    private totalGround = 0

    // 存储每个落点的标注对象
    private pointLabelObjects: Label[] = []

    // LabelCollection Primitive（图元，不走 Entity 系统）
    private labelCollection: LabelCollection

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher)
        this.measureUtil = MeasureUtil.getInstance(viewer)
        this.labelCollection = new LabelCollection({ scene: viewer.scene })
        viewer.scene.primitives.add(this.labelCollection)
    }

    protected buildFinalEntity() {
        return this.viewer.entities.add({
            polyline: new PolylineGraphics({
                positions: new CallbackProperty(() => this.getPositions(), false),
                width: 3,
                material: Color.ORANGE,
                clampToGround: true
            })
        })
    }

    protected buildTempEntity() {
        if (this.pointEntities.length < 1 || !this.tempCursor) return undefined
        return this.viewer.entities.add({
            polyline: new PolylineGraphics({
                positions: new CallbackProperty(
                    () => [...this.getPositions(), this.tempCursor!],
                    false
                ),
                width: 2,
                material: Color.YELLOW.withAlpha(0.6),
                clampToGround: true
            })
        })
    }

    protected addPoint(position: Cartesian3): void {
        const positions = this.getPositions()

        if (positions.length >= 1) {
            const lastPos = positions[positions.length - 1]

            // 同步计算空间距离
            const spaceResult = this.measureUtil.calculateSpaceDistance(lastPos, position)
            this.totalSpace += spaceResult.rawValue
            const totalSpaceText = this.measureUtil.formatResult(this.totalSpace).formatted

            // 同步创建落点实体（只有 point，无 label）
            const tempPoint = this.viewer.entities.add({
                id: "measure_point_entity_" + Date.now(),
                position,
                point: {
                    pixelSize: 10,
                    color: Color.YELLOW,
                    heightReference: HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            })
            this.pointEntities.push(tempPoint)

            // 用 LabelCollection 添加标注
            const initialText = `空间距离：${totalSpaceText}(计算中...)`
            const labelIndex = this.pointEntities.length - 1

            const labelObj = this.labelCollection.add({
                position,
                text: initialText,
                font: '18px sans-serif',
                fillColor: Color.CHARTREUSE,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                style: LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: VerticalOrigin.BOTTOM,
                horizontalOrigin: 0,
                pixelOffset: new Cartesian2(20, -20),
                heightReference: HeightReference.NONE,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            })
            this.pointLabelObjects.push(labelObj)

            // 贴地距离异步计算，完成后更新标注文字
            void this.measureUtil.calculateGroundDistance(lastPos, position).then((groundResult) => {
                this.totalGround += groundResult.rawValue
                const totalGroundText = this.measureUtil.formatResult(this.totalGround).formatted
                const distanceText =
                    `空间距离：${totalSpaceText}(+${spaceResult.formatted})` +
                    `\n贴地距离：${totalGroundText}(+${groundResult.formatted})`

                if (this.pointLabelObjects[labelIndex]) {
                    this.pointLabelObjects[labelIndex].text = distanceText
                }
            })
        } else {
            // 第一个点：只显示标记，无标注
            this.pointLabelObjects.push(null as unknown as Label)

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
        }
    }

    private clearLabels(): void {
        if (this.labelCollection) {
            this.labelCollection.removeAll()
        }
        this.pointLabelObjects = []
    }

    clearEntities(): void {
        super.clearEntities()
        this.clearLabels()
    }

    destroy(): void {
        this.clearLabels()
        if (this.labelCollection && this.viewer) {
            this.viewer.scene.primitives.remove(this.labelCollection)
        }
        super.destroy()
    }

    finish(): void {
        super.finish()
        this.totalSpace = 0
        this.totalGround = 0
    }
}
