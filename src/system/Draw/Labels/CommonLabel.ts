import { CallbackPositionProperty, Cartesian2, Cartesian3, Color, Entity, HeightReference, HorizontalOrigin, LabelStyle, VerticalOrigin, Viewer } from "cesium";
import { BaseDraw, GeometryType } from "../BaseDraw";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";


export default class CommonLabel extends BaseDraw {   

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_LABEL;       
    }

    protected buildFinalEntity(): Entity {
        const pos = this.getPositions()[0];
        return this.viewer.entities.add({
            position: pos,
            point: { pixelSize: 12, color: Color.RED, heightReference: HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            label: {
                text: '测试名称xttx110',
                font: '14pt Source Han Sans CN',
                fillColor: Color.BLUE,
                backgroundColor: Color.YELLOW,
                showBackground: true,
                scale: 1.0,
                style: LabelStyle.FILL_AND_OUTLINE,
                // 相对于坐标的水平位置
                verticalOrigin: VerticalOrigin.CENTER,
                // 相对于坐标的水平位置
                horizontalOrigin: HorizontalOrigin.LEFT,
                // 该属性指定标签在屏幕空间中距此标签原点的像素偏移量
                pixelOffset: new Cartesian2(10, 0),
                // 关闭深度测试，避免被地形遮挡
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                // 贴地显示（与 point 保持一致）
                heightReference: HeightReference.CLAMP_TO_GROUND,
                // 是否显示
                show: true
            }

        });
    }

    protected buildTempEntity(): Entity | undefined {
        return this.viewer.entities.add({
            position: new CallbackPositionProperty(() => this.tempCursor || new Cartesian3(), false),
            point: { pixelSize: 12, color: Color.RED, heightReference: HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            label: {
                text: '测试名称xttx110',
                font: '14pt Source Han Sans CN',
                fillColor: Color.BROWN,
                backgroundColor: Color.YELLOW,
                showBackground: true,
                scale: 1.0,
                style: LabelStyle.FILL_AND_OUTLINE,
                // 相对于坐标的水平位置
                verticalOrigin: VerticalOrigin.CENTER,
                // 相对于坐标的水平位置
                horizontalOrigin: HorizontalOrigin.LEFT,
                // 该属性指定标签在屏幕空间中距此标签原点的像素偏移量
                pixelOffset: new Cartesian2(10, 0),
                // 关闭深度测试，避免被地形遮挡
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                // 贴地显示（与 point 保持一致）
                heightReference: HeightReference.CLAMP_TO_GROUND,
                // 是否显示
                show: true
            }
        });
    }

    protected onLeftClick(e: any) {
        super.onLeftClick(e);
        // 点只需要 1 次点击即可结束
        this.finish();
    }




}