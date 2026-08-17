<template>
  <div class="mvt-style-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <span class="panel-title">MVT 样式设置</span>
      <el-tag size="small" type="info">矢量瓦片</el-tag>
    </div>

    <!-- 图层选择 -->
    <div class="section">
      <div class="section-label">
        <el-icon><FolderOpened /></el-icon>
        <span>目标图层</span>
        <el-button size="small" text @click="refreshLayers">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <el-select v-model="selectedLayerId" placeholder="选择图层" size="default" @change="onLayerChange">
        <el-option v-for="layerId in availableLayers" :key="layerId" :label="getLayerName(layerId)"
          :value="layerId" />
      </el-select>
      <div v-if="availableLayers.length === 0" class="empty-tip">
        <el-icon><Warning /></el-icon>
        <span>暂无MVT图层，请先添加</span>
        <el-button size="small" type="primary" @click="jumpToAddLayer">去添加</el-button>
      </div>
    </div>

    <!-- 预设样式 -->
    <div class="section">
      <div class="section-label">
        <el-icon><MagicStick /></el-icon>
        <span>快速预设</span>
      </div>
      <div class="preset-grid">
        <div v-for="preset in presetList" :key="preset.key" class="preset-item"
          :class="{ active: currentPreset === preset.key }" @click="applyPreset(preset.key)">
          <div class="preset-preview" :style="{ background: preset.preview }"></div>
          <span class="preset-name">{{ preset.label }}</span>
        </div>
      </div>
    </div>

    <!-- 填充样式 -->
    <div class="section">
      <div class="section-label">
        <el-icon><Brush /></el-icon>
        <span>面填充</span>
      </div>
      <div class="color-row">
        <span class="color-label">颜色</span>
        <div class="color-picker-wrapper">
          <div class="color-preview" :style="{ background: fillColor }"></div>
          <el-input v-model="fillColor" size="small" @change="updateStyle" />
        </div>
      </div>
      <div class="slider-row">
        <span class="slider-label">透明度</span>
        <el-slider v-model="fillOpacity" :min="0" :max="100" size="small" @change="updateStyle" />
        <span class="slider-value">{{ fillOpacity }}%</span>
      </div>
    </div>

    <!-- 边框样式 -->
    <div class="section">
      <div class="section-label">
        <el-icon><Edit /></el-icon>
        <span>边框线</span>
      </div>
      <div class="color-row">
        <span class="color-label">颜色</span>
        <div class="color-picker-wrapper">
          <div class="color-preview" :style="{ background: strokeColor }"></div>
          <el-input v-model="strokeColor" size="small" @change="updateStyle" />
        </div>
      </div>
      <div class="slider-row">
        <span class="slider-label">线宽</span>
        <el-slider v-model="lineWidth" :min="0.5" :max="10" :step="0.5" size="small" @change="updateStyle" />
        <span class="slider-value">{{ lineWidth }}px</span>
      </div>
    </div>

    <!-- 点样式 -->
    <div class="section">
      <div class="section-label">
        <el-icon><Aim /></el-icon>
        <span>点要素</span>
      </div>
      <div class="color-row">
        <span class="color-label">颜色</span>
        <div class="color-picker-wrapper">
          <div class="color-preview" :style="{ background: pointColor }"></div>
          <el-input v-model="pointColor" size="small" @change="updateStyle" />
        </div>
      </div>
      <div class="slider-row">
        <span class="slider-label">半径</span>
        <el-slider v-model="pointRadius" :min="2" :max="20" :step="1" size="small" @change="updateStyle" />
        <span class="slider-value">{{ pointRadius }}px</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <el-button type="primary" size="small" @click="applyToAll">
        <el-icon><CopyDocument /></el-icon>
        应用全部
      </el-button>
      <el-button size="small" @click="resetStyle">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FolderOpened, Warning, MagicStick, Brush, Edit, Aim, CopyDocument, Refresh } from '@element-plus/icons-vue'
