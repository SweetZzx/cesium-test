import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Entity, HeightReference, Cartesian3, Color, JulianDate, Cartesian2 } from 'cesium';
import EventDispatcher from '../EventDispatcher/EventDispatcher';
import { MultiEditManager } from '../Edit/MultiEditManager';
import { EntityManager } from './EntityManager';
import { GeometryType } from './GeometryType';
import { throttle } from '../Utils/DebounceThrottle';

export { GeometryType } from './GeometryType';
export abstract class BaseDraw {
    protected viewer: Viewer;
    protected dispatcher: EventDispatcher;
    protected handler: ScreenSpaceEventHandler;
    protected active = false;          // 是否处于绘制状态
    protected finished = false;        // 是否已结束
    protected tempEntity?: Entity;     // 绘制过程中跟随鼠标的临时实体
    protected pointEntities: Entity[] = []; // 已落点的实体（可用于回退、编辑）

    private clickIndex = 0; /// 点击次数，用于生成控制点的id

    multiEditManager: MultiEditManager;
    private keyDownHandler: ((e: KeyboardEvent) => void) | undefined;
    private ctrlZHandler: ((e: KeyboardEvent) => void) | undefined;

    protected geometryType: GeometryType;
    protected minPointCount: number; // 最小点击次数

    protected tempCursor?: Cartesian3;

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        this.viewer = viewer;
        this.dispatcher = dispatcher;
        this.handler = new ScreenSpaceEventHandler(viewer.canvas);
        this.geometryType = GeometryType.COMMON_POINT;
        this.minPointCount = 1;


        this.multiEditManager = MultiEditManager.getInstance(this.viewer, dispatcher);
    }

    /** 子类必须实现：根据当前点序列生成最终实体 */
    protected abstract buildFinalEntity(): Entity;

    /** 子类可实现：生成跟随鼠标的临时图形 */
    protected abstract buildTempEntity(): Entity | undefined;



    start() {
        if (this.active || this.finished) return;
        this.active = true;
        this.finished = false;

        // 左键落点
        this.handler.setInputAction((e: any) => this.onLeftClick(e), ScreenSpaceEventType.LEFT_CLICK);
        // 鼠标移动
        this.handler.setInputAction(
            (e: any) => this.throttledMouseMove(e),
            ScreenSpaceEventType.MOUSE_MOVE
        );
        // 右键结束
        this.handler.setInputAction(() => this.finish(), ScreenSpaceEventType.RIGHT_CLICK);

        this.bindCtrlZ();
        this.dispatcher.dispatchEvent('DRAWSTART', { type: this.constructor.name, text: "开始绘制" });
    }

    protected onLeftClick(e: any) {
        const cartesian = this.safePick(e.position || e.endPosition);
        if (!cartesian) return;

        //判断当前点与上一个点是否相同
        let pointEntitiesLength = this.pointEntities.length;
        if (pointEntitiesLength > 0 ) {
            let lastPointCartesian = this.pointEntities[pointEntitiesLength - 1].position?.getValue();
            if(!lastPointCartesian) return;
            if(Cartesian3.distance(lastPointCartesian, cartesian) < 0.001) {              
               return
            }
        }

        this.clickIndex++;

        this.addPoint(cartesian);
        this.dispatcher.dispatchEvent('DRAWUPDATE', { type: this.constructor.name, points: this.getPositions() });
    }

    /** 节流后的鼠标移动处理 */
    protected throttledMouseMove = throttle((e: any) => this.onMouseMove(e), 16, { first: true, end: false });

    protected onMouseMove(e: any) {

        const cartesian = this.safePick(e.position || e.endPosition);

        if (!cartesian) return;

        this.updateTempEntity(cartesian);
        // 更新临时图形
        if (!this.tempEntity) {
            this.tempEntity = this.buildTempEntity();
        }


        this.dispatcher.dispatchEvent('MOUSEMOVE', { type: this.constructor.name, points: this.getPositions(), cursor: cartesian, text: "添加下一个点，右键可结束绘制。" });
    }

    protected addPoint(position: Cartesian3) {
        // 落点显示
        const point = this.viewer.entities.add({
            id: "control_point_entity_" + this.clickIndex,
            position,
            point: {
                pixelSize: 10,
                color: Color.YELLOW,
                heightReference: HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY  // 始终不被地形遮挡 
            }
        });
        this.pointEntities.push(point);
    }
    private safePick(windowPos: Cartesian2): Cartesian3 | undefined {
        const ray = this.viewer.camera.getPickRay(windowPos);
        if (!ray) return undefined;
        return this.viewer.scene.globe.pick(ray, this.viewer.scene)
            ?? this.viewer.scene.globe.ellipsoid.scaleToGeodeticSurface(ray.origin);
    }



    /** 当前可用于成面的点数 */
    // protected get validPositions(): Cartesian3[] {
    //     const pts = this.getPositions();
    //     return pts.length >= 1 ? pts : [];
    // }


    finish() {
        if (!this.active) return;
        this.active = false;
        this.finished = true;
        this.handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
        this.unbindCtrlZ();

        // 移除临时
        if (this.tempEntity) {
            this.viewer.entities.remove(this.tempEntity);
            this.tempEntity = undefined;
        }
        //移除pointEntities中所有id包含control_point_entity_的点
        this.pointEntities.forEach(p => {
            if (p.id.includes("control_point_entity_")) {
                this.viewer.entities.remove(p);
            }
        });

        if (this.clickIndex < this.minPointCount) {
            this.dispatcher.dispatchEvent('DRAWEND', { type: this.constructor.name, points: this.getPositions(), text: "点击次数不足，请重新绘制" });
            return;
        } else {
            const final = this.buildFinalEntity();
            EntityManager.getInstance().register(final, this.geometryType);
            this.dispatcher.dispatchEvent('DRAWEND', { type: this.constructor.name, entity: final, points: this.getPositions(), text: "绘制完成" });
            // 登记到多编辑管理器
            this.multiEditManager.register(final, this.getPositions(), this.geometryType);
        }

        this.clickIndex = 0
    }

    destroy() {
        this.finish();
        this.unbindCtrlZ();
        this.pointEntities.forEach(p => this.viewer.entities.remove(p));
        this.pointEntities = [];
        this.handler.destroy();
    }

    /** 绑定 Ctrl+Z 撤销上一控制点 */
    private bindCtrlZ() {
        this.ctrlZHandler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'z') {
                if (this.pointEntities.length > 0) {
                    const last = this.pointEntities.pop()!;
                    this.viewer.entities.remove(last);
                    this.clickIndex--;
                    // 更新临时图形（如果已存在）
                    if (this.tempCursor) {
                        this.updateTempEntity(this.tempCursor);
                    }
                    const pos = this.getPositions();
                    this.dispatcher.dispatchEvent('DRAWUPDATE', { type: this.constructor.name, points: pos });
                }
            }
        };
        window.addEventListener('keydown', this.ctrlZHandler);
    }

    private unbindCtrlZ() {
        if (this.ctrlZHandler) {
            window.removeEventListener('keydown', this.ctrlZHandler);
            this.ctrlZHandler = undefined;
        }
    }
    
    /** 子类可重写：返回当前已有点序列 */
    protected getPositions(): Cartesian3[] {
        return this.pointEntities.map(e => e.position!.getValue(JulianDate.now())!);
    }

    /** 更新临时图形（子类可重写） */
    protected updateTempEntity(cursor: Cartesian3) {
        // 默认空实现
        this.tempCursor = cursor;
    }
}