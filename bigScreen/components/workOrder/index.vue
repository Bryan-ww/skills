<template>
  <div class="analysis-box">
    <deviceOnlineRate />
    <teamMember v-if="subCenterStore.checkedId" />
    <deviceIntegrityRate v-else />
  </div>
</template>

<script setup>
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';
  import deviceOnlineRate from '../deviceOnlineRate/index.vue';
  import deviceIntegrityRate from './deviceIntegrityRate.vue';
  import teamMember from './teamMember.vue';
  const subCenterStore = useSubCenterStore();
</script>

<style lang="scss" scoped>
  .analysis-box {}
</style>