import CesiumViewer from '@/Viewer/CesiumViewer'
import { LayerIdFlag } from '@/system/LayerManager/LayerConfig'
import LayerManager from '@/system/LayerManager/LayerManager'

let layerManager: LayerManager | null = null

// 初始化 LayerManager
const initLayerManager = () => {
  if (!CesiumViewer.initialized || !CesiumViewer.viewer) {
    console.warn('[MVTStyleControl] CesiumViewer 未初始化')
    return
  }
  if (!layerManager) {
    layerManager = LayerManager.getInstance(CesiumViewer.viewer)
    console.log('[MVTStyleControl] LayerManager 初始化完成')
    console.log('[MVTStyleControl] MVT图层列表:', layerManager.getAllMVTLayerIds())
    // 初始化后自动选中第一个图层
    const layers = layerManager.getAllMVTLayerIds()
    if (layers.length > 0) {
      selectedLayerId.value = layers[0]
      syncStyleToUI()
    }
  }
}

// 监听 CesiumViewer 初始化
watch(() => CesiumViewer.initialized, (isInit) => {
  if (isInit) {
    initLayerManager()
  }
}, { immediate: true })

onMounted(() => {
  // 如果 viewer 已经初始化，立即初始化 LayerManager
  if (CesiumViewer.initialized) {
    initLayerManager()
  }
})
const presetList = [
  {
    key: 'default',
    label: '默认',
    preview: 'linear-gradient(135deg, rgba(0, 150, 255, 0.3), rgba(0, 100, 255, 0.8))',
    style: {
      fillColor: 'rgba(0, 150, 255, 0.3)',
      strokeColor: 'rgba(0, 100, 255, 0.8)',
      lineWidth: 2,
      pointColor: 'rgba(255, 80, 80, 0.9)',
      pointRadius: 4,
      fillOpacity: 30,
    }
  },
  {
    key: 'tech-blue',
    label: '科技蓝',
    preview: 'linear-gradient(135deg, rgba(0, 150, 255, 0.5), rgba(0, 100, 200, 1))',
    style: {
      fillColor: 'rgba(0, 150, 255, 0.5)',
      strokeColor: 'rgba(0, 100, 200, 1)',
      lineWidth: 2,
      pointColor: 'rgba(100, 200, 255, 1)',
      pointRadius: 5,
      fillOpacity: 50,
    }
  },
  {
    key: 'military-green',
    label: '军事绿',
    preview: 'linear-gradient(135deg, rgba(0, 100, 50, 0.5), rgba(0, 80, 40, 1))',
    style: {
      fillColor: 'rgba(0, 100, 50, 0.5)',
      strokeColor: 'rgba(0, 80, 40, 1)',
      lineWidth: 2,
      pointColor: 'rgba(100, 200, 100, 1)',
      pointRadius: 4,
      fillOpacity: 50,
    }
  },
  {
    key: 'emergency-red',
    label: '应急红',
    preview: 'linear-gradient(135deg, rgba(255, 50, 50, 0.4), rgba(200, 0, 0, 1))',
    style: {
      fillColor: 'rgba(255, 50, 50, 0.4)',
      strokeColor: 'rgba(200, 0, 0, 1)',
      lineWidth: 3,
      pointColor: 'rgba(255, 100, 100, 1)',
      pointRadius: 6,
      fillOpacity: 40,
    }
  },
  {
    key: 'night-mode',
    label: '夜间',
    preview: 'linear-gradient(135deg, rgba(20, 20, 40, 0.6), rgba(100, 100, 150, 1))',
    style: {
      fillColor: 'rgba(20, 20, 40, 0.6)',
      strokeColor: 'rgba(100, 100, 150, 1)',
      lineWidth: 1,
      pointColor: 'rgba(150, 150, 200, 1)',
      pointRadius: 3,
      fillOpacity: 60,
    }
  },
  {
    key: 'sunset',
    label: '日落',
    preview: 'linear-gradient(135deg, rgba(255, 150, 50, 0.4), rgba(255, 100, 50, 1))',
    style: {
      fillColor: 'rgba(255, 150, 50, 0.4)',
      strokeColor: 'rgba(255, 100, 50, 1)',
      lineWidth: 2,
      pointColor: 'rgba(255, 200, 100, 1)',
      pointRadius: 5,
      fillOpacity: 40,
    }
  },
]

