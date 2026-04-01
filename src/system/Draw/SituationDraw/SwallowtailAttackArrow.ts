import { Viewer } from "cesium";
import { GeometryType } from "../BaseDraw";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { createSwallowtailAttackArrowPoints } from "@/system/Utils/SituationUtils/SituationUtil";
import BasePolygon from "../Polygons/BasePolygon";

export default class SwallowtailAttackArrow extends BasePolygon {

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.SWALLOWTAIL_ATTACK_ARROW;
        this.minPointCount = 3;
    }

    protected get maxPointCount() { return 20; }
    protected createPolygonPoints = createSwallowtailAttackArrowPoints;
}