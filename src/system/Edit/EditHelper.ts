import {
    ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Entity,
    Cartesian3, Color, HeightReference, CallbackProperty, defined,
    ConstantPositionProperty,
    PolygonHierarchy,
    PointGraphics,
    Cartesian2,
} from 'cesium';
import { ElMessage } from 'element-plus';

import { createAttackArrowPoints, createPincerAttackArrowPoints, createStraightArrowPoints, createStraightLineArrowPoints, createSwallowtailAttackArrowPoints } from '../Utils/SituationUtils/SituationUtil';
import { GeometryType } from '../Draw/BaseDraw';
import { circleRadiusCallback, CreateEllipse2Points, CreateEllipsePoints, CreateRectanglePoints, CreateSectorPoints } from '../Draw/Polygons/CreatePolygonPoints';
import { throttle } from '../Utils/DebounceThrottle';
import { getClosestLineAndIndex } from '../Utils/TurfUtil';
import EventDispatcher from '../EventDispatcher/EventDispatcher';


/** 控制点外观 */
const POINT_OPTS = {
    pixelSize: 18,
    color: Color.AQUA,
    heightReference: HeightReference.CLAMP_TO_GROUND,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
};

/** 拖拽状态 */
interface DragContext {
    target: 'vertex' | 'shape';   // 拖拽对象
    index: number;               // 顶点索引（target==='vertex' 时有效）
    offset: Cartesian3;           // 形状整体拖拽时，鼠标与形心的偏移
    startPos: Cartesian3;           // 拖拽开始时的顶点/形心位置
}

export class EditHelper {
    private viewer: Viewer;
    private handler: ScreenSpaceEventHandler;
    private dispatcher?: EventDispatcher;

    /** 被编辑的原始 entity */
    private shapeEntity: Entity;

    /** 当前顶点坐标（Mutable） */
    private positions: Cartesian3[];

    /** 几何体类型 */
    private geometryType: GeometryType;

    /** 控制点实体 */
    private ctrlPts: Entity[] = [];

    /** 高亮控制点 */
    private highlight?: Entity;

    /** 拖拽上下文 */
    private drag?: DragContext;

    private dragStartPositions: Cartesian3[] = [];

    /* 保存原始材质 */
    private storedMat: any;

    constructor(viewer: Viewer, entity: Entity, positions: Cartesian3[], geometryType: GeometryType, private onUpdate?: (p: Cartesian3[]) => void, dispatcher?: EventDispatcher) {
        this.viewer = viewer;
        this.shapeEntity = entity;
        this.handler = new ScreenSpaceEventHandler(this.viewer.canvas)
        this.dispatcher = dispatcher;

        this.positions = positions.map(p => p.clone());
        this.geometryType = geometryType;

    }

    start() {
        this.createControlPoints();
        this.bindEvents();

        // this.dispatcher.dispatchEvent('EDITSTART', { type: wSADFthis.constructor.name, text: "开始编辑" })
    }

    destroy() {
        this.ctrlPts.forEach(p => this.viewer.entities.remove(p));
        this.ctrlPts = [];
        this.handler.destroy();
        if (this.highlight) this.viewer.entities.remove(this.highlight);
    }

    private createControlPoints() {


        this.positions.forEach((pos, i) => {
            const p = this.viewer.entities.add({
                position: pos,
                point: POINT_OPTS
            });
            (p as any)._index = i;   // 绑定索引
            this.ctrlPts.push(p);
        });
    }

    private bindEvents() {
        this.handler.setInputAction((e: any) => this.onLeftDown(e), ScreenSpaceEventType.LEFT_DOWN);
        this.handler.setInputAction(
            (e: any) => this.throttledMouseMove(e),
            ScreenSpaceEventType.MOUSE_MOVE
        );
        this.handler.setInputAction(() => this.onLeftUp(), ScreenSpaceEventType.LEFT_UP);
        this.handler.setInputAction(
            (e: any) => this.onRightClick(e),
            ScreenSpaceEventType.RIGHT_CLICK
        );
    }

    /** 节流后的鼠标移动处理 */
    private throttledMouseMove = throttle((e: any) => this.onMouseMove(e), 16, { first: true, end: false });

    private onLeftDown(e: any) {
        const picked = this.viewer.scene.pick(e.position);
        if (!defined(picked)) return;


        const id = picked.id;

        if (this.ctrlPts.includes(id)) {
            /* === 禁用默认相机控制 === */
            this.viewer.scene.screenSpaceCameraController.enableInputs = false;
            // 拖拽顶点
            const idx = (id as any)._index;
            this.drag = {
                target: 'vertex',
                index: idx,
                offset: Cartesian3.ZERO,
                startPos: this.positions[idx].clone()
            };
        } else if (id === this.shapeEntity) {
            /* === 禁用默认相机控制 === */
            this.viewer.scene.screenSpaceCameraController.enableInputs = false;
            // 拖拽整体
            const ray = this.viewer.camera.getPickRay(e.position);
            const cart = this.viewer.scene.globe.pick(ray!, this.viewer.scene);
            if (!cart) return;
            const centroid = this.getCentroid();
            this.drag = {
                target: 'shape',
                index: -1,
                offset: Cartesian3.subtract(cart, centroid, new Cartesian3()),
                startPos: centroid
            };
            // 记录拖拽前的位置
            this.dragStartPositions = this.positions.map(p => p.clone());

        }
    }

