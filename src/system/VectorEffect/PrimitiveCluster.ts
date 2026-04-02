import { BillboardCollection, Cartesian3, Color, PinBuilder, PrimitiveCollection, VerticalOrigin, Viewer } from "cesium";
import BasePrimitiveCluster from './BasePrimitiveCluster.js';
import { ClusterOption, ClusterPoint } from "./EntityCluster";

export default class PrimitiveCluster {
    private basePrimitiveCluster = new BasePrimitiveCluster();
    private billboardsCollectionCombine = new BillboardCollection();
    private viewer: Viewer;
    private pinBuilder: PinBuilder;

    private option: Required<ClusterOption>
    private primitives: any;

    constructor(viewer: Viewer, opt: ClusterOption = {}) {
        this.viewer = viewer;

        this.pinBuilder = new PinBuilder();
        this.option = {
            pixelRange: opt.pixelRange ?? 80,
            minClusterSize: opt.minClusterSize ?? 2,
            pinColor: opt.pinColor ?? Color.ROYALBLUE,
            pinSize: opt.pinSize ?? 48,
        }

        this.primitives = viewer.scene.primitives.add(
            new PrimitiveCollection()
        );

        this.basePrimitiveCluster._enabled = true;
        this.basePrimitiveCluster._pixelRange = this.option.pixelRange;
        this.basePrimitiveCluster._minimumClusterSize = this.option.minClusterSize;

        // 将数据传给primitivecluster的标签属性
        this.basePrimitiveCluster._billboardCollection = this.billboardsCollectionCombine;
        // 初始化
        this.basePrimitiveCluster._initialize(this.viewer.scene);        // 将标签数据添加到实体中

        this.primitives.add(this.basePrimitiveCluster);
        // 监听相机缩放
        this.basePrimitiveCluster._clusterEvent.addEventListener(
            (clusteredEntities: any[], cluster: any) => {

                cluster.billboard.show = true
                cluster.label.show = false

                cluster.billboard.image = this.pinBuilder.fromText(
                    clusteredEntities.length.toString(),
                    this.option.pinColor,
                    this.option.pinSize
                );
                cluster.billboard.width = this.option.pinSize
                cluster.billboard.height = this.option.pinSize
                cluster.billboard.verticalOrigin = VerticalOrigin.BOTTOM
                // 关闭深度测试，避免被地形遮挡
                cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY
                // 贴地显示（与 point 保持一致）
                // cluster.billboard.heightReference = HeightReference.CLAMP_TO_GROUND
            }
        );

    }


    AddPoint(p: ClusterPoint, width: number = this.option.pinSize, height: number = this.option.pinSize): void {
        this.billboardsCollectionCombine.add({
            id: p.id,
            position: Cartesian3.fromDegrees(...p.position),
            image: this.pinBuilder.fromText("1", Color.GREENYELLOW, 24), // 单点显示 “1”
            width: width,
            height: height,
            verticalOrigin: VerticalOrigin.BOTTOM,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            // heightReference: HeightReference.CLAMP_TO_GROUND             
        })
    }

    AddPoints(list: ClusterPoint[]): void {
        list.forEach((p) => this.AddPoint(p))
    }
    Clear(): void {
        this.billboardsCollectionCombine.removeAll();
        this.viewer.scene.primitives.removeAll();
    }



}