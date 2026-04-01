import * as Cesium from 'cesium'
import { ICameraStatus, IPosition } from '../Common/interfaces';

export default class PositionUtil {
    static GetCameraStatus(viewer: Cesium.Viewer): ICameraStatus {
        let heading = Cesium.Math.toDegrees(viewer.camera.heading ?? 0)
        let pitch = Cesium.Math.toDegrees(viewer.camera.pitch ?? 0)
        let roll = Cesium.Math.toDegrees(viewer.camera.roll ?? 0)
        let height = viewer.camera.positionCartographic.height
        return {
            heading,
            pitch,
            roll,
            cameraHeight: height
        }
    }
    static GetMousePosition(viewer: Cesium.Viewer, movement: { endPosition: Cesium.Cartesian2 }): IPosition {

        // 获取鼠标在屏幕上的位置
        const screenPosition = movement.endPosition
        // 将屏幕位置转换为经纬度
        const cartesian = viewer.scene.globe.pick(viewer.camera.getPickRay(screenPosition)!, viewer.scene)
        // const cartesian = viewer.camera.pickEllipsoid(movement.endPosition,CesiumViewer.ellipsoid)
        if (cartesian) {
            const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian)

            let longtitude = Cesium.Math.toDegrees(cartographic?.longitude ?? 0)
            let latitude = Cesium.Math.toDegrees(cartographic?.latitude ?? 0)
            let altitude = viewer.scene.globe.getHeight(cartographic) ?? 0

            return {longtitude,latitude,altitude}

        }
        return { longtitude: 0, latitude: 0, altitude: 0 }

    }
}