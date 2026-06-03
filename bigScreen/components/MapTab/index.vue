<template>
  <div class="map-3d-tab">
    <div v-if="showBackBtn" class="tab-item" @click="backToSubCenter(item)">
      <img :src="`/assets/images/layer_search/back.png`" alt="" />
      返回
    </div>
    <div v-for="item of tabs" :key="item.value" v-show="item.show" class="tab-item" :class="{ active: tab === item.value }" @click="handle(item)">
      <img :src="`/assets/images/layer_search/${item.icon}.png`" :style="{ height: item.height }" alt="" />
      {{ item.label }}
    </div>

    <DeviceSelect ref="deviceSelectRef" />
    <MachineRoomSelect ref="machineRoomSelectRef" />
    <PersonnelSelect ref="personnelSelectRef" />
    <VehicleSelect ref="vehicleSelectRef" />
  </div>
</template>
<script setup>
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';

  import SubCenterStage from '../Map3D/utils2D/stage/SubCenterStage.js';
  import DeviceStage from '../Map3D/utils2D/stage/DeviceStage.js';
  import MachineRoomStage from '../Map3D/utils2D/stage/MachineRoomStage.js';
  import PersonnelStage from '../Map3D/utils2D/stage/PersonnelStage.js';
  import VehicleStage from '../Map3D/utils2D/stage/vehicleStage.js';

  import DeviceSelect from './DeviceSelect.vue';
  import PersonnelSelect from './PersonnelSelect.vue';
  import MachineRoomSelect from './MachineRoomSelect.vue';
  import VehicleSelect from './vehicleSelect.vue';

  import { useEventbus } from '@/hooks/useEventbus';
  const eventBus = useEventbus();
  const subCenterStore = useSubCenterStore();

  const deviceSelectRef = ref(null);
  const machineRoomSelectRef = ref(null);
  const personnelSelectRef = ref(null);
  const vehicleSelectRef = ref(null);

  const showBackBtn = computed(() => {
    return !!subCenterStore.checkedId;
  });
  watch(showBackBtn, (newVal) => {
    tabs.value[0].show = !newVal;
  });

  const tab = ref('');
  const tabs = ref([
    { label: '分公司', show: true, height: '0.2rem', emit: true, icon: 'reset_zoom', value: SubCenterStage.name },
    // 等选择了设备模型后再去触发changeMapStage事件
    { label: '设备', show: true, height: '0.19rem', emit: false, icon: 'switch', value: DeviceStage.name },
    { label: '机房', show: true, height: '0.2rem', emit: true, icon: 'around_search', value: MachineRoomStage.name },
    { label: '车辆位置', show: true, height: '0.2rem', emit: true, icon: 'location', value: VehicleStage.name },
    { label: '人员定位', show: true, height: '0.2rem', emit: true, icon: 'location', value: PersonnelStage.name },
  ]);

  const emits = defineEmits(['tabChange']);

  const backToSubCenter = () => {
    subCenterStore.updateCheckedId('');
  };

  const handle = (item) => {
    if (tab.value === item.value) {
      tab.value = '';
      emits('tabChange', tab.value);
      return;
    }
    if (item.value !== SubCenterStage.name) {
      subCenterStore.updateCheckedId('');
    }
    if (item.value === DeviceStage.name) {
      deviceSelectRef.value.open();
    } else {
      deviceSelectRef.value.hide();
    }
    if (item.value === MachineRoomStage.name) {
      machineRoomSelectRef.value.open();
    } else {
      machineRoomSelectRef.value.hide();
    }
    if (item.value === VehicleStage.name) {
      vehicleSelectRef.value.open();
    } else {
      vehicleSelectRef.value.hide();
    }
    if (item.value === PersonnelStage.name) {
      personnelSelectRef.value.open();
    } else {
      personnelSelectRef.value.hide();
    }

    if (item.emit) {
      eventBus.customEmitObject('changeMapStage', {
        id: item.value,
      });
    }
    tab.value = item.value;

    emits('tabChange', item.value);
  };
</script>
<style lang="less" scoped>
  .map-3d-tab {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    position: fixed;
    top: 1rem;
    left: 5.5rem;
    z-index: 20;
    pointer-events: all;

    .tab-item {
      display: flex;
      align-items: center;
      justify-content: start;
      padding-left: 0.1rem;
      width: 1rem;
      height: 0.3rem;
      background: linear-gradient(#003874 0%, #001d40 100%);
      box-shadow: inset 0px 0px 0.1rem 0px #00274c;
      border-radius: 0.04rem;
      border: 0.01rem solid;
      border-image: linear-gradient(360deg, rgba(91, 172, 255, 1), rgba(111, 182, 255, 1), rgba(9, 98, 160, 1)) 1 1;
      backdrop-filter: blur(2px);
      color: #47aeff;
      font-size: 0.12rem;
      cursor: pointer;

      &.active {
        color: #fff;
      }

      img {
        width: auto;
        height: 0.2rem;
        margin-right: 0.1rem;
      }
    }
  }
</style>
