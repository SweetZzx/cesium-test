# Cesium-Test

基于 Cesium + Vue 3 + TypeScript 的三维地球可视化项目。

## 功能特性

### 图层管理

- GeoJSON 数据加载
- KML/KMZ 数据加载
- CZML 数据加载
- 3D Tiles 模型加载
- MVT 矢量切片
- 动态图层控制

### 绘制功能

- **基础图形**：点、线、面、矩形、圆形、扇形、椭圆
- **实体标注**：广告牌、模型、文本标签
- **态势标绘**：直线箭头、直行箭头、钳击箭头（攻击箭头）、燕尾箭头
- **墙体绘制**

### 空间分析

- 距离量测
- 面积量测
- 洪水淹没分析

### 效果优化

- 实体聚合（Billboard / Point / Label 聚合）
- 动态模型调整（位置、样式）
- 大气、光照、背景控制

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建 | Vite 7 |
| 三维引擎 | Cesium 1.139 |
| UI 组件 | Element Plus |
| 地理分析 | Turf.js |
| 矢量切片 | mapbox-vector-tile |
| 样式 | Sass |

## 项目结构

```
src/
├── components/          # Vue 组件
│   ├── Draw/           # 绘制组件
│   ├── GlobalControl/  # 全局控制（大气、背景）
│   ├── LayerManager/   # 图层管理
│   ├── Measure/        # 量测工具
│   ├── Menu/          # 菜单树
│   ├── ModelRelated/  # 模型相关
│   ├── MouseStatusInfo/# 鼠标状态信息
│   ├── SpatialAnalysis/# 空间分析
│   └── VectorEffect/   # 矢量效果
├── system/             # 核心业务逻辑
│   ├── Common/        # 枚举、接口定义
│   ├── Config/        # 配置项
│   ├── Draw/          # 绘制模块
│   │   ├── Lines/    # 线段绘制
│   │   ├── Labels/   # 标签绘制
│   │   ├── Points/   # 点位绘制
│   │   ├── Polygons/ # 多边形绘制
│   │   ├── SituationDraw/  # 态势标绘
│   │   └── Walls/    # 墙体绘制
│   ├── Edit/          # 编辑模块
│   ├── LayerManager/ # 图层管理
│   ├── Measure/      # 量测模块
│   ├── ModelRelated/ # 模型管理
│   ├── SpatialAnalysis/  # 空间分析
│   ├── Utils/        # 工具函数
│   └── VectorEffect/ # 矢量效果（聚合）
├── Viewer/            # Cesium  viewer 封装
└── views/            # 页面视图
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 复制环境变量模板
cp .env.example .env
# 编辑 .env，填写 Cesium Token 和天地图 Key

# 开发
pnpm run dev

# 构建
pnpm run build

# 预览
pnpm run preview
```

## 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `VITE_CESIUM_TOKEN` | Cesium Ion Token | 是 |
| `VITE_TDT_KEY` | 天地图 Key | 是 |
| `VITE_SERVER_DATA_URL` | 静态数据服务地址 | 否 |
| `VITE_TERRAIN_URL` | 地形服务地址 | 否 |

获取 Token：
- [Cesium Ion](https://cesium.com/ion/) 注册获取
- [天地图 API Key](http://lbs.tianditu.gov.cn/) 申请

## License

MIT
