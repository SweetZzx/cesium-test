import { Cartesian3, Viewer } from 'cesium';
import { GeometryType } from '../BaseDraw';
import EventDispatcher from '@/system/EventDispatcher/EventDispatcher';
import BasePolygon from './BasePolygon';

export default class CommonPolygon extends BasePolygon {
    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_POLYGON;
        this.minPointCount = 3;
    }

    protected get maxPointCount() { return 20; }
    protected createPolygonPoints = (pos: Cartesian3[]) => pos;
}