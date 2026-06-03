import { createSubCenterOverlay } from '../overlay/createSubCenterOverlay.js';
import { createAlertOverlay } from '../overlay/createAlertOverlay.js';
import Stage from './Stage.js';
import { hideOverlays, showOverlays, setOverlayParentZIndex, delegateClick } from '../overlay/util.js';
import { createSubCenterCardOverlay } from '../overlay/createSubCenterCardOverlay/index.js';
import { createMachineRoomOverlay } from '../overlay/createMachineRoomOverlay.js';
import { createTollStationOverlay } from '../overlay/createTollStationOverlay.js';
import { initZoom } from '../../mini2d/utils/index.js';
import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';
import { watch } from 'vue';
import { createRoadLayers } from '../createRoad.js';
import JTGDGS from '@/views/bigScreen/components/Map3D/json/JTGDGS.json';
import JTSDGS from '@/views/bigScreen/components/Map3D/json/JTSDGS.json';
import { getDeptDeviceStat, getMaintenanceCenterAlarmCounts } from '@/api/admin/screen';
import { useEventbus } from '@/hooks/useEventbus';
import { useTollStationStore } from '@/views/bigScreen/components/MapTab/stores/useTollStation.js';
import { useMachineRoomStore } from '@/views/bigScreen/components/MapTab/stores/useMachineRoom.js';
import { useMapConfigStore } from '@/views/bigScreen/components/MapTab/stores/useMapConfig.js';
import { findMachineRoomAlarm } from '@/api/iot/index.js';

