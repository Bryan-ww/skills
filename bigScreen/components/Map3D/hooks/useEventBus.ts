import mitt from 'mitt'

type IUseEventbus = {
    customEmit: (eventName: string, eventData: boolean) => void
    customEmitObject: (eventName: string, eventData: Object) => void
    customObjectOn: (eventName: string, eventData: Object) => void
    customOn: (eventName: string, callback: () => void) => void
    customDataOn: (eventName: string, eventData: boolean) => void
    customOff: (eventName: string) => void
    toRefreshTable: () => void
    refreshTable: (callback: () => void) => void
}

const emitter = mitt()

/**
 * @description: 自定义触发器
 * @param {*} eventName 名称
 */
const customEmit = (eventName: string, eventData: boolean) => {
    emitter.emit(eventName, eventData)
}

/**
 * @description: 自定义触发器
 * @param {*} eventName 名称
 */
const customEmitObject = (eventName: string, eventData: Object) => {
    emitter.emit(eventName, eventData)
}

/**
 * @description: 自定义接收器
 * @param {*} name 名称
 * @param {*} callback 回调的函数
 */
const customOn = (eventName: string, callback: () => void) => {
    emitter.on(eventName, () => callback())
}

/**
 * @description: 自定义接收器
 * @param {*} name 名称
 * @param {*} callback 回调的函数
 */
const customDataOn = (eventName: string, eventData: boolean) => {
    emitter.on(eventName, eventData as any)
}

/**
 * @description: 自定义接收器
 * @param {*} name 名称
 * @param {*} callback 回调的函数
 */
const customObjectOn = (eventName: string, eventData: Object) => {
    emitter.on(eventName, eventData as any)
}

/**
 * @description: 通知刷新表格数据
 */
const toRefreshTable = () => {
    emitter.emit('refreshTable')
}

/**
 * @description: 刷新表格数据
 * @param {*} callback 回调的函数
 */
const refreshTable = (callback: () => void) => {
    emitter.on('refreshTable', () => callback())
}


/**
 * @description: 自定义接收器
 * @param {*} name 名称
 * @param {*} callback 回调的函数
 */
const customOff = (eventName: string, callback?: () => void) => {
    console.log('关闭mitt', eventName)
    if (callback) {
        emitter.off(eventName, callback)
    } else {
        emitter.off(eventName)
    }
}


/**
 * @description: 导出useEventbus
 */
export const useEventbus = (): IUseEventbus => {
    return {
        customEmit,
        customEmitObject,
        customOn,
        customObjectOn,
        customDataOn,
        customOff,
        toRefreshTable,
        refreshTable
    }
}