// 状态
const selectedLayerId = ref<string>('')
const currentPreset = ref<string>('')
const fillColor = ref('#0096FF')
const fillOpacity = ref(30)
const strokeColor = ref('#0064FF')
const lineWidth = ref(2)
const pointColor = ref('#FF5050')
const pointRadius = ref(4)

// 获取可用图层
const availableLayers = computed(() => {
  return layerManager?.getAllMVTLayerIds() || []
})

// 获取图层名称
const getLayerName = (layerId: string): string => {
  const nameMap: Record<string, string> = {
    [LayerIdFlag.MVT_TEST]: 'MVT 测试图层'
  }
  return nameMap[layerId] || layerId
}

// 同步样式到UI
const syncStyleToUI = () => {
  if (!layerManager || !selectedLayerId.value) return

  const style = layerManager.getMVTStyle(selectedLayerId.value)
  if (style) {
    fillColor.value = rgbaToHex(style.fillColor)
    fillOpacity.value = extractOpacity(style.fillColor)
    strokeColor.value = rgbaToHex(style.strokeColor)
    lineWidth.value = style.lineWidth
    pointColor.value = rgbaToHex(style.pointColor || style.fillColor)
    pointRadius.value = style.pointRadius || 4
  }
}

// 从rgba字符串提取透明度
const extractOpacity = (rgba: string): number => {
  const match = rgba.match(/rgba?\(.*?,\s*([\d.]+)\s*\)/)
  return match ? Math.round(parseFloat(match[1]) * 100) : 30
}

