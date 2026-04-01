<template>
  <div class="menu-tree-wrapper">
    <el-input
      v-if="!collapsed"
      v-model="filterText"
      placeholder="请输入功能名称"
      class="filter-input"
    />
    <el-tree
      ref="treeRef"
      class="filter-tree"
      :class="{ 'tree-collapsed': collapsed }"
      :data="menuTreeData"
      :filter-node-method="filterNode"
      @node-click="HandNodeClick"
      :accordion="true"
      :indent="24"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <el-icon class="menu-icon">
            <component :is="iconMap[data.icon]" v-if="data.icon && iconMap[data.icon]" />
          </el-icon>
          <span v-if="!collapsed" class="menu-label">
            {{ node.label }}
          </span>
        </span>
      </template>
    </el-tree>
  </div>
</template>
<script lang="ts" setup>
import menuTreeData from '@/system/Config/MenuTreeConfig'
import { ElTree, ElIcon } from 'element-plus'
import {
  Folder,
  EditPen,
  Edit,
  Brush,
  Location,
  Grid,
  Search,
  Box,
  Aim,
  Picture,
  Setting,
  Cloudy,
  Files,
  MapLocation,
  Collection,
  DataAnalysis,
  Coffee,
  Odometer
} from '@element-plus/icons-vue'
import type { Component } from 'vue'

// Props定义
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['targetComponentCode'])

// 图标映射表 - 优雅且可维护
const iconMap: Record<string, Component> = {
  Files,
  MapLocation,
  Folder,
  EditPen,
  Edit,
  Brush,
  Location,
  Grid,
  Search,
  Box,
  Aim,
  Picture,
  Setting,
  Cloudy,
  Collection,
  DataAnalysis,
  Coffee,
  Odometer
}

// 响应式数据
const filterText = ref('')
const treeRef = ref<InstanceType<typeof ElTree>>()

// 过滤监听
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

// 过滤方法
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.includes(value)
}

// 节点点击处理
const HandNodeClick = (clickNode: any, node: any) => {
  if (node.isLeaf) {
    emits("targetComponentCode", clickNode.componentCode)
  }
}
</script>

<style lang="scss" scoped>
.menu-tree-wrapper {
  padding: 12px;
}

.filter-input {
  margin-bottom: 12px;
  --el-input-bg-color: rgba(89, 69, 69, 0.8);
  --el-input-text-color: #e9edf5;
  --el-input-placeholder-color: #95a5a6;
  --el-input-border-color: rgba(52, 73, 94, 0.5);

  :deep(.el-input__wrapper) {
    background-color: rgba(89, 69, 69, 0.8);
    box-shadow: 0 0 0 1px rgba(52, 73, 94, 0.5) inset;
  }

  :deep(.el-input__inner) {
    color: #e9edf5;
  }
}

.filter-tree {
  background: transparent;
  color: #e9edf5;
  --el-tree-node-hover-bg-color: rgba(134, 140, 150, 0.6);
  --el-tree-text-color: #e9edf5;
  --el-tree-expand-icon-color: transparent;

  :deep(.el-tree-node__content) {
    height: 40px;
    border-radius: 4px;
    margin-bottom: 4px;
    transition: all 0.2s;
    padding-left: 8px !important; /* 减少基础左内边距，给缩进留空间 */
    justify-content: flex-start; /* 左对齐 */

    &:hover {
      background-color: rgba(134, 140, 150, 0.6);
    }
  }

  /* 子菜单缩进样式 */
  :deep(.el-tree-node__children) {
    .el-tree-node__content {
      padding-left: 32px !important; /* 子菜单额外缩进 */
    }
  }

  :deep(.el-tree-node__expand-icon) {
    display: none; /* 完全隐藏三角箭头 */
  }

  &.tree-collapsed {
    :deep(.el-tree-node__content) {
      justify-content: center;
      padding: 0 !important;
    }

    .menu-icon {
      margin-right: 0;
    }
  }
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  gap: 8px;
  text-align: left; /* 文字左对齐 */
}

.menu-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-right: 4px;
}

.menu-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-right: 4px;
}

.menu-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
</style>
