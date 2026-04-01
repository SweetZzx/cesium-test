import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { CallbackPositionProperty, CallbackProperty, Cartesian3, ClassificationType, Color, Entity, Viewer } from "cesium";
import { BaseDraw, GeometryType } from "../BaseDraw";
import { CreateEllipse2Points } from "./CreatePolygonPoints";


export default class CommonEllipseUseCesium extends BaseDraw {

    protected get maxPointCount() { return 3; }

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_ELLIPSE2;
        this.minPointCount = 3;
    }


    protected buildFinalEntity(): Entity {
        let positions = this.getPositions();

        return this.viewer.entities.add({
            position: Cartesian3.midpoint(positions[0], positions[1], new Cartesian3()),
            ellipse: {
                semiMajorAxis: CreateEllipse2Points(positions).semiMajorAxis,
                semiMinorAxis: CreateEllipse2Points(positions).semiMinorAxis,
                rotation: CreateEllipse2Points(positions).rotation,

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
            position: new CallbackPositionProperty(() => Cartesian3.midpoint(this.getPositions()[0], this.getPositions()[1], new Cartesian3()), false),
            ellipse: {
                semiMajorAxis: new CallbackProperty(() => CreateEllipse2Points([
                    ...this.getPositions(),
                   ...(this.tempCursor ? [this.tempCursor] : []),
                ]).semiMajorAxis, false),
                semiMinorAxis: new CallbackProperty(() => CreateEllipse2Points([
                    ...this.getPositions(),
                   ...(this.tempCursor ? [this.tempCursor] : []),
                ]).semiMinorAxis, false),
                rotation: new CallbackProperty(() => CreateEllipse2Points([
                    ...this.getPositions(),
                    ...(this.tempCursor ? [this.tempCursor] : []),
                ]).rotation, false),

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
    ;

}