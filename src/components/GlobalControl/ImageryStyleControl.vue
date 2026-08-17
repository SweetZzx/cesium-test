<template>
  <div class="imagery-style-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <span class="panel-title">底图风格调整</span>
    </div>

    <!-- 滑块控制 -->
    <div class="section">
      <div class="slider-row" v-for="item in sliderList" :key="item.key">
        <span class="slider-label">{{ item.label }}</span>
        <el-slider
          v-model="styles[item.key]"
          :min="0"
          :max="3"
          :step="0.01"
          size="small"
          @input="updateStyle"
        />
        <span class="slider-value">{{ styles[item.key].toFixed(2) }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <el-button size="small" @click="resetStyle">
        重置默认
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import CesiumViewer from '@/Viewer/CesiumViewer'
import type { ImageryLayer } from 'cesium'

const defaultStyles = {
  brightness: 1.0,
  contrast: 1.0,
  hue: 0.0,
  saturation: 1.0,
  gamma: 1.0,
}

const sliderList = [
  { key: 'brightness' as const, label: '亮度' },
  { key: 'contrast' as const, label: '对比度' },
  { key: 'hue' as const, label: '色调' },
  { key: 'saturation' as const, label: '饱和度' },
  { key: 'gamma' as const, label: '伽马' },
]

const styles = reactive({ ...defaultStyles })

let baseLayer: ImageryLayer | null = null

const getBaseLayer = (): ImageryLayer | null => {
  const viewer = CesiumViewer.viewer
  if (!viewer) return null
  const layers = viewer.imageryLayers
  return layers.length > 0 ? layers.get(0) : null
}

const updateStyle = () => {
  const layer = baseLayer || getBaseLayer()
  if (!layer) return
  baseLayer = layer

  layer.brightness = styles.brightness
  layer.contrast = styles.contrast
  layer.hue = styles.hue
  layer.saturation = styles.saturation
  layer.gamma = styles.gamma
}

const resetStyle = () => {
  Object.assign(styles, { ...defaultStyles })
  updateStyle()
}

onMounted(() => {
  baseLayer = getBaseLayer()
})
</script>

<style lang="scss" scoped>
.imagery-style-panel {
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
    margin-bottom: 16px;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;

    .slider-label {
      width: 56px;
      font-size: 13px;
      color: #80deea;
      flex-shrink: 0;
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
      flex-shrink: 0;
    }
  }

  .action-bar {
    display: flex;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .el-button {
      flex: 1;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #b0bec5;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(0, 229, 255, 0.5);
        color: #00e5ff;
      }
    }
  }
}
</style>
