import { CallbackProperty, Cartesian3, Color, Entity, PolylineGraphics, Viewer } from "cesium"
import { BaseDraw, GeometryType } from "../BaseDraw";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";

export default class CommonLine extends BaseDraw {

   
    //  protected geometryType :GeometryType = GeometryType.COMMON_LINE;
    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_LINE;
    }

    protected buildFinalEntity(): Entity {
        return this.viewer.entities.add({
            polyline: new PolylineGraphics({
                positions: new CallbackProperty(() => this.getPositions(), false),
                width: 3,
                material: Color.ORANGE,
                clampToGround: true
            })
        });
    }

    protected buildTempEntity(): Entity | undefined {
        return this.viewer.entities.add({
            polyline: new PolylineGraphics({
                positions: new CallbackProperty(() => [...this.getPositions(), this.tempCursor || new Cartesian3()], false),
                width: 2,
                material: Color.YELLOW.withAlpha(0.6),
                clampToGround: true
            })
        });
    }


}