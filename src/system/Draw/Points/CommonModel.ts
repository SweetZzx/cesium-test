import { CallbackPositionProperty, Cartesian3, Cartographic, Entity, HeightReference, ModelGraphics, Viewer } from "cesium";
import { BaseDraw, GeometryType } from "../BaseDraw";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";

export default class CommonModel extends BaseDraw {
    private modelOption: ModelGraphics.ConstructorOptions;
    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_MODEL;
        this.modelOption = {
            // 引入模型
            uri: '/testdata/CesiumBalloon.glb',
            // 模型的近似最小像素大小，而不考虑缩放。
            minimumPixelSize: 150,
            // 是否执行模型动画
            runAnimations: true,
            // 应用于图像的统一比例。比例大于会1.0放大标签，而比例小于会1.0缩小标签。
            scale: 1.0,
            // 贴地显示（与 point 保持一致）
            heightReference: HeightReference.CLAMP_TO_GROUND,
            // 是否显示
            show: true
        }
    }

    protected buildFinalEntity(): Entity {
        const pos = this.getPositions()[0];
        // 把模型抬高一小段，避免被地形遮挡
        const carto = Cartographic.fromCartesian(pos);
        const raised = Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height + 2);
        return this.viewer.entities.add({
            position: raised,
            model: this.modelOption,
           
        });
    }

    protected buildTempEntity(): Entity | undefined {
        return this.viewer.entities.add({
            position: new CallbackPositionProperty(() => {
                const p = this.tempCursor || new Cartesian3();
                const c = Cartographic.fromCartesian(p);
                return Cartesian3.fromRadians(c.longitude, c.latitude, c.height + 2);
            }, false),
            model: this.modelOption,           
        });
    }

    protected onLeftClick(e: any) {
        super.onLeftClick(e);
        // 点只需要 1 次点击即可结束
        this.finish();
    }
}