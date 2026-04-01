import { CallbackProperty, Cartesian3, ClassificationType, Color, Entity, PolygonGraphics, Viewer } from "cesium";
import { BaseDraw } from "../BaseDraw";
import EventDispatcher from "@/system/EventDispatcher/EventDispatcher";

export default abstract class BasePolygon extends BaseDraw {
    

    /** 算法函数，子类注入 */
    protected abstract createPolygonPoints(pos: Cartesian3[]): Cartesian3[];

    /** 达到几个点自动结束 */
    protected abstract get maxPointCount(): number;

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);

    }

    protected buildFinalEntity(): Entity {
        const geometryPoints = this.createPolygonPoints(this.getPositions())
        return this.viewer.entities.add({
            polygon: new PolygonGraphics({
                hierarchy: new CallbackProperty(() => ({
                    positions: geometryPoints
                }), false),
                classificationType: ClassificationType.BOTH,
                material: Color.BLUE.withAlpha(0.4)
            })
        });

    }
    protected buildTempEntity(): Entity | undefined {
        if (this.getPositions().length < (this.minPointCount - 1)) return undefined;
        return this.viewer.entities.add({
            polygon: new PolygonGraphics({
                hierarchy: new CallbackProperty(
                    () => ({
                        positions: this.createPolygonPoints([
                            ...this.getPositions(),
                            ...(this.tempCursor ? [this.tempCursor] : []),
                        ]),
                    }),
                    false
                ),
                classificationType: ClassificationType.BOTH,
                material: Color.CYAN.withAlpha(0.3),
            }),
        });
    }


    /* -------------------- 鼠标事件 -------------------- */
    protected onLeftClick(e: any): void {
        super.onLeftClick(e);
        if (this.getPositions().length === this.maxPointCount) {
            this.finish();
        }
    }
}