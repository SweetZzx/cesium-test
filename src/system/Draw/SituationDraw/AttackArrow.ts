import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { Viewer } from "cesium";
import { GeometryType } from "../BaseDraw";
import { createAttackArrowPoints } from "@/system/Utils/SituationUtils/SituationUtil";
import BasePolygon from "../Polygons/BasePolygon";


export default class AttackArrow extends BasePolygon {    

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.ATTACK_ARROW;
        this.minPointCount = 3;
        
    }

    protected get maxPointCount() { return 20; }
    protected createPolygonPoints = createAttackArrowPoints;
    
}