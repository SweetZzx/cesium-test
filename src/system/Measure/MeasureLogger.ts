/**
 * 量算模块调试日志（浏览器兼容版）
 * - 日志打印到 console（生产/开发通用）
 * - 日志同时保存到 localStorage（模拟文件持久化，页面刷新后追加）
 * - 提供 downloadLog() 下载日志文件
 * - 提供 clearLog() 清空日志
 *
 * 使用方式：
 *   import { MeasureLogger } from './MeasureLogger'
 *   MeasureLogger.info('DistanceMeasure', '点已添加', { count: 3 })
 *   // 下载：MeasureLogger.downloadLog()
 */

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO  = 'INFO ',
    WARN  = 'WARN ',
    ERROR = 'ERROR',
}

interface LoggerConfig {
    level: LogLevel
    printConsole: boolean
    persistLocalStorage: boolean
}

const config: LoggerConfig = {
    level: LogLevel.DEBUG,
    printConsole: true,
    persistLocalStorage: true,
}

const STORAGE_KEY = 'cesium_measure_log'
const LOG_FILE_PREFIX = 'measure'

function getDateStr(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getLogFileName(): string {
    return `${LOG_FILE_PREFIX}-${getDateStr()}.log`
}

function getLogFromStorage(): string {
    try {
        return localStorage.getItem(STORAGE_KEY) ?? ''
    } catch {
        return ''
    }
}

function appendLogToStorage(line: string): void {
    try {
        const existing = getLogFromStorage()
        localStorage.setItem(STORAGE_KEY, existing + line + '\n')
    } catch {
        // localStorage 满或不可用，静默忽略
    }
}

function formatArgs(args: unknown[]): string {
    return args.map(arg => {
        if (arg === null) return 'null'
        if (arg === undefined) return 'undefined'
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg, (_key: string, value: unknown) => {
                    // 简化 Cesium 对象，避免序列化失败
                    if (value && typeof value === 'object') {
                        const v = value as Record<string, unknown>
                        if (v.x !== undefined && v.y !== undefined && v.z !== undefined) {
                            return { _type: 'Cartesian3', x: v.x, y: v.y, z: v.z }
                        }
                        if ('longitude' in v && 'latitude' in v) {
                            return { _type: 'Cartographic', lon: v.longitude, lat: v.latitude, h: v.height }
                        }
                    }
                    return value
                }, 2)
            } catch {
                return String(arg)
            }
        }
        return String(arg)
    }).join(' ')
}

function shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    return levels.indexOf(level) >= levels.indexOf(config.level)
}

function writeLog(level: LogLevel, tag: string, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString()
    let fullMessage = `[${timestamp}] [${level}] [${tag}] ${message}`
    if (args.length > 0) {
        fullMessage += ' ' + formatArgs(args)
    }

    if (level === LogLevel.ERROR) {
        const stack = new Error().stack?.split('\n').slice(1, 4).join(' | ') ?? ''
        fullMessage += ` | STACK: ${stack}`
    }

    if (config.printConsole) {
        switch (level) {
            case LogLevel.ERROR:
                console.error(fullMessage)
                break
            case LogLevel.WARN:
                console.warn(fullMessage)
                break
            default:
                console.log(fullMessage)
        }
    }

    if (config.persistLocalStorage) {
        appendLogToStorage(fullMessage)
    }
}

export const MeasureLogger = {
    debug(tag: string, message: string, ...args: unknown[]) {
        if (shouldLog(LogLevel.DEBUG)) writeLog(LogLevel.DEBUG, tag, message, ...args)
    },

    info(tag: string, message: string, ...args: unknown[]) {
        if (shouldLog(LogLevel.INFO)) writeLog(LogLevel.INFO, tag, message, ...args)
    },

    warn(tag: string, message: string, ...args: unknown[]) {
        if (shouldLog(LogLevel.WARN)) writeLog(LogLevel.WARN, tag, message, ...args)
    },

    error(tag: string, message: string, ...args: unknown[]) {
        if (shouldLog(LogLevel.ERROR)) writeLog(LogLevel.ERROR, tag, message, ...args)
    },

    /** 记录函数入口 */
    enter(tag: string, fn: string, ...args: unknown[]) {
        this.debug(tag, `▶▶▶ ENTER ${fn}`, ...args)
    },

    /** 记录函数出口 */
    exit(tag: string, fn: string, ...args: unknown[]) {
        this.debug(tag, `◀◀◀ EXIT  ${fn}`, ...args)
    },

    /** 记录状态快照 */
    snapshot(tag: string, label: string, data: Record<string, unknown>) {
        this.debug(tag, `📋 SNAPSHOT [${label}]:`, data)
    },

    /**
     * 下载日志文件
     * 在 MeasureTool.vue 或控制台调用：MeasureLogger.downloadLog()
     */
    downloadLog() {
        const content = getLogFromStorage()
        if (!content) {
            console.warn('[MeasureLogger] 日志为空，无文件可下载')
            return
        }
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = getLogFileName()
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        console.info(`[MeasureLogger] 日志已下载: ${getLogFileName()}`)
    },

    /**
     * 清空日志
     * 在控制台调用：MeasureLogger.clearLog()
     */
    clearLog() {
        try {
            localStorage.removeItem(STORAGE_KEY)
            console.info('[MeasureLogger] 日志已清空')
        } catch {
            // ignore
        }
    },

    /**
     * 获取当前日志内容（字符串）
     */
    getLogContent(): string {
        return getLogFromStorage()
    },

    /**
     * 设置日志级别
     * @param level 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
     */
    setLevel(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR') {
        config.level = LogLevel[level]
    },

    /**
     * 禁用控制台打印（生产环境调用）
     */
    disableConsole() {
        config.printConsole = false
    },

    /**
     * 禁用 localStorage 持久化
     */
    disablePersist() {
        config.persistLocalStorage = false
    },
}
