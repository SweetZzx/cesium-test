/**箭头算法来源参考  https://github.com/ethan-zf/cesium-plot-js */

import { Cartesian3 } from "cesium";
import CoordinatesUtil from "../CoordinatesUtil";
import { getBaseLength, getBezierPoints, getQBSplinePoints, getThirdPoint, isClockWise, MathDistance, wholeDistance } from "../MathCalculateUtil";
import { getAttackArrowBodyPoints, getAttackArrowHeadPoints, getPincerAttackArrowPoints, getPincerAttackArrowTempPoint4 } from "./AttackArrow";

/**
 * 创建一条直箭头
 * @param positions 箭头的起点和终点
 * @param tailWidthFactor 尾端宽度因子
 * @param neckWidthFactor 颈部宽度因子
 * @param headWidthFactor 头端宽度因子
 * @param headAngle 头端角度
 * @param neckAngle 颈部角度
 * @returns 箭头的点数组
 */
export const createStraightArrowPoints = (positions: Cartesian3[], tailWidthFactor: number = 0.1, neckWidthFactor: number = 0.2, headWidthFactor: number = 0.25, headAngle: number = Math.PI / 8.5, neckAngle: number = Math.PI / 13) => {


  const firstPnt = CoordinatesUtil.Cartesian2Wgs84Lonlat(positions[0]);
  const lastPnt = CoordinatesUtil.Cartesian2Wgs84Lonlat(positions[1]);

  const distance = MathDistance([firstPnt[0], firstPnt[1]], [lastPnt[0], lastPnt[1]]);

  const tailWidth = distance * tailWidthFactor;
  const neckWidth = distance * neckWidthFactor;
  const headWidth = distance * headWidthFactor;
  const tailLeft = getThirdPoint([lastPnt[0], lastPnt[1]], [firstPnt[0], firstPnt[1]], Math.PI / 2, tailWidth, true);
  const tailRight = getThirdPoint([lastPnt[0], lastPnt[1]], [firstPnt[0], firstPnt[1]], Math.PI / 2, tailWidth, false);
  const headLeft = getThirdPoint([firstPnt[0], firstPnt[1]], [lastPnt[0], lastPnt[1]], headAngle, headWidth, false);
  const headRight = getThirdPoint([firstPnt[0], firstPnt[1]], [lastPnt[0], lastPnt[1]], headAngle, headWidth, true);
  const neckLeft = getThirdPoint([firstPnt[0], firstPnt[1]], [lastPnt[0], lastPnt[1]], neckAngle, neckWidth, false);
  const neckRight = getThirdPoint([firstPnt[0], firstPnt[1]], [lastPnt[0], lastPnt[1]], neckAngle, neckWidth, true);
  const points = [...tailLeft, ...neckLeft, ...headLeft, ...lastPnt, ...headRight, ...neckRight, ...tailRight, ...firstPnt];
  const cartesianPoints = Cartesian3.fromDegreesArray(points);
  return cartesianPoints;
}

/**
 * 创建一条直线箭头
 * @param positions 直箭头的起点和终点
 * @param arrowLengthScale 箭头长度缩放因子
 * @param maxArrowLength 最大箭头长度
 * @param minPointsForShape 最小点数以形成形状
 * @returns 直箭头的点数组
 */

export const createStraightLineArrowPoints = (positions: Cartesian3[], arrowLengthScale: number = 5, maxArrowLength: number = 3000000) => {
  const firstPnt = CoordinatesUtil.Cartesian2Wgs84Lonlat(positions[0]);
  const lastPnt = CoordinatesUtil.Cartesian2Wgs84Lonlat(positions[1]);

  const distance = MathDistance([firstPnt[0], firstPnt[1]], [lastPnt[0], lastPnt[1]]);
  let len = distance / arrowLengthScale;
  len = len > maxArrowLength ? maxArrowLength : len;
  const leftPnt = getThirdPoint([firstPnt[0], firstPnt[1]], [lastPnt[0], lastPnt[1]], Math.PI / 6, len / 2, false);
  const rightPnt = getThirdPoint([firstPnt[0], firstPnt[1]], [lastPnt[0], lastPnt[1]], Math.PI / 6, len / 2, true);
  const points = [...firstPnt, ...lastPnt, ...leftPnt, ...lastPnt, ...rightPnt];
  const cartesianPoints = Cartesian3.fromDegreesArray(points);
  return cartesianPoints;
}


