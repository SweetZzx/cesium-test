<template>
  <div class="snow-mask-panel">
    <div class="panel-header">
      <span class="panel-title">积雪效果</span>
      <el-button
        type="primary"
        size="small"
        :disabled="!!snowObj"
        @click="startSnow"
      >
        开始降雪
      </el-button>
    </div>

    <div class="section" v-if="snowMaskEffect">
      <div class="control-row">
        <span class="label">显示积雪</span>
        <el-switch
          v-model="showSnowMaskFlag"
          inline-prompt
          active-text="是"
          inactive-text="否"
          @change="toggleSnowMask"
        />
      </div>

      <div class="control-row">
        <span class="label">积雪颜色</span>
        <pick-colors v-model:value="snowColor" @change="changeSnowColor" />
      </div>

      <div class="control-row">
        <span class="label">积雪厚度</span>
        <el-slider
          v-model="snowLevel"
          :step="0.1"
          :min="0"
          :max="1"
          @input="changeSnowLevel"
        />
        <span class="slider-val">{{ snowLevel.toFixed(1) }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-tip">正在加载3D模型...</div>
    <div v-if="loadError" class="error-tip">3D模型加载失败，请检查数据服务</div>
  </div>
</template>

<script setup lang="ts">
import CesiumViewer from '@/Viewer/CesiumViewer'
import SnowEffect from '@/system/GlobalControl/SnowEffect'
import SnowMaskEffect from '@/system/GlobalControl/SnowMaskEffect'
import Model3dtile from '@/system/ModelRelated/Model3dtile'
import { model3dtilesTestInfo } from '@/system/LayerManager/LayerConfig'
import { Cesium3DTileset, Cartesian3, Color } from 'cesium'
import PickColors from 'vue-pick-colors'

const snowColor = ref('#ffffff')
const snowLevel = ref(1.0)
const showSnowMaskFlag = ref(false)
const loading = ref(false)
const loadError = ref(false)

let snowObj: SnowEffect | null = null
let snowMaskEffect: SnowMaskEffect | null = null
let tileSet: Cesium3DTileset | null = null
let model: Model3dtile | null = null

const startSnow = () => {
  const viewer = CesiumViewer.viewer
  if (!viewer || snowObj) return
  snowObj = new SnowEffect(viewer, { snowSize: 5, snowSpeed: 2 })
  snowObj.show()
}

const toggleSnowMask = () => {
  if (!snowMaskEffect) return
  snowMaskEffect.showSnowMask(showSnowMaskFlag.value)
}

const changeSnowColor = (val: string) => {
  if (!snowMaskEffect) return
  snowColor.value = val
  const color = Color.fromCssColorString(val)
  snowMaskEffect.setSnowColor(new Cartesian3(color.red, color.green, color.blue))
}

const changeSnowLevel = () => {
  if (!snowMaskEffect) return
  snowMaskEffect.setSnowLevel(snowLevel.value)
}

onMounted(async () => {
  const viewer = CesiumViewer.viewer
  if (!viewer) return

  loading.value = true
  try {
    tileSet = await Cesium3DTileset.fromUrl(model3dtilesTestInfo.url!)
    viewer.scene.primitives.add(tileSet)
    viewer.zoomTo(tileSet)
    model = new Model3dtile(tileSet)
    snowMaskEffect = new SnowMaskEffect(tileSet, model)
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  if (snowObj) {
    snowObj.hide()
    snowObj.destroy()
    snowObj = null
  }
  if (snowMaskEffect) {
    snowMaskEffect.destroy()
    snowMaskEffect = null
  }
  const viewer = CesiumViewer.viewer
  if (viewer && tileSet) {
    viewer.scene.primitives.remove(tileSet)
    tileSet = null
  }
})
</script>

<style lang="scss" scoped>
.snow-mask-panel {
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
      width: 65px;
      font-size: 13px;
      color: #80deea;
      flex-shrink: 0;
    }

    .el-switch {
      :deep(.el-switch__core) {
        background-color: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.2);
      }

      &.is-active :deep(.el-switch__core) {
        background-color: #00bcd4;
        border-color: #00e5ff;
      }
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

    .slider-val {
      width: 30px;
      font-size: 11px;
      color: #80deea;
      text-align: right;
      flex-shrink: 0;
    }
  }

  .loading-tip,
  .error-tip {
    text-align: center;
    padding: 12px;
    font-size: 12px;
    border-radius: 6px;
    margin-top: 12px;
  }

  .loading-tip {
    background: rgba(0, 229, 255, 0.1);
    color: #80deea;
  }

  .error-tip {
    background: rgba(255, 80, 80, 0.1);
    color: #ff6b6b;
  }
}
</style>
