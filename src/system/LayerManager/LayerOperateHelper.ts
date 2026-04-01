import * as Cesium from 'cesium';
import { IGlbEntityOpts, IGlbPrimitiveOps } from '../Common/interfaces';

export default class LayerOperateHelper {
    


    /**
     * 添加3dtiles
     * @param viewer 
     * @param tilesetUrl 
     * @returns 
     */

    static async AddTilesetLayer(viewer: Cesium.Viewer, tilesetUrl: string): Promise<Cesium.Cesium3DTileset> {
        const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl)
        viewer.scene.primitives.add(tileset)
        return tileset;
    }

    /**
     * 移除3dtiles
     * @param viewer 
     * @param tileset 
     */

    static RemoveTilesetLayer(viewer: Cesium.Viewer, tileset: Cesium.Cesium3DTileset) {
        viewer.scene.primitives.remove(tileset)
    }

    /**
     * 移除所有3D模型
     * @param viewer 
     */
    static RemoveAllTilesetLayer(viewer: Cesium.Viewer) {
        viewer.scene.primitives.removeAll()
    }

    static AddGlbToEntities(viewer: Cesium.Viewer, opt: IGlbEntityOpts) {
        const pos = Cesium.Cartesian3.fromDegrees(...opt.position);
        const hpr = new Cesium.HeadingPitchRoll(
            ...(opt.hpr || [0, 0, 0]).map(Cesium.Math.toRadians)
        );
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(pos, hpr);
        const glbEntity = viewer.entities.add({
            name: opt.debugName || 'GLB_Entity',
            position: pos,
            orientation,
            model: {
                uri: opt.url,
                scale: opt.scale ?? 1.0,
                minimumPixelSize: opt.minimumPixelSize ?? 128,
                maximumScale: opt.maximumScale ?? 20000,
                shadows: opt.shadows ?? Cesium.ShadowMode.ENABLED,
                runAnimations: opt.runAnimations ?? true,
                clampAnimations: true,
                incrementallyLoadTextures: true,

                /* 染色 / 轮廓 */
                color: opt.color ?? Cesium.Color.WHITE,
                colorBlendMode: opt.colorBlendMode ?? Cesium.ColorBlendMode.HIGHLIGHT,
                colorBlendAmount: opt.colorBlendAmount ?? 0.5,
                silhouetteColor: opt.silhouetteColor ?? Cesium.Color.TRANSPARENT,
                silhouetteSize: opt.silhouetteSize ?? 0,

                /* 离地参照 */
                heightReference: opt.heightReference ?? Cesium.HeightReference.NONE,

                /* 可视距离 */
                distanceDisplayCondition: opt.distanceDisplayCondition,
            }
        })
        return glbEntity;
    }

    static async AddGlbToPrimitives(viewer: Cesium.Viewer, opt: IGlbPrimitiveOps): Promise<Cesium.Model> {
        const pos = Cesium.Cartesian3.fromDegrees(...opt.position);
        const hpr = new Cesium.HeadingPitchRoll(...(opt.hpr || [0, 0, 0]).map(Cesium.Math.toRadians));
        const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
            pos,
            hpr,
            Cesium.Ellipsoid.WGS84,
            Cesium.Transforms.eastNorthUpToFixedFrame
        );

        const model = await Cesium.Model.fromGltfAsync({
            url: opt.url,
            modelMatrix,
            scale: opt.scale ?? 1.0,
            minimumPixelSize: opt.minimumPixelSize ?? 128, // 远距保证不消失
            maximumScale: opt.maximumScale ?? 20000,
            shadows: opt.shadows ?? Cesium.ShadowMode.ENABLED,
            debugShowBoundingVolume: opt.debug ?? false,
        });

        viewer.scene.primitives.add(model);
        return model;

    }


}