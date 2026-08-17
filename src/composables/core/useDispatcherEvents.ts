import { onBeforeUnmount } from 'vue'
import type EventDispatcher from '@/system/EventDispatcher/EventDispatcher'
import type { DrawEventType } from '@/system/Common/enums'

type EventCleanup = () => void

/**
 * 自动管理 EventDispatcher 事件监听的 composable
 *
 * 在组件卸载时自动清理所有通过此 composable 注册的事件监听器，
 * 彻底解决事件泄漏问题。
 *
 * @param dispatcher 事件调度器实例（通常使用 sharedDispatcher）
 * @returns on / cleanupAll 方法
 */
export function useDispatcherEvents(dispatcher: EventDispatcher) {
  const cleanups: EventCleanup[] = []

  /**
   * 注册事件监听，组件卸载时自动清理
   * @returns 手动取消函数（用于需要提前取消的场景）
   */
  function on(event: DrawEventType, listener: EventListener): EventCleanup {
    dispatcher.on(event, listener)
    const cleanup = () => {
      dispatcher.off(event, listener)
    }
    cleanups.push(cleanup)
    return cleanup
  }

  /**
   * 手动清理所有已注册的事件监听
   */
  function cleanupAll() {
    cleanups.forEach(fn => fn())
    cleanups.length = 0
  }

  // 组件卸载时自动清理所有事件监听
  onBeforeUnmount(() => {
    cleanupAll()
  })

  return { on, cleanupAll }
}