    private onMouseMove(e: any) {
        if (!this.drag) {
            // 高亮
            const picked = this.viewer.scene.pick(e.endPosition);
            if (defined(picked) && this.ctrlPts.includes(picked.id)) {
                if (this.highlight !== picked.id) this.setHighlight(picked.id);
            } else {
                this.clearHighlight();
            }
            return;
        }
        this.clearHighlight();
        // 实时拾取地面
        const ray = this.viewer.camera.getPickRay(e.endPosition);
        const cart = this.viewer.scene.globe.pick(ray!, this.viewer.scene);
        if (!cart) return;

        if (this.drag.target === 'vertex') {
            // 更新顶点
            const idx = this.drag.index;
            this.positions[idx] = cart.clone();
            this.ctrlPts[idx].position = new ConstantPositionProperty(cart);
            this.updateShape();
        } else {
            // 更新整体
            const delta = Cartesian3.subtract(cart, this.drag.startPos, new Cartesian3());
            Cartesian3.subtract(delta, this.drag.offset, delta); // 去掉初始偏移
            for (let i = 0; i < this.positions.length; i++) {
                this.positions[i] = Cartesian3.add(this.dragStartPositions[i], delta, new Cartesian3());
                if (i < this.ctrlPts.length) this.ctrlPts[i].position = new ConstantPositionProperty(this.positions[i]);
            }
            this.updateShape();

        }
    }

    private onLeftUp() {

        if (!this.drag) return;
        /* === 恢复默认相机控制 === */
        this.viewer.scene.screenSpaceCameraController.enableInputs = true;

        this.drag = undefined;
        this.dragStartPositions = [];


        // 把最新坐标写回外部
        this.onUpdate?.(this.positions);
    }

    private setHighlight(ent: Entity) {
        this.storedMat = ent.point; // 备份原材质
        (ent as any).point = new PointGraphics({
            pixelSize: 20,
            color: Color.YELLOW,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        });
        this.highlight = ent;       // 只是标记，实际没新建 entity
    }

    private clearHighlight() {

        if (!this.highlight) return;
        (this.highlight as any).point = this.storedMat; // 还原材质
        this.highlight = undefined;
    }

    private updateShape() {
        switch (this.geometryType) {
            case GeometryType.COMMON_POLYGON:
                this.shapeEntity.polygon!.hierarchy = new CallbackProperty(() => new PolygonHierarchy(this.positions), false);
                break;
            case GeometryType.COMMON_RECTANGLE:
                this.shapeEntity.polygon!.hierarchy = new CallbackProperty(() => new PolygonHierarchy(CreateRectanglePoints(this.positions)), false);
                break;
            case GeometryType.COMMON_CIRCLE:
                this.shapeEntity.position = new ConstantPositionProperty(this.positions[0]);

                if (this.shapeEntity.ellipse) {
                    this.shapeEntity.ellipse.semiMajorAxis = new CallbackProperty(() => circleRadiusCallback(this.positions) ?? 0, false);
                    this.shapeEntity.ellipse.semiMinorAxis = new CallbackProperty(() => circleRadiusCallback(this.positions) ?? 0, false);
                }
                break;
            case GeometryType.COMMON_ELLIPSE:
                this.shapeEntity.polygon!.hierarchy = new CallbackProperty(() => new PolygonHierarchy(CreateEllipsePoints(this.positions)), false);
                break;
            case GeometryType.COMMON_ELLIPSE2:
                this.shapeEntity.position = new ConstantPositionProperty(Cartesian3.midpoint(this.positions[0], this.positions[1], new Cartesian3()));
                if (this.shapeEntity.ellipse) {
                    this.shapeEntity.ellipse.semiMajorAxis = new CallbackProperty(() => CreateEllipse2Points(this.positions).semiMajorAxis, false);
                    this.shapeEntity.ellipse.semiMinorAxis = new CallbackProperty(() => CreateEllipse2Points(this.positions).semiMinorAxis, false);
                    this.shapeEntity.ellipse.rotation = new CallbackProperty(() => CreateEllipse2Points(this.positions).rotation, false);
                }
                break;
            case GeometryType.COMMON_SECTOR:
                this.shapeEntity.polygon!.hierarchy = new CallbackProperty(() => new PolygonHierarchy(CreateSectorPoints(this.positions)), false);
                break;
            case GeometryType.COMMON_LINE:
                this.shapeEntity.polyline!.positions = new CallbackProperty(() => this.positions, false);
                break;
            case GeometryType.COMMON_POINT:
            case GeometryType.COMMON_LABEL:
            case GeometryType.COMMON_BILLBOARD:
            case GeometryType.COMMON_MODEL:
                this.shapeEntity.position = new ConstantPositionProperty(this.positions[this.positions.length - 1]);
                break;

            case GeometryType.STRAIGHT_ARROW:
                this.shapeEntity.polygon!.hierarchy = new CallbackProperty(() => new PolygonHierarchy(createStraightArrowPoints(this.positions)), false);
                break;
            case GeometryType.STRAIGHT_LINE_ARROW:
                this.shapeEntity.polyline!.positions = new CallbackProperty(() => createStraightLineArrowPoints(this.positions), false);
                break;
            case GeometryType.ATTACK_ARROW:
                this.shapeEntity.polygon!.hierarchy = new CallbackProperty(() => new PolygonHierarchy(createAttackArrowPoints(this.positions)), false);
                break;
            case GeometryType.SWALLOWTAIL_ATTACK_ARROW:
                this.shapeEntity.polygon!.hierarchy = new CallbackProperty(() => new PolygonHierarchy(createSwallowtailAttackArrowPoints(this.positions)), false);
                break;
            case GeometryType.PINCER_ATTACK_ARROW:
                this.shapeEntity.polygon!.hierarchy = new CallbackProperty(() => new PolygonHierarchy(createPincerAttackArrowPoints(this.positions)), false);
                break;
        }

    }

