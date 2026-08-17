<template>
    <div class="status-info">
        <span>经度: {{ longitude.toFixed(3) }}</span>
        <span>纬度: {{ latitude.toFixed(3) }}</span>
        <span>高度: {{ altitude.toFixed(2) }}米</span>

        <span>偏航角: {{ heading.toFixed(3) }}°</span>
        <span>俯仰角: {{ pitch.toFixed(3) }}°</span>
        <span>横滚角: {{ roll.toFixed(3) }}°</span>

        <span>相机高度: {{ cameraHeight.toFixed(2) }}米</span>
    </div>
</template>
<script setup lang="ts">
import { useMouseStatus } from '@/composables/viewer/useMouseStatus'

const { longitude, latitude, altitude, heading, pitch, roll, cameraHeight } = useMouseStatus()
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