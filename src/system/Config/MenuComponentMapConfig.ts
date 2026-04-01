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

}

export default menuComponentMap