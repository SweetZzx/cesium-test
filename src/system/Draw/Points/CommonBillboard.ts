import { BillboardGraphics, CallbackPositionProperty, Cartesian3, Entity, HeightReference, HorizontalOrigin, VerticalOrigin, Viewer } from "cesium";
import { BaseDraw, GeometryType } from "../BaseDraw";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { SERVER_DATA_URL } from "@/system/Config/SystemConfig";

/** 可选的广告牌图标 */
export const BILLBOARD_ICONS: { label: string; value: string }[] = [
    { label: '广告牌', value: `${SERVER_DATA_URL}/images/mark1.png` },
];

export default class CommonBillboard extends BaseDraw {

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_BILLBOARD;
    }

    protected buildFinalEntity(): Entity {
        const pos = this.getPositions()[0];
        return this.viewer.entities.add({
            position: pos,
            billboard: this.makeBillboard(),
        });
    }

    protected buildTempEntity(): Entity | undefined {
        return this.viewer.entities.add({
            position: new CallbackPositionProperty(() => this.tempCursor || new Cartesian3(), false),
            billboard: this.makeBillboard(),
        });
    }

    private makeBillboard(): BillboardGraphics.ConstructorOptions {
        return {
            image: `${SERVER_DATA_URL}/images/mark1.png`,
            height: 40,
            width: 40,
            verticalOrigin: VerticalOrigin.BOTTOM,
            horizontalOrigin: HorizontalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            scale: 1.0,
            show: true,
        };
    }

    protected onLeftClick(e: any) {
        super.onLeftClick(e);
        this.finish();
    }
}
