import MouseStatusInViewer from '@/Viewer/MouseStatusInViewer'

/**
 * 鼠标状态 composable
 *
 * 封装 MouseStatusInViewer 的静态 ref 属性，提供符合 Vue composable 惯例的访问方式。
 * 模板中可直接使用返回值（自动解包 ref，无需 .value）。
 */
export function useMouseStatus() {
  return {
    longitude: MouseStatusInViewer.longtitude,
    latitude: MouseStatusInViewer.latitude,
    altitude: MouseStatusInViewer.altitude,
    heading: MouseStatusInViewer.heading,
    pitch: MouseStatusInViewer.pitch,
    roll: MouseStatusInViewer.roll,
    cameraHeight: MouseStatusInViewer.cameraHeight,
  }
}
