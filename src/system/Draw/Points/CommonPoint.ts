
import { Color, Entity, HeightReference, Viewer} from "cesium";
import { BaseDraw, GeometryType } from "../BaseDraw";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";

export default class CommonPoint extends BaseDraw {
    

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_POINT;
    }

    protected buildFinalEntity(): Entity {
        const pos = this.getPositions()[0];
        return this.viewer.entities.add({
            position: pos,
            point: { pixelSize: 12, color: Color.RED, heightReference: HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY }
        });
    }

    protected buildTempEntity(): Entity | undefined {
        return undefined; // 点绘制无需临时跟随
    }

    protected onLeftClick(e: any) {
        super.onLeftClick(e);
        // 点只需要 1 次点击即可结束
        this.finish();
    }


}