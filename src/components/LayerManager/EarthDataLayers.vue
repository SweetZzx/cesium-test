<template>
    <div class="layer-manager-container">
        <span class="layer-manager-title">全球数据</span>
        <div class="layer-content">
            <div class="layer-section">
                <div class="section-label">底图</div>
                <el-radio-group v-model="imageDataRadio" class="basemap-radio-group" @change="changeImageData">
                    <el-radio value="bingImage" class="basemap-radio">Bing影像</el-radio>
                    <el-radio value="tdtImage" class="basemap-radio">天地图-影像</el-radio>
                    <el-radio value="tdtVec" class="basemap-radio">天地图-地图</el-radio>
                </el-radio-group>
            </div>
            <div class="layer-section">
                <div class="section-label">注记</div>
                <el-checkbox v-model="tdtAnnotationChecked" class="annotation-checkbox" @change="changeTdtAnnotation">
                    天地图-注记
                </el-checkbox>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>

import { TDT_KEY } from '@/system/Config/SystemConfig'
import { LayerIdFlag, tdtAnnotationInfo, tdtImageLayerInfo, tdtVecLayerInfo } from '@/system/LayerManager/LayerConfig'
import LayerManager from '@/system/LayerManager/LayerManager'
import CesiumViewer from '@/Viewer/CesiumViewer'
import { ElMessage } from 'element-plus'

const imageDataRadio = ref('bingImage')

const tdtAnnotationChecked = ref(false)


const viewer = CesiumViewer.viewer
let mLayerManager: LayerManager | null = null

onMounted(() => {
    mLayerManager = LayerManager.getInstance(viewer!)
})

const changeImageData = (val: string | number | boolean | undefined) => {
    imageDataRadio.value = val as string
    if(TDT_KEY===""){
        ElMessage.error("请先在src/system/Config/SystemConfig.ts中配置天地图密钥TDT_KEY")
        imageDataRadio.value='bingImage'
        return;
    }

    switch (val) {
        case 'bingImage':
            mLayerManager?.Remove(LayerIdFlag.TDT_IMAGERY_WMTS)
            mLayerManager?.Remove(LayerIdFlag.TDT_VECTOR_WMTS)
            break
        case 'tdtImage':
            mLayerManager?.Remove(LayerIdFlag.TDT_VECTOR_WMTS)
            mLayerManager?.Add(tdtImageLayerInfo)
            break
        case 'tdtVec':
            mLayerManager?.Remove(LayerIdFlag.TDT_IMAGERY_WMTS)
            mLayerManager?.Add(tdtVecLayerInfo)
            break
        default:
            break
    }

    // 置顶标注图层
    if (tdtAnnotationChecked.value) {
        mLayerManager?.SetAnnotationLayerTop()
    }
}



const changeTdtAnnotation = (val: string | number | boolean) => {
    tdtAnnotationChecked.value = val as boolean
    if(TDT_KEY==""){
        ElMessage.error("请先在src/system/Config/SystemConfig.ts中配置天地图密钥TDT_KEY")
        tdtAnnotationChecked.value=false;
        return;
    }
    if (val) {
        mLayerManager?.Add(tdtAnnotationInfo)
    } else {
        mLayerManager?.Remove(LayerIdFlag.TDT_ANNOTATION_WMTS)
    }
}
</script>

<style lang="scss" scoped>
.layer-manager-container {
    padding: 15px 20px;
    width: 240px;
    text-align: left;

    .layer-manager-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #ecf0f1;
        display: block;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 10px;
        text-align: left;
    }

    .layer-content {
        text-align: left;
    }

    .layer-section {
        margin-bottom: 20px;

        &:last-child {
            margin-bottom: 0;
        }

        .section-label {
            font-size: 14px;
            color: #bdc3c7;
            margin-left: 20px;
            font-weight: 500;
            margin-bottom: 12px;
            text-align: left;
        }

        .basemap-radio-group {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;

            :deep(.el-radio) {
                margin: 0 0 0 20px;
                display: flex;
                align-items: center;
            }

            :deep(.el-radio__input) {
                .el-radio__inner {
                    width: 16px;
                    height: 16px;
                    background: rgba(52, 73, 94, 0.6);
                    border-color: rgba(149, 165, 166, 0.8);

                    &:hover {
                        border-color: #3498db;
                    }
                }

                &.is-checked .el-radio__inner {
                    background: #3498db;
                    border-color: #3498db;
                }
            }

            :deep(.el-radio__label) {
                color: #ecf0f1;
                font-size: 13px;
                padding-left: 8px;
            }
        }

        .annotation-checkbox {
            margin-left: 20px;
            display: flex;
            align-items: center;

            :deep(.el-checkbox__input) {
                .el-checkbox__inner {
                    width: 16px;
                    height: 16px;
                    background: rgba(52, 73, 94, 0.6);
                    border-color: rgba(149, 165, 166, 0.8);

                    &:hover {
                        border-color: #3498db;
                    }
                }

                &.is-checked .el-checkbox__inner {
                    background: #3498db;
                    border-color: #3498db;
                }
            }

            :deep(.el-checkbox__label) {
                color: #ecf0f1;
                font-size: 13px;
                padding-left: 8px;
            }
        }
    }
}
</style>
