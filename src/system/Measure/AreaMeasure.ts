import {
    CallbackProperty,
    Cartesian2,
    Cartesian3,
    Color,
    Entity,
    HeightReference,
    LabelStyle,
    PolygonGraphics,
    PolygonHierarchy,
    PolylineGraphics,
    VerticalOrigin,
    Viewer
} from "cesium"
import { BaseMeasure } from "./BaseMeasure"
import EventDispatcher from "../EventDispatcher/EventDispatcher"
import { MeasureUtil } from "./MeasureUtil"

/**
 * 面积/周长量测
 * 面积采用向量叉积方式计算，周长类似距离量测
 */
export class AreaMeasure extends BaseMeasure {
    private measureUtil: MeasureUtil
    private areaLabel?: Entity

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher)
        this.measureUtil = MeasureUtil.getInstance(viewer)
        this.minPointCount = 3
    }

    protected buildFinalEntity(): Entity {
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

    protected buildTempEntity(): Entity | undefined {
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

    protected addPoint(position: Cartesian3): void {
        // 先添加落点标记
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
            this.measureUtil.calculatePolygonAreaPerimeter(positions).then((result) => {
                if (this.areaLabel) this.viewer.entities.remove(this.areaLabel)
                this.areaLabel = this.viewer.entities.add({
                    position,
                    label: {
                        text: `面积: ${result.area.formatted}\n周长: ${result.perimeter.formatted}`,
                        font: "18px sans-serif",
                        fillColor: Color.LIME,
                        style: LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        verticalOrigin: VerticalOrigin.BOTTOM,
                        pixelOffset: new Cartesian2(20, -20),
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        heightReference: HeightReference.NONE
                    }
                })
            })
        }
    }

    finish(): void {
        super.finish()
        if (this.areaLabel) {
            this.viewer.entities.remove(this.areaLabel)
            this.areaLabel = undefined
        }
    }
}
