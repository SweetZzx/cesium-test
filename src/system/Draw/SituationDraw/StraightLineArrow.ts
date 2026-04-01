import { CallbackProperty, Color, Entity, PolylineGraphics, Viewer } from "cesium";
import { BaseDraw, GeometryType } from "../BaseDraw";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { createStraightLineArrowPoints } from "@/system/Utils/SituationUtils/SituationUtil";

export default class StraightLineArrow extends BaseDraw {
    
    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.STRAIGHT_LINE_ARROW;
        this.minPointCount = 2;
    }

    protected buildFinalEntity(): Entity {
        return this.viewer.entities.add({
            polyline: new PolylineGraphics({
                positions: new CallbackProperty(() => createStraightLineArrowPoints(this.getPositions()), false),
                width: 3,
                material: Color.ORANGE,
                clampToGround: true
            })
        });

    }
    protected buildTempEntity(): Entity | undefined {
        if(this.getPositions().length == 0) return undefined;
        return this.viewer.entities.add({
            polyline: new PolylineGraphics({
                positions: new CallbackProperty(() => createStraightLineArrowPoints([...this.getPositions(), ...(this.tempCursor ? [this.tempCursor] : []),]), false),
                width: 3,
                material: Color.YELLOW.withAlpha(0.6),
                clampToGround: true
            })
        });

    }

   
    protected onLeftClick(e: any) {
        super.onLeftClick(e);
        // 需要 2 次点击即可结束
        if (this.getPositions().length == 2) {

            this.finish();
        }
    }

}