<template>
  <vehicleListSelect ref="treeSelectRef" type="vehicle" width="6rem" :isLoading="vehicleStore.isLoading" :list="vehicleStore.list" @search="handleSearch" @select="handleSelect">
    <template #left>
      <div class="device-tree-box bigscreen-card-common-bg">
        <el-tree ref="treeRef" class="filter-tree" :data="vehicleStore.treeData" :props="treeProps" node-key="id" default-expand-all highlight-current @current-change="handleCurrentChange"></el-tree>
      </div>
    </template>
  </vehicleListSelect>
</template>

<script setup>
  import { useMessage } from '@/hooks/message';
  import { useEventbus } from '@/hooks/useEventbus';
  import VehicleStage from '../Map3D/utils2D/stage/vehicleStage.js';
  import { useVehicleStore } from './stores/useVehicle';
  import vehicleListSelect from './vehicleListSelect.vue';

  const vehicleStore = useVehicleStore(); 
  const eventBus = useEventbus();

  const treeRef = ref();
  const treeSelectRef = ref();
  const treeProps = {
    label: 'name',
    value: 'id',
    children: 'children',
  };

  const open = () => {
    treeSelectRef.value.open();
  };

  const hide = () => {
    treeSelectRef.value.hide();
  };

  const handleSearch = (name) => {
    vehicleStore.updateList({ carPlate: name });
  };

  const handleCurrentChange = (data) => {
    if (!data) {
      return;
    }
    vehicleStore.setCurrentNode(data);
    vehicleStore.updateList({ carPlate: treeSelectRef.value.getSearchText() });
    eventBus.customEmitObject('changeMapStage', {
      id: VehicleStage.name,
    });
  };

  const handleSelect = (item) => {
    eventBus.customEmitObject('openDialog', {
      type: 'vehicle',
      data: item,
    });
    if (!item.lat) {
      useMessage().error('该车辆没有定位信息');
      return;
    }
    eventBus.customEmitObject('setMapCenter', {
      center: [item.lng, item.lat],
      zoom: 16,
    });
  };

  onMounted(() => {
    vehicleStore.updateTreeData();
  })

  defineExpose({
    open,
    hide,
  });
</script>

<style lang="scss" scoped>
  .device-tree-box {
    // 树盒子背景颜色
    --el-fill-color-blank: transparent;
    --el-tree-text-color: #fff;
    // 文本颜色
    --el-text-color-regular: #fff;
    // hover背景颜色
    --el-fill-color-light: rgba(0, 0, 0, 0.5);
    // 选中背景颜色
    --el-color-primary-light-9: rgba(0, 0, 0, 0.5);

    width: 2rem;
    height: 100%;
    padding: 0.1rem;
    overflow: auto;

    &::-webkit-scrollbar-track-piece {
      background: transparent !important;
    }

    &::-webkit-scrollbar-thumb {
      background: #114BA0;
      border-radius: 0.05rem;
    }
  }
</style>
