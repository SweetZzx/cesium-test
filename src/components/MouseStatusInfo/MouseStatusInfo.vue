<template>
    <div class="status-info">
        <span>经度: {{ MouseStatusInViewer.longtitude.value.toFixed(3) }}</span>
        <span>纬度: {{ MouseStatusInViewer.latitude.value.toFixed(3) }}</span>
        <span>高度: {{ MouseStatusInViewer.altitude.value.toFixed(2) }}米</span>

        <span>偏航角: {{ MouseStatusInViewer.heading.value.toFixed(3) }}°</span>
        <span>俯仰角: {{ MouseStatusInViewer.pitch.value.toFixed(3) }}°</span>
        <span>横滚角: {{ MouseStatusInViewer.roll.value.toFixed(3) }}°</span>

        <span>相机高度: {{ MouseStatusInViewer.cameraHeight.value.toFixed(2) }}米</span>
    </div>
</template>
<script setup lang="ts">

import MouseStatusInViewer from '@/Viewer/MouseStatusInViewer';


</script>

<style lang="scss" scoped>
.status-info {
    width: 100%;
    height: 100%;

    span {
        margin-left: 20px;
    }
}
</style>