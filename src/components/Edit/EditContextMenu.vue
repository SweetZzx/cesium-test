<template>
    <Teleport to="body">
        <div
            v-if="visible"
            class="edit-context-menu"
            :style="{ left: menuX + 'px', top: menuY + 'px' }"
            @mousedown.prevent
        >
            <div class="menu-item" @click.stop="handleInsert">插入折点</div>
            <div class="menu-item" @click.stop="handleDelete">删除此点</div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { sharedDispatcher } from '@/system/EventDispatcher/EventDispatcher'
import { MultiEditManager } from '@/system/Edit/MultiEditManager'
import { Cartesian2 } from 'cesium'
import type { DrawEventType } from '@/system/Common/enums'

const visible = ref(false)
const menuX = ref(0)
const menuY = ref(0)

let pendingType = ''
let pendingPointIndex = -1
let pendingMousePosition: Cartesian2 | null = null

function showMenu(e: any) {
    pendingType = e.type
    pendingPointIndex = e.pointIndex ?? -1
    pendingMousePosition = e.mousePosition ?? null
    menuX.value = e.mouseX
    menuY.value = e.mouseY
    visible.value = true
}

function hideMenu() {
    visible.value = false
}

function handleInsert() {
    const helper = MultiEditManager.getInstance()?.getActiveHelper()
    if (helper && pendingMousePosition) {
        helper.onInsertHandler(pendingMousePosition)
    }
    hideMenu()
}

function handleDelete() {
    const helper = MultiEditManager.getInstance()?.getActiveHelper()
    if (helper && pendingPointIndex >= 0) {
        helper.onDeletePointHandler(pendingPointIndex)
    }
    hideMenu()
}

function onClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (!target.closest('.edit-context-menu')) {
        hideMenu()
    }
}

onMounted(() => {
    sharedDispatcher.on('EDITRIGHTCLICK' as DrawEventType, showMenu)
    document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
    sharedDispatcher.off('EDITRIGHTCLICK' as DrawEventType, showMenu)
    document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
.edit-context-menu {
    position: fixed;
    z-index: 9999;
    background: rgba(40, 44, 52, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    padding: 4px 0;
    min-width: 120px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    user-select: none;
}

.menu-item {
    padding: 8px 16px;
    color: #e8eaed;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
}

.menu-item:hover {
    background: rgba(64, 158, 255, 0.3);
    color: #409eff;
}
</style>
