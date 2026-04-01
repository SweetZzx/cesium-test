<template>
  <div class="custom-data-container">
    <span class="custom-data-title"> 自定义数据 </span>
    <div style="text-align: left;">

      <div class="data-items">
        <span>自定义图层</span>
        <div>
          <el-checkbox v-model="geojsonChecked" label="geojson" size="large" @change="changeGeojson" />
          <el-checkbox v-model="kmlChecked" label="KML" size="large" @change="changeKml" />
          <el-checkbox v-model="glbChecked" label="glb" size="large" @change="changeGlb" />
          <el-checkbox v-model="model3dtilesChecked" label="3dtiles" size="large" @change="changeModel3dtiles" />
          <el-checkbox v-model="czmlChecked" label="czml" size="large" @change="changeCzml" />
          <el-checkbox v-model="wmsImageTestChecked" label="影像WMS" size="large" @change="changeWmsImageTest" />
          <el-checkbox v-model="wmsShpTestChecked" label="矢量WMS" size="large" @change="changeWmsShpTest" />
          <el-checkbox v-model="wmtsImageTestChecked" label="影像WMTS" size="large" @change="changeWmtsImageTest" />
          <el-checkbox v-model="xyzImageTestChecked" label="XYZ瓦片" size="large" @change="changeXyzImageTest" />
          <el-checkbox v-model="mvtTestChecked" label="MVT矢量瓦片" size="large" @change="changeMvtTest" />
          <el-checkbox v-model="terrainChecked" label="Mars3D全球地形" size="large" @change="changeTerrain"></el-checkbox>
        </div>

      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { czmlTestInfo, geojsonTestInfo, glbTestInfo, kmlTestInfo, LayerIdFlag, model3dtilesTestInfo, mvtTestInfo, terrainTestInfo, wmsImageTestInfo, wmsShpTestInfo, wmtsImageTestInfo, xyzImageTestInfo } from '@/system/LayerManager/LayerConfig'
import LayerManager from '@/system/LayerManager/LayerManager'
import CesiumViewer from '@/Viewer/CesiumViewer'
import { Cartesian3 } from 'cesium'

const viewer = CesiumViewer.viewer
let mLayerManager: LayerManager | null = null

const geojsonChecked = ref(false)
const kmlChecked = ref(false)
const glbChecked = ref(false)
const model3dtilesChecked = ref(false)
const czmlChecked = ref(false)
const wmsImageTestChecked = ref(false)
const wmsShpTestChecked = ref(false)
const wmtsImageTestChecked = ref(false)
const xyzImageTestChecked = ref(false)
const mvtTestChecked = ref(false)
const terrainChecked = ref(false)

onMounted(() => {
  mLayerManager = LayerManager.getInstance(viewer!)
})

const changeGeojson = (val: string | number | boolean) => {
  if (val) {
    // 加载geojson图层
    mLayerManager?.Add(geojsonTestInfo)
    // 飞到西安位置
    viewer?.camera.flyTo({
      destination: Cartesian3.fromDegrees(108.9, 34.3, 20000.0)
    })
  } else {
    // 移除geojson图层
    mLayerManager?.Remove(LayerIdFlag.GEOMSON_TEST)
  }
}

const changeKml = (val: string | number | boolean) => {
  if (val) {
    // 加载kml图层
    mLayerManager?.Add(kmlTestInfo)
    // 飞到西安上空30000m
    viewer?.camera.flyTo({
      destination: Cartesian3.fromDegrees(108.9, 34.3, 100000.0)
    })
  } else {
    // 移除kml图层
    mLayerManager?.Remove(LayerIdFlag.KML_TEST)
  }
}
const changeGlb = (val: string | number | boolean) => {
  if (val) {
    // 加载glb图层
    mLayerManager?.Add(glbTestInfo)
    // 飞到西安位置
    viewer?.camera.flyTo({
      destination: Cartesian3.fromDegrees(108.95, 34.26, 500)
    })
  } else {
    // 移除glb图层
    mLayerManager?.Remove(LayerIdFlag.GLB_TEST)
  }
}