// rgba转hex
const rgbaToHex = (color: string): string => {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0')
    const g = parseInt(match[2]).toString(16).padStart(2, '0')
    const b = parseInt(match[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  return '#0096FF'
}

// 更新图层样式
const updateStyle = () => {
  if (!layerManager || !selectedLayerId.value) return

  const finalFillColor = hexToRgba(fillColor.value, fillOpacity.value / 100)
  const finalStrokeColor = hexToRgba(strokeColor.value, 1)
  const finalPointColor = hexToRgba(pointColor.value, 1)

  layerManager.updateMVTStyle(selectedLayerId.value, {
    fillColor: finalFillColor,
    strokeColor: finalStrokeColor,
    lineWidth: lineWidth.value,
    pointColor: finalPointColor,
    pointRadius: pointRadius.value,
  })

  // 清除预设选中
  currentPreset.value = ''
}

// hex转rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// 应用预设
const applyPreset = (presetKey: string) => {
  if (!layerManager || !selectedLayerId.value) return

  const preset = presetList.find(p => p.key === presetKey)
  if (!preset) return

  const { style } = preset
  layerManager.updateMVTStyle(selectedLayerId.value, {
    fillColor: style.fillColor,
    strokeColor: style.strokeColor,
    lineWidth: style.lineWidth,
    pointColor: style.pointColor,
    pointRadius: style.pointRadius,
  })

  // 同步UI
  fillColor.value = rgbaToHex(style.fillColor)
  fillOpacity.value = style.fillOpacity
  strokeColor.value = rgbaToHex(style.strokeColor)
  lineWidth.value = style.lineWidth
  pointColor.value = rgbaToHex(style.pointColor)
  pointRadius.value = style.pointRadius
  currentPreset.value = presetKey
}

// 应用到所有
const applyToAll = () => {
  if (!layerManager || !selectedLayerId.value) return

  const style = {
    fillColor: hexToRgba(fillColor.value, fillOpacity.value / 100),
    strokeColor: hexToRgba(strokeColor.value, 1),
    lineWidth: lineWidth.value,
    pointColor: hexToRgba(pointColor.value, 1),
    pointRadius: pointRadius.value,
  }

  layerManager.updateMVTStyle(selectedLayerId.value, style)
  layerManager.updateAllMVTStyle(style)
}

// 重置
const resetStyle = () => {
  applyPreset('default')
}

// 图层变化
const onLayerChange = () => {
  syncStyleToUI()
}

// 刷新图层列表
const refreshLayers = () => {
  if (!layerManager) {
    initLayerManager()
  }
  if (layerManager) {
    const layers = layerManager.getAllMVTLayerIds()
    console.log('[MVTStyleControl] 刷新后图层列表:', layers)
    if (layers.length > 0 && !layers.includes(selectedLayerId.value)) {
      selectedLayerId.value = layers[0]
      syncStyleToUI()
    }
  }
}

// 跳转到添加图层
const jumpToAddLayer = () => {
  // 触发事件让父组件切换到自定义数据面板
  // 或者直接通过 emit 通知
}
</script>

<style lang="scss" scoped>
.mvt-style-panel {
  padding: 16px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .panel-title {
      font-size: 16px;
      font-weight: 600;
      color: #00e5ff;
    }
  }

  .section {
    margin-bottom: 20px;

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
      font-size: 13px;
      color: #80deea;
      font-weight: 500;

      .el-icon {
        font-size: 14px;
      }

      .el-button {
        margin-left: auto;
        padding: 4px;
        color: #80deea;

        &:hover {
          color: #00e5ff;
        }
      }
    }

    .empty-tip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      color: #999;
      font-size: 12px;
      flex-wrap: wrap;

      .el-icon {
        color: #ffc107;
      }

      .el-button {
        margin-left: auto;
      }
    }

    .el-select {
      width: 100%;

      :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.08);
        box-shadow: none;
        border: 1px solid rgba(255, 255, 255, 0.1);

        &:hover {
          border-color: rgba(0, 229, 255, 0.5);
        }

        &.is-focus {
          border-color: #00e5ff;
        }
      }

      :deep(.el-input__inner) {
        color: #e0e0e0;
      }

      :deep(.el-select__caret) {
        color: #80deea;
      }
    }
  }

  // 预设样式网格
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;

    .preset-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(0, 229, 255, 0.5);
        transform: translateY(-2px);
      }

      &.active {
        background: rgba(0, 229, 255, 0.15);
        border-color: #00e5ff;
        box-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
      }

      .preset-preview {
        width: 100%;
        height: 24px;
        border-radius: 4px;
        margin-bottom: 6px;
      }

      .preset-name {
        font-size: 11px;
        color: #b0bec5;
      }
    }
  }

  // 颜色选择行
  .color-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .color-label {
      width: 50px;
      font-size: 12px;
      color: #90a4ae;
    }

    .color-picker-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;

      .color-preview {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        flex-shrink: 0;
      }

      .el-input {
        flex: 1;

        :deep(.el-input__wrapper) {
          background: rgba(255, 255, 255, 0.08);
          box-shadow: none;
          border: 1px solid rgba(255, 255, 255, 0.1);

          &:hover {
            border-color: rgba(0, 229, 255, 0.5);
          }

          &.is-focus {
            border-color: #00e5ff;
          }
        }

        :deep(.el-input__inner) {
          color: #e0e0e0;
          font-size: 12px;
        }
      }
    }
  }

  // 滑块行
  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;

    .slider-label {
      width: 50px;
      font-size: 12px;
      color: #90a4ae;
    }

    .el-slider {
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

    .slider-value {
      width: 40px;
      font-size: 11px;
      color: #80deea;
      text-align: right;
    }
  }

  // 操作按钮栏
  .action-bar {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .el-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;

      &.el-button--primary {
        background: linear-gradient(135deg, #00e5ff, #00bcd4);
        border: none;
        color: #1a1a2e;
        font-weight: 500;

        &:hover {
          background: linear-gradient(135deg, #26c6da, #00acc1);
        }
      }

      &:not(.el-button--primary) {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #b0bec5;

        &:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(0, 229, 255, 0.5);
          color: #00e5ff;
        }
      }

      .el-icon {
        font-size: 14px;
      }
    }
  }
}
</style>
