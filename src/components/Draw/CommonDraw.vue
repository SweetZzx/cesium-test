<template>
    <div class="common-draw-container">
        <span class="common-draw-title">普通标绘、编辑</span>

        <!-- 绘制按钮区 -->
        <div class="draw-btns">
            <el-button type="primary" @click="DrawPointOnScene">点</el-button>
            <el-button type="primary" @click="DrawLineOnScene">线</el-button>
            <el-button type="primary" @click="DrawPolygonOnScene">多边形</el-button>
            <el-button type="primary" @click="DrawRectangleOnScene">矩形</el-button>
            <el-button type="primary" @click="DrawCircleOnScene">圆形</el-button>
            <el-button type="primary" @click="DrawSectorOnScene">扇形</el-button>
            <el-button type="primary" @click="DrawEllipseOnScene">椭圆</el-button>
            <el-button type="primary" @click="DrawBillboardOnScene">图标</el-button>
            <el-button type="primary" @click="DrawModelOnScene">模型</el-button>
            <el-button type="primary" @click="DrawWallOnScene">墙体</el-button>
        </div>

        <!-- 实体管理面板 -->
        <div class="entity-manager">
            <div class="manager-header">
                <span class="manager-title">实体管理</span>
                <el-button type="danger" size="small" @click="clearAll">清空全部</el-button>
            </div>

            <div v-if="entityGroups.length === 0" class="empty-tip">
                暂无已绘制的实体
            </div>

            <div v-for="group in entityGroups" :key="group.type" class="entity-group">
                <div class="group-header">
                    <span class="group-label">{{ group.label }}</span>
                    <el-switch
                        :model-value="group.visible"
                        active-text="显示"
                        inactive-text="隐藏"
                        @change="toggleType(group.type, $event)"
                    />
                    <el-button type="danger" size="small" plain @click="removeByType(group.type)">
                        删除
                    </el-button>
                </div>

                <div class="entity-list">
                    <div
                        v-for="item in group.entities"
                        :key="item.id"
                        class="entity-item"
                    >
                        <span class="entity-name">{{ item.name }}</span>
                        <el-switch
                            :model-value="item.visible"
                            size="small"
                            @change="toggleEntity(item.id)"
                        />
                        <el-button
                            type="danger"
                            size="small"
                            link
                            @click="removeEntity(item.id)"
                        >
                            删除
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import CommonLine from '@/system/Draw/Lines/CommonLine'
import CommonPoint from '@/system/Draw/Points/CommonPoint'
import CommonCircle from '@/system/Draw/Polygons/CommonCircle'
import CommonEllipse from '@/system/Draw/Polygons/CommonEllipse'
import CommonPolygon from '@/system/Draw/Polygons/CommonPolygon'
import CommonRectangle from '@/system/Draw/Polygons/CommonRectangle'
import CommonSector from '@/system/Draw/Polygons/CommonSector'
import CommonBillboard from '@/system/Draw/Points/CommonBillboard'
import CommonModel from '@/system/Draw/Points/CommonModel'
import CommonWall from '@/system/Draw/Walls/CommonWall'
import EventDispatcher from '@/system/EventDispatcher/EventDispatcher'
import CesiumViewer from '@/Viewer/CesiumViewer'
import {
    EntityManager,
    IManagedEntity,
} from '@/system/Draw/EntityManager'
import { GeometryType, GeometryTypeLabel } from '@/system/Draw/GeometryType'

const drawInfo = ref('')

let viewer = CesiumViewer.viewer!
const dispatcher = new EventDispatcher()
const entityManager = EntityManager.getInstance(viewer)

// 监听绘制事件
dispatcher.on('DRAWEND', (payload: any) => {
    drawInfo.value = payload.text
    refreshGroups()
})
dispatcher.on('DRAWSTART', (payload: any) => {
    drawInfo.value = payload.text
})
dispatcher.on('MOUSEMOVE', (payload: any) => {
    drawInfo.value = payload.text
})
dispatcher.on('EDITSTART', (payload: any) => {
    drawInfo.value = payload.text
})
dispatcher.on('EDITEND', () => {
    drawInfo.value = ''
    refreshGroups()
})

