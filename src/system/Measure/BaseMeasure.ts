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
import { MeasureLogger } from './MeasureLogger';

const TAG = 'BaseMeasure';

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
        MeasureLogger.enter(TAG, 'start', { active: this.active, finished: this.finished });
        if (this.active || this.finished) {
            MeasureLogger.warn(TAG, 'start: already active or finished, return');
            return;
        }
        this.active = true;
        this.finished = false;

        MeasureLogger.info(TAG, '注册鼠标事件监听');
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
        MeasureLogger.exit(TAG, 'start');
    }

    protected onLeftClick(e: any) {
        MeasureLogger.enter(TAG, 'onLeftClick', { position: e.position || e.endPosition });

        const cartesian = this.safePick(e.position || e.endPosition);
        if (!cartesian) {
            MeasureLogger.warn(TAG, 'onLeftClick: safePick 返回 null，跳过');
            return;
        }

        // 防止重复点击同一点
        const len = this.pointEntities.length;
        if (len > 0) {
            const lastPos = this.pointEntities[len - 1].position?.getValue(JulianDate.now());
            if (!lastPos) {
                MeasureLogger.warn(TAG, 'onLeftClick: lastPos 为空，跳过');
                return;
            }
            const dist = Cartesian3.distance(lastPos, cartesian);
            MeasureLogger.debug(TAG, `onLeftClick: 与上一点距离=${dist}`);
            if (dist < 0.001) {
                MeasureLogger.warn(TAG, 'onLeftClick: 距离过近，跳过');
                return;
            }
        }

        MeasureLogger.info(TAG, `onLeftClick: 准备添加第 ${len + 1} 个点`, { cartesian });
        this.addPoint(cartesian);

        const positions = this.getPositions();
        MeasureLogger.snapshot(TAG, '点序列快照', {
            count: positions.length,
            positions: positions.map(p => ({ x: p.x, y: p.y, z: p.z }))
        });

        this.dispatcher.dispatchEvent('DRAWUPDATE', {
            type: this.constructor.name,
            points: positions
        });
        MeasureLogger.exit(TAG, 'onLeftClick', { pointCount: positions.length });
    }

    protected onMouseMove(e: any) {
        const cartesian = this.safePick(e.position || e.endPosition);
        if (!cartesian) return;

        this.tempCursor = cartesian;

        // 首次移动时创建临时实体（用 CallbackProperty，之后自动更新）
        if (!this.tempEntity) {
            MeasureLogger.info(TAG, 'onMouseMove: 创建临时实体');
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
        MeasureLogger.debug(TAG, 'addPoint: 创建落点实体', { position });
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
        MeasureLogger.info(TAG, `addPoint: 已添加，当前共 ${this.pointEntities.length} 个点`);
    }

    /** 结束量测 */
    finish() {
        MeasureLogger.enter(TAG, 'finish', { active: this.active, pointCount: this.pointEntities.length });
        if (!this.active) {
            MeasureLogger.warn(TAG, 'finish: 未激活，直接返回');
            return;
        }
        this.active = false;
        this.finished = true;

        MeasureLogger.info(TAG, '移除鼠标事件监听');
        this.handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);

        // 移除临时实体
        if (this.tempEntity) {
            MeasureLogger.debug(TAG, 'finish: 移除临时实体');
            this.viewer.entities.remove(this.tempEntity);
            this.tempEntity = undefined;
        }

        if (this.pointEntities.length < this.minPointCount) {
            MeasureLogger.warn(TAG, `finish: 点数不足 ${this.pointEntities.length} < ${this.minPointCount}`);
            this.dispatcher.dispatchEvent('DRAWEND', {
                type: this.constructor.name,
                points: this.getPositions(),
                text: '点数不足，请重新量测'
            });
            return;
        }

        // 创建最终实体（用 CallbackProperty，只 build 一次）
        MeasureLogger.info(TAG, 'finish: 构建最终实体');
        const final = this.buildFinalEntity();
        this.dispatcher.dispatchEvent('DRAWEND', {
            type: this.constructor.name,
            entity: final,
            points: this.getPositions(),
            text: '量测完成'
        });
        MeasureLogger.exit(TAG, 'finish');
    }

    /** 从 pointEntities 读取当前点序列 */
    protected getPositions(): Cartesian3[] {
        const positions = this.pointEntities.map(
            e => e.position!.getValue(JulianDate.now())!
        );
        MeasureLogger.debug(TAG, 'getPositions', {
            pointCount: this.pointEntities.length,
            positionsCount: positions.length,
            hasNull: positions.some(p => p === null || p === undefined)
        });
        return positions;
    }

    /** 安全拾取贴地点 */
    private safePick(windowPos: Cartesian2): Cartesian3 | undefined {
        const ray = this.viewer.camera.getPickRay(windowPos);
        if (!ray) {
            MeasureLogger.warn(TAG, 'safePick: getPickRay 返回 null');
            return undefined;
        }
        const result = this.viewer.scene.globe.pick(ray, this.viewer.scene)
            ?? this.viewer.scene.globe.ellipsoid.scaleToGeodeticSurface(ray.origin);
        if (!result) {
            MeasureLogger.warn(TAG, 'safePick: globe.pick 和 scaleToGeodeticSurface 都返回 null');
        }
        return result;
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
