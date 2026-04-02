import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";
import { Cartographic, ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer } from "cesium";
import { throttle } from "@/system/Utils/DebounceThrottle";


export default class MouseInfoPickerInViewer {
    private handler: ScreenSpaceEventHandler;
    private dispatcher = new EventDispatcher();
    private viewer: Viewer;

    constructor(viewer: Viewer) {
        this.viewer = viewer;
        this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        this.bindMouseMove();
        this.bindWheel();
    }
    onMouseMove(cb: (coords: Cartographic) => void) {
        // Wrap the callback to match EventListener signature
        const wrapper = (evt: any) => cb(evt as Cartographic);
        this.dispatcher.on('MOUSEMOVE', wrapper);        
        // Return a function to remove the wrapper
        return () => this.dispatcher.off('MOUSEMOVE', wrapper); // 返回取消函数
    }

    onMouseWheel(cb: (h: number) => void) {
        // Wrap the callback to match EventListener signature
        const wrapper = (evt: any) => cb(evt as number);
        this.dispatcher.on('WHEEL', wrapper);        
        // Return a function to remove the wrapper
        return () => this.dispatcher.off('WHEEL', wrapper); // 返回取消函数
    }

    private bindMouseMove() {
        this.handler.setInputAction(
            (movement: any) => this.throttledPick(movement),
            ScreenSpaceEventType.MOUSE_MOVE
        );
    }

    /** 节流后的地面拾取 */
    private throttledPick = throttle((movement: any) => {
        const screenPosition = movement.endPosition;
        const cartesian = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(screenPosition)!, this.viewer.scene);
        if (cartesian) {
            const cartographic = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
            this.dispatcher.dispatchEvent('MOUSEMOVE', cartographic);
        }
    }, 16, { first: true, end: false });
    private bindWheel() {
        this.handler.setInputAction(() => {
            this.dispatcher.dispatchEvent('WHEEL', this.viewer.camera.positionCartographic.height)
        }, ScreenSpaceEventType.WHEEL);
    }

    destroy() {
        this.handler.destroy()
        this.dispatcher.clear('MOUSEMOVE')
        this.dispatcher.clear('WHEEL')
    }
}