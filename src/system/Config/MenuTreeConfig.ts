

import { IMenuTree } from "../Common/interfaces"
import { MenuEnum } from "../Common/enums"

const menuTreeData: IMenuTree[] = [
    {
        id: 1,
        label: '图层管理',
        icon: 'Files',
        children: [
            {
                id: '1-1',
                label: '底图',
                icon: 'MapLocation',
                componentCode: MenuEnum.EarthDataLayers,
                children: []
            },
            {
                id: '1-2',
                label: '自定义数据',
                icon: 'Folder',
                componentCode: MenuEnum.CustomDataLayer,
                children: []
            },

        ],
    },
    {
        id: 2,
        label: '标绘',
        icon: 'EditPen',
        children: [
            {
                id: '2-1',
                label: '普通标绘、编辑',
                icon: 'Edit',
                componentCode: MenuEnum.CommonDraw,
                children: []
            },
            {
                id: '2-1',
                label: '态势标绘、编辑',
                icon: 'Brush',
                componentCode: MenuEnum.SituationPlotDraw,
                children: []
            },

        ],
    },
    {
        id: 3,
        label: '矢量相关功能',
        icon: 'Location',
        children: [
            {
                id: '3-1',
                label: '聚合效果',
                icon: 'Grid',
                componentCode: MenuEnum.Cluster,
                children: []
            },
            // TODO: 地名搜索功能待完善
        // {
        //         id: '3-2',
        //         label: '地名搜索',
        //         icon: 'Search',
        //         componentCode: MenuEnum.PlaceNameSearch,
        //         children: []
        //     },
            {
                id: '3-3',
                label: '迁徙图',
                icon: 'Promotion',
                componentCode: MenuEnum.MigrationLine,
                children: []
            },
            {
                id: '3-4',
                label: '电子围栏',
                icon: 'Warning',
                componentCode: MenuEnum.ElectronicFence,
                children: []
            },

        ],

    },
    {
        id: 4,
        label: '三维模型功能',
        icon: 'Box',
        children: [
            {
                id: '4-1',
                label: '动态调整3dtiles位置、姿态',
                icon: 'Aim',
                componentCode: MenuEnum.ChangeModelPositionHdr,
                children: []
            },
            {
                id: '4-2',
                label: '动态调整glb/gltf样式',
                icon: 'Picture',
                componentCode: MenuEnum.ChangeGlbStyle,
                children: []
            },


        ],

    },
    {
        id: 5,
        label: '全局控制',
        icon: 'Setting',
        children: [
            // {
            //     id: '5-1',
            //     label: '大气环境控制',
            //     icon: 'Cloudy',
            //     componentCode: MenuEnum.AtmosphereControl,
            //     children: []
            // },
            // {
            //     id: '5-2',
            //     label: '全局背景',
            //     icon: 'Collection',
            //     componentCode: MenuEnum.BackGroundControl,
            //     children: []
            // },
            {
                id: '5-3',
                label: '云效果',
                icon: 'Cloudy',
                componentCode: MenuEnum.CloudControl,
                children: []
            },
            {
                id: '5-4',
                label: '雨效果',
                icon: 'Pouring',
                componentCode: MenuEnum.RainControl,
                children: []
            },
            {
                id: '5-5',
                label: '雪效果',
                icon: 'Drizzling',
                componentCode: MenuEnum.SnowControl,
                children: []
            },
            {
                id: '5-6',
                label: '雾效果',
                icon: 'MostlyCloudy',
                componentCode: MenuEnum.FogControl,
                children: []
            },
            {
                id: '5-7',
                label: '底图风格调整',
                icon: 'Sunny',
                componentCode: MenuEnum.ImageryStyleControl,
                children: []
            },
            {
                id: '5-8',
                label: '积雪效果',
                icon: 'Drizzling',
                componentCode: MenuEnum.SnowMaskControl,
                children: []
            },
            {
                id: '5-9',
                label: '高度雾效果',
                icon: 'Moon',
                componentCode: MenuEnum.HeightFogControl,
                children: []
            },


        ],

    },
    {
        id: 6,
        label: '空间分析',
        icon: 'DataAnalysis',
        children: [
            {
                id: '6-1',
                label: '淹没分析',
                icon: 'Coffee',
                componentCode: MenuEnum.FloodAnalysis,
                children: []
            },
            {
                id: '6-2',
                label: '空间量算',
                icon: 'Odometer',
                componentCode: MenuEnum.MeasureTool,
                children: []
            },
            {
                id: '6-3',
                label: '缓冲区分析',
                icon: 'Position',
                componentCode: MenuEnum.BufferAnalysis,
                children: []
            },
        ],

    }

]
export default menuTreeData
