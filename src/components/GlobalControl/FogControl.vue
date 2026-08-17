<template>
  <div class="fog-container">
    <div class="title-section">
      <span class="fog-title">雾效果控制</span>
      <el-button type="primary" size="small" @click="toggleFog">
        {{ active ? '关闭' : '开启' }}
      </el-button>
    </div>

    <div v-if="active" class="fog-content">
      <div class="slider-block">
        <span class="demonstration">雾浓度</span>
        <el-slider v-model="fogVisibility" :step="0.01" :min="0" :max="0.25" @input="changeVisibility" />
      </div>
      <div class="slider-block">
        <span class="demonstration">雾颜色</span>
        <pick-colors v-model:value="color" @change="changeColor" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CesiumViewer from "@/Viewer/CesiumViewer";
import FogEffect from "@/system/GlobalControl/FogEffect";
import { Color } from "cesium";
import PickColors from "vue-pick-colors";

const viewer = CesiumViewer.viewer!;
const fogEffect = new FogEffect(viewer, {
  visibility: 0.1,
  color: new Color(0.8, 0.8, 0.8, 1.0),
});

const active = ref(true);
const fogVisibility = ref(0.1);
const color = ref("#cccccc");

const toggleFog = () => {
  if (active.value) {
    fogEffect.hide();
    active.value = false;
  } else {
    fogEffect.show();
    active.value = true;
  }
};

const changeVisibility = () => {
  fogEffect.setVisibility(fogVisibility.value);
};

const changeColor = () => {
  fogEffect.setColor(Color.fromCssColorString(color.value));
};

onBeforeUnmount(() => {
  fogEffect.destroy();
});
</script>

<style lang="scss" scoped>
.fog-container {
  overflow: auto;
  padding: 10px;

  .title-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    margin-top: 10px;

    .fog-title {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .fog-content {
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