/**
 * 创建一条攻击箭头
 * @param positions 攻击箭头的控制点
 * @returns 攻击箭头的点数组
 */
export const createAttackArrowPoints = (positions: Cartesian3[]) => {
  const positionLength = positions.length;
  if (positionLength > 2 && positions[positionLength - 1].equals(positions[positionLength - 2])) {
    positions.pop();
  }
  const lnglatPoints = positions.map((pnt) => {
    return CoordinatesUtil.Cartesian2Wgs84Lonlat(pnt);
  });

  let [tailLeft, tailRight] = [lnglatPoints[0], lnglatPoints[1]];
  if (isClockWise(lnglatPoints[0], lnglatPoints[1], lnglatPoints[2])) {
    tailLeft = lnglatPoints[1];
    tailRight = lnglatPoints[0];
  }

  const midTail = CoordinatesUtil.MidPoint(tailLeft, tailRight);
  const bonePnts = [midTail].concat(lnglatPoints.slice(2));
  const headPnts = getAttackArrowHeadPoints(bonePnts, tailLeft, tailRight);
  const [neckLeft, neckRight] = headPnts ? [headPnts[0] ?? [], headPnts[4] ?? []] : [[], []];
  const tailWidthFactor = MathDistance(tailLeft, tailRight) / wholeDistance(bonePnts);
  const bodyPnts = getAttackArrowBodyPoints(bonePnts, neckLeft, neckRight, tailWidthFactor);
  const count = bodyPnts.length;
  let leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
  leftPnts.push(neckLeft);
  let rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
  rightPnts.push(neckRight);

  leftPnts = getQBSplinePoints(leftPnts);
  rightPnts = getQBSplinePoints(rightPnts);
  const points = leftPnts.concat(headPnts ?? [], rightPnts.reverse());

  const temp = points.flat();
  const cartesianPoints = Cartesian3.fromDegreesArray(temp);
  return cartesianPoints;

}

/**
 * 创建一条燕尾攻击箭头
 * @param positions 攻击箭头的控制点
 * @param tailWidthFactor 尾端宽度因子
 * @param swallowTailFactor 燕子尾长度因子
 * @returns 攻击箭头的点数组
 */
export const createSwallowtailAttackArrowPoints = (positions: Cartesian3[],tailWidthFactor:number = 0.1,swallowTailFactor:number = 1): Cartesian3[] => {
  const positionLength = positions.length;
  if (positionLength > 2 && positions[positionLength - 1].equals(positions[positionLength - 2])) {
    positions.pop();
  }
  const lnglatPoints = positions.map((pnt) => {
    return CoordinatesUtil.Cartesian2Wgs84Lonlat(pnt);
  });
  let [tailLeft, tailRight] = [lnglatPoints[0], lnglatPoints[1]];
  if (isClockWise(lnglatPoints[0], lnglatPoints[1], lnglatPoints[2])) {
    tailLeft = lnglatPoints[1];
    tailRight = lnglatPoints[0];
  }
  const midTail = CoordinatesUtil.MidPoint(tailLeft, tailRight);
  const bonePnts = [midTail].concat(lnglatPoints.slice(2));
  const headPnts = getAttackArrowHeadPoints(bonePnts, tailLeft, tailRight);
  const [neckLeft, neckRight] = headPnts ? [headPnts[0], headPnts[4]] : [undefined, undefined];
  const tailWidth = MathDistance(tailLeft, tailRight);
  const allLen = getBaseLength(bonePnts);
  const len = allLen * tailWidthFactor * swallowTailFactor;
  const swallowTailPnt = getThirdPoint(bonePnts[1], bonePnts[0], 0, len, true);
  const factor = tailWidth / allLen;
  const bodyPnts = getAttackArrowBodyPoints(bonePnts, neckLeft ?? [], neckRight ?? [], factor);
  const count = bodyPnts.length;
  let leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
  leftPnts.push(neckLeft ?? []);
  let rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
  rightPnts.push(neckRight ?? []);
  leftPnts = getQBSplinePoints(leftPnts);
  rightPnts = getQBSplinePoints(rightPnts);
  const points = leftPnts.concat(headPnts ?? [], rightPnts.reverse(), [swallowTailPnt, leftPnts[0]]);
  const temp = points.flat();
  const cartesianPoints = Cartesian3.fromDegreesArray(temp);
  return cartesianPoints;
}



