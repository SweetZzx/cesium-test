import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { Viewer } from "cesium";
import BasePolygon from "./BasePolygon";
import { GeometryType } from "../BaseDraw";
import { CreateSectorPoints } from "./CreatePolygonPoints";

export default class CommonSector  extends BasePolygon { 
    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_SECTOR;
        this.minPointCount = 3;
    }
    protected get maxPointCount() { return 3; }

    protected createPolygonPoints = CreateSectorPoints;
}