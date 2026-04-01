import { ILayerItem } from "@/system/Common/interfaces";
import * as Cesium from "cesium";
import { LayerIdFlag } from "./LayerConfig";
import { MVTImageryProvider } from "./MVTImageryProvider";

export default class LayerManager {

    private static instance: LayerManager;
    private viewer: Cesium.Viewer
    private layersIdMap = new Map<string, ILayerItem & { handle?: any }>()
    private cachedTerrainProvider: Cesium.CesiumTerrainProvider | null = null
    constructor(viewer: Cesium.Viewer) {
        this.viewer = viewer
    }

    // 获取单例实例
    public static getInstance(viewer?: Cesium.Viewer): LayerManager {
        if (!LayerManager.instance) {
            if (!viewer) throw new Error("LayerManager需要传入viewer实例");
            LayerManager.instance = new LayerManager(viewer);
        }
        return LayerManager.instance;
    }

    //添加图层
    async Add(item: ILayerItem): Promise<void> {
        if (this.layersIdMap.has(item.id)) {
            return
        }
        const { type, show = true, alpha = 1, zIndex = 0 } = item
        let handle: any
        let provider: Cesium.ImageryProvider
        switch (type) {
            /* ---- 影像 ---- */
            case 'imagery_wmts':
                provider = new Cesium.WebMapTileServiceImageryProvider({
                    url: item.url!,
                    layer: item.layer!,
                    style: item.style || '',
                    format: item.format || 'image/png',
                    tileMatrixSetID: item.tileMatrixSetID || "EPSG:4326",
                    tileMatrixLabels: item.tileMatrixLabels || undefined,
                    tilingScheme: item.tilingScheme || undefined,
                    subdomains: item.subdomains || undefined,
                });
                handle = this.AddImageryLayer(provider, show, alpha, zIndex)
                break
            case 'imagery_wms':

                provider = new Cesium.WebMapServiceImageryProvider({
                    url: item.url!,
                    layers: item.layer!,
                    parameters: {
                        service: 'WMS',
                        transparent: true,
                        format: 'image/png',
                        srs: 'EPSG:4326'
                    }

                });
                provider.errorEvent.addEventListener(() => {
                    throw new Error('WMS 服务不可用，请检查wms服务地址和图层名称是否正确!');
                });

                handle = this.AddImageryLayer(provider, show, alpha, zIndex)


                break
            case 'imagery_xyz':
                provider = new Cesium.UrlTemplateImageryProvider({
                    url: item.url!,
                })

                handle = this.AddImageryLayer(provider, show, alpha, zIndex)
                break
            case 'imagery_mvt':
                const mvtProvider = new MVTImageryProvider({
                    url: item.url!,
                });
                handle = this.AddImageryLayer(mvtProvider, show, alpha, zIndex)
                break

                /* ---- 地形 ---- */
            case 'terrain':
                if (!this.cachedTerrainProvider) {
                    this.cachedTerrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(item.url!, {
                        requestWaterMask: true,
                        requestVertexNormals: true,
                    });
                }
                this.viewer.terrainProvider = this.cachedTerrainProvider;
                handle = { __terrain: true }; // 占位，方便 remove 时切回 ellipsoid
                break

            /* ---- 矢量 ---- */
            case 'geojson':
                handle = await Cesium.GeoJsonDataSource.load(item.url!, {
                    clampToGround: true,
                });
                (handle as Cesium.GeoJsonDataSource).show = show;
                this.viewer.dataSources.add(handle)
                //视角
                this.viewer.zoomTo(handle)
                break
            case 'kml':
                handle = await Cesium.KmlDataSource.load(item.url!, {
                    clampToGround: true,
                });
                (handle as Cesium.KmlDataSource).show = show
                this.viewer.dataSources.add(handle)
                this.viewer.zoomTo(handle)

                break
            case 'czml':
                handle = await Cesium.CzmlDataSource.load(item.url!);
                (handle as Cesium.CzmlDataSource).show = show
                this.viewer.dataSources.add(handle)
                const czmlClock = (handle as Cesium.CzmlDataSource).clock;
                if (czmlClock) {
                    this.viewer.clock.startTime = czmlClock.startTime.clone();
                    this.viewer.clock.currentTime = czmlClock.currentTime.clone();
                    this.viewer.clock.stopTime = czmlClock.stopTime.clone();
                    this.viewer.clock.clockRange = czmlClock.clockRange;
                    this.viewer.clock.multiplier = czmlClock.multiplier;
                    this.viewer.clock.shouldAnimate = true;
                    this.viewer.timeline?.zoomTo(czmlClock.startTime, czmlClock.stopTime);
                }
                // 先飞到数据范围，再跟踪飞机entity
                await this.viewer.zoomTo(handle);
                const czmlEntities = (handle as Cesium.CzmlDataSource).entities.values;
                const aircraft = czmlEntities.find(e => e.model || e.billboard);
                if (aircraft) {
                    this.viewer.trackedEntity = aircraft;
                }
                break

            /* ---- 3DTiles ---- */
            case '3dtiles':
                handle = await Cesium.Cesium3DTileset.fromUrl(item.url!);
                (handle as Cesium.Cesium3DTileset).show = show;
                this.viewer.scene.primitives.add(handle)

                // tileset.json 已包含正确的 transform 定位，向上偏移3米贴地
                const bsCenter = handle.boundingSphere.center;
                const bsCarto = Cesium.Cartographic.fromCartesian(bsCenter);
                if (bsCarto) {
                    const targetPos = Cesium.Cartesian3.fromRadians(
                        bsCarto.longitude, bsCarto.latitude, bsCarto.height + 3
                    );
                    const offset = Cesium.Cartesian3.subtract(
                        targetPos, bsCenter, new Cesium.Cartesian3()
                    );
                    handle.modelMatrix = Cesium.Matrix4.fromTranslation(offset);
                }

                this.viewer.zoomTo(handle, new Cesium.HeadingPitchRange(0.0, -0.3, 0.0))

                break
            case 'glb':
                if (!item.lon || !item.lat) {
                    throw new Error('[LayerManager] glb类型需要提供lon/lat');
                }
                let position = Cesium.Cartesian3.fromDegrees(item.lon, item.lat, item.height || 0);
                let hpRoll = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(item.heading ?? 0), Cesium.Math.toRadians(item.pitch ?? 0), Cesium.Math.toRadians(item.roll ?? 0));
                let fixedFrame = Cesium.Transforms.localFrameToFixedFrameGenerator('north', 'west');
                handle = await Cesium.Model.fromGltfAsync({
                    url: item.url!,
                    modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(position, hpRoll, Cesium.Ellipsoid.WGS84, fixedFrame),
                    scale: item.scale ?? 1,
                });
                handle.show = show;
                this.viewer.scene.primitives.add(handle)
                this.viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(item.lon, item.lat, 2500),
                    duration: 2
                })
                break;

            default:
                throw new Error(`[LayerManager] 未知类型 ${type}`)
        }

        this.layersIdMap.set(item.id, { ...item, handle })
    }

    /**增加影像数据 */
    AddImageryLayer(provider: Cesium.ImageryProvider, show = true, alpha = 1, zIndex = 0) {
        let handle = this.viewer.imageryLayers.addImageryProvider(provider)
        handle.alpha = alpha
        handle.show = show
        this.viewer.imageryLayers.raiseToTop(handle) // 先置顶，再按 zIndex 微调
        if (zIndex)
            this.SetImageryLayerIndex(handle, zIndex)
        return handle
    }

    /**设置影像数据的叠加顺序 */
    SetImageryLayerIndex(layer: Cesium.ImageryLayer, targetIndex: number) {
        const imageryLayers = this.viewer.imageryLayers
        const curIndex = imageryLayers.indexOf(layer)
        if (curIndex === targetIndex) return

        if (targetIndex === 0) {
            imageryLayers.lowerToBottom(layer)          // 直接到底
        } else if (targetIndex === imageryLayers.length - 1) {
            imageryLayers.raiseToTop(layer)            // 直接到顶
        } else {
            // 逐层移动，直到索引匹配
            while (imageryLayers.indexOf(layer) > targetIndex) imageryLayers.lower(layer)
            while (imageryLayers.indexOf(layer) < targetIndex) imageryLayers.raise(layer)
        }
    }

    // 置顶标注图层
    SetAnnotationLayerTop() {
        let annotationHandle = this.layersIdMap.get(LayerIdFlag.TDT_ANNOTATION_WMTS)?.handle
        if (annotationHandle) {
            this.viewer.imageryLayers.raiseToTop(annotationHandle)
        }
    }

    /* 移除图层 */
    Remove(id: string): void {
        const item = this.layersIdMap.get(id)

        if (!item) return;
        const { type, handle } = item;
        switch (type) {
            case 'imagery_wms':
            case 'imagery_wmts':
            case 'imagery_xyz':
            case 'imagery_mvt':
                this.viewer.imageryLayers.remove(handle)
                break
            case 'terrain':
                // 回到默认椭球
                this.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider()
                break
            case 'geojson':
            case 'kml':
            case 'czml':
                if (this.viewer.trackedEntity) {
                    this.viewer.trackedEntity = undefined;
                }
                this.viewer.dataSources.remove(handle)
                break;
                break;
            case '3dtiles':
            case 'glb':
                this.viewer.scene.primitives.remove(handle)
                break;
        }
        this.layersIdMap.delete(id);
    }

    RemoveAllImageLayer() {
        this.viewer.imageryLayers.removeAll()
    }




}
