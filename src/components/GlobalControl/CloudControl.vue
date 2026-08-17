<template>
  <div class="cloud-container">
    <div class="title-section">
      <span class="cloud-title">云效果控制</span>
      <el-button type="primary" size="small" @click="createClouds">生成云</el-button>
      <el-button type="danger" size="small" @click="clearClouds">清除云</el-button>
    </div>

    <div class="cloud-content">
      <div class="slider-block">
        <span class="demonstration">X比例</span>
        <el-slider v-model="scaleX" :step="1" :min="5" :max="50" @input="changeScaleXYZ" />
      </div>
      <div class="slider-block">
        <span class="demonstration">Y比例</span>
        <el-slider v-model="scaleY" :step="1" :min="5" :max="50" @input="changeScaleXYZ" />
      </div>
      <div class="slider-block">
        <span class="demonstration">Z比例</span>
        <el-slider v-model="scaleZ" :step="1" :min="5" :max="50" @input="changeScaleXYZ" />
      </div>
      <div class="slider-block">
        <span class="demonstration">切片比例</span>
        <el-slider v-model="slice" :step="0.1" :min="0" :max="1" @input="changeSlice" />
      </div>
      <div class="slider-block">
        <span class="demonstration">颜色</span>
        <pick-colors v-model:value="color" @change="changeColor" />
      </div>
      <div class="slider-block">
        <span class="demonstration">亮度</span>
        <el-slider v-model="brightness" :step="0.1" :min="0" :max="1" @input="changeBrightness" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CesiumViewer from "@/Viewer/CesiumViewer";
import CloudsManager from "@/system/GlobalControl/CloudsManager";
import { Cartesian3, Math as CesiumMath } from "cesium";
import PickColors from "vue-pick-colors";

const viewer = CesiumViewer.viewer!;
const cloudManager = new CloudsManager(viewer);

const scaleX = ref(25);
const scaleY = ref(12);
const scaleZ = ref(15);
const slice = ref(0.3);
const color = ref("#ffffff");
const brightness = ref(1.0);

const changeScaleXYZ = () => {
  cloudManager.updateScale(scaleX.value, scaleY.value, scaleZ.value);
};

const changeSlice = () => {
  cloudManager.updateSlice(slice.value);
};

const changeColor = () => {
  cloudManager.updateColor(color.value);
};

const changeBrightness = () => {
  cloudManager.updateBrightness(brightness.value);
};

const createClouds = () => {
  cloudManager.removeAllClouds();
  const cameraPos = viewer.camera.positionCartographic;
  const basePos = Cartesian3.fromDegrees(
    CesiumMath.toDegrees(cameraPos.longitude),
    CesiumMath.toDegrees(cameraPos.latitude),
    Math.max(cameraPos.height * 0.3, 500),
  );
  cloudManager.createRandomClouds(basePos, 500);
  // 应用当前参数
  changeScaleXYZ();
  changeSlice();
  changeColor();
  changeBrightness();
};

const clearClouds = () => {
  cloudManager.removeAllClouds();
};

onBeforeUnmount(() => {
  cloudManager.destroy();
});
</script>

<style lang="scss" scoped>
.cloud-container {
  overflow: auto;
  padding: 10px;

  .title-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    margin-top: 10px;

    .cloud-title {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .cloud-content {
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
