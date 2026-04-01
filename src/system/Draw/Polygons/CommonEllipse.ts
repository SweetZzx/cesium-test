import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { Viewer } from "cesium";
import { GeometryType } from "../BaseDraw";
import { CreateEllipsePoints } from "./CreatePolygonPoints";
import BasePolygon from "./BasePolygon";

export default class CommonEllipse extends BasePolygon {

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_ELLIPSE;
        this.minPointCount = 2;
    }

    protected get maxPointCount() { return 2; }
    protected createPolygonPoints = CreateEllipsePoints;
}