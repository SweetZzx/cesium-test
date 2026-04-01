<template>
  <div class="atmosphere-container">
    <div class="title-section">

      <span class="atmosphere-title"> 大气环境控制 </span>
      <el-button type="primary" size="small" @click="resetAtmosphere">恢复默认值</el-button>
    </div>

    <div class="atmosphere-content">
      <div class="slider-block">
        <span class="demonstration">光照强度</span>
        <el-slider v-model="lightIntensity" :step="1" :min="2" :max="100" @input="changeLightIntensity" />
      </div>
      <div class="slider-block">
        <span class="demonstration">色相</span>
        <el-slider v-model="hue" :step="0.01" :min="-1" :max="1" @input="changeHue" />
      </div>
      <div class="slider-block">
        <span class="demonstration">饱和度</span>
        <el-slider v-model="saturation" :step="0.01" :min="-1" :max="1" @input="changeSaturation" />
      </div>
      <div class="slider-block">
        <span class="demonstration">亮度</span>
        <el-slider v-model="brightness" :step="0.01" :min="-1" :max="1" @input="changeBrightness" />
      </div>
      <div class="slider-block">
        <span class="demonstration">瑞利散射系数（红）</span>
        <el-slider v-model="rayleighScatteringRed" :step="1" :min="0" :max="100" @input="changeRayleighScatteringRed" />
      </div>
      <div class="slider-block">
        <span class="demonstration">瑞利散射系数（绿）</span>
        <el-slider v-model="rayleighScatteringGreen" :step="1" :min="0" :max="100"
          @input="changeRayleighScatteringGreen" />
      </div>
      <div class="slider-block">
        <span class="demonstration">瑞利散射系数（蓝）</span>
        <el-slider v-model="rayleighScatteringBlue" :step="1" :min="0" :max="100"
          @input="changeRayleighScatteringBlue" />
      </div>
      <div class="slider-block">
        <span class="demonstration">瑞利散射高度</span>
        <el-slider v-model="rayleighScatteringHeight" :step="100" :min="10" :max="20000"
          @input="changeRayleighScatteringHeight" />
      </div>
      <div class="slider-block">
        <span class="demonstration">米氏散射系数</span>
        <el-slider v-model="mieScattering" :step="1" :min="0" :max="100" @input="changeMieScattering" />
      </div>
      <div class="slider-block">
        <span class="demonstration">米氏散射高度</span>
        <el-slider v-model="mieScatteringHeight" :step="100" :min="10" :max="10000"
          @input="changeMieScatteringHeight" />
      </div>
      <div class="slider-block">
        <span class="demonstration">米氏散射各向异性</span>
        <el-slider v-model="mieScatteringAnisotropy" :step="0.1" :min="-1" :max="1"
          @input="changeMieScatteringAnisotropy" />
      </div>


    </div>
  </div>

</template>
<script setup lang="ts">
import CesiumViewer from '@/Viewer/CesiumViewer'
import { Cartesian3 } from 'cesium'


const viewer = CesiumViewer.viewer

const globe = viewer!.scene.globe


const lightIntensity = ref(20)
const hue = ref(0.0)
const saturation = ref(0.0)
const brightness = ref(0.0)
const rayleighScatteringRed = ref(5.5)
const rayleighScatteringGreen = ref(13.0)
const rayleighScatteringBlue = ref(28.4)
const rayleighScatteringHeight = ref(10000.0)
const mieScattering = ref(0.0)
const mieScatteringHeight = ref(3200.0)
const mieScatteringAnisotropy = ref(0.9)

const changeLightIntensity = () => {
  globe.atmosphereLightIntensity = lightIntensity.value
}
const changeHue = () => {
  globe.atmosphereHueShift = hue.value
}
const changeSaturation = () => {
  globe.atmosphereSaturationShift = saturation.value
}
const changeBrightness = () => {
  globe.atmosphereBrightnessShift = brightness.value
}
const changeRayleighScatteringRed = () => {
  globe.atmosphereRayleighCoefficient.x = rayleighScatteringRed.value * 1e-6;
}
const changeRayleighScatteringGreen = () => {
  globe.atmosphereRayleighCoefficient.y = rayleighScatteringGreen.value * 1e-6;
}
const changeRayleighScatteringBlue = () => {
  globe.atmosphereRayleighCoefficient.z = rayleighScatteringBlue.value * 1e-6;
}
const changeRayleighScatteringHeight = () => {
  globe.atmosphereRayleighScaleHeight = rayleighScatteringHeight.value;
}
const changeMieScattering = () => {
  const v = mieScattering.value * 1e-6;
  globe.atmosphereMieCoefficient = new Cartesian3(v, v, v);
}
const changeMieScatteringHeight = () => {
  globe.atmosphereMieScaleHeight = mieScatteringHeight.value;
}
const changeMieScatteringAnisotropy = () => {
  globe.atmosphereMieAnisotropy = mieScatteringAnisotropy.value;
}



const resetAtmosphere = () => {
  lightIntensity.value = 20
  hue.value = 0.0
  saturation.value = 0.0
  brightness.value = 0.0
  rayleighScatteringRed.value = 5.5
  rayleighScatteringGreen.value = 13.0
  rayleighScatteringBlue.value = 28.4
  rayleighScatteringHeight.value = 10000.0
  mieScattering.value = 0.0
  mieScatteringHeight.value = 3200.0
  mieScatteringAnisotropy.value = 0.9

  globe.atmosphereLightIntensity = lightIntensity.value
  globe.atmosphereHueShift = hue.value
  globe.atmosphereSaturationShift = saturation.value
  globe.atmosphereBrightnessShift = brightness.value
  globe.atmosphereRayleighCoefficient.x = rayleighScatteringRed.value * 1e-6;
  globe.atmosphereRayleighCoefficient.y = rayleighScatteringGreen.value * 1e-6;
  globe.atmosphereRayleighCoefficient.z = rayleighScatteringBlue.value * 1e-6;
  globe.atmosphereRayleighScaleHeight = rayleighScatteringHeight.value;
  const v = mieScattering.value * 1e-6;
  globe.atmosphereMieCoefficient = new Cartesian3(v, v, v);
  globe.atmosphereMieScaleHeight = mieScatteringHeight.value;
  globe.atmosphereMieAnisotropy = mieScatteringAnisotropy.value;
}
resetAtmosphere()
onBeforeUnmount(() => {
  resetAtmosphere()
})


</script>
<style lang="scss" scoped>
.atmosphere-container {
  overflow: auto;
  padding: 10px;

  .title-section {
    text-align: left;
    margin-bottom: 10px;
    margin-top: 10px;

    .atmosphere-title {
      font-size: 16px;
      font-weight: bold;

    }

  }


  .atmosphere-content {
    font-size: 12px;

    .slider-block {
      display: flex;
      align-items: center;

      span {
        width: 180px;
      }

      .el-slider {
        margin-left: 10px;
      }

    }
  }

}
</style>