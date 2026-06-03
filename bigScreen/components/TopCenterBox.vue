<template>
  <div class="top-center-box">
    <div class="flex items-center statistical-overview">
      <div class="overview-item" @click="openDevice('online')">
        <img class="item-icon" src="/assets/images/screen/overview/icon-online.png" alt="" />
        <div class="item-content">
          <div class="item-name">在线设备</div>
          <div class="item-num online">{{ deviceStatusCount.onlineCount }}</div>
        </div>
      </div>
      <div class="overview-item" @click="openDevice('offline')">
        <img class="item-icon" src="/assets/images/screen/overview/icon-offline.png" alt="" />
        <div class="item-content">
          <div class="item-name">离线设备</div>
          <div class="item-num offline">{{ deviceStatusCount.offlineCount }}</div>
        </div>
      </div>
      <div class="overview-item" @click="openDevice('warning')">
        <img class="item-icon" src="/assets/images/screen/overview/icon-warning.png" alt="" />
        <div class="item-content">
          <div class="item-name">告警设备</div>
          <div class="item-num warning">{{ deviceStatusCount.alarmCount }}</div>
        </div>
      </div>
      <div class="overview-item" @click="openDevice('maintain')">
        <img class="item-icon" src="/assets/images/screen/overview/icon-maintain.png" alt="" />
        <div class="item-content">
          <div class="item-name">维保设备</div>
          <div class="item-num maintain">{{ deviceStatusCount.maintenanceCount }}</div>
        </div>
      </div>
    </div>
    <deviceList ref="deviceListRef" />
  </div>
</template>

<script setup>
  import { getDeviceStatusCount } from '@/api/bigscreen/index';
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';
  import deviceList from '@/views/bigScreen/components/dialogs/deviceList.vue';

  const subCenterStore = useSubCenterStore();
  const deviceStatusCount = ref({});
  const deviceListRef = ref();

  watch(
    () => subCenterStore.checkedId,
    () => {
      nextTick(() => {
        getData();
      });
    },
    { immediate: true }
  );

  const getData = () => {
    getDeviceStatusCount({ opsDeptId: subCenterStore.checkedId }).then(({ data }) => {
      deviceStatusCount.value = data || {};
    });
  };

  const openDevice = (type) => {
    deviceListRef.value.open(type);
  };
</script>

<style lang="scss" scoped>
  .top-center-box {
    position: absolute;
    top: 0.95rem;
    left: 50%;
    transform: translate(-50%, 0);
    z-index: 2;
    .statistical-overview {
      gap: 0.1rem;
      .overview-item {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        gap: 0.16rem;
        cursor: pointer;
        .item-icon {
          width: 0.63rem;
        }
        .item-content {
          padding: 0.05rem 0.2rem 0.05rem 0.5rem;
          margin-left: -0.46rem;
          background: url(/assets/images/screen/overview/content-bg.png);
          background-repeat: no-repeat;
          background-size: 100% 100%;
        }
        .item-name {
          margin-bottom: 0.02rem;
          font-size: 0.1rem;
          color: #f6faff;
        }
        .item-num {
          line-height: 1;
          font-size: 0.18rem;
          letter-spacing: 0.01rem;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          &.online {
            background-image: linear-gradient(258deg, #00da7a 0%, #a1ffd6 100%);
          }
          &.offline {
            background-image: linear-gradient(258deg, #ada100 0%, #fffdcb 100%);
          }
          &.warning {
            background-image: linear-gradient(258deg, #ff3a3a 0%, #ffa1a1 100%);
          }
          &.maintain {
            background-image: linear-gradient(258deg, #006eda 0%, #b9deff 100%);
          }
        }
      }
    }
  }
</style>
