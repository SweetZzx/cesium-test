import * as turf from '@turf/turf';
import CoordinatesUtil from './CoordinatesUtil';
import { Cartesian3 } from 'cesium';
import type { Feature, Polygon, GeoJsonProperties } from 'geojson';


export default class TurfUtil {

  static Cartesian2TurfPoint(cartesian: Cartesian3) {
    let lonlat = CoordinatesUtil.Cartesian2Wgs84Lonlat(cartesian)
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
    let geo = g.geometry.coordinates[0]
    return geo.map((p: Array<number>) => CoordinatesUtil.LonLat2Cartesian(p, undefined))
  }

  static String2TurfUnits(unitStr: string): turf.Units {
    let turfUnit: turf.Units = "kilometers"
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




}