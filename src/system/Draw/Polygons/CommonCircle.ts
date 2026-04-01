import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { CallbackProperty,  ClassificationType, Color, Entity, Viewer } from "cesium";
import { BaseDraw, GeometryType } from "../BaseDraw";
import { circleRadiusCallback } from "./CreatePolygonPoints";

export default class CommonCircle extends BaseDraw {
   
    protected get maxPointCount() { return 2; }

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_CIRCLE;
        this.minPointCount = 2;
    }


    protected buildFinalEntity(): Entity {
        return this.viewer.entities.add({
            position: this.getPositions()[0],
            ellipse: {
                semiMajorAxis: circleRadiusCallback(this.getPositions()),
                semiMinorAxis: circleRadiusCallback(this.getPositions()),
                               
                material: Color.BLUE.withAlpha(0.4),
                outline: true,
                outlineColor: Color.WHITE,
                outlineWidth: 2,
                classificationType: ClassificationType.BOTH
            }
        });
    }
    protected buildTempEntity(): Entity | undefined {
       
        if (this.getPositions().length < (this.minPointCount - 1)) return undefined;

        return this.viewer.entities.add({
            position: this.getPositions()[0],
            ellipse: {
                semiMajorAxis: new CallbackProperty(() => circleRadiusCallback([
                    ...this.getPositions(),
                    ...(this.tempCursor ? [this.tempCursor] : []),
                ]), false),
                semiMinorAxis: new CallbackProperty(() => circleRadiusCallback([
                    ...this.getPositions(),
                   ...(this.tempCursor ? [this.tempCursor] : []),
                ]), false),
             
                classificationType: ClassificationType.BOTH,// 贴地
                material: Color.CYAN.withAlpha(0.3),
                outline: true,
                outlineColor: Color.WHITE,
                outlineWidth: 2
            }
        });

    }

    /* -------------------- 鼠标事件 -------------------- */
    protected onLeftClick(e: any): void {
        super.onLeftClick(e);
        if (this.getPositions().length === this.maxPointCount) {
            this.finish();
        }
    }

}