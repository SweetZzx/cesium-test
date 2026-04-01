import { GeometryType } from "../BaseDraw";
import { Viewer } from "cesium";
import { createStraightArrowPoints } from "@/system/Utils/SituationUtils/SituationUtil";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import BasePolygon from "../Polygons/BasePolygon";

export default class StraightArrow extends BasePolygon {    
  
    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.STRAIGHT_ARROW;
        this.minPointCount = 2;
    }
    protected get maxPointCount() { return 2; }
    protected createPolygonPoints = createStraightArrowPoints;
}