import EarthDataLayers from "@/components/LayerManager/EarthDataLayers.vue"
import { MenuEnum } from "../Common/enums"
import CustomDataLayers from "@/components/LayerManager/CustomDataLayers.vue"
import CommonDraw from "@/components/Draw/CommonDraw.vue"
import SituationPlotDraw from "@/components/Draw/SituationPlotDraw.vue"
import Cluster from "@/components/VectorEffect/Cluster.vue"
import PlaceNameSearch from "@/components/VectorEffect/PlaceNameSearch.vue"
import ChangeModelPositionHdr from "@/components/ModelRelated/ChangeModelPositionHdr.vue"
import AtmoshereControl from "@/components/GlobalControl/AtmoshereControl.vue"
import BackGroundControl from "@/components/GlobalControl/BackGroundControl.vue"
import ChangeGlbStyle from "@/components/ModelRelated/ChangeGlbStyle.vue"
import FloodAnalysis from "@/components/SpatialAnalysis/FloodAnalysis.vue"
import MeasureTool from "@/components/Measure/MeasureTool.vue"
import CloudControl from "@/components/GlobalControl/CloudControl.vue"
import RainControl from "@/components/GlobalControl/RainControl.vue"
import SnowControl from "@/components/GlobalControl/SnowControl.vue"
import FogControl from "@/components/GlobalControl/FogControl.vue"
import ImageryStyleControl from "@/components/GlobalControl/ImageryStyleControl.vue"
import SnowMaskControl from "@/components/GlobalControl/SnowMaskControl.vue"
import HeightFogControl from "@/components/GlobalControl/HeightFogControl.vue"
import BufferAnalysis from "@/components/SpatialAnalysis/BufferAnalysis.vue"
import MigrationLineControl from "@/components/VectorEffect/MigrationLineControl.vue"
import ElectronicFenceControl from "@/components/VectorEffect/ElectronicFenceControl.vue"



const menuComponentMap:Record<MenuEnum, Component> = {
    [MenuEnum.EarthDataLayers]: markRaw(EarthDataLayers),
    [MenuEnum.CustomDataLayer]: markRaw(CustomDataLayers),
    [MenuEnum.CommonDraw]: markRaw(CommonDraw),
    [MenuEnum.SituationPlotDraw]: markRaw(SituationPlotDraw),
    [MenuEnum.Cluster]: markRaw(Cluster),
    [MenuEnum.PlaceNameSearch]: markRaw(PlaceNameSearch),
    [MenuEnum.ChangeModelPositionHdr]: markRaw(ChangeModelPositionHdr),
    [MenuEnum.ChangeGlbStyle]: markRaw(ChangeGlbStyle),        
    [MenuEnum.AtmosphereControl]: markRaw(AtmoshereControl),
    [MenuEnum.BackGroundControl]: markRaw(BackGroundControl),
    [MenuEnum.FloodAnalysis]: markRaw(FloodAnalysis),
    [MenuEnum.MeasureTool]: markRaw(MeasureTool),
    [MenuEnum.CloudControl]: markRaw(CloudControl),
    [MenuEnum.RainControl]: markRaw(RainControl),
    [MenuEnum.SnowControl]: markRaw(SnowControl),
    [MenuEnum.FogControl]: markRaw(FogControl),
    [MenuEnum.ImageryStyleControl]: markRaw(ImageryStyleControl),
    [MenuEnum.SnowMaskControl]: markRaw(SnowMaskControl),
    [MenuEnum.HeightFogControl]: markRaw(HeightFogControl),
    [MenuEnum.BufferAnalysis]: markRaw(BufferAnalysis),
    [MenuEnum.MigrationLine]: markRaw(MigrationLineControl),
    [MenuEnum.ElectronicFence]: markRaw(ElectronicFenceControl),

}

export default menuComponentMap