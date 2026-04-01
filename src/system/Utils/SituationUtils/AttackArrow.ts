import CoordinatesUtil from "../CoordinatesUtil";
import { getAngleOfThreePoints, getBaseLength, getThirdPoint, MathDistance, wholeDistance } from "../MathCalculateUtil";

/**
 * 获取攻击箭头点数组
 * @param points 攻击箭头的控制点
 * @param tailLeft 攻击箭头的头点
 * @param tailRight 攻击箭头的尾点
 * @param headHeightFactor 攻击箭头头高因子
 * @param headWidthFactor 攻击箭头头宽因子
 * @param neckHeightFactor 攻击箭头脖子高因子
 * @param neckWidthFactor 攻击箭头脖子宽因子
 * @param headTailFactor 攻击箭头头尾因子
 * @returns 攻击箭头的头点数组
 */
export const getAttackArrowHeadPoints = (points: number[][], tailLeft: number[], tailRight: number[], headHeightFactor: number = 0.18, headWidthFactor: number = 0.3, neckHeightFactor: number = 0.85, neckWidthFactor: number = 0.15, headTailFactor: number = 0.8) => {
    try {
        let len = getBaseLength(points);
        let headHeight = len * headHeightFactor;
        const headPnt = points[points.length - 1];
        len = MathDistance(headPnt, points[points.length - 2]);
        const tailWidth = MathDistance(tailLeft, tailRight);
        if (headHeight > tailWidth * headTailFactor) {
            headHeight = tailWidth * headTailFactor;
        }
        const headWidth = headHeight * headWidthFactor;
        const neckWidth = headHeight * neckWidthFactor;
        headHeight = headHeight > len ? len : headHeight;
        const neckHeight = headHeight * neckHeightFactor;
        const headEndPnt = getThirdPoint(points[points.length - 2], headPnt, 0, headHeight, true);
        const neckEndPnt = getThirdPoint(points[points.length - 2], headPnt, 0, neckHeight, true);
        const headLeft = getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, false);
        const headRight = getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, true);
        const neckLeft = getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, false);
        const neckRight = getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, true);
        return [neckLeft, headLeft, headPnt, headRight, neckRight];
    } catch (e) {
        console.log(e);
    }
}

export const getAttackArrowBodyPoints = (points: number[][], neckLeft: number[], neckRight: number[], tailWidthFactor: number) => {
    const allLen = wholeDistance(points);
    const len = getBaseLength(points);
    const tailWidth = len * tailWidthFactor;
    const neckWidth = MathDistance(neckLeft, neckRight);
    const widthDif = (tailWidth - neckWidth) / 2;

    let tempLen = 0;
    let leftBodyPnts: number[][] = [];
    let rightBodyPnts: number[][] = [];
    for (let i = 1; i < points.length - 1; i++) {
        const angle = getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
        tempLen += MathDistance(points[i - 1], points[i]);
        const w = (tailWidth / 2 - (tempLen / allLen) * widthDif) / Math.sin(angle);
        const left = getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
        const right = getThirdPoint(points[i - 1], points[i], angle, w, false);
        leftBodyPnts.push(left);
        rightBodyPnts.push(right);
    }
    return leftBodyPnts.concat(rightBodyPnts);
}

export const getPincerAttackArrowPoints = (pnt1: number[], pnt2: number[], pnt3: number[], clockWise: boolean, headHeightFactor: number, headWidthFactor: number, neckWidthFactor: number, neckHeightFactor: number): number[][] => {
    const midPnt = CoordinatesUtil.MidPoint(pnt1, pnt2);
    const len = MathDistance(midPnt, pnt3);
    let midPnt1 = getThirdPoint(pnt3, midPnt, 0, len * 0.3, true);
    let midPnt2 = getThirdPoint(pnt3, midPnt, 0, len * 0.5, true);
    midPnt1 = getThirdPoint(midPnt, midPnt1, Math.PI / 2, len / 5, clockWise);

    midPnt2 = getThirdPoint(midPnt, midPnt2, Math.PI / 2, len / 4, clockWise);
    const points = [midPnt, midPnt1, midPnt2, pnt3];
    const arrowPnts = getPincerAttackArrowHeadPoints(points, headHeightFactor, headWidthFactor, neckWidthFactor, neckHeightFactor);
    if (arrowPnts && Array.isArray(arrowPnts) && arrowPnts.length > 0) {
        const neckLeftPoint = arrowPnts[0];
        const neckRightPoint = arrowPnts[4];
        const tailWidthFactor = MathDistance(pnt1, pnt2) / getBaseLength(points) / 2;
        const bodyPnts = getPincerAttackArrowBodyPoints(points, neckLeftPoint, neckRightPoint, tailWidthFactor);
        if (bodyPnts) {
            const n = bodyPnts.length;
            let lPoints = bodyPnts.slice(0, n / 2);
            let rPoints = bodyPnts.slice(n / 2, n);
            lPoints.push(neckLeftPoint);
            rPoints.push(neckRightPoint);
            lPoints = lPoints.reverse();
            lPoints.push(pnt2);
            rPoints = rPoints.reverse();
            rPoints.push(pnt1);
            return lPoints.reverse().concat(arrowPnts, rPoints);
        }
    } else {
        throw new Error('Interpolation Error');
    }
    // To satisfy return type, return an empty array as fallback (should not reach here)
    return [];
}

