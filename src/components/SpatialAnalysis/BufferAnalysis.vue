<template>
  <div class="buffer-analysis-panel">
    <div class="panel-header">
      <span class="panel-title">缓冲区分析</span>
    </div>

    <!-- 绘制类型选择 -->
    <div class="section">
      <div class="section-label">绘制类型</div>
      <div class="draw-type-btns">
        <el-button
          v-for="item in geometryTypes"
          :key="item.value"
          :type="activeType === item.value ? 'primary' : 'default'"
          size="small"
          @click="activeType = item.value"
        >
          {{ item.label }}
        </el-button>
      </div>
    </div>

    <!-- 缓冲参数 -->
    <div class="section">
      <div class="section-label">缓冲参数</div>
      <div class="control-row">
        <span class="label">缓冲半径</span>
        <el-slider
          v-model="bufferRadius"
          :min="1"
          :max="maxRadius"
          :step="1"
          class="buffer-slider"
        />
        <el-input-number
          v-model="bufferRadius"
          :min="1"
          :max="maxRadius"
          size="small"
          class="radius-input"
          controls-position="right"
        />
      </div>
      <div class="control-row">
        <span class="label">单位</span>
        <el-select v-model="bufferUnit" size="small" class="unit-select">
          <el-option label="米" value="meters" />
          <el-option label="千米" value="kilometers" />
        </el-select>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-btns">
      <el-button
        type="primary"
        :disabled="isDrawing"
        @click="startDrawGeometry"
      >
        {{ drawButtonText }}
      </el-button>
      <el-button
        type="success"
        :disabled="!canCreateBuffer"
        @click="createBuffer"
      >
        生成缓冲区
      </el-button>
      <el-button type="danger" @click="clearAll">
        清空
      </el-button>
    </div>

    <!-- 状态信息 -->
    <div class="status-info" v-if="statusText">
      <span>{{ statusText }}</span>
    </div>

    <!-- 分析结果 -->
    <div class="result-section" v-if="bufferResult">
      <div class="section-label">分析结果</div>
      <div class="result-item">
        <span class="result-label">缓冲面积：</span>
        <span class="result-value">{{ BufferUtil.formatArea(bufferResult.area) }}</span>
      </div>
      <div class="result-item">
        <span class="result-label">缓冲周长：</span>
        <span class="result-value">{{ BufferUtil.formatPerimeter(bufferResult.perimeter) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Cartesian3, Color, Entity } from 'cesium'
import CommonPoint from '@/system/Draw/Points/CommonPoint'
import CommonLine from '@/system/Draw/Lines/CommonLine'
import CommonPolygon from '@/system/Draw/Polygons/CommonPolygon'
import BufferUtil, { type BufferGeometryType, type BufferResult } from '@/system/Utils/AnalysisUtils/BufferUtil'
import { useCesium } from '@/composables/core/useCesium'
import { useDispatcherEvents } from '@/composables/core/useDispatcherEvents'
import { useDrawInstance } from '@/composables/draw/useDrawInstance'
import type { Units } from '@turf/turf'

const { viewer, dispatcher } = useCesium()
const { on: onEvent } = useDispatcherEvents(dispatcher)
const { startDraw, destroyCurrent, isDrawing } = useDrawInstance(viewer, dispatcher)

const geometryTypes: { label: string; value: BufferGeometryType }[] = [
  { label: '点', value: 'point' },
  { label: '线', value: 'line' },
  { label: '面', value: 'polygon' },
]

const activeType = ref<BufferGeometryType>('point')
const bufferRadius = ref(100)
const bufferUnit = ref<Units>('meters')
const statusText = ref('')

const maxRadius = computed(() => bufferUnit.value === 'kilometers' ? 50 : 5000)

const drawButtonText = computed(() => {
  if (isDrawing.value) return '绘制中...'
  return '开始绘制'
})

// 绘制状态
const drawnPositions = ref<Cartesian3[]>([])
const hasDrawnPositions = computed(() => drawnPositions.value.length > 0)
const canCreateBuffer = computed(() => {
  if (!hasDrawnPositions.value) return false
  if (activeType.value === 'point') return drawnPositions.value.length >= 1
  if (activeType.value === 'line') return drawnPositions.value.length >= 2
  if (activeType.value === 'polygon') return drawnPositions.value.length >= 3
  return false
})

// 实体管理
const sourceEntities: Entity[] = []
const bufferEntities: Entity[] = []
const bufferResult = ref<BufferResult | null>(null)

// 监听绘制事件
onEvent('DRAWEND', (payload: any) => {
  statusText.value = '绘制完成，可点击"生成缓冲区"进行分析'
  if (payload.points && payload.points.length > 0) {
    drawnPositions.value = payload.points
    // 渲染原始图形
    const sourceEntity = BufferUtil.renderSource(viewer, payload.points, activeType.value)
    if (sourceEntity) sourceEntities.push(sourceEntity)
  }
})
onEvent('DRAWSTART', () => {
  statusText.value = '在地图上绘制图形，右键结束'
})
onEvent('MOUSEMOVE', (payload: any) => {
  statusText.value = payload.text ?? '移动鼠标...'
})

function startDrawGeometry() {
  clearBufferOnly()
  drawnPositions.value = []
  statusText.value = ''

  switch (activeType.value) {
    case 'point':
      startDraw(CommonPoint)
      break
    case 'line':
      startDraw(CommonLine)
      break
    case 'polygon':
      startDraw(CommonPolygon)
      break
  }
}

function createBuffer() {
  if (!canCreateBuffer.value) return

  clearBufferOnly()

  const result = BufferUtil.createBuffer(
    drawnPositions.value,
    activeType.value,
    {
      radius: bufferRadius.value,
      units: bufferUnit.value,
    }
  )

  if (!result) {
    statusText.value = '缓冲区计算失败'
    return
  }

  bufferResult.value = result
  statusText.value = '缓冲区分析完成'

  const entity = BufferUtil.renderBuffer(
    viewer,
    result.positions,
    Color.fromCssColorString('rgba(0, 200, 255, 0.25)'),
    Color.fromCssColorString('rgba(0, 200, 255, 0.8)')
  )
  bufferEntities.push(entity)
}

function clearBufferOnly() {
  bufferEntities.forEach(e => viewer.entities.remove(e))
  bufferEntities.length = 0
  bufferResult.value = null
}

function clearAll() {
  destroyCurrent()
  sourceEntities.forEach(e => viewer.entities.remove(e))
  sourceEntities.length = 0
  clearBufferOnly()
  drawnPositions.value = []
  statusText.value = ''
}

onBeforeUnmount(() => {
  clearAll()
})
</script>

<style lang="scss" scoped>
.buffer-analysis-panel {
  padding: 16px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .panel-title {
      font-size: 16px;
      font-weight: 600;
      color: #00e5ff;
    }
  }

  .section {
    margin-bottom: 16px;
  }

  .section-label {
    font-size: 13px;
    color: #80deea;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .draw-type-btns {
    display: flex;
    gap: 8px;
  }

  .control-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;

    .label {
      width: 60px;
      font-size: 13px;
      color: #80deea;
      flex-shrink: 0;
    }

    .buffer-slider {
      flex: 1;

      :deep(.el-slider__runway) {
        background: rgba(255, 255, 255, 0.1);
      }

      :deep(.el-slider__bar) {
        background: linear-gradient(90deg, #00e5ff, #00bcd4);
      }

      :deep(.el-slider__button) {
        border-color: #00e5ff;
        background: #00e5ff;
      }
    }

    .radius-input {
      width: 100px;

      :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.3) inset;
      }

      :deep(.el-input__inner) {
        color: #e0e0e0;
      }
    }

    .unit-select {
      flex: 1;

      :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.3) inset;
      }

      :deep(.el-input__inner) {
        color: #e0e0e0;
      }
    }
  }

  .action-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .status-info {
    margin-top: 12px;
    padding: 8px 12px;
    background: rgba(0, 229, 255, 0.08);
    border-radius: 4px;
    font-size: 12px;
    color: #80deea;
    border-left: 3px solid #00e5ff;
  }

  .result-section {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .result-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;

      .result-label {
        color: #aaa;
      }

      .result-value {
        color: #00e5ff;
        font-weight: 500;
      }
    }
  }
}
</style>
