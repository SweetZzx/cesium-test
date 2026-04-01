<template>
  <div class="background-control">
    <span class="background-control-title">全局背景图</span>
    <div class="pure-color-background">
      <span>纯色背景</span>
      <pick-colors v-model:value="colorValue" @change="setPureColorBackground" />


    </div>
    <div class="custom-image-background">
      <el-checkbox v-model="checkedCustomImage" label="自定义图片" @change="changeCustomImage" />
      <el-select v-model="selectValue" @change="changeSelectImage">
        <el-option v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>

    </div>

  </div>
</template>

<script lang="ts" setup>
import CesiumViewer from '@/Viewer/CesiumViewer'
import { Color } from 'cesium';
import PickColors from 'vue-pick-colors'

const colorValue = ref('#000000')
const checkedCustomImage = ref(false)
const selectValue = ref(0)

const selectOptions = ref([
  {
    value: 0,
    label: '图片1',
    url: '/testdata/backgroundImages/image1.jpg',
  },
  {
    value: 1,
    label: '图片2',
    url: '/testdata/backgroundImages/image2.jpg',
  },
  {
    value: 2,
    label: '图片3',
    url: '/testdata/backgroundImages/image3.jpg',
  },
  {
    value: 3,
    label: '图片4',
    url: '/testdata/backgroundImages/image4.jpg',
  },
])


const viewer = CesiumViewer.viewer




const setPureColorBackground = () => {
  // viewer!.scene.globe.showGroundAtmosphere = false;
  checkedCustomImage.value = false
  selectValue.value = 0
  setEnableAtmosphereFog(false)
  viewer!.scene.backgroundColor = Color.fromCssColorString(colorValue.value)
}

const changeCustomImage = () => {
  if (checkedCustomImage.value) {
    //背景透明      
    viewer!.scene.backgroundColor = Color.TRANSPARENT
    setEnableAtmosphereFog(false)
    setBackGroundImage()

  } else {
    viewer!.scene.backgroundColor = Color.fromCssColorString(colorValue.value)
  }
}

const changeSelectImage = () => {
  if (checkedCustomImage.value) {
    setBackGroundImage()
  }
}

// 设置背景图片
const setBackGroundImage = () => {
  let url = selectOptions.value[selectValue.value].url
  let container = viewer!.container as HTMLElement

  container.style.backgroundImage = 'url(' + url + ')'
  container.style.backgroundRepeat = 'no-repeat'
  container.style.backgroundSize = 'cover'
}
//设置全局大气与雾是否显示
const setEnableAtmosphereFog = (enabled: boolean) => {
  viewer!.scene.skyAtmosphere!.show = enabled
  viewer!.scene.fog!.enabled = enabled
}

//恢复原样
onBeforeUnmount(() => {
  setEnableAtmosphereFog(true)
  viewer!.scene.backgroundColor = Color.fromCssColorString("#000000")
})




</script>

<style lang="scss" scoped>
.background-control {
  padding: 10px;
  text-align: left;

  .background-control-title {
    font-size: 16px;
    font-weight: bold;

  }

  .pure-color-background {
    display: flex;
    align-items: center;
    margin-top: 10px;
  }

  .custom-image-background {
    display: flex;
    align-items: center;

    :deep(.el-checkbox__label) {
      color: white !important;
      margin-right: 10px;
    }

  }

}
</style>