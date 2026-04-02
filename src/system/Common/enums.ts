// 菜单项
export enum MenuEnum{
    EarthDataLayers,  //全球数据
    CustomDataLayer,   //自定义数据

    CommonDraw, //普通标绘
    SituationPlotDraw, //态势标绘

    Cluster, //Entity聚合
    PlaceNameSearch, //地名搜索

    ChangeModelPositionHdr, //动态3dtiles调整位置、姿态
    ChangeGlbStyle, //动态调整glb/gltf样式

    AtmosphereControl, //大气环境控制
    BackGroundControl, //全局背景控制

    FloodAnalysis, //淹没分析
    MeasureTool, //空间量算
}

//标绘状态
export enum DrawState{
    "IDLE", 
    'DRAWING',
    "EDIT"
}

/**事件类型 */
export type DrawEventType = 'DRAWSTART' | 'DRAWUPDATE' | 'DRAWEND' | 'EDITSTART'| 'EDITEND' | 'MOUSEMOVE' | 'WHEEL' | 'EDITRIGHTCLICK'
