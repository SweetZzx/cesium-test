import * as Cesium from "cesium";
import MouseStatusInViewer from "./MouseStatusInViewer";
import { CESIUM_TOKEN } from "@/system/Config/SystemConfig";
import MouseInfoPickerInViewer from "./MouseInfoPickerInViewer";

export default class CesiumViewer {

    public static viewer: Cesium.Viewer | undefined
    public static handler: Cesium.ScreenSpaceEventHandler
    public static ellipsoid: Cesium.Ellipsoid

    constructor() { }

    static async CreateViewer(containerId: string) {
        Cesium.Ion.defaultAccessToken = CESIUM_TOKEN ?? ''
        CesiumViewer.viewer = await CesiumViewer.InitViewer(containerId)
        CesiumViewer.handler = new Cesium.ScreenSpaceEventHandler(CesiumViewer.viewer.canvas)
        CesiumViewer.ellipsoid = CesiumViewer.viewer.scene.globe.ellipsoid
    }

    static async InitViewer(containerId: string) {
        const viewer = new Cesium.Viewer(containerId, {
            baseLayerPicker: false, // 基础影响图层选择器
            navigationHelpButton: false, // 导航帮助按钮
            animation: false, // 动画控件
            timeline: false, // 时间控件
            shadows: false, // 显示阴影
            shouldAnimate: false, // 模型动画效果 大气
            skyBox: false,
            infoBox: false, // 显示 信息框
            fullscreenButton: true, // 是否显示全屏按钮
            homeButton: false, // 是否显示首页按钮
            geocoder: false, // 默认不显示搜索栏地址
            sceneModePicker: false, // 是否显示视角切换按钮
            selectionIndicator: false, // 是否显示选择框，
            //需要纯色背景必须设置
            contextOptions: {
                webgl: {
                    alpha: true,
                }
            },

        });

        // viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(TERRAIN_URL, {
        //     requestWaterMask: true,
        //     requestVertexNormals: true,
        // })

        viewer.scene.globe.depthTestAgainstTerrain = true
        const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement
        creditContainer.style.display = 'none' // 隐藏logo

        
    

        // 暂时隐藏 fps
        viewer.scene.debugShowFramesPerSecond = false
        
       
        //抗锯齿  
        viewer.scene.postProcessStages.fxaa.enabled = true;
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(108.9402, 34.3416, 50000.0),
            duration: 2
        })
        viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
        // viewer.screenSpaceEventHandler.setInputAction(CesiumViewer.GetMousePosition, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        // viewer.screenSpaceEventHandler.setInputAction(CesiumViewer.GetCameraHeight, Cesium.ScreenSpaceEventType.WHEEL)

        const picker = new MouseInfoPickerInViewer(viewer);
        picker.onMouseMove((cartographic) => {
            //鼠标位置
            MouseStatusInViewer.longtitude.value = Cesium.Math.toDegrees(cartographic?.longitude ?? 0)
            MouseStatusInViewer.latitude.value = Cesium.Math.toDegrees(cartographic?.latitude ?? 0)
            MouseStatusInViewer.altitude.value = viewer.scene.globe.getHeight(cartographic) ?? 0

            //相机信息
            MouseStatusInViewer.heading.value = Cesium.Math.toDegrees(viewer.camera.heading ?? 0)
            MouseStatusInViewer.pitch.value = Cesium.Math.toDegrees(viewer.camera.pitch ?? 0)
            MouseStatusInViewer.roll.value = Cesium.Math.toDegrees(viewer.camera.roll ?? 0)

        });
        picker.onMouseWheel((h) => {
            MouseStatusInViewer.cameraHeight.value = h
        })

        return viewer
    }


    static GetCameraHeight() {
        const viewer = CesiumViewer.viewer
        if (!viewer) return 0;
        MouseStatusInViewer.cameraHeight.value = viewer.camera.positionCartographic.height
    }




}