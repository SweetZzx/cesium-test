import { Cartesian3, Color } from "cesium";

export default class CustomCloud {
  position: Cartesian3;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  color: Color;
  slice: number;
  brightness: number;

  constructor(
    position: Cartesian3,
    scaleX: number = 25,
    scaleY: number = 12,
    scaleZ: number = 15,
    color: Color = Color.fromCssColorString("#ffffff"),
    slice: number = 0.3,
    brightness: number = 1.0,
  ) {
    this.position = position;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.scaleZ = scaleZ;
    this.color = color;
    this.slice = slice;
    this.brightness = brightness;
  }
}