const getPincerAttackArrowHeadPoints = (points: number[][], headHeightFactor: number, headWidthFactor: number, neckWidthFactor: number, neckHeightFactor: number): number[][] => {
    const len = getBaseLength(points);
    const headHeight = len * headHeightFactor;
    const headPnt = points[points.length - 1];
    const headWidth = headHeight * headWidthFactor;
    const neckWidth = headHeight * neckWidthFactor;
    const neckHeight = headHeight * neckHeightFactor;
    const headEndPnt = getThirdPoint(points[points.length - 2], headPnt, 0, headHeight, true);
    const neckEndPnt = getThirdPoint(points[points.length - 2], headPnt, 0, neckHeight, true);
    const headLeft = getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, false);
    const headRight = getThirdPoint(headPnt, headEndPnt, Math.PI / 2, headWidth, true);
    const neckLeft = getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, false);
    const neckRight = getThirdPoint(headPnt, neckEndPnt, Math.PI / 2, neckWidth, true);
    return [neckLeft, headLeft, headPnt, headRight, neckRight];
}

const getPincerAttackArrowBodyPoints = (points: number[][], neckLeft: number[], neckRight: number[], tailWidthFactor: number): number[][] => {
    const allLen = wholeDistance(points);
    const len = getBaseLength(points);
    const tailWidth = len * tailWidthFactor;
    const neckWidth = MathDistance(neckLeft, neckRight);
    const widthDif = (tailWidth - neckWidth) / 2;
    let tempLen: number = 0;
    let leftBodyPnts: number[][] = [];
    let rightBodyPnts: number[][] = [];
    for (let i = 1; i < points.length - 1; i++) {
        const angle = getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
        tempLen += MathDistance(points[i - 1], points[i]);
        const w = (tailWidth / 2 - (tempLen / allLen) * widthDif) / Math.sin(angle);
        const left = getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
        const right = getThirdPoint(points[i - 1], points[i], angle, w, false);
        leftBodyPnts.push(left);
        rightBodyPnts.push(right);
    }
    return leftBodyPnts.concat(rightBodyPnts);
}

export const getPincerAttackArrowTempPoint4 = (linePnt1: number[], linePnt2: number[], point: number[]): number[] => {
    const midPnt = CoordinatesUtil.MidPoint(linePnt1, linePnt2);
    const len = MathDistance(midPnt, point);
    const angle = getAngleOfThreePoints(linePnt1, midPnt, point);
    let symPnt = [0, 0] as number[];
    let distance1;
    let distance2;
    let mid;
    if (angle < Math.PI / 2) {
        distance1 = len * Math.sin(angle);
        distance2 = len * Math.cos(angle);
        mid = getThirdPoint(linePnt1, midPnt, Math.PI / 2, distance1, false);
        symPnt = getThirdPoint(midPnt, mid, Math.PI / 2, distance2, true);
    } else if (angle >= Math.PI / 2 && angle < Math.PI) {
        distance1 = len * Math.sin(Math.PI - angle);
        distance2 = len * Math.cos(Math.PI - angle);
        mid = getThirdPoint(linePnt1, midPnt, Math.PI / 2, distance1, false);
        symPnt = getThirdPoint(midPnt, mid, Math.PI / 2, distance2, false);
    } else if (angle >= Math.PI && angle < Math.PI * 1.5) {
        distance1 = len * Math.sin(angle - Math.PI);
        distance2 = len * Math.cos(angle - Math.PI);
        mid = getThirdPoint(linePnt1, midPnt, Math.PI / 2, distance1, true);
        symPnt = getThirdPoint(midPnt, mid, Math.PI / 2, distance2, true);
    } else {
        distance1 = len * Math.sin(Math.PI * 2 - angle);
        distance2 = len * Math.cos(Math.PI * 2 - angle);
        mid = getThirdPoint(linePnt1, midPnt, Math.PI / 2, distance1, true);
        symPnt = getThirdPoint(midPnt, mid, Math.PI / 2, distance2, false);
    }
    return symPnt;
}



