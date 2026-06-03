import Stage from './Stage.js'
import { hideOverlays, showOverlays, delegateClick } from '../overlay/util.js'
import { createMachineRoomOverlay } from '../overlay/createMachineRoomOverlay.js'
import { useMapConfigStore } from '@/views/bigScreen/components/MapTab/stores/useMapConfig.js';
import { useMachineRoomStore } from '@/views/bigScreen/components/MapTab/stores/useMachineRoom.js';
import { useEventbus } from '@/hooks/useEventbus';
import { findMachineRoomAlarm } from '@/api/iot/index.js';

export default class MachineRoomStage extends Stage {
  static name = 'MachineRoomStage'
  constructor(map) {
    super(map)
    this.name = MachineRoomStage.name
    this.machineRoomOverlays = []
    
    this.machineRoomStore = useMachineRoomStore()
    this.mapConfigStore = useMapConfigStore()
    
    this.stopMachineRoomWatch = watch(() => this.machineRoomStore.filteredList, (newVal) => {
      if (this.mapConfigStore.stage !== this.name) {
        return
      }
      this.createMachineRoomOverlays()
    })

    // 通过事件委托监听点击事件
    this.stopDelegateClick = delegateClick('machine-room-overlay', (event, target) => {
      if (this.mapConfigStore.stage !== this.name) {
        return
      }
      const id = target.dataset.overlayId
      const machineRoomOverlay = map.getOverlayById(id)
      const data = machineRoomOverlay?.get('data')

      useEventbus().customEmitObject('openDialog', {type: 'machineRoom', data: data})
    })
  }
  removeMachineRoomOverlays() {
    this.machineRoomOverlays.forEach(overlay => {
      this.map.removeOverlay(overlay)
    })
    this.machineRoomOverlays = []
  }
  async createMachineRoomOverlays() {
    this.removeMachineRoomOverlays()

    const list = this.machineRoomStore.filteredList
    if (!list || list.length === 0) {
      return
    }

    // 获取所有机房的告警信息
    const alarmsMap = await findMachineRoomAlarm().then((res) => {
      const result = {}

      res.data?.list?.forEach(item => {
        result[item.boardId] = item
      })

      return result
    })


    list.forEach(item => {
      const overlay = createMachineRoomOverlay([item.lng, item.lat], item)
      const alarm = alarmsMap[item.boardId]
      if (alarm) {
        overlay.getElement().classList.add('alarm')
        overlay.set('alarmInfo', alarm)
      }
      overlay.set('data', item)
      this.machineRoomOverlays.push(overlay)
      this.map.addOverlay(overlay)
    })
  }
  create() {
    this.createMachineRoomOverlays()
  }
  show() {
    if (this.machineRoomOverlays.length === 0) {
      this.create()
    } else {
      showOverlays(this.machineRoomOverlays)
    }
  }
  hide() {
    hideOverlays(this.machineRoomOverlays)  
  }
  destroy() {
    this.removeMachineRoomOverlays()

    this.stopDelegateClick()
    this.stopMachineRoomWatch()
  }
}
