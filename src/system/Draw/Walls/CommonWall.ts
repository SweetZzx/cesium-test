import { Color, Entity, Viewer } from 'cesium';
import { BaseDraw, GeometryType } from '../BaseDraw';
import EventDispatcher from '@/system/EventDispatcher/EventDispatcher';

/** 自定义墙体绘制工具 */
export default class CommonWall extends BaseDraw {
    private wallHeight = 50; // 墙体高度（米）

    constructor(viewer: Viewer, dispatcher: EventDispatcher) {
        super(viewer, dispatcher);
        this.geometryType = GeometryType.COMMON_WALL;
        this.minPointCount = 2;
    }

    protected buildFinalEntity(): Entity {
        const positions = this.getPositions();
        return this.viewer.entities.add({
            wall: {
                positions,
                minimumHeights: new Array(positions.length).fill(0),
                maximumHeights: new Array(positions.length).fill(this.wallHeight),
                material: Color.CORAL.withAlpha(0.7),
                outline: true,
                outlineColor: Color.DARKRED,
            },
        });
    }

    protected buildTempEntity(): Entity | undefined {
        if (this.getPositions().length < 1) return undefined;
        const positions = [...this.getPositions(), ...(this.tempCursor ? [this.tempCursor] : [])];
        return this.viewer.entities.add({
            wall: {
                positions,
                minimumHeights: new Array(positions.length).fill(0),
                maximumHeights: new Array(positions.length).fill(this.wallHeight),
                material: Color.YELLOW.withAlpha(0.4),
                outline: false,
            },
        });
    }

    protected onLeftClick(e: any) {
        super.onLeftClick(e);
        // 每添加一个点，重建临时墙体以更新预览
        if (this.tempEntity) {
            this.viewer.entities.remove(this.tempEntity);
            this.tempEntity = undefined;
        }
    }
}
