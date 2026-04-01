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
import { MeasureLogger } from "./MeasureLogger"

const TAG = 'DistanceMeasure'

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

    // 存储每个落点的标注文字（用于直接赋值更新）
    private pointLabels: string[] = []

    // 每个落点的标注对象（直接操作 Label 实例属性，无 Property 系统）
    private pointLabelObjects: Label[] = []

    // LabelCollection Primitive（图元，不走 Entity 系统）
    private labelCollection: LabelCollection

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher)
        this.measureUtil = MeasureUtil.getInstance(viewer)
        // 创建 LabelCollection primitive 并加入场景
        this.labelCollection = new LabelCollection({ scene: viewer.scene })
        viewer.scene.primitives.add(this.labelCollection)
        MeasureLogger.info(TAG, 'DistanceMeasure 实例已创建，LabelCollection 已加入场景')
    }

    protected buildFinalEntity() {
        MeasureLogger.debug(TAG, 'buildFinalEntity: 构建最终线段实体')
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
        MeasureLogger.debug(TAG, 'buildTempEntity', {
            pointCount: this.pointEntities.length,
            hasTempCursor: !!this.tempCursor
        })
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
        MeasureLogger.enter(TAG, 'addPoint', { position, totalSpace: this.totalSpace, totalGround: this.totalGround })
        const positions = this.getPositions()

        if (positions.length >= 1) {
            const lastPos = positions[positions.length - 1]
            MeasureLogger.debug(TAG, 'addPoint: 计算空间距离', { lastPos, currentPos: position })

            // 同步计算空间距离
            const spaceResult = this.measureUtil.calculateSpaceDistance(lastPos, position)
            this.totalSpace += spaceResult.rawValue
            const totalSpaceText = this.measureUtil.formatResult(this.totalSpace).formatted
            MeasureLogger.info(TAG, 'addPoint: 空间距离累加', {
                segmentSpace: spaceResult.formatted,
                totalSpace: totalSpaceText,
                newTotal: this.totalSpace
            })

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
            MeasureLogger.info(TAG, `addPoint: 落点实体已添加（无 Entity label，走 Primitive 系统）`)

            // 用 LabelCollection primitive 添加标注（图元系统，不触发 EntityCluster 崩溃）
            const initialText = `空间距离：${totalSpaceText}(计算中...)`
            this.pointLabels.push(initialText)
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
                horizontalOrigin: 0, // HorizontalOrigin.LEFT
                pixelOffset: new Cartesian2(20, -20),
                heightReference: HeightReference.NONE,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            })
            this.pointLabelObjects.push(labelObj)
            MeasureLogger.info(TAG, `addPoint: LabelCollection 标注已添加，labelIndex=${labelIndex}`)

            // 贴地距离异步计算，完成后更新标注文字
            void this.measureUtil.calculateGroundDistance(lastPos, position).then((groundResult) => {
                MeasureLogger.debug(TAG, 'addPoint: 贴地距离计算完成（异步回调）', {
                    segmentGround: groundResult.formatted,
                    rawValue: groundResult.rawValue
                })

                this.totalGround += groundResult.rawValue
                const totalGroundText = this.measureUtil.formatResult(this.totalGround).formatted
                const distanceText =
                    `空间距离：${totalSpaceText}(+${spaceResult.formatted})` +
                    `\n贴地距离：${totalGroundText}(+${groundResult.formatted})`

                // 直接更新 Label 对象的 text 属性（LabelCollection 图元，走 Primitive 渲染管线，不触发 EntityCluster）
                if (this.pointLabelObjects[labelIndex]) {
                    this.pointLabelObjects[labelIndex].text = distanceText
                    MeasureLogger.info(TAG, 'addPoint: 标注已更新', { distanceText: distanceText.replace(/\n/g, '\\n') })
                }
            }).catch((err: unknown) => {
                MeasureLogger.error(TAG, 'addPoint: 贴地距离计算失败', { error: String(err) })
            })
        } else {
            // 第一个点：只显示标记，无标注
            MeasureLogger.info(TAG, 'addPoint: 第一个点，仅创建标记')
            this.pointLabels.push('')
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
            MeasureLogger.info(TAG, `addPoint: 第一个点已添加，当前共 ${this.pointEntities.length} 个点`)
        }
        MeasureLogger.exit(TAG, 'addPoint')
    }

    /** 清除 LabelCollection 中的标注 */
    private clearLabels(): void {
        if (this.labelCollection) {
            this.labelCollection.removeAll()
        }
        this.pointLabels = []
        this.pointLabelObjects = []
    }

    clearEntities(): void {
        super.clearEntities()
        this.clearLabels()
    }

    destroy(): void {
        this.clearLabels()
        // 从场景中移除 LabelCollection
        if (this.labelCollection && this.viewer) {
            this.viewer.scene.primitives.remove(this.labelCollection)
        }
        super.destroy()
    }

    finish(): void {
        MeasureLogger.enter(TAG, 'finish')
        super.finish()
        MeasureLogger.info(TAG, 'finish: 重置累加值', {
            resetTotalSpace: this.totalSpace,
            resetTotalGround: this.totalGround
        })
        this.totalSpace = 0
        this.totalGround = 0
        MeasureLogger.exit(TAG, 'finish')
    }
}
