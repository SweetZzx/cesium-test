<template>
  <div class="height-fog-panel">
    <div class="panel-header">
      <span class="panel-title">高度雾效果</span>
      <el-button
        type="primary"
        size="small"
        :disabled="!!heightFogObj"
        @click="startHeightFog"
      >
        开启高度雾
      </el-button>
    </div>

    <div class="section" v-if="heightFogObj">
      <div class="control-row">
        <span class="label">雾浓度</span>
        <el-slider
          v-model="fogDensity"
          :step="0.05"
          :min="0"
          :max="1"
          @input="changeDensity"
        />
        <span class="val">{{ fogDensity.toFixed(2) }}</span>
      </div>

      <div class="control-row">
        <span class="label">雾高度</span>
        <el-slider
          v-model="fogHeight"
          :step="20"
          :min="10"
          :max="2000"
          @input="changeHeight"
        />
        <span class="val">{{ fogHeight }}m</span>
      </div>

      <div class="control-row">
        <span class="label">雾颜色</span>
        <pick-colors v-model:value="fogColor" @change="changeColor" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CesiumViewer from '@/Viewer/CesiumViewer'
import HeightFogEffect from '@/system/GlobalControl/HeightFogEffect'
import { Color } from 'cesium'
import PickColors from 'vue-pick-colors'

const fogDensity = ref(0.6)
const fogHeight = ref(900)
const fogColor = ref('#ccd0d6')

let heightFogObj: HeightFogEffect | null = null

const startHeightFog = () => {
  const viewer = CesiumViewer.viewer
  if (!viewer || heightFogObj) return

  const color = Color.fromCssColorString(fogColor.value)
  heightFogObj = new HeightFogEffect(viewer, {
    globalDensity: fogDensity.value,
    fogHeight: fogHeight.value,
    fogColor: [color.red, color.green, color.blue],
  })
}

const changeDensity = () => {
  heightFogObj?.update({ globalDensity: fogDensity.value })
}

const changeHeight = () => {
  heightFogObj?.update({ fogHeight: fogHeight.value })
}

const changeColor = (val: string) => {
  if (!heightFogObj) return
  fogColor.value = val
  const color = Color.fromCssColorString(val)
  heightFogObj.update({ fogColor: [color.red, color.green, color.blue] })
}

onBeforeUnmount(() => {
  if (heightFogObj) {
    heightFogObj.destroy()
    heightFogObj = null
  }
})
</script>

<style lang="scss" scoped>
.height-fog-panel {
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
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .control-row {
    display: flex;
    align-items: center;
    gap: 10px;

    .label {
      width: 50px;
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

    .val {
      width: 48px;
      font-size: 11px;
      color: #80deea;
      text-align: right;
      flex-shrink: 0;
    }
  }
}
</style>
