<template>
  <div class="migration-container">
    <div class="title-section">
      <span class="migration-title">迁徙图控制</span>
      <el-button type="primary" size="small" @click="createMigration">生成</el-button>
      <el-button type="danger" size="small" @click="clearMigration">清除</el-button>
    </div>

    <div class="migration-content">
      <div class="slider-block">
        <span class="demonstration">颜色</span>
        <pick-colors v-model:value="color" @change="changeColor" />
      </div>
      <div class="slider-block">
        <span class="demonstration">尾迹长度</span>
        <el-slider
          v-model="percentage"
          :step="0.05"
          :min="0.1"
          :max="0.9"
          @input="changePercentage"
        />
      </div>
      <div class="slider-block">
        <span class="demonstration">速度</span>
        <el-slider
          v-model="speed"
          :step="0.001"
          :min="0.001"
          :max="0.02"
          @input="changeSpeed"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CesiumViewer from '@/Viewer/CesiumViewer'
import MigrationLine from '@/system/VectorEffect/MigrationLine'
import { Cartesian3, Color } from 'cesium'
import PickColors from 'vue-pick-colors'

const viewer = CesiumViewer.viewer!

const migrationLine = new MigrationLine(viewer)

const color = ref('#00e8ff')
const percentage = ref(0.4)
const speed = ref(0.005)

const sampleCities = {
  start: { name: '西安', position: Cartesian3.fromDegrees(108.95, 34.27) },
  destinations: [
    { name: '延安', position: Cartesian3.fromDegrees(109.49, 36.60) },
    { name: '汉中', position: Cartesian3.fromDegrees(107.28, 33.07) },
    { name: '安康', position: Cartesian3.fromDegrees(109.03, 32.68) },
    { name: '洛阳', position: Cartesian3.fromDegrees(112.45, 34.62) },
    { name: '郑州', position: Cartesian3.fromDegrees(113.65, 34.76) },
    { name: '兰州', position: Cartesian3.fromDegrees(103.83, 36.06) },
    { name: '太原', position: Cartesian3.fromDegrees(112.55, 37.87) },
    { name: '银川', position: Cartesian3.fromDegrees(106.27, 38.47) },
    { name: '成都', position: Cartesian3.fromDegrees(104.06, 30.67) },
    { name: '重庆', position: Cartesian3.fromDegrees(106.54, 29.59) },
    { name: '武汉', position: Cartesian3.fromDegrees(114.31, 30.52) },
    { name: '南京', position: Cartesian3.fromDegrees(118.78, 32.04) },
  ],
}

const changeColor = () => {
  migrationLine.setColor(Color.fromCssColorString(color.value))
}

const changePercentage = () => {
  migrationLine.setPercentage(percentage.value)
}

const changeSpeed = () => {
  migrationLine.setSpeed(speed.value)
}

const createMigration = () => {
  migrationLine.show(sampleCities.start, sampleCities.destinations)
  changeColor()
  changePercentage()
  changeSpeed()
}

const clearMigration = () => {
  migrationLine.destroy()
}

onBeforeUnmount(() => {
  migrationLine.destroy()
})
</script>

<style lang="scss" scoped>
.migration-container {
  overflow: auto;
  padding: 10px;

  .title-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    margin-top: 10px;

    .migration-title {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .migration-content {
    font-size: 12px;

    .slider-block {
      display: flex;
      align-items: center;

      span {
        width: 80px;
      }

      .el-slider {
        margin-left: 10px;
      }
    }
  }
}
</style>
