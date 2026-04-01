<template>
    <div class="flood-analysis-container">
        <span class="flood-analysis-title">淹没分析</span>

        <div class="analysis-content">
            <div class="analysis-section">
                <div class="section-label">目标区域</div>
                <div class="draw-actions">
                    <el-button size="small" :type="isDrawing ? 'warning' : 'primary'" @click="toggleDraw">
                        {{ isDrawing ? '结束绘制' : '绘制区域' }}
                    </el-button>
                    <el-button size="small" type="info" @click="clearDraw">清除</el-button>
                </div>
                <div v-if="isDrawing" class="draw-tip">单击地图绘制多边形，双击结束</div>
            </div>

            <div class="analysis-section">
                <div class="section-label">参数设置</div>
                <div class="analysis-item">
                    <span class="item-title">初始高度</span>
                    <el-input-number v-model="initialHeight" :min="0" :max="10000" :step="10" size="small" />
                    <span class="item-unit">米</span>
                </div>
                <div class="analysis-item">
                    <span class="item-title">最高高度</span>
                    <el-input-number v-model="floodHeight" :min="0" :max="10000" :step="10" size="small" />
                    <span class="item-unit">米</span>
                </div>
                <div class="analysis-item">
                    <span class="item-title">淹没速度</span>
                    <el-input-number v-model="floodSpeed" :min="1" :max="1000" :step="5" size="small" />
                    <span class="item-unit">米/秒</span>
                </div>
            </div>

            <div class="analysis-actions">
                <el-button type="primary" :disabled="!canStart" @click="startFlood">
                    开始分析
                </el-button>
                <el-button type="danger" @click="stopFlood">
                    停止
                </el-button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Cartesian3, ScreenSpaceEventHandler, ScreenSpaceEventType, Color, PolygonHierarchy, CallbackProperty, CustomDataSource, Entity } from 'cesium'
import CesiumViewer from '@/Viewer/CesiumViewer'
import { ElMessage } from 'element-plus'

const viewer = CesiumViewer.viewer

// 参数
const initialHeight = ref(0)
const floodHeight = ref(500)
const floodSpeed = ref(50)

// 绘制状态
const isDrawing = ref(false)
const polygonCoords = ref<Cartesian3[]>([])
const drawPoints = ref<Cartesian3[]>([])

// 淹没分析状态
let floodTimer: ReturnType<typeof setInterval> | null = null
let floodDataSource: CustomDataSource | null = null
let waterEntity: Entity | undefined = null as unknown as Entity

// 绘制相关临时数据源
let drawDataSource: CustomDataSource | null = null

let drawHandler: ScreenSpaceEventHandler | null = null

onMounted(() => {
    drawDataSource = new CustomDataSource("floodDraw")
    viewer?.dataSources.add(drawDataSource)

    floodDataSource = new CustomDataSource("floodAnalysis")
    viewer?.dataSources.add(floodDataSource)
})

onBeforeUnmount(() => {
    clearAll()
    if (drawDataSource) {
        viewer?.dataSources.remove(drawDataSource)
        drawDataSource = null
    }
    if (floodDataSource) {
        viewer?.dataSources.remove(floodDataSource)
        floodDataSource = null
    }
})

const canStart = computed(() => {
    return drawPoints.value.length >= 3
})

// 切换绘制状态
const toggleDraw = () => {
    if (isDrawing.value) {
        finishDraw()
    } else {
        startDraw()
    }
}

