/** 几何图形类型枚举 */
export enum GeometryType {
    'COMMON_POINT',
    'COMMON_LABEL',
    'COMMON_BILLBOARD',
    'COMMON_MODEL',
    'COMMON_LINE',
    'COMMON_POLYGON',
    'COMMON_RECTANGLE',
    'COMMON_CIRCLE',
    'COMMON_ELLIPSE',
    'COMMON_ELLIPSE2',
    'COMMON_SECTOR',
    'COMMON_WALL',
    'STRAIGHT_ARROW',
    'STRAIGHT_LINE_ARROW',
    'ATTACK_ARROW',
    'SWALLOWTAIL_ATTACK_ARROW',
    'PINCER_ATTACK_ARROW'
}

/** 类型分组显示名映射 */
export const GeometryTypeLabel: Record<GeometryType, string> = {
    [GeometryType.COMMON_POINT]: '点',
    [GeometryType.COMMON_LINE]: '线',
    [GeometryType.COMMON_POLYGON]: '面',
    [GeometryType.COMMON_RECTANGLE]: '矩形',
    [GeometryType.COMMON_CIRCLE]: '圆',
    [GeometryType.COMMON_ELLIPSE]: '椭圆',
    [GeometryType.COMMON_ELLIPSE2]: '椭圆2',
    [GeometryType.COMMON_SECTOR]: '扇形',
    [GeometryType.COMMON_BILLBOARD]: '广告牌',
    [GeometryType.COMMON_LABEL]: '标签',
    [GeometryType.COMMON_MODEL]: '模型',
    [GeometryType.COMMON_WALL]: '墙体',
    [GeometryType.STRAIGHT_ARROW]: '直线箭头',
    [GeometryType.STRAIGHT_LINE_ARROW]: '直线箭头',
    [GeometryType.ATTACK_ARROW]: '攻击箭头',
    [GeometryType.SWALLOWTAIL_ATTACK_ARROW]: '燕尾箭头',
    [GeometryType.PINCER_ATTACK_ARROW]: '钳式箭头',
};
