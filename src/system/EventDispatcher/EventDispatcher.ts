import { DrawEventType } from "../Common/enums";


/**
 * 事件总线管理，事件派发器：负责管理画笔/编辑相关事件的订阅、取消与派发。
 */
export default class EventDispatcher {
    /** 监听器池，按事件类型存储多个回调函数 */
    listeners: Map<DrawEventType, Set<EventListener>>;

    constructor() {
        // 初始化时，预置所有支持的事件类型，避免运行时动态添加
        this.listeners = new Map([
            ['DRAWSTART', new Set()],
            ['DRAWUPDATE', new Set()],
            ['DRAWEND',   new Set()],
            ['EDITSTART', new Set()],
            ['EDITEND',   new Set()],
            ['MOUSEMOVE',  new Set()],
            ['WHEEL',  new Set()],
            ['EDITRIGHTCLICK', new Set()],
        ]);
    }

    /**
     * 注册事件监听器
     * @param event   事件类型，必须是预置的 DrawEventType 之一
     * @param listener 回调函数，事件触发时会收到 eventData
     */
    on(event: DrawEventType, listener: EventListener) {
        if (!this.listeners.has(event)) {
            console.warn("事件类型必须是'DRAWSTART', 'DRAWUPDATE', 'DRAWEND', 'EDITSTART', 'EDITEND', 'MOUSEMOVE', 'WHEEL'之一");
            return;
        }
        this.listeners.get(event)?.add(listener);
    }

    /**
     * 移除事件监听器
     * @param event   事件类型
     * @param listener 之前注册过的回调函数引用
     */
    off(event: DrawEventType, listener: EventListener) {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.delete(listener);
        }
    }

    /**
     * 派发（触发）指定事件
     * @param event     事件类型
     * @param eventData 随事件携带的任意数据，会透传给所有监听器
     */
    dispatchEvent(event: DrawEventType, eventData?: any) {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.forEach((listener) => {
                listener(eventData);
            });
        }
    }

     /** 一次性监听 */
    once(event: DrawEventType, listener: EventListener) {
        const wrap: EventListener = (data) => {
            this.off(event, wrap);
            listener(data);
        };
        this.on(event, wrap);
    }

    /** 清空某类事件 */
    clear(event: DrawEventType) {
        this.listeners.get(event)?.clear();
    }


}

/** 全局共享的事件调度器单例 */
export const sharedDispatcher = new EventDispatcher();