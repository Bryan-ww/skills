<template>
  <CommonSelect ref="commonSelectRef" :loading="personnelStore.loading" :list="list" @search="handleSearch" @select="handleSelect" />
</template>

<script setup>
  import CommonSelect from './CommonSelect.vue';
  import { usePersonnelStore } from './stores/usePersonnel';
  import { useMessage } from '@/hooks/message';
  import { useEventbus } from '@/hooks/useEventbus';

  const personnelStore = usePersonnelStore();
  const commonSelectRef = ref(null);
  const eventBus = useEventbus();

  const list = computed(() => {
    return personnelStore.list.map((item) => {
      return {
        rightText: item.phone || '',
        ...item,
      };
    });
  });

  const open = () => {
    commonSelectRef.value.open();
  };

  const hide = () => {
    commonSelectRef.value.hide();
  };

  const handleSearch = (name) => {
    personnelStore.updateList({ name });
  };
  const handleSelect = (item) => {
    if (!item.lat) {
      useMessage().error('该人员没有定位信息');
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
