import * as turf from '@turf/turf';
import CoordinatesUtil from './CoordinatesUtil';
import { Cartesian3 } from 'cesium';
import type { Feature, Point, Polygon, GeoJsonProperties } from 'geojson';

export type NearestPointOnLineResult = {
    nearestPoint: Feature<Point>;
    closestLineIndex: number;
};

/**
 * 从 Cartesian3 数组构成的线段中，找到离目标点最近的一条线段及其索引
 * @param positions 所有顶点
 * @param target 目标点（Cartesian3）
 * @returns 包含最近点 Feature 和线段索引的对象
 */
export function getClosestLineAndIndex(positions: Cartesian3[], target: Cartesian3): NearestPointOnLineResult {
    return TurfUtil.getClosestLineAndIndex(positions, target);
}

export default class TurfUtil {

  static Cartesian2TurfPoint(cartesian: Cartesian3) {
    var lonlat = CoordinatesUtil.Cartesian2Wgs84Lonlat(cartesian)
    return turf.point(lonlat)
  }
  static Cartesians2TurfLinestring(points: Cartesian3[]) {
    var lonlatPoints = TurfUtil.CartesianArray2LonLats(points); // 坐标数组
    return turf.lineString(lonlatPoints);
  }
  static Cartesians2TurfPolygon(points: Cartesian3[]) {
    var lonlatPoints = TurfUtil.CartesianArray2LonLats(points); // 坐标数组
    lonlatPoints.push(lonlatPoints[0])
    return turf.polygon([lonlatPoints]);
  }

  static CartesianArray2LonLats(points: Cartesian3[]) {
    var arr = []
    for (var i = 0; i < points.length; i++) {
      var item = CoordinatesUtil.Cartesian2Wgs84Lonlat(points[i]);
      arr.push(item.slice(0, 2));
    }
    return arr;
  }

  static TurfGeometry2Cartesians(g: Feature<Polygon, GeoJsonProperties>) {
    var geo = g.geometry.coordinates[0]
    return geo.map(function(p: Array<number>) { return CoordinatesUtil.LonLat2Cartesian(p, undefined) })
  }

  static String2TurfUnits(unitStr: string): turf.Units {
    var turfUnit: turf.Units = "kilometers"
    switch (unitStr) {
      case 'meters':
        turfUnit = "meters"
        break;
      case 'kilometers':
        turfUnit = "kilometers"
        break;
    }
    return turfUnit
  }

  /**
   * 从 Cartesian3 数组构成的线段中，找到离目标点最近的一条线段及其索引
   * @param positions 所有顶点
   * @param target 目标点（Cartesian3）
   * @returns 包含最近点 Feature 和线段索引的对象
   */
  static getClosestLineAndIndex(positions: Cartesian3[], target: Cartesian3): NearestPointOnLineResult {
    var minDist = Infinity;
    var closestLineIndex = -1;
    var nearestPoint: Feature<Point> | null = null;
    var targetLonLat = CoordinatesUtil.Cartesian2Wgs84Lonlat(target);
    var targetPt = turf.point(targetLonLat);

    for (var i = 0; i < positions.length - 1; i++) {
      var p1 = CoordinatesUtil.Cartesian2Wgs84Lonlat(positions[i]);
      var p2 = CoordinatesUtil.Cartesian2Wgs84Lonlat(positions[i + 1]);
      var line = turf.lineString([p1, p2]);
      var snapped = turf.nearestPointOnLine(line, targetPt, { units: 'meters' });
      var dist = turf.distance(targetPt, snapped, { units: 'meters' });
      if (dist < minDist) {
        minDist = dist;
        closestLineIndex = i;
        nearestPoint = snapped;
      }
    }
    return { nearestPoint: nearestPoint!, closestLineIndex };
  }

  /**
   * 计算鼠标点在线段上的最近点（垂足）
   * @param positions 线的顶点
   * @param target 鼠标位置的 Cartesian3
   * @returns turf Point（包含最近点坐标）
   */
  static nearestPointOnLineFromCesium(positions: Cartesian3[], target: Cartesian3) {
    var result = TurfUtil.getClosestLineAndIndex(positions, target);
    return result.nearestPoint;
  }
}
