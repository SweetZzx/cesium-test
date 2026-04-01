<template>
  <div class="glb-style-container">
    <span class="glb-style-title"> 动态调整glb/gltf样式风格</span>
    <div class="glb-style-section">
      <span class="glb-style-item"> 模型颜色</span>
      <div class="glb-color">
        <span>颜色模式</span>
        <el-select v-model="colorBlendMode" placeholder="请选择模式" @change="changeColorMode">
          <el-option label="高亮" value="HIGHLIGHT"></el-option>
          <el-option label="替换" value="REPLACE"></el-option>
          <el-option label="混合" value="MIX"></el-option>
        </el-select>
      </div>
      <div class="glb-color">
        <span>颜色</span>
        <pick-colors v-model:value="glbColor" @change="changeGlbColor" />
      </div>
      <div class="glb-color">
        <span>不透明度</span>
        <el-slider v-model="colorAlphaValue" :min="0" :max="1" :step="0.01" @input="changeGlbColor" />

      </div>
      <div class="glb-color">
        <span>混合系数</span>
        <el-slider :disabled="colorBlendMode != 'MIX'" v-model="colorMixValue" :min="0" :max="1" :step="0.01"
          @input="changeMixValue" />

      </div>
    </div>
    <div class="glb-style-section">
      <span class="glb-style-item"> 模型姿态</span>
      <div class="glb-color">
        <span>航向</span>
        <el-slider v-model="headingValue" :min="0" :max="360" :step="1" @input="changeOrientation" />
      </div>
      <div class="glb-color">
        <span>俯仰</span>
        <el-slider v-model="pitchValue" :min="-90" :max="90" :step="1" @input="changeOrientation" />
      </div>
      <div class="glb-color">
        <span>翻滚</span>
        <el-slider v-model="rollValue" :min="-180" :max="180" :step="1" @input="changeOrientation" />
      </div>
    </div>
    <div class="glb-style-section">
      <span class="glb-style-item"> 模型轮廓线</span>
      <div class="glb-color">
        <span>颜色</span>

        <pick-colors v-model:value="glbSilhouetteColor" @change="changeSilhouetteColor" />
      </div>
      <div class="glb-color">
        <span>宽度</span>
        <el-slider v-model="silhouetteWidthValue" :min="0" :max="10" :step="0.01" @input="changeSilhouetteWidth" />

      </div>
    </div>
  </div>

</template>

<script setup lang="ts">


import CesiumViewer from '@/Viewer/CesiumViewer'
import { Cartesian3, HeadingPitchRoll, Transforms, Viewer, Color, Math as CesiumMath, ColorBlendMode, ConstantProperty, Matrix3, Matrix4, Quaternion, Ellipsoid } from 'cesium'
import PickColors from 'vue-pick-colors'
import { glbTestInfo } from '@/system/LayerManager/LayerConfig'

const viewer = CesiumViewer.viewer

// 模型展示参数（前端自定义，不属于图层配置）
const modelOpts = {
  lon: 108.95,
  lat: 34.26,
  height: 500,
  heading: 45,
  pitch: 0,
  roll: 0,
  scale: 50
}


const colorBlendMode = ref("HIGHLIGHT")
const glbColor = ref("#F2EFEF")
const colorAlphaValue = ref(1.0)
const colorMixValue = ref(0.5)

const glbSilhouetteColor = ref("#00ff00")
const silhouetteWidthValue = ref(4.0)

const headingValue = ref(modelOpts.heading)
const pitchValue = ref(modelOpts.pitch)
const rollValue = ref(modelOpts.roll)

const getColor = (colorCss: string, alpha: number) => {
  const color = Color.fromCssColorString(colorCss)
  return Color.fromAlpha(color, alpha);
}


const getColorBlendMode = () => {
  return ColorBlendMode[colorBlendMode.value as keyof typeof ColorBlendMode]
}

