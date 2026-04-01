import { Entity, Viewer } from 'cesium';
import CesiumViewer from '@/Viewer/CesiumViewer';
import { GeometryType, GeometryTypeLabel } from './GeometryType';

/** 管理实体的元数据 */
export interface IManagedEntity {
    id: string;
    name: string;
    type: GeometryType;
    entity: Entity;
    visible: boolean;
}

/** 按类型分组的实体管理器（单例） */
export class EntityManager {
    private static instance: EntityManager;
    private viewer: Viewer;
    private entityMap = new Map<string, IManagedEntity>();
    private typeMap = new Map<GeometryType, IManagedEntity[]>();
    private autoId = 0;

    private constructor(viewer: Viewer) {
        this.viewer = viewer;
    }

    static getInstance(viewer?: Viewer): EntityManager {
        if (!EntityManager.instance) {
            EntityManager.instance = new EntityManager(viewer ?? CesiumViewer.viewer!);
        }
        return EntityManager.instance;
    }

    register(entity: Entity, geometryType: GeometryType): IManagedEntity {
        const id = `entity_${++this.autoId}`;
        const label = GeometryTypeLabel[geometryType] ?? '未知';
        const managed: IManagedEntity = {
            id,
            name: `${label}_${id}`,
            type: geometryType,
            entity,
            visible: true,
        };
        this.entityMap.set(id, managed);

        if (!this.typeMap.has(geometryType)) {
            this.typeMap.set(geometryType, []);
        }
        this.typeMap.get(geometryType)!.push(managed);

        return managed;
    }

    remove(id: string): boolean {
        const managed = this.entityMap.get(id);
        if (!managed) return false;

        this.viewer.entities.remove(managed.entity);
        this.entityMap.delete(id);

        const list = this.typeMap.get(managed.type);
        if (list) {
            const idx = list.indexOf(managed);
            if (idx >= 0) list.splice(idx, 1);
            if (list.length === 0) this.typeMap.delete(managed.type);
        }
        return true;
    }

    removeByType(type: GeometryType): void {
        const list = this.typeMap.get(type);
        if (!list) return;
        for (const m of list) {
            this.viewer.entities.remove(m.entity);
            this.entityMap.delete(m.id);
        }
        this.typeMap.delete(type);
    }

    toggleByType(type: GeometryType): void {
        const list = this.typeMap.get(type);
        if (!list || list.length === 0) return;
        const newVisible = !list[0].visible;
        for (const m of list) {
            m.entity.show = newVisible;
            m.visible = newVisible;
        }
    }

    showByType(type: GeometryType, visible: boolean): void {
        const list = this.typeMap.get(type);
        if (!list) return;
        for (const m of list) {
            m.entity.show = visible;
            m.visible = visible;
        }
    }

    toggle(id: string): void {
        const managed = this.entityMap.get(id);
        if (!managed) return;
        managed.visible = !managed.visible;
        managed.entity.show = managed.visible;
    }

    getEntitiesByType(type: GeometryType): IManagedEntity[] {
        return this.typeMap.get(type) ?? [];
    }

    getRegisteredTypes(): GeometryType[] {
        return Array.from(this.typeMap.keys());
    }

    isTypeVisible(type: GeometryType): boolean {
        const list = this.typeMap.get(type);
        if (!list || list.length === 0) return true;
        return list[0].visible;
    }

    clear(): void {
        for (const m of this.entityMap.values()) {
            this.viewer.entities.remove(m.entity);
        }
        this.entityMap.clear();
        this.typeMap.clear();
    }
}
