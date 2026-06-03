<template>
  <el-dialog v-model="isVisible" class="vehicle-details screen-dark-dialog" :show-close="false" width="8rem" append-to-body>
    <template #header>
      <div class="header-title">
        <div class="left-box">
          <span class="title-label">车辆详情</span>
        </div>
        <div class="right-box">
          <span class="close" @click="handleClose"></span>
        </div>
      </div>
    </template>

    <div v-loading="isLoading" class="dark-table-box">
      <div class="base-info">
        <div class="base-info-header flex items-center justify-between">
          <div class="flex items-end">
            <div>车牌号：</div>
            <div class="mr-[8px] text-[14px]">{{ infoData.carPlate || '-' }}</div>
          </div>
          <div class="flex items-end">{{ infoData.stateCn || '-' }}</div>
        </div>
        <el-descriptions class="dialog-descriptions w-full" :column="4" border>
          <el-descriptions-item label="定位时间">{{ infoData.location?.locTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="行驶速度">{{ infoData.location?.speed || '-' }}</el-descriptions-item>
          <el-descriptions-item label="行驶方向">{{ infoData.location?.drctCn || '-' }}</el-descriptions-item>
          <el-descriptions-item label="定位经度">{{ infoData.location?.lng || '-' }}</el-descriptions-item>
          <el-descriptions-item label="定位纬度">{{ infoData.location?.lat || '-' }}</el-descriptions-item>
          <el-descriptions-item label="定位海拔">{{ infoData.location?.height || '-' }}</el-descriptions-item>
          <el-descriptions-item label="定位信号">{{ infoData.location?.satl || '-' }}</el-descriptions-item>
          <el-descriptions-item label="通信信号">{{ infoData.location?.sgn || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地理位置" :span="4">{{ infoData.location?.addr || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
  import { getVehicleDetails } from '@/api/melon/vehicle/index';

  const dialogId = ref('');
  const isLoading = ref(false);
  const isVisible = ref(false);
  const infoData = ref({});
  const open = (data) => {
    dialogId.value = data.id;
    infoData.value = data;

    isVisible.value = true;
    getInfoData();
  };

  const getInfoData = () => {
    isLoading.value = true;
    getVehicleDetails(dialogId.value).then(({ data }) => {
      infoData.value = data || {};
    }).finally(() => {
      isLoading.value = false;
    });
  };

  const handleClose = () => {
    dialogId.value = '';
    isVisible.value = false;
    infoData.value = {};
  };

  defineExpose({
    open,
  });
</script>

<style lang="scss" scoped>
  .vehicle-details {
    .base-info {
      padding: 16px;
      border-radius: 4px;
      border: 1px solid;
      box-shadow: inset 0px 0px 11px 0px #00274c;
      background: linear-gradient(0deg, rgba(0, 128, 255, 0.5) 0%, #002a54 100%);
      border-image: linear-gradient(360deg, rgba(91, 172, 255, 1), rgba(111, 182, 255, 1), rgba(9, 98, 160, 1)) 1 1;
      .base-info-header {
        margin-bottom: 10px;
        font-size: 12px;
        font-weight: 500;
        color: #fff;
      }
      :deep(.dialog-descriptions) {
        .el-descriptions__body {
          background: transparent !important;
          .el-descriptions__label {
            white-space: nowrap;
          }
          .el-descriptions__label,
          .el-descriptions__content {
            font-size: 12px !important;
            min-width: unset !important;
          }
        }
      }
    }
  }
</style>
