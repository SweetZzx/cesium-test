import { shallowRef, ref, onBeforeUnmount } from 'vue'
import type { BaseDraw } from '@/system/Draw/BaseDraw'
import type { Viewer } from 'cesium'
import type EventDispatcher from '@/system/EventDispatcher/EventDispatcher'

type DrawClass = new (viewer: Viewer, dispatcher: EventDispatcher) => BaseDraw

/**
 * 绘制实例生命周期管理 composable
 *
 * 解决 new CommonLine(viewer, dispatcher).start() 后引用丢失的问题。
 * 自动在组件卸载时销毁当前实例，启动新绘制前自动销毁旧实例。
 *
 * @param viewer Cesium Viewer 实例
 * @param dispatcher 事件调度器实例
 */
export function useDrawInstance(viewer: Viewer, dispatcher: EventDispatcher) {
  const currentInstance = shallowRef<BaseDraw | null>(null)
  const isDrawing = ref(false)

  /**
   * 创建并启动一个绘制实例
   * 自动销毁旧实例后再创建新实例
   * @param DrawClass BaseDraw 的子类构造函数
   */
  function startDraw(DrawClass: DrawClass) {
    destroyCurrent()

    const instance = new DrawClass(viewer, dispatcher)
    currentInstance.value = instance
    isDrawing.value = true
    instance.start()
  }

  /**
   * 手动结束当前绘制（保留结果）
   */
  function finishCurrent() {
    if (currentInstance.value) {
      currentInstance.value.finish()
      isDrawing.value = false
    }
  }

  /**
   * 手动销毁当前实例（清除结果）
   */
  function destroyCurrent() {
    if (currentInstance.value) {
      currentInstance.value.destroy()
      currentInstance.value = null
      isDrawing.value = false
    }
  }

  // 组件卸载时自动销毁
  onBeforeUnmount(() => {
    destroyCurrent()
  })

  return {
    currentInstance,
    isDrawing,
    startDraw,
    finishCurrent,
    destroyCurrent,
  }
}
