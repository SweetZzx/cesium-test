import { Cartesian3 } from "cesium";

/**
 * 计算两个坐标之间的距离
 * @param pnt1
 * @param pnt2
 * @returns {number}
 * @constructor
 */
export const MathDistance = (pnt1: number[], pnt2: number[]) => Math.sqrt((pnt1[0] - pnt2[0]) ** 2 + (pnt1[1] - pnt2[1]) ** 2);
/**
 * 获取基础长度
 * @param points
 * @returns {number}
 */
export const getBaseLength = (points: number[][]) => wholeDistance(points) ** 0.99;

/**
 * 计算点集合的总距离
 * @param points
 * @returns {number}
 */
export const wholeDistance = (points: number[][]) => {
    let distance = 0;
    if (points && Array.isArray(points) && points.length > 0) {
        points.forEach((item, index) => {
            if (index < points.length - 1) {
                distance += MathDistance(item, points[index + 1]);
            }
        });
    }
    return distance;
};

/**
 * 根据起止点和旋转方向求取第三个点
 * @param startPnt
 * @param endPnt
 * @param angle
 * @param distance
 * @param clockWise
 * @returns {[*,*]}
 */
export const getThirdPoint = (startPnt: number[], endPnt: number[], angle: number, distance: number, clockWise: boolean): number[] => {
    const azimuth = getAzimuth(startPnt, endPnt);
    const alpha = clockWise ? azimuth! + angle : azimuth! - angle;
    const dx = distance * Math.cos(alpha);
    const dy = distance * Math.sin(alpha);
    return [endPnt[0] + dx, endPnt[1] + dy];
};

/**
 * 插值线性点
 * @param points
 * @returns {*}
 */
export const getQBSplinePoints = (points: number[][]) => {
    if (points.length <= 2) {
        return points;
    }

    const n = 2;
    const bSplinePoints: number[][] = [];
    const m = points.length - n - 1;
    bSplinePoints.push(points[0]);
    for (let i = 0; i <= m; i++) {
        for (let t = 0; t <= 1; t += 0.05) {
            let [x, y] = [0, 0];
            for (let k = 0; k <= n; k++) {
                // eslint-disable-next-line
                const factor = getQuadricBSplineFactor(k, t);
                x += factor * points[i + k][0];
                y += factor * points[i + k][1];
            }
            bSplinePoints.push([x, y]);
        }
    }
    bSplinePoints.push(points[points.length - 1]);
    return bSplinePoints;
};

/**
 * 得到二次线性因子
 * @param k
 * @param t
 * @returns {number}
 */
export const getQuadricBSplineFactor = (k: number, t: number) => {
    let res = 0;
    if (k === 0) {
        res = (t - 1) ** 2 / 2;
    } else if (k === 1) {
        res = (-2 * t ** 2 + 2 * t + 1) / 2;
    } else if (k === 2) {
        res = t ** 2 / 2;
    }
    return res;
};



/**
 * 获取方位角（地平经度）
 * @param startPoint
 * @param endPoint
 * @returns {*}
 */
export const getAzimuth = (startPoint: number[], endPoint: number[]) => {
    let azimuth;
    const angle = Math.asin(Math.abs(endPoint[1] - startPoint[1]) / MathDistance(startPoint, endPoint));
    if (endPoint[1] >= startPoint[1] && endPoint[0] >= startPoint[0]) {
        azimuth = angle + Math.PI;
    } else if (endPoint[1] >= startPoint[1] && endPoint[0] < startPoint[0]) {
        azimuth = Math.PI * 2 - angle;
    } else if (endPoint[1] < startPoint[1] && endPoint[0] < startPoint[0]) {
        azimuth = angle;
    } else if (endPoint[1] < startPoint[1] && endPoint[0] >= startPoint[0]) {
        azimuth = Math.PI - angle;
    }
    return azimuth;
};

/**
 * 插值弓形线段点
 * @param center
 * @param radius
 * @param startAngle
 * @param endAngle
 * @returns {number[][]}
 */
export const getArcPoints = (center: number[], radius: number, startAngle: number, endAngle: number): number[][] => {

    let pnts: number[][] = [];
    let angleDiff = endAngle - startAngle;
    angleDiff = angleDiff < 0 ? angleDiff + Math.PI * 2 : angleDiff;
    for (let i = 0; i <= 100; i++) {
        const angle = startAngle + (angleDiff * i) / 100;
        let x = center[0] + radius * Math.cos(angle);
        let y = center[1] + radius * Math.sin(angle);
        pnts.push([x, y]);
    }
    return pnts;
}



/**
 * 判断是否是顺时针
 * @param pnt1
 * @param pnt2
 * @param pnt3
 * @returns {boolean}
 */
export const isClockWise = (pnt1: number[], pnt2: number[], pnt3: number[]) =>
    (pnt3[1] - pnt1[1]) * (pnt2[0] - pnt1[0]) > (pnt2[1] - pnt1[1]) * (pnt3[0] - pnt1[0]);

/**
 * 通过三个点获取方位角
 * @param pntA
 * @param pntB
 * @param pntC
 * @returns {number}
 */
export const getAngleOfThreePoints = (pntA: number[], pntB: number[], pntC: number[]) => {

    const angle = (getAzimuth(pntB, pntA) ?? 0) - (getAzimuth(pntB, pntC) ?? 0);
    return angle < 0 ? angle + Math.PI * 2 : angle;
};

/**
 * 贝塞尔曲线
 * @param points
 * @returns {*}
 */
export const getBezierPoints = (points: number[][]) => {
    if (points.length <= 2) {
        return points;
    }
    const bezierPoints = [];
    const n = points.length - 1;
    for (let t = 0; t <= 1; t += 0.01) {
        let [x, y] = [0, 0];
        for (let index = 0; index <= n; index++) {
            // eslint-disable-next-line
            const factor = getBinomialFactor(n, index);
            const a = t ** index;
            const b = (1 - t) ** (n - index);
            x += factor * a * b * points[index][0];
            y += factor * a * b * points[index][1];
        }
        bezierPoints.push([x, y]);
    }
    bezierPoints.push(points[n]);
    return bezierPoints;
};

/**
 * 获取二项分布
 * @param n
 * @param index
 * @returns {number}
 */
export const getBinomialFactor = (n: number, index: number) => getFactorial(n) / (getFactorial(index) * getFactorial(n - index));

/**
 * 获取阶乘数据
 * @param n
 * @returns {number}
 */
export function getFactorial(n: number): number {
    if (n < 0) throw new Error("n must be non-negative");
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}


// 计算点到线段距离
export function pointToLineDistance(pt: Cartesian3, lineStart: Cartesian3, lineEnd: Cartesian3): number {
    const v = Cartesian3.subtract(lineEnd, lineStart, new Cartesian3());
    const w = Cartesian3.subtract(pt, lineStart, new Cartesian3());
    const c1 = Cartesian3.dot(w, v);
    const c2 = Cartesian3.dot(v, v);
    let t = c1 / c2;
    t = Math.max(0, Math.min(1, t));
    const proj = Cartesian3.add(lineStart, Cartesian3.multiplyByScalar(v, t, new Cartesian3()), new Cartesian3());
    return Cartesian3.distance(pt, proj);
}



