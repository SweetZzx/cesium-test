<template>

    <div class="situation-draw-container">
        <div class="draw-title-container">

            <span class="situation-draw-title"> 态势标绘、编辑</span>
            <el-button type="danger" size="small" @click="ClearAllShapes">全部清除</el-button>
        </div>
        <div class="draw-btns">
            <el-button type="primary" @click="DrawStraightArrowOnScene">直箭头</el-button>
            <el-button type="primary" @click="DrawStraightLineArrowOnScene">细直线箭头</el-button>
            <el-button type="primary" @click="DrawAttackArrowOnScene">攻击箭头</el-button>
            <el-button type="primary" @click="DrawSwallowtailAttackArrowOnScene">燕尾攻击箭头</el-button>
             <el-button type="primary" @click="DrawPincerAttackArrowOnScene">钳形攻击箭头</el-button>

        </div>
        <el-text>{{ drawInfo }}</el-text>
        
    </div>




   
</template>

<script setup lang="ts">
import AttackArrow from '@/system/Draw/SituationDraw/AttackArrow';
import PincerAttackArrow from '@/system/Draw/SituationDraw/PincerAttackArrow';
import StraightArrow from '@/system/Draw/SituationDraw/StraightArrow';
import StraightLineArrow from '@/system/Draw/SituationDraw/StraightLineArrow';
import SwallowtailAttackArrow from '@/system/Draw/SituationDraw/SwallowtailAttackArrow';
import { useCesium } from '@/composables/core/useCesium'
import { useDispatcherEvents } from '@/composables/core/useDispatcherEvents'
import { useDrawInstance } from '@/composables/draw/useDrawInstance'

const { viewer, dispatcher } = useCesium()
const { on: onEvent } = useDispatcherEvents(dispatcher)
const { startDraw } = useDrawInstance(viewer, dispatcher)

const drawInfo = ref('')

// 监听绘制事件（组件卸载时自动清理）
onEvent('DRAWEND', (payload: any) => {
    drawInfo.value = payload.text;
});
onEvent('DRAWSTART', (payload: any) => {
    drawInfo.value = payload.text;
});
onEvent('MOUSEMOVE', (payload: any) => {
    drawInfo.value = payload.text;
});
onEvent('EDITSTART', (payload: any) => {
    drawInfo.value = payload.text;
});
onEvent('EDITEND', (payload: any) => {
    drawInfo.value = payload.text;
});

const DrawStraightArrowOnScene = () => startDraw(StraightArrow)
const DrawStraightLineArrowOnScene = () => startDraw(StraightLineArrow)
const DrawAttackArrowOnScene = () => startDraw(AttackArrow)
const DrawSwallowtailAttackArrowOnScene = () => startDraw(SwallowtailAttackArrow)
const DrawPincerAttackArrowOnScene = () => startDraw(PincerAttackArrow)

const ClearAllShapes = () => {
    viewer.entities.removeAll();
}
</script>

<style scoped lang="scss">
.situation-draw-container {
    padding: 20px;
    text-align: left;
    .draw-title-container{
        display: flex;
        justify-content: space-between;
     
    }

    .situation-draw-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .draw-btns {
        margin-top: 20px;
        margin-bottom: 20px;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: center;
        gap: 16px 24px;
        min-height: 90px;
    }
    .draw-btns .el-button {
        flex: 0 1 calc(50% - 24px);
        width: 100px;
        margin: 0;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .el-text {
        color: yellow
    }
}


</style>
   