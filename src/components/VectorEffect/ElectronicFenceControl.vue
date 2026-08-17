<template>
  <div class="electronic-fence-container">
    <div class="title-section">
      <span class="fence-title">电子围栏控制</span>
      <el-button type="primary" size="small" @click="createFence">生成</el-button>
      <el-button type="danger" size="small" @click="clearFence">清除</el-button>
    </div>

    <div class="fence-content">
      <div class="slider-block">
        <span class="demonstration">颜色</span>
        <pick-colors v-model:value="color" @change="changeColor" />
      </div>
      <div class="slider-block">
        <span class="demonstration">墙体高度</span>
        <el-slider
          v-model="wallHeight"
          :step="100"
          :min="1000"
          :max="20000"
          @input="changeHeight"
        />
      </div>
      <div class="slider-block">
        <span class="demonstration">动画周期(ms)</span>
        <el-slider
          v-model="duration"
          :step="100"
          :min="500"
          :max="8000"
          @input="changeDuration"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CesiumViewer from '@/Viewer/CesiumViewer'
import DynamicWallMaterialProperty from '@/system/VectorEffect/DynamicWallMaterialProperty'
import { Cartesian3, Color, Entity } from 'cesium'
import PickColors from 'vue-pick-colors'

const viewer = CesiumViewer.viewer!

let wallEntity: Entity | null = null
let materialProperty: DynamicWallMaterialProperty | null = null

const color = ref('#00e8ff')
const wallHeight = ref(5000)
const duration = ref(3000)

const samplePositions = Cartesian3.fromDegreesArray([
  108.80, 34.15,
  109.10, 34.15,
  109.10, 34.50,
  108.80, 34.50,
  108.80, 34.15,
])

const changeColor = () => {
  materialProperty?.setColor(Color.fromCssColorString(color.value).withAlpha(0.7))
}

const changeHeight = () => {
  if (wallEntity?.wall) {
    wallEntity.wall.maximumHeights = new Array(samplePositions.length).fill(wallHeight.value) as any
  }
}

const changeDuration = () => {
  if (materialProperty) {
    materialProperty.duration = duration.value
  }
}

const createFence = () => {
  clearFence()

  materialProperty = new DynamicWallMaterialProperty({
    viewer,
    color: Color.fromCssColorString(color.value).withAlpha(0.7),
    duration: duration.value,
  })

  wallEntity = viewer.entities.add({
    name: '电子围栏',
    wall: {
      positions: samplePositions,
      maximumHeights: new Array(samplePositions.length).fill(wallHeight.value),
      minimumHeights: new Array(samplePositions.length).fill(0),
      material: materialProperty,
    },
  })

  viewer.zoomTo(wallEntity)
}

const clearFence = () => {
  if (wallEntity) {
    viewer.entities.remove(wallEntity)
    wallEntity = null
    materialProperty = null
  }
}

onBeforeUnmount(() => {
  clearFence()
})
</script>

<style lang="scss" scoped>
.electronic-fence-container {
  overflow: auto;
  padding: 10px;

  .title-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    margin-top: 10px;

    .fence-title {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .fence-content {
    font-size: 12px;

    .slider-block {
      display: flex;
      align-items: center;

      span {
        width: 100px;
      }

      .el-slider {
        margin-left: 10px;
      }
    }
  }
}
</style>
