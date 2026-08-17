import { Cartesian2, Cartesian3, CloudCollection, Color, CumulusCloud, Viewer } from "cesium";
import CustomCloud from "./CustomCloud";

export default class CloudsManager {
  viewer: Viewer;
  clouds: CloudCollection;
  cumulusCloudList: CumulusCloud[] = [];

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.clouds = viewer.scene.primitives.add(
      new CloudCollection({
        noiseDetail: 16.0,
        noiseOffset: 0,
      }),
    );
  }

  addCloud(cloud: CustomCloud) {
    const cumulusCloud = this.clouds.add({
      position: cloud.position,
      scale: new Cartesian2(cloud.scaleX, cloud.scaleY),
      maximumSize: new Cartesian3(cloud.scaleX, cloud.scaleY, cloud.scaleZ),
      color: cloud.color,
      slice: cloud.slice,
      brightness: cloud.brightness,
    });
    this.cumulusCloudList.push(cumulusCloud);
  }

  removeAllClouds() {
    this.cumulusCloudList.splice(0, this.cumulusCloudList.length);
    this.clouds.removeAll();
  }

  createRandomClouds(basePos: Cartesian3, count: number) {
    for (let i = 0; i < count; i++) {
      const randomPos = new Cartesian3(
        basePos.x + (Math.random() - 0.5) * 500,
        basePos.y + (Math.random() - 0.5) * 100,
        basePos.z + (Math.random() - 0.5) * 100,
      );
      const cloud = new CustomCloud(randomPos);
      this.addCloud(cloud);
    }
  }

  updateScale(scaleX: number, scaleY: number, scaleZ: number) {
    this.cumulusCloudList.forEach((cloud) => {
      cloud.scale = new Cartesian2(scaleX, scaleY);
      cloud.maximumSize = new Cartesian3(scaleX, scaleY, scaleZ);
    });
  }

  updateSlice(slice: number) {
    this.cumulusCloudList.forEach((cloud) => {
      cloud.slice = slice;
    });
  }

  updateColor(color: string) {
    this.cumulusCloudList.forEach((cloud) => {
      cloud.color = Color.fromCssColorString(color);
    });
  }

  updateBrightness(brightness: number) {
    this.cumulusCloudList.forEach((cloud) => {
      cloud.brightness = brightness;
    });
  }

  destroy() {
    this.removeAllClouds();
    this.viewer.scene.primitives.remove(this.clouds);
  }
}
