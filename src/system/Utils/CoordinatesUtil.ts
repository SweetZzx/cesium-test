import * as Cesium from "cesium";


export default class CoordinatesUtil {

    //笛卡尔坐标转为经纬度，通过viewer所在的椭球体
    static CartesianToLnglat(viewer: Cesium.Viewer, cartesian: Cesium.Cartesian3): number[] {
        const lnglat = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        const lat = Cesium.Math.toDegrees(lnglat.latitude);
        const lng = Cesium.Math.toDegrees(lnglat.longitude);
        return [lng, lat];
    }
    //笛卡尔坐标转为经纬度，WGS84椭球
    static Cartesian2Wgs84Lonlat(cartesian: Cesium.Cartesian3): Array<number> {
        let ellipsoid = Cesium.Ellipsoid.WGS84
        var cartographic = ellipsoid.cartesianToCartographic(cartesian)
        if (cartographic) {
            let longitudeString = Cesium.Math.toDegrees(cartographic.longitude)
            let latitudeString = Cesium.Math.toDegrees(cartographic.latitude)
            return [longitudeString, latitudeString]
        } else {
            return [0, 0]
        }
    }

    //笛卡尔坐标转为经纬度，WGS84椭球
    static Cartesian2Wgs84LonlatHeight(cartesian: Cesium.Cartesian3): Array<number> {
        let ellipsoid = Cesium.Ellipsoid.WGS84
        var cartographic = ellipsoid.cartesianToCartographic(cartesian)
        if (cartographic) {
            let longitudeString = Cesium.Math.toDegrees(cartographic.longitude)
            let latitudeString = Cesium.Math.toDegrees(cartographic.latitude)
            return [longitudeString, latitudeString, cartographic.height]
        } else {
            return [0, 0]
        }
    }
    /**
       * 笛卡尔数组转经纬度数组
       * @param {*} cartesianArr 
       */
    static cartesianArrayToWGS84Array(cartesianArr: Cesium.Cartesian3[]) {
        return cartesianArr ?
            cartesianArr.map((item) => { return CoordinatesUtil.Cartesian2Wgs84Lonlat(item) }) : []
    }

    //经纬度转为笛卡尔坐标
    static LonLat2Cartesian(lonlat: Array<number>, height: number | undefined): Cesium.Cartesian3 {
        return Cesium.Cartesian3.fromDegrees(
            lonlat[0],
            lonlat[1],
            height,
            Cesium.Ellipsoid.WGS84
        )
    }

    //屏幕坐标转为笛卡尔坐标
    static pixelToCartesian(viewer: Cesium.Viewer, position: Cesium.Cartesian2): Cesium.Cartesian3 | undefined {
        var cartesian = viewer.scene.pickPosition(position);
        return cartesian;
    }

    //屏幕坐标转为经纬度
    static pixelToWGS84(viewer: Cesium.Viewer, screenPosition: Cesium.Cartesian2): Array<number> {
        // 将屏幕位置转换为经纬度
        const cartesian = viewer.scene.globe.pick(viewer.camera.getPickRay(screenPosition)!, viewer.scene)
        if (!cartesian) return [0, 0];
        return CoordinatesUtil.Cartesian2Wgs84Lonlat(cartesian);
    }



    //计算两个点的中点坐标  
    static MidPoint(point1: number[], point2: number[]): number[] {
        return [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2];
    }

    static GetCatesian3FromPX(viewer: Cesium.Viewer | undefined, px: Cesium.Cartesian2) {
        let picks = viewer?.scene.drillPick(px);
        let cartesian = null;
        let isOn3dtiles = false, isOnTerrain = false;
        // drillPick
        picks?.forEach((pick) => {
            if (
                (pick && pick.primitive instanceof Cesium.Cesium3DTileFeature) ||
                (pick && pick.primitive instanceof Cesium.Cesium3DTileset) ||
                (pick && pick.primitive instanceof Cesium.Model)
            ) {
                //模型上拾取
                isOn3dtiles = true;
            }
            // 3dtilset
            if (isOn3dtiles) {
                viewer?.scene.pick(px); // pick
                cartesian = viewer?.scene.pickPosition(px);
                if (cartesian) {
                    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    if (cartographic.height < 0) cartographic.height = 0;
                    let lon = Cesium.Math.toDegrees(cartographic.longitude),
                        lat = Cesium.Math.toDegrees(cartographic.latitude),
                        height = cartographic.height;
                    cartesian = CoordinatesUtil.LonLat2Cartesian([lon, lat], height);
                }
            }

        })

        // 地形
        let boolTerrain =
            viewer?.terrainProvider instanceof Cesium.EllipsoidTerrainProvider;
        // Terrain
        if (!isOn3dtiles && !boolTerrain) {
            let ray = viewer?.scene.camera.getPickRay(px);
            if (!ray) return null;
            cartesian = viewer?.scene.globe.pick(ray, viewer.scene);
            isOnTerrain = true;
        }
        // 地球
        if (!isOn3dtiles && !isOnTerrain && boolTerrain) {
            cartesian = viewer?.scene.camera.pickEllipsoid(
                px,
                viewer.scene.globe.ellipsoid
            );
        }
        if (cartesian) {
            let position = CoordinatesUtil.Cartesian2Wgs84LonlatHeight(cartesian);
            if (position[2] < 0) {
                cartesian = CoordinatesUtil.LonLat2Cartesian(position, 0.1);
            }
            return cartesian;
        }
        return false;
    }

    //根据经纬度获取高度
    static GetHeightFromLonlat(viewer: Cesium.Viewer, x: number, y: number, objectsToExclude: any[]) {
        let endCartographic = Cesium.Cartographic.fromDegrees(x, y);
        let endHeight = viewer.scene.sampleHeight(
            endCartographic,
            objectsToExclude
        );
        return endHeight;
    }
}
