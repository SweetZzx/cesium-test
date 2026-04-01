import * as Cesium from "cesium"
import Pbf from "pbf"
import { VectorTile } from "@mapbox/vector-tile"

/**
 * MVT (Mapbox Vector Tile) 影像提供器
 * 从 MVT 瓦片服务获取矢量瓦片，在 Canvas 上渲染后作为影像叠加到 Cesium 地球上
 */
export class MVTImageryProvider implements Cesium.ImageryProvider {
    readonly ready: boolean = true
    readonly tileWidth: number = 512
    readonly tileHeight: number = 512
    readonly minimumLevel: number = 4
    readonly maximumLevel: number = 14
    readonly credit: Cesium.Credit = new Cesium.Credit("MVT")
    readonly tilingScheme: Cesium.TilingScheme
    readonly rectangle: Cesium.Rectangle

    private _url: string
    private _styleOptions: MVTStyleOptions
    private _cancelled = false

    errorEvent: Cesium.Event<(provider: Cesium.ImageryProvider) => void>

    constructor(options: MVTImageryProvider.ConstructorOptions) {
        this._url = options.url
        this._styleOptions = options.style ?? defaultStyle

        this.tilingScheme = options.tilingScheme ?? new Cesium.WebMercatorTilingScheme()
        this.rectangle = this.tilingScheme.rectangle
        this.errorEvent = new Cesium.Event()
    }

    get tileDiscardPolicy(): Cesium.TileDiscardPolicy {
        return new Cesium.NeverTileDiscardPolicy()
    }

    get proxy(): Cesium.Proxy {
        return new Cesium.DefaultProxy("")
    }

    get hasAlphaChannel(): boolean {
        return true
    }

    getTileCredits(
        _x: number,
        _y: number,
        _level: number
    ): Cesium.Credit[] {
        return []
    }

    pickFeatures(
        _x: number,
        _y: number,
        _level: number,
        _longitude: number,
        _latitude: number
    ): Promise<Cesium.ImageryLayerFeatureInfo[]> {
        return Promise.resolve([])
    }

    requestImage = (
        x: number,
        y: number,
        level: number,
        _request?: Cesium.Request
    ): Promise<HTMLCanvasElement> | undefined => {
        const url = this._url
            .replace("{z}", String(level))
            .replace("{x}", String(x))
            .replace("{y}", String(y))

        const canvas = document.createElement("canvas")
        canvas.width = this.tileWidth
        canvas.height = this.tileHeight

        return fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error(`MVT tile fetch failed: ${res.status}`)
                return res.arrayBuffer()
            })
            .then((buf) => {
                if (this._cancelled) throw new Error("cancelled")

                const tile = new VectorTile(new Pbf(buf))
                const ctx = canvas.getContext("2d")!
                const style = this._styleOptions

                // 遍历所有图层
                for (const layerName in tile.layers) {
                    const layer = tile.layers[layerName]
                    const tileExtent = layer.extent || 4096
                    for (let i = 0; i < layer.length; i++) {
                        const feature = layer.feature(i)
                        const type = feature.type

                        ctx.fillStyle = style.fillColor
                        ctx.strokeStyle = style.strokeColor
                        ctx.lineWidth = style.lineWidth

                        if (type === 3) {
                            // Polygon
                            this._drawPolygon(ctx, feature, canvas.width, tileExtent)
                        } else if (type === 2) {
                            // LineString
                            this._drawLine(ctx, feature, canvas.width, tileExtent)
                        } else if (type === 1) {
                            // Point
                            this._drawPoint(ctx, feature, canvas.width, tileExtent)
                        }
                    }
                }
                return canvas
            })
            .catch((err) => {
                if (err.message === "cancelled") return canvas
                console.warn("[MVTImageryProvider]", err.message)
                return canvas
            })
    }

    private _drawPolygon(
        ctx: CanvasRenderingContext2D,
        feature: any,
        size: number,
        extent: number
    ) {
        const geo = feature.loadGeometry()
        for (const ring of geo) {
            ctx.beginPath()
            for (let i = 0; i < ring.length; i++) {
                const x = (ring[i].x / extent) * size
                const y = (ring[i].y / extent) * size
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
        }
    }

    private _drawLine(
        ctx: CanvasRenderingContext2D,
        feature: any,
        size: number,
        extent: number
    ) {
        const geo = feature.loadGeometry()
        for (const line of geo) {
            ctx.beginPath()
            for (let i = 0; i < line.length; i++) {
                const x = (line[i].x / extent) * size
                const y = (line[i].y / extent) * size
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()
        }
    }

    private _drawPoint(
        ctx: CanvasRenderingContext2D,
        feature: any,
        size: number,
        extent: number
    ) {
        const geo = feature.loadGeometry()
        const r = this._styleOptions.pointRadius ?? 3
        ctx.fillStyle = this._styleOptions.pointColor ?? this._styleOptions.fillColor
        for (const pt of geo) {
            const x = (pt[0].x / extent) * size
            const y = (pt[0].y / extent) * size
            ctx.beginPath()
            ctx.arc(x, y, r, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    destroy(): void {
        this._cancelled = true
    }
}

export interface MVTStyleOptions {
    fillColor: string
    strokeColor: string
    lineWidth: number
    pointColor?: string
    pointRadius?: number
}

const defaultStyle: MVTStyleOptions = {
    fillColor: "rgba(0, 150, 255, 0.3)",
    strokeColor: "rgba(0, 100, 255, 0.8)",
    lineWidth: 2,
    pointColor: "rgba(255, 80, 80, 0.9)",
    pointRadius: 4,
}

export namespace MVTImageryProvider {
    export interface ConstructorOptions {
        url: string
        tilingScheme?: Cesium.TilingScheme
        style?: MVTStyleOptions
    }
}
