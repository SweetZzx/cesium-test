import {
    CallbackProperty,
    Cartesian2,
    Cartesian3,
    Color,
    Entity,
    HeightReference,
    LabelStyle,
    PolylineGraphics,
    VerticalOrigin,
    Viewer
} from "cesium"
import { BaseMeasure } from "./BaseMeasure"
import EventDispatcher from "../EventDispatcher/EventDispatcher"
import { MeasureUtil } from "./MeasureUtil"

/**
 * 距离量测
 * 每点击一个点记录与上一点的距离以及总线段距离
 * 空间距离同步计算，贴地距离异步采样地形
 */
export class DistanceMeasure extends BaseMeasure {
    private measureUtil: MeasureUtil
    private totalSpace = 0
    private totalGround = 0

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher)
        this.measureUtil = MeasureUtil.getInstance(viewer)
    }

    protected buildFinalEntity(): Entity {
        return this.viewer.entities.add({
            polyline: new PolylineGraphics({
                positions: new CallbackProperty(() => this.getPositions(), false),
                width: 3,
                material: Color.ORANGE,
                clampToGround: true
            })
        })
    }

    protected buildTempEntity(): Entity | undefined {
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

    /** 重写 addPoint：每落一个点计算与上一点的距离 */
    protected addPoint(position: Cartesian3): void {
        const positions = this.getPositions()

        if (positions.length >= 1) {
            const lastPos = positions[positions.length - 1]
            const spaceResult = this.measureUtil.calculateSpaceDistance(lastPos, position)
            this.totalSpace += spaceResult.rawValue
            const totalSpaceText = this.measureUtil.formatResult(this.totalSpace).formatted

            // 贴地距离异步计算，完成后创建带标注的落点
            this.measureUtil.calculateGroundDistance(lastPos, position).then((groundResult) => {
                this.totalGround += groundResult.rawValue
                const totalGroundText = this.measureUtil.formatResult(this.totalGround).formatted
                const distanceText =
                    `空间距离：${totalSpaceText}(+${spaceResult.formatted})` +
                    `\n贴地距离：${totalGroundText}(+${groundResult.formatted})`

                const point = this.viewer.entities.add({
                    id: "measure_point_entity_" + Date.now(),
                    position,
                    point: {
                        pixelSize: 10,
                        color: Color.YELLOW,
                        heightReference: HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY
                    },
                    label: {
                        text: distanceText,
                        font: "18px sans-serif",
                        fillColor: Color.CHARTREUSE,
                        style: LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        verticalOrigin: VerticalOrigin.BOTTOM,
                        pixelOffset: new Cartesian2(20, -20),
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        heightReference: HeightReference.NONE
                    }
                })
                this.pointEntities.push(point)
            })
        } else {
            // 第一个点：只显示标记
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

    finish(): void {
        super.finish()
        this.totalSpace = 0
        this.totalGround = 0
    }
}
