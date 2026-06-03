<template>
  <CommonSelect ref="commonSelectRef" :loading="machineRoomStore.loading" :list="list" @search="handleSearch" @select="handleSelect" />
</template>

<script setup>
  import CommonSelect from './CommonSelect.vue';
  import { useMachineRoomStore } from './stores/useMachineRoom';
  import { useMessage } from '@/hooks/message';
  import { useEventbus } from '@/hooks/useEventbus';

  const machineRoomStore = useMachineRoomStore();
  const commonSelectRef = ref(null);
  const eventBus = useEventbus();

  const list = computed(() => {
    return machineRoomStore.filteredList.map((item) => {
      return {
        rightText: item.deptName || '',
        ...item,
      };
    })
  });

  const open = () => {
    commonSelectRef.value.open();
  };

  const hide = () => {
    commonSelectRef.value.hide();
  };

  const handleSearch = (name) => {
    machineRoomStore.filterList(name)
  };
  const handleSelect = (item) => {
    eventBus.customEmitObject('openDialog', {
      type: 'machineRoom',
      data: item,
    });
    if (!item.lat) {
      useMessage().error('该机房没有定位信息');
      return;
    }
    eventBus.customEmitObject('setMapCenter', {
      center: [item.lng, item.lat],
      zoom: 9.2,
    });
  };
  defineExpose({
    open,
    hide,
  });
</script>

<style lang="scss" scoped></style>
