<template>
  <div class="snow-container">
    <div class="title-section">
      <span class="snow-title">雪效果控制</span>
      <el-button type="primary" size="small" @click="toggleSnow">
        {{ active ? '关闭' : '开启' }}
      </el-button>
    </div>

    <div v-if="active" class="snow-content">
      <div class="slider-block">
        <span class="demonstration">雪花大小</span>
        <el-slider v-model="snowSize" :step="0.5" :min="1" :max="20" @input="changeSize" />
      </div>
      <div class="slider-block">
        <span class="demonstration">下落速度</span>
        <el-slider v-model="snowSpeed" :step="0.1" :min="0.1" :max="5" @input="changeSpeed" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CesiumViewer from "@/Viewer/CesiumViewer";
import SnowEffect from "@/system/GlobalControl/SnowEffect";

const viewer = CesiumViewer.viewer!;
const snowEffect = new SnowEffect(viewer, { snowSize: 5.0, snowSpeed: 1.0 });

const active = ref(true);
const snowSize = ref(5.0);
const snowSpeed = ref(1.0);

const toggleSnow = () => {
  if (active.value) {
    snowEffect.hide();
    active.value = false;
  } else {
    snowEffect.show();
    active.value = true;
  }
};

const changeSize = () => {
  snowEffect.setSnowSize(snowSize.value);
};

const changeSpeed = () => {
  snowEffect.setSnowSpeed(snowSpeed.value);
};

onBeforeUnmount(() => {
  snowEffect.destroy();
});
</script>

<style lang="scss" scoped>
.snow-container {
  overflow: auto;
  padding: 10px;

  .title-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    margin-top: 10px;

    .snow-title {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .snow-content {
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
