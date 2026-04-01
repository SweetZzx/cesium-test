import { GeographicTilingScheme} from "cesium"
import { ILayerItem } from "../Common/interfaces"
import { TDT_KEY, SERVER_DATA_URL, GEOSERVER_URL } from "../Config/SystemConfig"

// 图层ID枚举
export enum LayerIdFlag {
    TDT_IMAGERY_WMTS = "tdt_imagery_wmts",
    TDT_ANNOTATION_WMTS = "tdt_annotation_wmts",
    TDT_VECTOR_WMTS = "tdt_vector_wmts",

    GEOMSON_TEST = "geojsonTest",
    KML_TEST = "kmlTest",
    GLB_TEST = "glbTest",
    MODEL_3DTILES_TEST = "model3dtilesTest",
    CZML_TEST = "czmlTest",
    TERRAIN_TEST = "terrainTest",

    WMS_IMAGE_TEST = "wms_image_test",
    WMS_SHAPETEST = "wms_shapetest",
    WMTS_IMAGE_TEST = "wmts_image_test",
    XYZ_IMAGE_TEST = "xyz_image_test",
    MVT_TEST = "mvt_test",

}

//天地图影像配置信息
export const tdtImageLayerInfo: ILayerItem =
{
    id: LayerIdFlag.TDT_IMAGERY_WMTS,
    name: 'tdtImage',
    type: "imagery_wmts",
    url: `http://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=` + TDT_KEY,
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    layer: "tdtBasicLayer",
    style: "default",
    format: "image/jpeg",
    tileMatrixSetID: "GoogleMapsCompatible",
}
//天地图注记信息
export const tdtAnnotationInfo: ILayerItem =
{
    id: LayerIdFlag.TDT_ANNOTATION_WMTS,
    name: 'tdtAnnotation',
    type: "imagery_wmts",
    url: `http://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=` + TDT_KEY,
    layer: "tdtAnnotationLayer",
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    style: "default",
    format: "image/jpeg",
    tileMatrixSetID: "GoogleMapsCompatible",
}
//天地图矢量地图信息
export const tdtVecLayerInfo: ILayerItem =
{
    id: LayerIdFlag.TDT_VECTOR_WMTS,
    name: 'tdtVec',
    type: "imagery_wmts",
    url: "http://t{s}.tianditu.gov.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=" + TDT_KEY,
    layer: "tdtVecBasicLayer",
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    style: "default",
    format: "image/jpeg",
    tileMatrixSetID: "GoogleMapsCompatible",
}

//geojson测试数据 - 西安市区
export const geojsonTestInfo: ILayerItem = {
    id: LayerIdFlag.GEOMSON_TEST,
    name: "geojsonTest",
    type: "geojson",
    url: `${SERVER_DATA_URL}/geojson/xian.geojson`,
    layer: "geojsonTest"
}
//kml测试数据
export const kmlTestInfo: ILayerItem = {
    id: LayerIdFlag.KML_TEST,
    name: "kmlTest",
    type: "kml",
    url: `${SERVER_DATA_URL}/kml/xian_metro.kml`,
    layer: "kmlTest"
}
//glb测试数据 - 飞机模型
export const glbTestInfo: ILayerItem = {
    id: LayerIdFlag.GLB_TEST,
    name: "glbTest",
    type: "glb",
    url: `${SERVER_DATA_URL}/glb/Cesium_Air.glb`,
    layer: "glbTest",
    scale: 50,
    lon: 108.95,
    lat: 34.26,
    height: 500,
    heading: 45,
    pitch: 0,
    roll: 0
}
//3dtile测试数据 - 大雁塔
export const model3dtilesTestInfo: ILayerItem = {
    id: LayerIdFlag.MODEL_3DTILES_TEST,
    name: "model3dtilesTest",
    type: "3dtiles",
    url: `${SERVER_DATA_URL}/3dtiles/dayanta/tileset.json`,
    layer: "model3dtilesTest"
}
//czml测试数据 - 飞机轨迹
export const czmlTestInfo: ILayerItem = {
    id: LayerIdFlag.CZML_TEST,
    name: "czmlTest",
    type: "czml",
    url: `${SERVER_DATA_URL}/czml/simple.czml`,
    layer: "czmlTest"
}

// wms测试数据 - SRTM 30m DEM高程数据(西安区域)
export const wmsImageTestInfo: ILayerItem = {
    id: LayerIdFlag.WMS_IMAGE_TEST,
    name: "wmsImageTest",
    type: "imagery_wms",
    url: `${GEOSERVER_URL}/test/wms`,
    layer: 'test:xian_dem',
}
// wms测试数据 - 西安市行政区划矢量数据
export const wmsShpTestInfo: ILayerItem = {
    id: LayerIdFlag.WMS_SHAPETEST,
    name: "wmsShpTest",
    type: "imagery_wms",
    url: `${GEOSERVER_URL}/test/wms`,
    layer: 'test:xian_boundary',
}
// WMTS测试数据 - 西安DEM高程(GeoWebCache缓存瓦片)
export const wmtsImageTestInfo: ILayerItem = {
    id: LayerIdFlag.WMTS_IMAGE_TEST,
    name: "wmtsImageTest",
    type: "imagery_wmts",
    url: `${GEOSERVER_URL}/gwc/service/wmts`,
    layer: 'test:xian_dem',
    style: 'raster',
    format: 'image/png',
    tileMatrixSetID: 'EPSG:4326',
    tileMatrixLabels: ['EPSG:4326:0', 'EPSG:4326:1', 'EPSG:4326:2',
                        'EPSG:4326:3', 'EPSG:4326:4', 'EPSG:4326:5', 'EPSG:4326:6',
                        'EPSG:4326:7', 'EPSG:4326:8', 'EPSG:4326:9', 'EPSG:4326:10',
                        'EPSG:4326:11', 'EPSG:4326:12', 'EPSG:4326:13', 'EPSG:4326:14',
                        'EPSG:4326:15', 'EPSG:4326:16', 'EPSG:4326:17', 'EPSG:4326:18'],
    tilingScheme: new GeographicTilingScheme({
        numberOfLevelZeroTilesX: 2,
        numberOfLevelZeroTilesY: 1,
    }),
}

// XYZ瓦片测试数据
export const xyzImageTestInfo: ILayerItem = {
    id: LayerIdFlag.XYZ_IMAGE_TEST,
    name: "xyzImageTest",
    type: "imagery_xyz",
    url: `${SERVER_DATA_URL}/xyz_tiles/{z}/{x}/{y}.png`,
    layer: 'xyzImageTest',
}

// MVT矢量瓦片测试数据 - 西安市行政区划
export const mvtTestInfo: ILayerItem = {
    id: LayerIdFlag.MVT_TEST,
    name: "mvtTest",
    type: "imagery_mvt",
    url: `${SERVER_DATA_URL}/mvt_tiles/{z}/{x}/{y}.pbf`,
    layer: 'mvtTest',
}

// 地形测试数据 - Mars3D全球地形 (quantized mesh)
export const terrainTestInfo: ILayerItem = {
    id: LayerIdFlag.TERRAIN_TEST,
    name: "terrainTest",
    type: "terrain",
    url: `https://data.mars3d.cn/terrain`,
    layer: 'terrainTest',
}


