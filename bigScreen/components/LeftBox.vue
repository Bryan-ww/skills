<template>
  <div class="left-box sidebar-box sf-glass-left" :class="{ 'is-open': isOpen }">
    <div class="basic-title2">
      <div class="title">机电设备统计</div>
    </div>

    <!-- 资产分布 -->
    <assetDistribution />

    <!-- 机房环境、服务器监测 -->
    <monitorOverview />

    <!-- 故障设备Top -->
    <!-- <faultDeviceTop /> -->
  </div>
</template>

<script setup>
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';
  import assetDistribution from './assetDistribution/index.vue';
  import deviceOnlineRate from './deviceOnlineRate/index.vue';
  import monitorOverview from './monitorOverview/index.vue';
  // import faultDeviceTop from './faultDeviceTop/index.vue';

  const subCenterStore = useSubCenterStore();
  const isOpen = ref(false);

  watch(
    () => subCenterStore.checkedId,
    (newVal) => {
      isOpen.value = false;
      setTimeout(() => {
        isOpen.value = true;
      }, 1000);
    }
  );

  onMounted(() => {
    setTimeout(() => {
      isOpen.value = true;
    }, 1000);
  });
</script>

<style lang="scss" scoped>
  .left-box {
    left: 0;
    transform: translate(-100%, 0%);
    justify-content: space-between;
  }
</style>