    /** 右键处理：派发事件给 Vue 组件弹框 */
    private onRightClick(e: any) {
        const mousePosition = e.position || e.endPosition;
        const picked = this.viewer.scene.pick(mousePosition);

        // 点到控制点 → 记录为可删除
        if (defined(picked) && defined(picked.id) && this.ctrlPts.includes(picked.id)) {
            const idx = (picked.id as any)._index;
            this.dispatcher?.dispatchEvent('EDITRIGHTCLICK', {
                type: 'delete',
                pointIndex: idx,
                mouseX: mousePosition.x,
                mouseY: mousePosition.y,
            });
        } else {
            // 否则派发插入事件
            this.dispatcher?.dispatchEvent('EDITRIGHTCLICK', {
                type: 'insert',
                mousePosition,
                mouseX: mousePosition.x,
                mouseY: mousePosition.y,
            });
        }
    }

    /** 右键插入折点：仅线和多边形支持，供 Vue 组件调用 */
    public onInsertHandler(mousePosition: Cartesian2) {
        if (
            this.geometryType !== GeometryType.COMMON_LINE &&
            this.geometryType !== GeometryType.COMMON_POLYGON
        ) {
            return;
        }

        // 拾取地面点
        const ray = this.viewer.camera.getPickRay(mousePosition);
        const cart = this.viewer.scene.globe.pick(ray!, this.viewer.scene);
        if (!cart) return;

        // 找最近线段和垂足
        const { nearestPoint, closestLineIndex } = getClosestLineAndIndex(this.positions, cart);
        if (closestLineIndex < 0) return;

        // 将垂足转为 Cartesian3
        const nearestPointCartesian = Cartesian3.fromDegrees(
            nearestPoint.geometry.coordinates[0],
            nearestPoint.geometry.coordinates[1]
        );

        // 插入到 positions 和 ctrlPts 中
        const insertIdx = closestLineIndex + 1;
        this.positions.splice(insertIdx, 0, nearestPointCartesian);

        const newCtrlPt = this.viewer.entities.add({
            position: nearestPointCartesian,
            point: POINT_OPTS
        });
        (newCtrlPt as any)._index = insertIdx;
        this.ctrlPts.splice(insertIdx, 0, newCtrlPt);

        // 更新后面所有控制点的索引
        this.updateEntityIndex(insertIdx + 1);
        this.updateShape();
    }

    /** 右键删除折点，供 Vue 组件调用 */
    public onDeletePointHandler(pointIndex: number) {
        if (
            this.geometryType !== GeometryType.COMMON_LINE &&
            this.geometryType !== GeometryType.COMMON_POLYGON
        ) {
            return;
        }

        // 多边形至少保留 3 个点
        if (this.geometryType === GeometryType.COMMON_POLYGON && this.positions.length <= 3) {
            ElMessage.error('多边形至少需要保留 3 个点');
            return;
        }

        const idx = pointIndex;
        // 从场景、positions、ctrlPts 中移除
        this.viewer.entities.remove(this.ctrlPts[idx]);
        this.positions.splice(idx, 1);
        this.ctrlPts.splice(idx, 1);

        // 更新后面控制点的索引
        this.updateEntityIndex(idx);
        this.updateShape();
    }

    /** 从指定索引开始重新编号所有控制点的 _index */
    private updateEntityIndex(startIdx: number) {
        for (let i = startIdx; i < this.ctrlPts.length; i++) {
            (this.ctrlPts[i] as any)._index = i;
        }
    }

    private getCentroid(): Cartesian3 {
        const sum = this.positions.reduce(
            (acc, p) => Cartesian3.add(acc, p, acc),
            new Cartesian3()
        );
        return Cartesian3.divideByScalar(sum, this.positions.length, new Cartesian3());
    }
}