export default class SubCenterStage extends Stage {
  static name = 'SubCenterStage';
  constructor(map) {
    super(map);
    this.name = SubCenterStage.name;
    // 分公司铭牌
    this.subCenterOverlays = [];
    // 告警
    this.alertOverlays = [];
    // 分公司信息卡片
    this.subCenterCardOverlay = null;
    // 轮播索引
    this.carouselIndex = 0;
    // 轮播时间间隔 秒
    this.carouselInterval = 8 * 1000;
    this.carouselTimer = null;
    // 分公司机房图层
    this.machineRoomOverlays = [];
    // 分公司列表
    this.subCenters = [];
    // 分公司收费占图层
    this.tollStationOverlays = [];

    // 分公司国道
    this.gd = null;
    // 分公司省道
    this.sd = null;

    this.subCenterStore = useSubCenterStore();

    this.stopWatchCheckedId = watch(
      () => this.subCenterStore.checkedId,
      (newVal) => {
        if (!newVal) {
          this.removeMachineRoomOverlays();
          this.removeTollStationOverlays();
          this.clearRoad();
          this.unCheck();
          this.show();
        }
      }
    );

    // 通过事件委托监听点击事件
    this.stopMachineRoomDelegateClick = delegateClick('machine-room-overlay', (event, target) => {
      if (useMapConfigStore().stage !== this.name) {
        return;
      }
      const id = target.dataset.overlayId;
      const machineRoomOverlay = this.map.getOverlayById(id);
      const data = machineRoomOverlay?.get('data');

      useEventbus().customEmitObject('openDialog', { type: 'machineRoom', data: data });
    });

    // 通过事件委托监听点击事件
    this.stopDelegateClick = delegateClick('sub-center-overlay', (event, target) => {
      const id = target.dataset.overlayId;
      const subCenterOverlay = map.getOverlayById(id);
      if (!subCenterOverlay) {
        return;
      }
      const data = subCenterOverlay?.get('data');
      console.log('分中心数据', data);

      const mapCenter = [data.lng, data.lat];

      this.subCenterStore.updateCheckedId(data.deptId);

      this.stopCarousel();
      this.unCheck();

      // uncheck的时候需要使用到carouselIndex
      this.carouselIndex = this.subCenterOverlays.indexOf(subCenterOverlay);
      hideOverlays(this.alertOverlays);
      // 只显示选中的分公司卡片
      this.subCenterOverlays.forEach((item) => {
        if (item !== subCenterOverlay) {
          hideOverlays([item]);
        } else {
          item?.getElement().classList.add('checked');
        }
      });

      this.subCenterCardOverlay.setPosition(mapCenter);
      getDeptDeviceStat(data.deptId).then((res) => {
        const params = { ...data, ...res.data };
        this.subCenterCardOverlay.getElement().updateProps({ data: params });
      });

      this.map.getView().animate({
        center: mapCenter,
        zoom: 8.6,
        duration: 1000,
      });

      setTimeout(() => {
        // 创建分公司机房图层
        this.createMachineRoomOverlays(data.kchildren);

        // 创建分公司管辖路段图层
        this.createRoadLayer(data.buMenCode);
        // 创建当前分中心路段收费站图层
        useTollStationStore()
          .updateList(data.deptId)
          .then((tollStations) => {
            this.createTollStationOverlays(tollStations);
          });
      }, 1000);
    });
    // 通过事件委托监听点击事件
    this.stopTollStationDelegateClick = delegateClick('toll-station-overlay', (event, target) => {
      const id = target.dataset.overlayId;
      const currentTollStation = map.getOverlayById(id);
      if (!currentTollStation) {
        return;
      }
      const data = currentTollStation?.get('data');
      const mapCenter = [data.lng, data.lat];
      this.tollStationOverlays.forEach((item) => {
        if (item == currentTollStation) {
          item?.getElement().classList.add('checked');
        } else {
          item?.getElement().classList.remove('checked');
        }
      });

      currentTollStation.setPosition(mapCenter);

      this.map.getView().animate({
        center: mapCenter,
        zoom: 8.6,
        duration: 1000,
      });
      // 隐藏分中统计卡片
      hideOverlays([this.subCenterCardOverlay]);
      useEventbus().customEmitObject('openDialog', { type: 'tollStation', data: data });
    });
  }
  // 创建分公司管辖路段图层
  createRoadLayer(buMenCode) {
    const gd = JTGDGS[buMenCode];
    const sd = JTSDGS[buMenCode];
    if (gd) {
      createRoadLayers({ temp: gd }, { originalData: true, width: 3, zIndex: 4, color: '#ff0000' }).then((res) => {
        this.gd = res;
        this.map.addLayer(res);
      });
    }
    if (sd) {
      createRoadLayers({ temp: sd }, { originalData: true, width: 3, zIndex: 4, color: '#ff0000' }).then((res) => {
        this.sd = res;
        this.map.addLayer(res);
      });
    }
  }
  removeMachineRoomOverlays() {
    this.machineRoomOverlays.forEach((overlay) => {
      this.map.removeOverlay(overlay);
    });
    this.machineRoomOverlays = [];
  }
  async createMachineRoomOverlays(tollStations) {
    this.removeMachineRoomOverlays();

    if (!tollStations || tollStations.length === 0) {
      return;
    }

    // 获取所有机房的告警信息
    const alarmsMap = await findMachineRoomAlarm().then((res) => {
      const result = {};

      res.data?.list?.forEach((item) => {
        result[item.boardId] = item;
      });

      return result;
    });

    const machineRoomsMap = useMachineRoomStore().listMap;

    tollStations.forEach((item) => {
      const machineRoom = machineRoomsMap[item.deptId];
      if (machineRoom) {
        const overlay = createMachineRoomOverlay([machineRoom.lng, machineRoom.lat], {
          name: machineRoom.name,
        });
        const alarm = alarmsMap[machineRoom.boardId];
        if (alarm) {
          overlay.getElement().classList.add('alarm');
          overlay.set('alarmInfo', alarm);
        }
        overlay.set('data', machineRoom);
        this.machineRoomOverlays.push(overlay);
        this.map.addOverlay(overlay);
      }
    });
  }

  createTollStationOverlays = (subTollStations) => {
    this.removeTollStationOverlays();
    if (!subTollStations || subTollStations.length === 0) {
      return;
    }
    for (const item of subTollStations) {
      if (!item.lng || !item.lat) {
        continue;
      }
      const overlay = createTollStationOverlay({ name: item.name, point: [item.lng, item.lat] });
      overlay.set('data', item);
      this.tollStationOverlays.push(overlay);
      this.map.addOverlay(overlay);
    }
  };
  removeTollStationOverlays() {
    this.tollStationOverlays.forEach((overlay) => {
      this.map.removeOverlay(overlay);
    });
    this.tollStationOverlays = [];
  }

  clearRoad() {
    if (this.gd) {
      this.map.removeLayer(this.gd);
    }
    if (this.sd) {
      this.map.removeLayer(this.sd);
    }
    this.gd = null;
    this.sd = null;
  }
  /**
   * 开始轮播分公司信息卡片
   */
  startCarousel() {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }
    this.carouselTimer = null;
    this.carouselIndex = 0;

