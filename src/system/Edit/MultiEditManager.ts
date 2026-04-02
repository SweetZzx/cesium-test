import {
    Entity, Cartesian3, defined, ScreenSpaceEventHandler,
    ScreenSpaceEventType, Viewer
} from 'cesium';
import { EditHelper } from './EditHelper';
import EventDispatcher from '../EventDispatcher/EventDispatcher';
import { GeometryType } from '../Draw/BaseDraw';


export class MultiEditManager {
    private viewer: Viewer;
    private handler: ScreenSpaceEventHandler;
    private activeEditor?: { entity: Entity; helper: EditHelper };
    private keyDownHandler: ((e: KeyboardEvent) => void) | undefined;

    private static instance: MultiEditManager;
    private dispatcher: EventDispatcher;



    constructor(viewer: Viewer,dispatcher: EventDispatcher) {
        this.viewer = viewer;
        this.handler = new ScreenSpaceEventHandler(viewer.canvas);
        this.bindClick();
        this.bindKeyDelete();
        this.dispatcher = dispatcher;
    }
    private bindKeyDelete() {
        this.keyDownHandler = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && this.activeEditor?.entity) {
                this.viewer.entities.remove(this.activeEditor.entity);
                this.clear();
                this.dispatcher.dispatchEvent('EDITEND',{text:""});
            }
        };
        window.addEventListener('keydown', this.keyDownHandler);
    }

    // 获取单例实例
    public static getInstance(viewer?: Viewer, dispatcher?: EventDispatcher): MultiEditManager {
        if (!MultiEditManager.instance) {
            if (!viewer) throw new Error("MultiEditManager需要传入viewer实例");
            if (!dispatcher) throw new Error("MultiEditManager需要传入dispatcher实例");
            MultiEditManager.instance = new MultiEditManager(viewer, dispatcher);
        }
        return MultiEditManager.instance;
    }

    /** 把画好的 entity 登记进来（由外部调用） */
    register(entity: Entity, positions: Cartesian3[],geometryType:GeometryType) {
        (entity as any)._editPositions = positions.map(p => p.clone());
        (entity as any)._geometryType = geometryType;
    }

    destroy() {
        this.clear();
        if (this.keyDownHandler) {
            window.removeEventListener('keydown', this.keyDownHandler);
            this.keyDownHandler = undefined;
        }
        this.handler.destroy();
    }


    private bindClick() {
        this.handler.setInputAction((e: any) => this.onClick(e), ScreenSpaceEventType.LEFT_CLICK);
    }

    private onClick(e: any) {
        const picked = this.viewer.scene.pick(e.position);
        if (defined(picked) && defined(picked.id) && (picked.id as any)._editPositions) {
            // 点到了可编辑 entity
            const entity = picked.id as Entity;         
         
            if (this.activeEditor?.entity === entity) return; // 已经是它，忽略
            this.clear();               // 先关掉之前的
            this.startEdit(entity);     // 打开新的           

            this.dispatcher.dispatchEvent('EDITSTART',{text:"编辑开始，可拖动控制点编辑、可拖动图形移动位置，delete键删除当前图形；点击空白，结束编辑；"});
        } else {
            // 点到空白
            this.clear();
            this.dispatcher.dispatchEvent('EDITEND',{text:""});
        }
    }

    /** 启动某个 entity 的编辑 */
    private startEdit(entity: Entity) {
        const positions: Cartesian3[] = (entity as any)._editPositions;
        const geometryType: GeometryType = (entity as any)._geometryType;
        const helper = new EditHelper(this.viewer, entity, positions, geometryType, (newP) => {           
            (entity as any)._editPositions = newP; // 其实引用没变，只是兜底
        });
        helper.start();
        this.activeEditor = { entity, helper };
    }

    /** 关闭当前编辑 */
    private clear() {
        if (!this.activeEditor) return;
        this.activeEditor.helper.destroy();
        this.activeEditor = undefined;
    }
}