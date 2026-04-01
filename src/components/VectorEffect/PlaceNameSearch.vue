<template>
    <div class="tdt-geocoder-container">
        <span class="tdt-geocoder-title">地名搜索</span>
        <div class="tdt-geocoder-select">

            <el-select v-model="placeSelected"  filterable remote reserve-keyword placeholder="请输入地名"
                :remote-method="dropDownSearch" :loading="loading" @change="HandleSelectChange"
                style="width: 240px;margin-right:10px;">
                <el-option v-for="(item, index) in optionsPlaceList" :key="index" :label="item.name" :value="item.name" />
            </el-select>
        </div>


    </div>

</template>
<script setup lang="ts">
import { TDT_KEY } from '@/system/Config/SystemConfig';
import CesiumViewer from '@/Viewer/CesiumViewer';
import { Cartesian2, Cartesian3, Color, HeightReference, HorizontalOrigin, LabelStyle, VerticalOrigin, Viewer } from 'cesium';
import { ElMessage } from 'element-plus';

interface ILocation {
    name: string;
    lon: number;
    lat: number;
}


const placeSelected = ref("");

const loading = ref(false)
let optionsPlaceList: ILocation[] = reactive([])

const dropDownSearch = async (query: string) => {
    if (TDT_KEY == "") {
        ElMessage.error("请先在src/system/Config/SystemConfig.ts中配置天地图密钥TDT_KEY")
        return;
    }
    optionsPlaceList.splice(0, optionsPlaceList.length); // 清空数组
    if (query) {

        loading.value = true
        const { data } = await axios.get(`http://api.tianditu.gov.cn/v2/search?postStr={"keyWord":"${query}","level":16,"queryType":1,"start":0,"count":10,"mapBound":"-180,-90,180,90"}&type=query&tk=${TDT_KEY}`)


        let pois = data.pois
        if(pois && pois.length > 0){

            pois.forEach((item: any) => {
                let lonlat = item.lonlat.split(",")
                let lon = Number(lonlat[0])
                let lat = Number(lonlat[1])
                optionsPlaceList.push({
                    name: item.name + "," + item.address,
                    lon: lon,
                    lat: lat
                })
            })
        }

        loading.value = false
    }

}
const HandleSelectChange = async (selectString: string) => {

    let selectedPlace = optionsPlaceList.find(item => item.name === selectString)

    let viewer = CesiumViewer.viewer
    viewer?.entities.removeAll()

    if (selectedPlace) {

        addBillboard(viewer!, selectedPlace.lon, selectedPlace.lat)
        addLabel(viewer!, selectedPlace.name, selectedPlace.lon, selectedPlace.lat)

        viewer?.camera.flyTo({
            destination: Cartesian3.fromDegrees(selectedPlace.lon, selectedPlace.lat, 10000),
            duration: 2
        })

    }

};

const addBillboard = (viewer: Viewer, lon: number, lat: number) => {
    viewer?.entities.add({
        position: Cartesian3.fromDegrees(lon, lat),
        // point: { pixelSize: 12, color: Color.RED, heightReference: HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        billboard: {
            // 图像地址，URI或Canvas的属性
            image: '/testdata/images/mark1.png',
            // 高度（以像素为单位）
            height: 50,
            // 宽度（以像素为单位）
            width: 50,
            // 相对于坐标的垂直位置
            verticalOrigin: VerticalOrigin.BOTTOM,
            // 相对于坐标的水平位置
            horizontalOrigin: HorizontalOrigin.CENTER,
            // 关闭深度测试，避免被地形遮挡
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            // 贴地显示（与 point 保持一致）
            heightReference: HeightReference.CLAMP_TO_GROUND,
            // 应用于图像的统一比例。比例大于会1.0放大标签，而比例小于会1.0缩小标签。
            scale: 0.5,
            // 是否显示
            show: true

        }

    })

}

const addLabel = (viewer: Viewer, text: string, lon: number, lat: number) => {

    viewer?.entities.add({
        position: Cartesian3.fromDegrees(lon, lat),
        // point: { pixelSize: 12, color: Color.RED, heightReference: HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        label: {
            text: text,
            font: '14pt Source Han Sans CN',
            fillColor: Color.BLUE,
            backgroundColor: Color.YELLOW,
            showBackground: true,
            scale: 1.0,
            style: LabelStyle.FILL_AND_OUTLINE,
            // 相对于坐标的水平位置
            verticalOrigin: VerticalOrigin.CENTER,
            // 相对于坐标的水平位置
            horizontalOrigin: HorizontalOrigin.LEFT,
            // 该属性指定标签在屏幕空间中距此标签原点的像素偏移量
            pixelOffset: new Cartesian2(10, 0),
            // 关闭深度测试，避免被地形遮挡
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            // 贴地显示（与 point 保持一致）
            heightReference: HeightReference.CLAMP_TO_GROUND,
            // 是否显示
            show: true

        }

    })

}

onBeforeUnmount(() => {
    let viewer = CesiumViewer.viewer
    viewer?.entities.removeAll()
})




</script>
<style scoped>
.tdt-geocoder-container {
    padding: 10px;
    text-align: left;

    .tdt-geocoder-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;

    }
    .tdt-geocoder-select {
        margin-top: 10px;
        .el-select{
            width:100% !important;
        }
    }
}
</style>