    this.showSubCenterCardOverlay();
    this.carouselTimer = setInterval(() => {
      this.showSubCenterCardOverlay();
    }, this.carouselInterval);
  }
  /**
   * 暂停轮播分公司信息卡片
   */
  stopCarousel() {
    clearInterval(this.carouselTimer);
    this.carouselTimer = null;
  }
  showSubCenterCardOverlay() {
    if (this.subCenterOverlays.length === 0) {
      return;
    }
    showOverlays([this.subCenterCardOverlay]);

    // 取消选中
    let subCenterOverlay = this.subCenterOverlays[this.carouselIndex];
    subCenterOverlay?.getElement().classList.remove('checked');
    setOverlayParentZIndex(subCenterOverlay, 0);

    this.carouselIndex = (this.carouselIndex + 1) % this.subCenterOverlays.length;

    // 选中
    subCenterOverlay = this.subCenterOverlays[this.carouselIndex];
    subCenterOverlay?.getElement().classList.add('checked');
    setOverlayParentZIndex(subCenterOverlay, 1);
    const data = subCenterOverlay?.get('data');

    const mapCenter = [data.lng, data.lat];
    this.subCenterCardOverlay.setPosition(mapCenter);
    getDeptDeviceStat(data.deptId).then((res) => {
      const params = { ...data, ...res.data };
      this.subCenterCardOverlay.getElement().updateProps({ data: params });
    });

    this.map.getView().animate({
      center: mapCenter,
      zoom: initZoom,
      duration: 1000,
    });
  }
  hideSubCenterCardOverlay() {
    hideOverlays([this.subCenterCardOverlay]);
    this.removeMachineRoomOverlays();
  }
  createSubCenterCardOverlay() {
    this.subCenterCardOverlay = createSubCenterCardOverlay([88, 44], { name: '' });
    hideOverlays([this.subCenterCardOverlay]);
    this.map.addOverlay(this.subCenterCardOverlay);
  }
  async createAlertOverlays() {
    const alarmCountMap = await getMaintenanceCenterAlarmCounts().then(({ code, data }) => {
      if (code === 0) {
        return data || {};
      }

      return {};
    });

    this.subCenters.forEach((item) => {
      const countString = alarmCountMap[item.deptId];
      if (countString && Number(countString) > 0) {
        const overlay = createAlertOverlay([item.lng, item.lat]);

        this.alertOverlays.push(overlay);
        this.map.addOverlay(overlay);
      }
    });
  }

  async createSubCenterOverlays() {
    this.subCenters = useSubCenterStore().subCenters;
    for (const item of this.subCenters) {
      const overlay = createSubCenterOverlay({ name: item.name, point: [item.lng, item.lat] });
      overlay.set('data', item);

      this.subCenterOverlays.push(overlay);
      this.map.addOverlay(overlay);
    }
  }
  async create() {
    await this.createSubCenterOverlays();
    this.createAlertOverlays();
    this.createSubCenterCardOverlay();
  }
  // 取消当前选中
  unCheck() {
    let subCenterOverlay = this.subCenterOverlays[this.carouselIndex];
    subCenterOverlay?.getElement().classList.remove('checked');
  }
  async show() {
    if (this.subCenterOverlays.length === 0) {
      await this.create();
    } else {
      showOverlays(this.subCenterOverlays);
      showOverlays(this.alertOverlays);
    }
    this.startCarousel();
  }
  hide() {
    hideOverlays(this.subCenterOverlays);
    hideOverlays(this.alertOverlays);
    hideOverlays([this.subCenterCardOverlay]);
    this.stopCarousel();
    this.unCheck();
    this.clearRoad();
    this.removeMachineRoomOverlays();
  }
  destroy() {
    // 取消选中
    this.unCheck();

    this.map.removeOverlay(this.subCenterCardOverlay);
    this.subCenterCardOverlay.getElement().unmount();
    this.subCenterCardOverlay = null;
    this.stopCarousel();

    this.subCenterOverlays.forEach((overlay) => {
      this.map.removeOverlay(overlay);
    });
    this.subCenterOverlays = [];

    this.alertOverlays.forEach((overlay) => {
      this.map.removeOverlay(overlay);
    });
    this.alertOverlays = [];

    this.removeMachineRoomOverlays();

    this.stopMachineRoomDelegateClick();
    this.stopDelegateClick();
    this.stopWatchCheckedId();
    this.stopTollStationDelegateClick();

    this.clearRoad();
  }
}