// 开始绘制多边形
const startDraw = () => {
    clearDraw()
    isDrawing.value = true

    drawHandler = new ScreenSpaceEventHandler(viewer!.canvas)

    // 单击添加点
    drawHandler.setInputAction((click: any) => {
        const cartesian = viewer!.scene.pickPosition(click.position)
        if (!cartesian) return

        drawPoints.value.push(cartesian.clone())
        updateDrawPreview()
    }, ScreenSpaceEventType.LEFT_CLICK)

    // 双击结束绘制
    drawHandler.setInputAction(() => {
        finishDraw()
    }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
}

// 完成绘制
const finishDraw = () => {
    if (drawPoints.value.length < 3) {
        ElMessage.warning("至少需要3个点才能构成多边形")
        return
    }

    isDrawing.value = false
    polygonCoords.value = [...drawPoints.value]

    if (drawHandler) {
        drawHandler.destroy()
        drawHandler = null
    }

    ElMessage.success("区域绘制完成")
}

// 清除绘制
const clearDraw = () => {
    isDrawing.value = false
    drawPoints.value = []
    polygonCoords.value = []

    if (drawHandler) {
        drawHandler.destroy()
        drawHandler = null
    }

    drawDataSource?.entities.removeAll()
}

// 更新绘制预览
const updateDrawPreview = () => {
    drawDataSource?.entities.removeAll()

    // 绘制已有顶点
    drawPoints.value.forEach((pos) => {
        drawDataSource?.entities.add({
            position: pos,
            point: {
                pixelSize: 8,
                color: Color.YELLOW,
                outlineColor: Color.BLACK,
                outlineWidth: 1
            }
        })
    })

    // 当点数>=3时绘制多边形预览
    if (drawPoints.value.length >= 3) {
        drawDataSource?.entities.add({
            polygon: {
                hierarchy: new PolygonHierarchy(drawPoints.value),
                material: Color.fromCssColorString("rgba(0, 123, 229, 0.3)"),
                outline: true,
                outlineColor: Color.YELLOW
            }
        })
    }
}

// 开始淹没分析
const startFlood = () => {
    if (polygonCoords.value.length < 3) {
        ElMessage.warning("请先绘制目标区域")
        return
    }

    if (initialHeight.value >= floodHeight.value) {
        ElMessage.warning("初始高度必须小于最高高度")
        return
    }

    // 清理之前的淹没效果
    stopFlood()

    const startH = initialHeight.value
    const targetH = floodHeight.value
    const heightPerTick = floodSpeed.value * 0.05

    waterEntity = floodDataSource!.entities.add({
        polygon: {
            hierarchy: new PolygonHierarchy(polygonCoords.value),
            material: Color.fromCssColorString("rgba(0, 123, 229, 0.5)"),
            extrudedHeight: new CallbackProperty(() => {
                return waterEntity?.properties?.currentHeight?.getValue() ?? startH
            }, false)
        },
        properties: {
            currentHeight: startH
        }
    })

    floodTimer = setInterval(() => {
        const h = waterEntity?.properties?.currentHeight.getValue() as number
        if (h >= targetH) {
            if (floodTimer) {
                clearInterval(floodTimer)
                floodTimer = null
            }
            ElMessage.success("淹没分析完成")
            return
        }
        waterEntity?.properties?.currentHeight.setValue(h + heightPerTick)
    }, 50)
}

// 停止淹没分析
const stopFlood = () => {
    if (floodTimer) {
        clearInterval(floodTimer)
        floodTimer = null
    }
    floodDataSource?.entities.removeAll()
    waterEntity = undefined
}

// 清理全部
const clearAll = () => {
    stopFlood()
    clearDraw()
}
</script>

<style lang="scss" scoped>
.flood-analysis-container {
    padding: 15px 20px;
    width: 280px;
    text-align: left;

    .flood-analysis-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #ecf0f1;
        display: block;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 10px;
        text-align: left;
    }

    .analysis-content {
        text-align: left;
    }

    .analysis-section {
        margin-bottom: 18px;

        .section-label {
            font-size: 14px;
            color: #bdc3c7;
            margin-left: 4px;
            font-weight: 500;
            margin-bottom: 10px;
        }
    }

    .draw-actions {
        display: flex;
        gap: 8px;
        margin-left: 4px;
    }

    .draw-tip {
        margin-top: 8px;
        font-size: 12px;
        color: #f39c12;
        margin-left: 4px;
    }

    .analysis-item {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 10px;
        margin-left: 4px;

        .item-title {
            color: #ecf0f1;
            font-size: 13px;
            white-space: nowrap;
            min-width: 56px;
        }

        .item-unit {
            color: #95a5a6;
            font-size: 12px;
        }

        :deep(.el-input-number) {
            width: 100px;

            .el-input__wrapper {
                background: rgba(52, 73, 94, 0.6);
                box-shadow: 0 0 0 1px rgba(149, 165, 166, 0.5) inset;
            }

            .el-input__inner {
                color: #ecf0f1;
            }
        }
    }

    .analysis-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
        margin-left: 4px;
    }
}
</style>
