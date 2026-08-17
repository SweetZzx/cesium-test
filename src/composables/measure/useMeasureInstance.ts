import { shallowRef, ref, onBeforeUnmount } from 'vue'
import type { BaseMeasure } from '@/system/Measure/BaseMeasure'
import type { Viewer } from 'cesium'
import type EventDispatcher from '@/system/EventDispatcher/EventDispatcher'

type MeasureClass = new (viewer: Viewer, dispatcher: EventDispatcher) => BaseMeasure

/**
 * 量测实例生命周期管理 composable
 *
 * 管理量测工具（距离量测、面积量测）的创建、切换和销毁。
 * 自动在组件卸载时销毁当前实例。
 *
 * @param viewer Cesium Viewer 实例
 * @param dispatcher 事件调度器实例
 */
export function useMeasureInstance(viewer: Viewer, dispatcher: EventDispatcher) {
  const currentInstance = shallowRef<BaseMeasure | null>(null)
  const isActive = ref(false)

  /**
   * 创建并启动一个量测实例
   * 自动销毁旧实例后再创建新实例
   * @param MeasureClass BaseMeasure 的子类构造函数
   */
  function startMeasure(MeasureClass: MeasureClass) {
    destroyCurrent()

    const instance = new MeasureClass(viewer, dispatcher)
    currentInstance.value = instance
    isActive.value = true
    instance.start()
  }

  /**
   * 销毁当前量测实例
   */
  function destroyCurrent() {
    if (currentInstance.value) {
      currentInstance.value.destroy()
      currentInstance.value = null
      isActive.value = false
    }
  }

  /**
   * 清除当前量测实例的实体（不销毁实例本身）
   */
  function clearEntities() {
    if (currentInstance.value) {
      currentInstance.value.clearEntities()
    }
  }

  // 组件卸载时自动销毁
  onBeforeUnmount(() => {
    destroyCurrent()
  })

  return {
    currentInstance,
    isActive,
    startMeasure,
    destroyCurrent,
    clearEntities,
  }
}
