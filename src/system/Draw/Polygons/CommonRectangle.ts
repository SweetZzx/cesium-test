import { Viewer } from "cesium";
import BasePolygon from "./BasePolygon";
import { GeometryType } from "../BaseDraw";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { CreateRectanglePoints } from "./CreatePolygonPoints";

export default class CommonRectangle extends BasePolygon {

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_RECTANGLE;
        this.minPointCount = 2;
    }

    protected get maxPointCount() { return 2; }
    protected createPolygonPoints = CreateRectanglePoints;


}