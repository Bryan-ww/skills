<template>
  <div class="sub-center-card">
    <div class="card-content">
      <div v-for="item in list" :key="item.key" class="item">
        <img class="icon" :src="item.icon" alt="">
        <div class="content">
          <div class="name">{{ item.name }}</div>
          <div class="count">{{ data[item.key] || 0 }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const list = ref([
  {
    name: '告警设备',
    key: 'alarmDeviceCount',
    icon: '/assets/images/subCenterCard/icon1.png'
  },
  {
    name: '维保设备',
    key: 'maintenanceDeviceCount',
    icon: '/assets/images/subCenterCard/icon2.png'
  },
  {
    name: '在途工单数',
    key: 'inProgressOrderCount',
    icon: '/assets/images/subCenterCard/icon3.png'
  },
])
</script>

<style lang="scss" scoped>
.sub-center-card {

  width: 519px;

  padding: 10px 20px 0 20px;
  background: linear-gradient(0deg, rgb(0, 34, 75, 0.4) 0%, rgb(0, 22, 0, 0.4) 100%);
  box-shadow: inset 0px 0px 9px 0px #00274C;
  border-radius: 4px;
  border: 1px solid;
  border-image: linear-gradient(360deg, rgba(91, 172, 255, 1), rgba(111, 182, 255, 1), rgba(9, 98, 160, 1)) 1 1;
  backdrop-filter: blur(2px);

  .title {
    width: 100%;
    background: url('/assets/images/screen/dialog/arrow_right.png') no-repeat left center;
    background-size: 12px 12px;
    padding-left: 25px;
    line-height: 20px;
    font-size: 14px;
    color: #fff;
  }

  .card-content {
    display: flex;
    align-items: center;
    gap: 20px;
    height: 80px;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 0;
    flex: 1;

    .icon {
      width: 54px;
      height: 66px;
    }

    .content {
      color: #fff;
      font-size: 12px;
      height: 51px;
      width: 93px;
      background: url('/assets/images/subCenterCard/bg.png') no-repeat center center;
      background-size: 100% 100%;
      padding-left: 10px;
      padding-top: 6px;
      white-space: nowrap;
    }
  }
}
</style>