const changeModel3dtiles = (val: string | number | boolean) => {
  if (val) {
    // 加载3dtiles图层
    mLayerManager?.Add(model3dtilesTestInfo)
  } else {
    // 移除3dtiles图层
    mLayerManager?.Remove(LayerIdFlag.MODEL_3DTILES_TEST)
  }
}

const changeCzml = (val: string | number | boolean) => {
  if (val) {
    // 加载czml图层
    mLayerManager?.Add(czmlTestInfo)
  } else {
    // 移除czml图层
    mLayerManager?.Remove(LayerIdFlag.CZML_TEST)
  }
}

const changeWmsImageTest = (val: string | number | boolean) => {
  if (val) {
    // 加载wms影像图层
    mLayerManager?.Add(wmsImageTestInfo)
    // 跳转到DEM图层范围 N34~35 E108~109
    viewer?.camera.flyTo({
      destination: Cartesian3.fromDegrees(108.9, 34.3, 100000.0)
    });
  } else {
    // 移除wms影像图层
    mLayerManager?.Remove(LayerIdFlag.WMS_IMAGE_TEST)
  }
}
const changeWmsShpTest = (val: string | number | boolean) => {
  if (val) {
    // 加载wms矢量图层
    mLayerManager?.Add(wmsShpTestInfo)
    // 跳转到指定坐标
    viewer?.camera.flyTo({
      destination: Cartesian3.fromDegrees(108.9, 34.3, 100000.0)
    });
  } else {
    // 移除wms矢量图层
    mLayerManager?.Remove(LayerIdFlag.WMS_SHAPETEST)
  }
}

const changeWmtsImageTest = (val: string | number | boolean) => {
  if (val) {
    // 加载wmts影像图层
    mLayerManager?.Add(wmtsImageTestInfo)
    // 跳转到指定坐标
    viewer?.camera.flyTo({
      destination: Cartesian3.fromDegrees(108.9, 34.3, 100000.0)
    });
  } else {
    // 移除wmts影像图层
    mLayerManager?.Remove(LayerIdFlag.WMTS_IMAGE_TEST)
  }
}

const changeXyzImageTest = (val: string | number | boolean) => {
  if (val) {
    // 加载离线TMS瓦片图层
    mLayerManager?.Add(xyzImageTestInfo)
    // 跳转到指定坐标
    viewer?.camera.flyTo({
      destination: Cartesian3.fromDegrees(108.9, 34.3, 100000.0)
    });
  } else {
    // 移除离线TMS瓦片图层
    mLayerManager?.Remove(LayerIdFlag.XYZ_IMAGE_TEST)
  }
}

const changeMvtTest = (val: string | number | boolean) => {
  if (val) {
    // 加载MVT矢量瓦片图层
    mLayerManager?.Add(mvtTestInfo)
    // 飞到西安上空
    viewer?.camera.flyTo({
      destination: Cartesian3.fromDegrees(108.9, 34.3, 100000.0)
    });
  } else {
    // 移除MVT矢量瓦片图层
    mLayerManager?.Remove(LayerIdFlag.MVT_TEST)
  }
}

const changeTerrain = async(val: string | number | boolean) => {
  if (val) {
    // 加载秦岭地形
    mLayerManager?.Add(terrainTestInfo)

    viewer?.camera.flyTo({
      destination: Cartesian3.fromDegrees(108.5, 34.0, 15000.0)
    });

  } else {
    // 移除地形，恢复椭球
    mLayerManager?.Remove(LayerIdFlag.TERRAIN_TEST)
  }
}



</script>
<style lang="scss" scoped>
.custom-data-container {
  padding: 10px;

  .custom-data-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
  }



  .data-items {
    margin-top: 10px;
    .el-checkbox {
      display: block;
      margin-left: 20px;
      height: 30px;
    }

    :deep(.el-checkbox__label) {
      color: rgb(206, 194, 194);
    }
  }

}
</style>
