import Stage from './Stage.js'
import { hideOverlays, showOverlays, delegateClick } from '../overlay/util.js'
import { createPersonnelOverlay } from '../overlay/createPersonnelOverlay/index.js'
import { usePersonnelStore } from '@/views/bigScreen/components/MapTab/stores/usePersonnel'
import { useMapConfigStore } from '@/views/bigScreen/components/MapTab/stores/useMapConfig.js';
import { watch } from 'vue'

export default class PersonnelStage extends Stage {
  static name = 'PersonnelStage'
  constructor(map) {
    super(map)
    this.name = PersonnelStage.name
    this.personnelOverlays = []

    
    this.personnelStore = usePersonnelStore()
    this.mapConfigStore = useMapConfigStore()

    this.stopPersonnelWatch = watch(() => this.personnelStore.listHasLocation, (newVal) => {
      if (this.mapConfigStore.stage !== this.name) {
        return
      }
      this.createPersonnelOverlays()
    })

    // 通过事件委托监听点击事件
    this.stopDelegateClick = delegateClick('personnel-overlay', (event, target) => {
      const id = target.dataset.overlayId
      const personnelOverlay = map.getOverlayById(id)
      const data = personnelOverlay?.get('data')

      this.map.getView().animate({
        center: [data.lng, data.lat],
        zoom: 8.6,
        duration: 1000,
      });
    })
  }
  removePersonnelOverlays() {
    this.personnelOverlays.forEach(overlay => {
      this.map.removeOverlay(overlay)
    })
    this.personnelOverlays = []
  }
  createPersonnelOverlays() {
    this.removePersonnelOverlays()

    const list = this.personnelStore.listHasLocation
    if (!list || list.length === 0) {
      return
    }

    list.forEach(item => {
      const overlay = createPersonnelOverlay([item.lng, item.lat], item)
      overlay.set('data', item)
      this.personnelOverlays.push(overlay)
      this.map.addOverlay(overlay)
    })
  }
  create() {
    // 通过更新list来触发创建overlay的方法
    this.personnelStore.updateList()
  }
  show() {
    if (this.personnelOverlays.length === 0) {
      this.create()
    } else {
      showOverlays(this.personnelOverlays)
    }
  }
  hide() {
    hideOverlays(this.personnelOverlays)
  }
  destroy() {
    this.removePersonnelOverlays()

    this.stopDelegateClick()
    if (this.stopPersonnelWatch) {
      this.stopPersonnelWatch()
    }
  }
}
