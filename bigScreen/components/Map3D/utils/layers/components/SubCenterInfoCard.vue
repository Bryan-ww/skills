<template>
<div class="sub-center-info-card">
  <div class="card-title">{{ data.name }}</div>
  <DeviceOverview />
</div>
</template>

<script setup>
import DeviceOverview from './DeviceOverview.vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

</script>

<style lang="scss" scoped>
.sub-center-info-card {
  width: 6.6rem;
  height: 4rem;
  background: url("/assets/images/screen/subcenter_info_big_bg.png") no-repeat;
  background-size: 100% 100%;
  border-radius: 0.06rem;
  padding: 0.1rem;
  box-shadow: 0 0.04rem 0.08rem rgba(0, 60, 150, 0.3);
  font-family: 'Segoe UI', sans-serif;
  color: #e0e9ff;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;


  .card-title {
    font-size: 0.16rem;
    height: 0.2rem;
    color: #4d9eff;
    margin: 0 0 0.04rem 0;
    white-space: nowrap;
  }
}
</style>