export const createPincerAttackArrowPoints = (positions: Cartesian3[],headHeightFactor: number=0.25,headWidthFactor:number=0.3,neckWidthFactor:number=0.15,neckHeightFactor:number=0.85) => {
    const lnglatPoints = positions.map((pnt) => {
      return CoordinatesUtil.Cartesian2Wgs84Lonlat(pnt);
    });
    const [pnt1, pnt2, pnt3] = [lnglatPoints[0], lnglatPoints[1], lnglatPoints[2]];
    const count = lnglatPoints.length;
    let tempPoint4: number[] = [];
    let connPoint: number[] = [];
    if (count === 3) {
      tempPoint4 = getPincerAttackArrowTempPoint4(pnt1, pnt2, pnt3);
      connPoint = CoordinatesUtil.MidPoint(pnt1, pnt2);
    } else if (count === 4) {
      tempPoint4 = lnglatPoints[3];
      connPoint = CoordinatesUtil.MidPoint(pnt1, pnt2);
    } else {
      tempPoint4 = lnglatPoints[3];
      connPoint = lnglatPoints[4];
    }
    let leftArrowPnts: number[][];
    let rightArrowPnts;
    let isCW = isClockWise(pnt1, pnt2, pnt3);
    if (isCW) {
      leftArrowPnts = getPincerAttackArrowPoints(pnt1, connPoint, tempPoint4, false,headHeightFactor,headWidthFactor,neckWidthFactor,neckHeightFactor);
      rightArrowPnts = getPincerAttackArrowPoints(connPoint, pnt2, pnt3, true,headHeightFactor,headWidthFactor,neckWidthFactor,neckHeightFactor);
    } else {
      leftArrowPnts = getPincerAttackArrowPoints(pnt2, connPoint, pnt3, false,headHeightFactor,headWidthFactor,neckWidthFactor,neckHeightFactor);
      rightArrowPnts = getPincerAttackArrowPoints(connPoint, pnt1, tempPoint4, true,headHeightFactor,headWidthFactor,neckWidthFactor,neckHeightFactor);
    }
    const m = leftArrowPnts.length;
    const t = (m - 5) / 2;
    const llBodyPnts = leftArrowPnts.slice(0, t);
    const lArrowPnts = leftArrowPnts.slice(t, t + 5);
    let lrBodyPnts = leftArrowPnts.slice(t + 5, m);
   
    let rlBodyPnts = rightArrowPnts.slice(0, t);
    const rArrowPnts = rightArrowPnts.slice(t, t + 5);
    const rrBodyPnts = rightArrowPnts.slice(t + 5, m);
   
    rlBodyPnts = getBezierPoints(rlBodyPnts);
    const bodyPnts = getBezierPoints(rrBodyPnts.concat(llBodyPnts.slice(1)));
    lrBodyPnts = getBezierPoints(lrBodyPnts);
    const pnts: number[][] = rlBodyPnts.concat(rArrowPnts, bodyPnts, lArrowPnts, lrBodyPnts);
    const temp: number[] = ([] as number[]).concat(...pnts);
    const cartesianPoints = Cartesian3.fromDegreesArray(temp);
    return cartesianPoints;
  }