const createModel = (viewer: Viewer, url: string, lon: number, lat: number, height: number, heading: number, pitch: number, roll: number, scale: number) => {
  viewer.entities.removeAll();

  const position = Cartesian3.fromDegrees(lon, lat, height);
  const hpRoll = new HeadingPitchRoll(
    CesiumMath.toRadians(heading ?? 0),
    CesiumMath.toRadians(pitch ?? 0),
    CesiumMath.toRadians(roll ?? 0)
  );
  const fixedFrame = Transforms.localFrameToFixedFrameGenerator('north', 'west');
  const modelMatrix = Transforms.headingPitchRollToFixedFrame(position, hpRoll, Ellipsoid.WGS84, fixedFrame);
  const rotationMatrix = new Matrix3();
  Matrix4.getMatrix3(modelMatrix, rotationMatrix);
  const orientation = Quaternion.fromRotationMatrix(rotationMatrix);

  let entity = viewer.entities.add({
    name: url,
    position: position,
    orientation: orientation,
    model: {
      uri: url,
      scale: scale,
      color: getColor(glbColor.value, colorAlphaValue.value),
      colorBlendMode: getColorBlendMode(),
      colorBlendAmount: colorMixValue.value,
      silhouetteColor: getColor(
        glbSilhouetteColor.value,
        1.0,
      ),
      silhouetteSize: silhouetteWidthValue.value,
    },
  });
 viewer?.camera.flyTo({
      destination: Cartesian3.fromDegrees(lon, lat, height * 10)
    });
  return entity;
}


const targetEntity = createModel(viewer!, glbTestInfo.url!, modelOpts.lon, modelOpts.lat, modelOpts.height, modelOpts.heading, modelOpts.pitch, modelOpts.roll, modelOpts.scale)

const changeGlbColor = () => {
  if (targetEntity) {
    targetEntity.model!.color = new ConstantProperty(getColor(glbColor.value, colorAlphaValue.value))
  }
}

const changeMixValue = () => {
  if (targetEntity) {
    targetEntity.model!.colorBlendAmount = new ConstantProperty(colorMixValue.value)
  }
}
const changeSilhouetteColor = () => {
  if (targetEntity) {
    targetEntity.model!.silhouetteColor = new ConstantProperty(getColor(glbSilhouetteColor.value, 1.0))
  }

}

const modelPosition = Cartesian3.fromDegrees(modelOpts.lon, modelOpts.lat, modelOpts.height)

const changeOrientation = () => {
  if (targetEntity) {
    const hpRoll = new HeadingPitchRoll(
      CesiumMath.toRadians(headingValue.value),
      CesiumMath.toRadians(pitchValue.value),
      CesiumMath.toRadians(rollValue.value)
    );
    const fixedFrame = Transforms.localFrameToFixedFrameGenerator('north', 'west');
    const modelMatrix = Transforms.headingPitchRollToFixedFrame(modelPosition, hpRoll, Ellipsoid.WGS84, fixedFrame);
    const rotationMatrix = new Matrix3();
    Matrix4.getMatrix3(modelMatrix, rotationMatrix);
    targetEntity.orientation = new ConstantProperty(Quaternion.fromRotationMatrix(rotationMatrix));
  }
}
const changeColorMode = () => {
  if (targetEntity) {
    targetEntity.model!.colorBlendMode = new ConstantProperty(getColorBlendMode())
  }
}
const changeSilhouetteWidth = () => {
  if (targetEntity) {
    targetEntity.model!.silhouetteSize = new ConstantProperty(silhouetteWidthValue.value)
  }
}
onBeforeUnmount(() => {
  viewer!.entities.removeAll()
})
</script>

<style lang="scss" scoped>
.glb-style-container {

  padding: 10px;

  .glb-style-title {
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .glb-style-section {
    text-align: left;

    .glb-style-item {
      font-size: 14px;
      // margin-bottom: 5px;
      font-weight: bold;
      color: rgb(13, 233, 149);

    }

    .glb-color {
      display: flex;
      align-items: center;
      // margin-top: 5px;
      text-align: left;

      span {
        width: 50px;
        font-size: 12px;
        margin-right: 10px;

      }

      .el-select {
        flex: 1;
      }

      .el-slider {
        flex: 1;
      }

    }

  }
}
</style>
