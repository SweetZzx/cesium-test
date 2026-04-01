import { Color, ColorBlendMode, DistanceDisplayCondition, HeightReference, MaterialProperty, ShadowMode, TilingScheme } from "cesium"
import { MenuEnum } from "./enums"


/**菜单树 */
export interface IMenuTree {
  id: string | number
  label: string
  icon?: string  // 图标名称
  children?: IMenuTree[]
  componentCode?: MenuEnum
}

export type LayerType = 'imagery_wmts' | 'imagery_wms' | 'imagery_xyz' | 'imagery_mvt' | 'terrain' | 'geojson' | 'kml' | 'czml' | '3dtiles'|'glb';
/**图层接口 */
export interface ILayerItem {
  id: string;               // UI 唯一键
  name: string;             // 显示名
  type: LayerType | string;
  alpha?: number;           // 透明度，仅对 imagery / geojson 有效
  show?: boolean;           // 初始是否可见
  zIndex?: number;          // 叠加顺序，仅 imagery
  url?: string;             // 大部分服务需要
  layer?: string;           // WMTS/WMS 专用
  style?: string;           // WMTS 专用
  format?: string;          // WMTS 专用
  tileMatrixSetID?: string; // WMTS 专用
  tilingScheme?: TilingScheme; // WMTS 专用
  requestWaterMask?: boolean; // 地形
  requestVertexNormals?: boolean;
  // 任意扩展字段，回调里透传
  [key: string]: any;
}

/**GLB模型的Primitive选项*/
export interface IGlbPrimitiveOps {
  url: string;
  position: [number, number, number]; // [lon, lat, height]
  hpr?: [number, number, number];     // 可选 航向/俯仰/横滚（度）
  scale?: number;
  minimumPixelSize?: number;
  maximumScale?: number;
  shadows?: ShadowMode;
  debug?: boolean;
}

/**GLB模型的Entity选项*/
export interface IGlbEntityOpts {
  url: string;
  position: [number, number, number]; // [lon, lat, height]
  hpr?: [number, number, number];     // 航向/俯仰/横滚（度）
  scale?: number;
  minimumPixelSize?: number;
  maximumScale?: number;
  shadows?: ShadowMode;
  runAnimations?: boolean;
  color?: Color;
  colorBlendMode?: ColorBlendMode;
  colorBlendAmount?: number;
  heightReference?: HeightReference;
  silhouetteColor?: Color;
  silhouetteSize?: number;
  distanceDisplayCondition?: DistanceDisplayCondition;
  debugName?: string;
}


/**在Viewer中的位置 经度纬度高度  单位：度 度 米*/
export interface IPosition{
  longtitude: number;
  latitude: number;
  altitude: number;
}

/**相机在Viewer中的位置 单位：度 度 米*/
export interface ICameraStatus {
  heading: number;
  pitch: number;
  roll: number;
  cameraHeight: number;
}

//标绘样式相关
//点样式
export type PointStyle={
  color ?:Color
  pixelSize ?:number
}
// 多边形样式
export type PolygonStyle={
  material ?:MaterialProperty
  outlineWidth ?:number
  outlineMaterial:MaterialProperty
}

//线样式
export type LineStyle={
  material ?:Color|MaterialProperty
  lineWidth ?:number
}
//Geometry样式
export type GeometryStyle = PolygonStyle | LineStyle | PointStyle

