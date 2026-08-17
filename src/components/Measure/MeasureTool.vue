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
import { ref } from 'vue'
import { DistanceMeasure } from '@/system/Measure/DistanceMeasure'
import { AreaMeasure } from '@/system/Measure/AreaMeasure'
import { useCesium } from '@/composables/core/useCesium'
import { useDispatcherEvents } from '@/composables/core/useDispatcherEvents'
import { useMeasureInstance } from '@/composables/measure/useMeasureInstance'

const { viewer, dispatcher } = useCesium()
const { on: onEvent } = useDispatcherEvents(dispatcher)
const { startMeasure, destroyCurrent } = useMeasureInstance(viewer, dispatcher)

const activeType = ref<'distance' | 'area' | ''>('')
const measureInfo = ref('')

// 监听事件，实时更新提示信息（组件卸载时自动清理）
onEvent('DRAWSTART', (payload: any) => {
    measureInfo.value = payload.text
})
onEvent('MOUSEMOVE', (payload: any) => {
    measureInfo.value = payload.text
})
onEvent('DRAWEND', (payload: any) => {
    measureInfo.value = payload.text
    activeType.value = ''
})

const startDistanceMeasure = () => {
    activeType.value = 'distance'
    measureInfo.value = ''
    startMeasure(DistanceMeasure)
}

const startAreaMeasure = () => {
    activeType.value = 'area'
    measureInfo.value = ''
    startMeasure(AreaMeasure)
}

const clearAll = () => {
    destroyCurrent()
    activeType.value = ''
    measureInfo.value = ''
}
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
