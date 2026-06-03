<template>
  <TreeSelect ref="treeSelectRef" width="6rem" :loading="deviceStore.loading" :list="deviceStore.listTree" @search="handleSearch" @select="handleSelect">
    <template #left>
      <div class="device-tree-box bigscreen-card-common-bg">
        <el-tree ref="treeRef" class="filter-tree" :data="deviceStore.treeData" :props="treeProps" node-key="id" default-expand-all highlight-current @current-change="handleCurrentChange">
          <template #default="{ node }">
            <div class="tree-label">
              <div>{{ node.label }}</div>
            </div>
          </template>
        </el-tree>
      </div>
    </template>
  </TreeSelect>
</template>

<script setup>
  import { useMessage } from '@/hooks/message';
  import { useEventbus } from '@/hooks/useEventbus';
  import { useDeviceStore } from './stores/useDevice';
  import TreeSelect from './TreeSelect.vue';
  import DeviceStage from '../Map3D/utils2D/stage/DeviceStage.js';

  const deviceStore = useDeviceStore(); 
  const treeSelectRef = ref(null);
  const eventBus = useEventbus();

  const treeRef = ref();
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
    deviceStore.updateList({ name });
  };

  const handleCurrentChange = (data) => {
    if (!data) {
      return
    }
    if (data.levelType !== 'NAME') {
      nextTick(() => {
        // 恢复上次选中的节点
        treeRef.value?.setCurrentKey(deviceStore.modelId);
      });
      return;
    }
    deviceStore.setModelId(data.id)
    deviceStore.updateList({ name: treeSelectRef.value.getSearchText() });
    eventBus.customEmitObject('changeMapStage', {
      id: DeviceStage.name,
    });
  };

  const handleSelect = (item) => {
    eventBus.customEmitObject('openDialog', {
      type: 'device',
      data: item,
    });
    if (!item.lat) {
      useMessage().error('该设备没有定位信息');
      return;
    }
    eventBus.customEmitObject('setMapCenter', {
      center: [item.lng, item.lat],
      zoom: 16,
    });
  };

  onMounted(() => {
    deviceStore.updateTreeData();
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
