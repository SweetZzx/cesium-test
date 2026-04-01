import { Viewer } from "cesium";
import { GeometryType } from "../BaseDraw";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { createPincerAttackArrowPoints } from "@/system/Utils/SituationUtils/SituationUtil";
import BasePolygon from "../Polygons/BasePolygon";


export default class PincerAttackArrow extends BasePolygon {  

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.PINCER_ATTACK_ARROW;
        this.minPointCount = 4;
    }
    protected get maxPointCount() { return 5; }
    protected createPolygonPoints = createPincerAttackArrowPoints;

}