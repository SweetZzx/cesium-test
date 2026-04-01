<template>
  <div class="cluster-container">
    <span class="cluster-title">聚合效果</span>
    <div class="cluster-content">
      <div class="cluster-section">
        <div class="section-label">测试区域：西安周边</div>
        <p class="section-desc">点击下方按钮在西安周边生成聚合测试点</p>
      </div>
      <div class="cluster-btns">
        <el-button type="primary" @click="EntityClusterOnScene">
          Entity聚合 (1000点)
        </el-button>
        <el-button type="primary" @click="PrimitiveClusterOnScene">
          Primitive聚合 (5000点)
        </el-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import EntityCluster, { ClusterPoint } from '@/system/VectorEffect/EntityCluster';

import PrimitiveCluster2 from '@/system/VectorEffect/PrimitiveCluster';
import CesiumViewer from '@/Viewer/CesiumViewer';


let viewer = CesiumViewer.viewer


const EntityClusterOnScene = () => {

  const cluster = new EntityCluster(viewer!)
  // 西安坐标：经度 108.9°E，纬度 34.3°N，在西安周边生成测试点
  const pts: ClusterPoint[] = Array.from({ length: 1000 }, (_, i) => ({
    id: `p-${i}`,
    position: [
      108.4 + Math.random() * 1.0,  // 经度范围：108.4 - 109.4
      33.8 + Math.random() * 1.0,   // 纬度范围：33.8 - 34.8
      0,
    ],
  }))
  cluster.AddPoints(pts)

}

const PrimitiveClusterOnScene = async () => {

  // 西安坐标：经度 108.9°E，纬度 34.3°N，在西安周边生成测试点
  const pts: ClusterPoint[] = Array.from({ length: 5000 }, (_, i) => ({
    id: `p-${i}`,
    position: [
      108.4 + Math.random() * 1.0,  // 经度范围：108.4 - 109.4
      33.8 + Math.random() * 1.0,   // 纬度范围：33.8 - 34.8
      0,
    ],
  }))

  const cluster = new PrimitiveCluster2(viewer!)
  cluster.AddPoints(pts)

}

onBeforeUnmount(() => {
  viewer?.entities.removeAll()
  viewer?.scene.primitives.removeAll()
})




</script>
<style lang="scss" scoped>
.cluster-container {
  padding: 15px 20px;
  width: 240px;
  text-align: left;

  .cluster-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #ecf0f1;
    display: block;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 10px;
  }

  .cluster-content {
    text-align: left;
  }

  .cluster-section {
    margin-bottom: 20px;

    .section-label {
      font-size: 14px;
      color: #bdc3c7;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .section-desc {
      font-size: 12px;
      color: #7f8c8d;
      margin: 0;
    }
  }

  .cluster-btns {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .el-button {
      width: 100%;
      background: rgba(52, 73, 94, 0.6);
      border-color: rgba(149, 165, 166, 0.8);
      color: #ecf0f1;

      &:hover {
        background: #3498db;
        border-color: #3498db;
      }
    }
  }
}
</style>