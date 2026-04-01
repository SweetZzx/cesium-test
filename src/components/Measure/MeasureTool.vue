<template>
    <div class="measure-container">
        <span class="measure-title">空间量算</span>

        <div class="measure-content">
            <div class="measure-section">
                <div class="section-label">量测工具</div>
                <div class="measure-buttons">
                    <el-button
                        size="small"
                        :type="activeType === 'distance' ? 'primary' : 'default'"
                        @click="startDistanceMeasure"
                    >
                        距离量测
                    </el-button>
                    <el-button
                        size="small"
                        :type="activeType === 'area' ? 'primary' : 'default'"
                        @click="startAreaMeasure"
                    >
                        面积量测
                    </el-button>
                </div>
                <el-text v-if="measureInfo" class="measure-tip">
                    {{ measureInfo }}
                </el-text>
            </div>

            <div class="measure-actions">
                <el-button size="small" type="warning" @click="clearAll">
                    清除结果
                </el-button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount } from 'vue'
import CesiumViewer from '@/Viewer/CesiumViewer'
import { DistanceMeasure } from '@/system/Measure/DistanceMeasure'
import { AreaMeasure } from '@/system/Measure/AreaMeasure'
import type { BaseMeasure } from '@/system/Measure/BaseMeasure'
import EventDispatcher from '@/system/EventDispatcher/EventDispatcher'

const viewer = CesiumViewer.viewer
const dispatcher = new EventDispatcher()

const activeType = ref<'distance' | 'area' | ''>('')
const measureInfo = ref('')

let currentMeasure: BaseMeasure | null = null

// 监听事件，实时更新提示信息
dispatcher.on('DRAWSTART', (payload: any) => {
    measureInfo.value = payload.text
})
dispatcher.on('MOUSEMOVE', (payload: any) => {
    measureInfo.value = payload.text
})
dispatcher.on('DRAWEND', (payload: any) => {
    measureInfo.value = payload.text
    activeType.value = ''
})

const startDistanceMeasure = () => {
    activeType.value = 'distance'
    measureInfo.value = ''
    currentMeasure = new DistanceMeasure(viewer!, dispatcher)
    currentMeasure.start()
}

const startAreaMeasure = () => {
    activeType.value = 'area'
    measureInfo.value = ''
    currentMeasure = new AreaMeasure(viewer!, dispatcher)
    currentMeasure.start()
}

const clearAll = () => {
    if (currentMeasure) {
        currentMeasure.destroy()
        currentMeasure = null
    }
    activeType.value = ''
    measureInfo.value = ''
}

onBeforeUnmount(() => {
    clearAll()
})
</script>

<style lang="scss" scoped>
.measure-container {
    padding: 15px 20px;
    width: 280px;
    text-align: left;

    .measure-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #ecf0f1;
        display: block;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 10px;
        text-align: left;
    }

    .measure-content {
        text-align: left;
    }

    .measure-section {
        margin-bottom: 18px;

        .section-label {
            font-size: 14px;
            color: #bdc3c7;
            margin-left: 4px;
            font-weight: 500;
            margin-bottom: 12px;
        }
    }

    .measure-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-left: 4px;
    }

    .measure-tip {
        margin-top: 10px;
        font-size: 12px;
        color: #f39c12;
        margin-left: 4px;
        display: block;
    }

    .measure-actions {
        margin-top: 15px;
        margin-left: 4px;
    }
}
</style>
