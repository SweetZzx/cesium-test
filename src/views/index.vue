<template>
    <!-- 可折叠侧边栏 -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
        <div class="sidebar-header">
            <span v-if="!isCollapsed" class="sidebar-title">cesium-test</span>
            <el-button
                class="toggle-btn"
                @click="toggleSidebar"
                text
            >
                <el-icon :size="20">
                    <Fold v-if="!isCollapsed" />
                    <Expand v-else />
                </el-icon>
            </el-button>
        </div>
        <div class="sidebar-content">
            <MenuTree @targetComponentCode="HandleClickMenuNode" :collapsed="isCollapsed"></MenuTree>
        </div>
    </div>

    <div class="operate-area" v-if="currentComponent !== null">
        <component :is="currentComponent"></component>
    </div>
    <div id="cesium-container"></div>
    <div class="mouse-status-info">
        <MouseStatusInfo></MouseStatusInfo>
    </div>
</template>

<script lang="ts" setup>
import MenuTree from '@/components/Menu/MenuTree.vue';
import { MenuEnum } from '@/system/Common/enums';
import menuComponentMap from '@/system/Config/MenuComponentMapConfig';
import CesiumViewer from '@/Viewer/CesiumViewer';
import { Expand, Fold } from '@element-plus/icons-vue';
import { ElIcon } from 'element-plus';

import type { Component } from 'vue';

let currentComponent = ref<Component | null>(null);
const isCollapsed = ref(false);

onMounted(() => {
    CesiumViewer.CreateViewer("cesium-container")
});

const HandleClickMenuNode = (componentCode: number) => {
    currentComponent.value = menuComponentMap[componentCode as MenuEnum];
}

const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value;
}
</script>

<style scoped>
#cesium-container {
    width: 100%;
    height: 100%;
    left: 0px;
    top: 0px;
    position: absolute;

}

/* 侧边栏样式 */
.sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: calc(100vh - 30px);
    width: 240px;
    background: #333541ab;
    z-index: 100;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
    transition: width 0.3s ease;
    display: flex;
    flex-direction: column;
}

.sidebar-collapsed {
    width: 60px;
}

.sidebar-header {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: rgba(51, 53, 65, 0.6);
    border-bottom: 1px solid rgba(52, 73, 94, 0.3);
}

.sidebar-title {
    color: #ecf0f1;
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
}

.toggle-btn {
    color: #ecf0f1 !important;
    padding: 8px;
    min-width: auto;

    &:hover {
        background-color: rgba(134, 140, 150, 0.3) !important;
    }
}

.sidebar-collapsed .sidebar-header {
    justify-content: center;
    padding: 0;
}

.sidebar-collapsed .toggle-btn {
    padding: 8px;
}

.sidebar-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}

/* 隐藏滚动条 */
.sidebar-content::-webkit-scrollbar {
    display: none;
}

.sidebar-content {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.operate-area {
    width: 360px;
    z-index: 11;
    position: absolute;
    right: 50px;
    top: 80px;

    background: #333541ab;
    color: white;
    border-radius: 10px;

}

.mouse-status-info {
    position: fixed;
    left: 0px;
    right: 20px;
    bottom: 0px;
    height: 30px;
    margin-right: 20px;
    background: #333541ab;
    z-index: 11;
    width: calc(100% - 30px);
    line-height: 30px;
    color: white;

}
</style>
