import {
    Cartesian2,
    Cartesian3,
    Color,
    Entity,
    HeightReference,
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    Viewer,
    JulianDate
} from 'cesium';
import EventDispatcher from '../EventDispatcher/EventDispatcher';

/**
 * 量算基类
 * 参照 BaseDraw 模式：pointEntities 管理坐标 + CallbackProperty 动态更新 + EventDispatcher 派发事件
 */
export abstract class BaseMeasure {
    protected viewer: Viewer;
    protected dispatcher: EventDispatcher;
    protected handler: ScreenSpaceEventHandler;

    protected active = false;
    protected finished = false;
    protected tempEntity?: Entity;
    protected pointEntities: Entity[] = [];

    protected tempCursor?: Cartesian3;
    protected minPointCount: number;

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        this.viewer = viewer;
        this.dispatcher = dispatcher;
        this.handler = new ScreenSpaceEventHandler(viewer.canvas);
        this.minPointCount = 2;
    }

    /** 子类必须实现：根据当前点序列生成最终测量实体（用 CallbackProperty） */
    protected abstract buildFinalEntity(): Entity;

    /** 子类必须实现：生成跟随鼠标的临时图形（用 CallbackProperty） */
    protected abstract buildTempEntity(): Entity | undefined;

    /** 开始量测 */
    start() {
        if (this.active || this.finished) return;
        this.active = true;
        this.finished = false;

        this.handler.setInputAction(
            (e: any) => this.onLeftClick(e),
            ScreenSpaceEventType.LEFT_CLICK
        );
        this.handler.setInputAction(
            (e: any) => this.onMouseMove(e),
            ScreenSpaceEventType.MOUSE_MOVE
        );
        this.handler.setInputAction(
            () => this.finish(),
            ScreenSpaceEventType.RIGHT_CLICK
        );

        this.dispatcher.dispatchEvent('DRAWSTART', {
            type: this.constructor.name,
            text: '开始量测'
        });
    }

    protected onLeftClick(e: any) {
        const cartesian = this.safePick(e.position || e.endPosition);
        if (!cartesian) return;

        // 防止重复点击同一点
        const len = this.pointEntities.length;
        if (len > 0) {
            const lastPos = this.pointEntities[len - 1].position?.getValue(JulianDate.now());
            if (!lastPos) return;
            if (Cartesian3.distance(lastPos, cartesian) < 0.001) return;
        }

        this.addPoint(cartesian);
        this.dispatcher.dispatchEvent('DRAWUPDATE', {
            type: this.constructor.name,
            points: this.getPositions()
        });
    }

    protected onMouseMove(e: any) {
        const cartesian = this.safePick(e.position || e.endPosition);
        if (!cartesian) return;

        this.tempCursor = cartesian;

        // 首次移动时创建临时实体（用 CallbackProperty，之后自动更新）
        if (!this.tempEntity) {
            this.tempEntity = this.buildTempEntity();
        }

        this.dispatcher.dispatchEvent('MOUSEMOVE', {
            type: this.constructor.name,
            points: this.getPositions(),
            cursor: cartesian,
            text: '添加下一个点，右键结束量测'
        });
    }

    /** 子类可重写：落点逻辑（DistanceMeasure 会重写此方法计算距离） */
    protected addPoint(position: Cartesian3) {
        const point = this.viewer.entities.add({
            position,
            point: {
                pixelSize: 10,
                color: Color.YELLOW,
                heightReference: HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
        this.pointEntities.push(point);
    }

    /** 结束量测 */
    finish() {
        if (!this.active) return;
        this.active = false;
        this.finished = true;

        this.handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);

        // 移除临时实体
        if (this.tempEntity) {
            this.viewer.entities.remove(this.tempEntity);
            this.tempEntity = undefined;
        }

        if (this.pointEntities.length < this.minPointCount) {
            this.dispatcher.dispatchEvent('DRAWEND', {
                type: this.constructor.name,
                points: this.getPositions(),
                text: '点数不足，请重新量测'
            });
            return;
        }

        // 创建最终实体（用 CallbackProperty，只 build 一次）
        const final = this.buildFinalEntity();
        this.dispatcher.dispatchEvent('DRAWEND', {
            type: this.constructor.name,
            entity: final,
            points: this.getPositions(),
            text: '量测完成'
        });
    }

    /** 从 pointEntities 读取当前点序列 */
    protected getPositions(): Cartesian3[] {
        return this.pointEntities.map(
            e => e.position!.getValue(JulianDate.now())!
        );
    }

    /** 安全拾取贴地点 */
    private safePick(windowPos: Cartesian2): Cartesian3 | undefined {
        const ray = this.viewer.camera.getPickRay(windowPos);
        if (!ray) return undefined;
        return this.viewer.scene.globe.pick(ray, this.viewer.scene)
            ?? this.viewer.scene.globe.ellipsoid.scaleToGeodeticSurface(ray.origin);
    }

    /** 清除所有实体 */
    clearEntities() {
        this.pointEntities.forEach(p => this.viewer.entities.remove(p));
        this.pointEntities = [];
        if (this.tempEntity) {
            this.viewer.entities.remove(this.tempEntity);
            this.tempEntity = undefined;
        }
    }

    /** 销毁 */
    destroy() {
        this.finish();
        this.clearEntities();
        this.handler.destroy();
    }
}
