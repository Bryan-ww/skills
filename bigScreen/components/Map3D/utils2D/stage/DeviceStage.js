import Stage from './Stage.js'
import { useDeviceStore } from '@/views/bigScreen/components/MapTab/stores/useDevice.js'
import { watch } from 'vue'
import { createIconLayer } from '@/views/bigScreen/components/Map3D/utils2D/createIconLayer.js'
import { INFRAS_TYPE } from '@/views/bigScreen/components/Map3D/utils/infrasData.js'
import LayerGroup from 'ol/layer/Group.js';

export default class DeviceStage extends Stage {
  name = 'DeviceStage'
  constructor(map) {
    super(map) 
    this.name = DeviceStage.name

    // 设备图层
    this.deviceLayer = null

    this.deviceStore = useDeviceStore()

    this.stopDeviceWatch = watch(() => this.deviceStore.collapseActiveList, (newVal) => {
      this.removeDeviceLayer()
      if (newVal.length > 0) {
        this.createDeviceLayer()
      }
    })
  }
  getDeviceIcon(type) {
    switch (type) {
      case '3':
        return 'error'
      case '2':
        return 'normal'
      case '1':
        return 'offline'
      case '0':
        return 'offline'
      default:
        return 'normal'
    }
  }
  createDeviceLayer() {
    const list = this.deviceStore.collapseActiveList.map(item => {
      item.lnglat = [item.lng, item.lat]

      return item
    })
    const runningStateMap = {}
    list.forEach(item => {
      const key = item.runningState.value
      if (!runningStateMap[key]) {
        runningStateMap[key] = []
      }
      runningStateMap[key].push(item)
    })

    const layers = []
    for (const key of Object.keys(runningStateMap)) {
      layers.push(createIconLayer({
        list: runningStateMap[key],
        type: INFRAS_TYPE.CONSTRUCT,
        baseIcon: this.getDeviceIcon(key),
        anchor: [0.5, 2.4],
      }))
    }

    const layerGroup = new LayerGroup({
      layers: layers
    })  

    this.deviceLayer = layerGroup
    this.map.addLayer(this.deviceLayer)
  }
  removeDeviceLayer() {
    this.map.removeLayer(this.deviceLayer)
    this.deviceLayer = null
  }
  show() {
  }
  hide() {
    this.removeDeviceLayer()
  }
  destroy() {
    this.stopDeviceWatch()
    this.removeDeviceLayer()
  }
}