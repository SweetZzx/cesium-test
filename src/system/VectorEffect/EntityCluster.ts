import { Billboard, Cartesian3, Color, CustomDataSource, Entity, HeightReference,  Label, PinBuilder, VerticalOrigin, Viewer } from "cesium"

export interface ClusterOption {
    pixelRange?: number
    minClusterSize?: number
    pinColor?: Color   // 新增：图钉颜色
    pinSize?: number          // 新增：图钉像素大小
}

/** 内部点数据结构 */
export interface ClusterPoint {
    id: string
    position: [number, number, number] // lon lat alt
    style?: any                         // 单点正常显示时的样式
}

export default class EntityCluster {
    private viewer: Viewer
    private dataSource: CustomDataSource
    private option: Required<ClusterOption>
    private pinBuilder = new PinBuilder()

    constructor(viewer: Viewer, opt: ClusterOption = {}) {
        this.viewer = viewer
        this.option = {
            pixelRange: opt.pixelRange ?? 80,
            minClusterSize: opt.minClusterSize ?? 2,
            pinColor: opt.pinColor ?? Color.ROYALBLUE,
            pinSize: opt.pinSize ?? 48,
        }
        this.dataSource = new CustomDataSource('ClusterLayer')
        this.viewer.dataSources.add(this.dataSource)

        // 开启聚合
        this.dataSource.clustering.enabled = true
        this.dataSource.clustering.pixelRange = this.option.pixelRange
        this.dataSource.clustering.minimumClusterSize = this.option.minClusterSize

     
        this.dataSource.clustering.clusterEvent.addEventListener(
            (clusteredEntities: Entity[], cluster: { billboard: Billboard,label:Label }) => { 
                cluster.billboard.show = true
                cluster.label.show = false
              
                cluster.billboard.image = this.BuildPin(clusteredEntities.length);
                cluster.billboard.width = this.option.pinSize
                cluster.billboard.height = this.option.pinSize
                cluster.billboard.verticalOrigin = VerticalOrigin.BOTTOM
                // 关闭深度测试，避免被地形遮挡
                cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY
                // 贴地显示（与 point 保持一致）
                cluster.billboard.heightReference = HeightReference.CLAMP_TO_GROUND

            }
        )

    }
   
    private BuildPin(count: number,pinColor:Color = this.option.pinColor,pinSize:number = this.option.pinSize): string {
        // PinBuilder.fromText 可能返回 HTMLCanvasElement 或 string
        const result = this.pinBuilder.fromText(
            count.toString(),
            pinColor,
            pinSize
        );
        // 直接返回 canvas 或 string，Cesium billboard.image 接受两者
        return result.toDataURL();
    }

    AddPoint(p: ClusterPoint,width:number = this.option.pinSize,height:number = this.option.pinSize): void {
        this.dataSource.entities.add({
            id: p.id,
            position: Cartesian3.fromDegrees(...p.position),
            billboard: {
                image: this.BuildPin(1,Color.GREENYELLOW,24),                // 单点显示 “1”
                width: width,
                height: height,
                verticalOrigin: VerticalOrigin.BOTTOM,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: HeightReference.CLAMP_TO_GROUND
            },
        })
    }

    AddPoints(list: ClusterPoint[]): void {
        list.forEach((p) => this.AddPoint(p))
    }

    RemoveById(id: string): void {
        this.dataSource.entities.removeById(id)
    }

    Clear(): void {
        this.dataSource.entities.removeAll()
    }

    Destroy(): void {
        this.viewer.dataSources.remove(this.dataSource)
    }

}