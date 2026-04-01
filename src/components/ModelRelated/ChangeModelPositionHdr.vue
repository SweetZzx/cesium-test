<template>
    <div class="model-phdr-container">
        <span class="model-phdr-title"> 动态调整3dtiles位置、姿态</span>
        <el-button type="primary" @click="ResetModel" size="small" style="margin-left: 20px;">一键复位</el-button>
        <div class="model-phdr-section">
            <div class="slider-block">
                <span class="demonstration">经度</span>
                <el-slider v-model="lon" :step="1" :min="-10" :max="10" @input="model.changeLongitudeDeg(lon)" />
                <el-input-number v-model="lon" :step="1" :min="-10" :max="10" size="small" @change="model.changeLongitudeDeg(lon)" />
            </div>
            <div class="slider-block">
                <span class="demonstration">纬度</span>
                <el-slider v-model="lat" :step="1" :min="-10" :max="10" @input="model.changeLatitudeDeg(lat)" />
                <el-input-number v-model="lat" :step="1" :min="-10" :max="10" size="small" @change="model.changeLatitudeDeg(lat)" />
            </div>
            <div class="slider-block">
                <span class="demonstration">高度</span>
                <el-slider v-model="height" :step="1" :min="-1000" :max="1000" @input="model.changeHeight(height)" />
                <el-input-number v-model="height" :step="1" :min="-1000" :max="1000" size="small" @change="model.changeHeight(height)" />
            </div>

            <div class="slider-block">
                <span class="demonstration">Heading</span>
                <el-slider v-model="headingDeg" :step="1" :min="-180" :max="180" @input="model.changeHeadingDeg(headingDeg)" />
                <el-input-number v-model="headingDeg" :step="1" :min="-180" :max="180" size="small" @change="model.changeHeadingDeg(headingDeg)" />
            </div>
            <div class="slider-block">
                <span class="demonstration">Pitch</span>
                <el-slider v-model="pitchDeg" :step="1" :min="-180" :max="180" @input="model.changePitchDeg(pitchDeg)" />
                <el-input-number v-model="pitchDeg" :step="1" :min="-180" :max="180" size="small" @change="model.changePitchDeg(pitchDeg)" />
            </div>
            <div class="slider-block">
                <span class="demonstration">Roll</span>
                <el-slider v-model="rollDeg" :step="1" :min="-180" :max="180" @input="model.changeRollDeg(rollDeg)" />
                <el-input-number v-model="rollDeg" :step="1" :min="-180" :max="180" size="small" @change="model.changeRollDeg(rollDeg)" />
            </div>
     

        </div>

    </div>
</template>
<script setup lang="ts">
import { model3dtilesTestInfo } from '@/system/LayerManager/LayerConfig'

import Model3dtile from '@/system/ModelRelated/Model3dtile'
import CesiumViewer from '@/Viewer/CesiumViewer'
import { Cesium3DTileset } from 'cesium'


const viewer = CesiumViewer.viewer


const lon = ref(0.0)
const lat = ref(0.0)
const height = ref(0.0)

const headingDeg = ref(0.0)
const pitchDeg = ref(0.0)
const rollDeg = ref(0.0)


let model: Model3dtile

onMounted(async () => {

    let tileSet = await Cesium3DTileset.fromUrl(model3dtilesTestInfo.url!);

    viewer?.scene.primitives.add(tileSet)

    viewer?.zoomTo(tileSet)

    model = new Model3dtile(tileSet)

})

const ResetModel = () => {
    lon.value = 0.0
    lat.value = 0.0
    height.value = 0.0
    headingDeg.value = 0.0
    pitchDeg.value = 0.0
    rollDeg.value = 0.0
    model.reset()
}

onBeforeUnmount(() => {
    viewer?.scene.primitives.removeAll()
})



</script>
<style lang="scss" scoped>
.model-phdr-container {
    padding: 10px;
    text-align: left;

    .model-phdr-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;

    }

    .model-phdr-section {
        margin-top: 20px;

        .slider-block {
            max-width: 800px;
            display: flex;
            align-items: center;
            margin-top:10px;


            span {
                width: 70px;
                font-size: 14px;
                margin-right:20px;
                flex-shrink: 0;
            }

            .el-slider {
                flex: 1;
            }

            .el-input-number {
                width: 120px;
                margin-left: 12px;
                flex-shrink: 0;
            }
        }

    }
}
</style>
