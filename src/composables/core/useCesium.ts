import CesiumViewer from '@/Viewer/CesiumViewer'
import { sharedDispatcher } from '@/system/EventDispatcher/EventDispatcher'

/**
 * 统一获取 Cesium Viewer 和全局事件调度器的 composable
 *
 * 注意：调用此 composable 的组件必须确保 CesiumViewer.CreateViewer 已经执行完毕。
 * 在当前项目中，由于组件是通过菜单点击动态渲染的（此时 Viewer 已初始化完成），
 * 所以 CesiumViewer.viewer 的非空断言是安全的。
 */
export function useCesium() {
  const viewer = CesiumViewer.viewer!
  const dispatcher = sharedDispatcher
  return { viewer, dispatcher }
}