/** 需要在管理面板显示的类型 */
const MANAGED_TYPES: GeometryType[] = [
    GeometryType.COMMON_POINT,
    GeometryType.COMMON_LINE,
    GeometryType.COMMON_POLYGON,
    GeometryType.COMMON_RECTANGLE,
    GeometryType.COMMON_CIRCLE,
    GeometryType.COMMON_ELLIPSE,
    GeometryType.COMMON_SECTOR,
    GeometryType.COMMON_BILLBOARD,
    GeometryType.COMMON_WALL,
]

interface EntityGroup {
    type: GeometryType
    label: string
    visible: boolean
    entities: IManagedEntity[]
}

const entityGroups = ref<EntityGroup[]>([])

function refreshGroups() {
    entityGroups.value = MANAGED_TYPES
        .map((type) => {
            const entities = entityManager.getEntitiesByType(type)
            if (entities.length === 0) return null
            return {
                type,
                label: GeometryTypeLabel[type] ?? type,
                visible: entityManager.isTypeVisible(type),
                entities,
            } as EntityGroup
        })
        .filter(Boolean) as EntityGroup[]
}

// 绘制方法
const DrawPointOnScene = () => {
    new CommonPoint(viewer, dispatcher).start()
}
const DrawBillboardOnScene = () => {
    new CommonBillboard(viewer, dispatcher).start()
}
const DrawModelOnScene = () => {
    new CommonModel(viewer, dispatcher).start()
}
const DrawLineOnScene = () => {
    new CommonLine(viewer, dispatcher).start()
}
const DrawPolygonOnScene = () => {
    new CommonPolygon(viewer, dispatcher).start()
}
const DrawRectangleOnScene = () => {
    new CommonRectangle(viewer, dispatcher).start()
}
const DrawSectorOnScene = () => {
    new CommonSector(viewer, dispatcher).start()
}
const DrawCircleOnScene = () => {
    new CommonCircle(viewer, dispatcher).start()
}
const DrawEllipseOnScene = () => {
    new CommonEllipse(viewer, dispatcher).start()
}
const DrawWallOnScene = () => {
    new CommonWall(viewer, dispatcher).start()
}

// 管理操作
function toggleType(type: GeometryType, val: any) {
    const v = Boolean(val)
    entityManager.showByType(type, v)
    refreshGroups()
}

function removeByType(type: GeometryType) {
    entityManager.removeByType(type)
    refreshGroups()
}

function toggleEntity(id: string) {
    entityManager.toggle(id)
    refreshGroups()
}

function removeEntity(id: string) {
    entityManager.remove(id)
    refreshGroups()
}

function clearAll() {
    entityManager.clear()
    refreshGroups()
}
</script>

<style lang="scss" scoped>
.common-draw-container {
    padding: 20px;
    text-align: left;

    .common-draw-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .draw-btns {
        margin-top: 12px;
        margin-bottom: 12px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px 16px;
    }

    .draw-btns .el-button {
        width: 80px;
        margin: 0 auto;
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
    }

    .entity-manager {
        margin-top: 20px;
        border-top: 1px solid #333;
        padding-top: 16px;
        max-height: 300px;
        overflow-y: auto;

        .manager-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .manager-title {
                font-size: 14px;
                font-weight: 600;
            }
        }

        .empty-tip {
            color: #666;
            font-size: 13px;
            text-align: center;
            padding: 16px 0;
        }

        .entity-group {
            margin-bottom: 14px;
            border: 1px solid #2d2d2d;
            border-radius: 6px;
            overflow: hidden;

            .group-header {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                background: #1f1f1f;

                .group-label {
                    font-size: 13px;
                    font-weight: 600;
                    min-width: 40px;
                }

                .el-switch {
                    margin-left: auto;
                }
            }

            .entity-list {
                .entity-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 5px 12px;
                    border-top: 1px solid #2d2d2d;
                    font-size: 12px;

                    .entity-name {
                        flex: 1;
                        color: #ccc;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }
            }
        }
    }
}
</style>
