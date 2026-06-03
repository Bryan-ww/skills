<template>
  <div class="right-box sidebar-box sf-glass-right" :class="{ 'is-open': isOpen }">
    <warningMsg />
    <workOrder />
  </div>
</template>

<script setup>
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';
  import warningMsg from './warningMsg/index.vue';
  import workOrder from './workOrder/index.vue';

  const subCenterStore = useSubCenterStore();
  const isOpen = ref(false);

  watch(() => subCenterStore.checkedId, (newVal) => {
    isOpen.value = false;
    setTimeout(() => {
      isOpen.value = true;
    }, 1000);
  })

  onMounted(() => {
    setTimeout(() => {
      isOpen.value = true;
    }, 1000);
  });
</script>

<style lang="scss" scoped>
  .right-box {
    right: 0;
    transform: translate(100%, 0%);
  }
</style>
