
import CoordinatesUtil from "@/system/Utils/CoordinatesUtil";
import TurfUtil from "@/system/Utils/TurfUtil";
import { Cartesian3, Cartographic, Matrix4, Transforms, Math as CesiumMath } from "cesium";
import * as turf from '@turf/turf';
import type { Units } from '@turf/turf';
import { pointToLineDistance } from "@/system/Utils/MathCalculateUtil";


/**
 * 创建矩形的四个点，顺时针返回
 * @param pos 传入的两个点
 * @returns 矩形的四个点，顺时针返回
 */
export const CreateRectanglePoints = (pos: Cartesian3[]) => {
    if (pos.length !== 2) return pos;
    const carto1 = Cartographic.fromCartesian(pos[0]);
    const carto2 = Cartographic.fromCartesian(pos[1]);

    const minLon = Math.min(carto1.longitude, carto2.longitude);
    const maxLon = Math.max(carto1.longitude, carto2.longitude);
    const minLat = Math.min(carto1.latitude, carto2.latitude);
    const maxLat = Math.max(carto1.latitude, carto2.latitude);

    const height = (carto1.height + carto2.height) / 2;

    // 顺时针：左下、左上、右上、右下
    const leftBottom = Cartesian3.fromRadians(minLon, minLat, height);
    const leftTop = Cartesian3.fromRadians(minLon, maxLat, height);
    const rightTop = Cartesian3.fromRadians(maxLon, maxLat, height);
    const rightBottom = Cartesian3.fromRadians(maxLon, minLat, height);

    return [leftBottom, leftTop, rightTop, rightBottom];
};

export const circleRadiusCallback = (pos: Cartesian3[]) => {
    if (pos.length !== 2) return 0;
    return Cartesian3.distance(pos[0], pos[1]);
}

export const CreateEllipsePoints = (pos: Cartesian3[]) => {

    const lnglatPoints = CoordinatesUtil.cartesianArrayToWGS84Array(pos);

    const pnt1 = lnglatPoints[0];
    const pnt2 = lnglatPoints[1];

    const center = CoordinatesUtil.MidPoint(pnt1, pnt2);

    let leftPoint = [pnt1[0], center[1]];
    let topPoint = [center[0], pnt2[1]];
    let options = { units: 'kilometers' as Units };


    let xSemi = turf.distance(leftPoint, center, options)
    let ySemi = turf.distance(topPoint, center, options)
    let geometry = turf.ellipse(center, xSemi, ySemi, options)
    return TurfUtil.TurfGeometry2Cartesians(geometry);
}
export const CreateEllipse2Points = (pos: Cartesian3[]) => {  

    // 1. 圆心
    const center = Cartesian3.midpoint(pos[0], pos[1], new Cartesian3());
    // 2. 长半轴
    let semiMajorAxis = Cartesian3.distance(pos[0], pos[1]) / 2;
    // 3. 短半轴
    let semiMinorAxis = pointToLineDistance(pos[2], pos[0], pos[1]);
    // 4. rotation
    // ENU变换
    const enuToFixed = Transforms.eastNorthUpToFixedFrame(center);
    const fixedToEnu = Matrix4.inverse(enuToFixed, new Matrix4());
    const p2ENU = Matrix4.multiplyByPoint(fixedToEnu, pos[1], new Cartesian3());
    const centerENU = new Cartesian3(0, 0, 0);
    const majorVecENU = Cartesian3.subtract(p2ENU, centerENU, new Cartesian3());
    // rotation是与正东（x轴）的夹角
    let rotation = Math.atan2(majorVecENU.y, majorVecENU.x);
    // 5. 保证semiMajorAxis >= semiMinorAxis
    if (semiMajorAxis < semiMinorAxis) {
        [semiMajorAxis, semiMinorAxis] = [semiMinorAxis, semiMajorAxis];
        rotation += Math.PI / 2;
    }

    // 归一化到[0, 2PI]
    rotation = (rotation + 2 * Math.PI) % (2 * Math.PI);

    return {    
        semiMajorAxis,
        semiMinorAxis,
        rotation
    };

}

export const CreateEllipse3Points = (pos: Cartesian3[]) => {

    const lnglatPoints = CoordinatesUtil.cartesianArrayToWGS84Array(pos);
    const pnt1 = lnglatPoints[0];
    const pnt2 = lnglatPoints[1];

    let pnt3 = [pnt1[0], lnglatPoints[2][1]];
    let options = { units: 'kilometers' as Units };
    let ySemi = turf.distance(pnt1, pnt3, options)
    let xSemi = turf.distance(pnt1, pnt2, options)
    let geometry = turf.ellipse(pnt1, xSemi, ySemi, options)
    return TurfUtil.TurfGeometry2Cartesians(geometry);

}


/**
 * 创建扇形数据点
 * @param pos 传入的三个点
 * @returns 
 */
export const CreateSectorPoints = (pos: Cartesian3[]) => {
    if (pos.length !== 3) return pos;

    let center = pos[0];
    let p1 = pos[1];
    let p2 = pos[2];

    // 1. 半径
    const radius = Cartesian3.distance(center, p1);

    // 2. 把三点转到局部 ENU 平面，方便算夹角
    const toLocal = Transforms.eastNorthUpToFixedFrame(center);
    const inv = Matrix4.inverse(toLocal, new Matrix4());

    const q1 = Matrix4.multiplyByPoint(inv, p1, new Cartesian3());
    const q2 = Matrix4.multiplyByPoint(inv, p2, new Cartesian3());

    // 3. 起始角、终止角
    let start = Math.atan2(q1.y, q1.x);
    let end = Math.atan2(q2.y, q2.x);
    if (end < start) end += CesiumMath.TWO_PI;   // 保证逆时针

    // 4. 三角网：圆心 + 圆弧插值
    const positions: number[][] = [];

    const N = 64;               // 插值数，可改
    for (let i = 0; i <= N; i++) {
        const angle = start + (end - start) * (i / N);
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const z = 0;
        positions.push([x, y, z]);
    }
    //ENU 转回 WGS84
    const worldPositions: Cartesian3[] = [];
    // 先把圆心（世界坐标）放进去
    worldPositions.push(center);
    // 再把圆弧上的点逐个转回世界
    for (let i = 0; i < positions.length; i++) {
        const local = new Cartesian3(positions[i][0], positions[i][1], positions[i][2]);
        const world = Matrix4.multiplyByPoint(toLocal, local, new Cartesian3());
        worldPositions.push(world);
    }
    return worldPositions;
}

