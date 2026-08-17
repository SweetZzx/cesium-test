<template>
  <div class="rain-container">
    <div class="title-section">
      <span class="rain-title">雨效果控制</span>
      <el-button type="primary" size="small" @click="toggleRain">
        {{ active ? '关闭' : '开启' }}
      </el-button>
    </div>

    <div v-if="active" class="rain-content">
      <div class="slider-block">
        <span class="demonstration">雨速度</span>
        <el-slider v-model="rainSpeed" :step="0.1" :min="0.1" :max="5" @input="changeSpeed" />
      </div>
      <div class="slider-block">
        <span class="demonstration">倾斜角度</span>
        <el-slider v-model="rainAngle" :step="0.01" :min="-1" :max="1" @input="changeAngle" />
      </div>
      <div class="slider-block">
        <span class="demonstration">闪电效果</span>
        <el-switch
          v-model="showLightning"
          style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="changeLightning"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CesiumViewer from "@/Viewer/CesiumViewer";
import RainEffect from "@/system/GlobalControl/RainEffect";

const viewer = CesiumViewer.viewer!;
const rainEffect = new RainEffect(viewer, { rainSpeed: 1.0, rainAngle: 0.0 });

const active = ref(true);
const rainSpeed = ref(1.0);
const rainAngle = ref(0.0);
const showLightning = ref(false);

const toggleRain = () => {
  if (active.value) {
    rainEffect.hide();
    active.value = false;
  } else {
    rainEffect.show();
    active.value = true;
  }
};

const changeSpeed = () => {
  rainEffect.setRainSpeed(rainSpeed.value);
};

const changeAngle = () => {
  rainEffect.setRainAngle(rainAngle.value);
};

const changeLightning = () => {
  rainEffect.setShowThunderLightning(showLightning.value);
};

onBeforeUnmount(() => {
  rainEffect.destroy();
});
</script>

<style lang="scss" scoped>
.rain-container {
  overflow: auto;
  padding: 10px;

  .title-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    margin-top: 10px;

    .rain-title {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .rain-content {
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
