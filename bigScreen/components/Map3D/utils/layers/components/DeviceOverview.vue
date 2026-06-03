<template>
  <div class="device-overview">
    <div class="statistical-overview">
      <div v-for="(item, index) in itemList" :key="index" class="overview-item">
        <div class="item-name">{{ item.name }}</div>
        <div class="item-num">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
  const itemList = ref([
    { name: '全部', value: 898 },
    { name: '在线设备', value: 725 },
    { name: '离线设备', value: 123 },
    { name: '告警设备', value: 10 },
    { name: '维保设备', value: 10 },
  ]);
</script>

<style lang="scss" scoped>
  .device-overview {
    width: 100%;
    z-index: 2;
    .statistical-overview {
      display: flex;
      // 待UI切图 用背景图替换
      border: 1px solid;
      backdrop-filter: blur(26.6px);
      box-shadow: inset 0 -4px 5px 0 rgba(49, 102, 156, 0.32);
      background: linear-gradient(180deg, rgba(7, 13, 23, 0.6) 0%, rgba(6, 48, 101, 0.47) 100%);
      border-image: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(0, 106, 255, 0)) 1 1;
      .overview-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 1.2rem;
        height: 1.4rem;
        background: url(/assets/images/screen/overview-item-bg.png);
        background-repeat: no-repeat;
        background-size: 100% 100%;
        .item-name {
          font-size: 0.13rem;
          color: #00b7ff;
        }
        .item-num {
          margin: 0.06rem 0 0.16rem;
          font-size: 0.26rem;
          line-height: 0.34rem;
          color: #ebeef6;
          text-shadow: 0 0.3rem 0.3rem rgba(5, 18, 35, 0.71);
          background: linear-gradient(9deg, #ebeef6 0%, #cbd2e5 100%);
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }
    }
  }
</style>
