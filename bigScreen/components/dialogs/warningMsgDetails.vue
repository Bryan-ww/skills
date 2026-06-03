<template>
  <el-dialog v-model="isVisible" class="screen-dark-dialog" :show-close="false" :width="sourceType === 'IOT' ? '6rem' : '8rem'" append-to-body>
    <template #header>
      <div class="header-title">
        <div class="left-box">
          <span class="title-label">告警详情</span>
        </div>
        <div class="right-box">
          <span class="close" @click="handleClose"></span>
        </div>
      </div>
    </template>

    <div class="dark-table-box">
      <div v-if="sourceType === 'IOT'" v-loading="isLoading" class="info-box">
        <div class="alarm-overview my-[10px]">{{ iotInfoData.deptName + ' ' + iotInfoData.alarmData?.alarmDesc }}</div>
        <div class="title">告警信息</div>
        <el-descriptions class="dialog-descriptions" :column="1" border>
          <el-descriptions-item label="告警时间">{{ iotInfoData.alarmTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="告警类型">{{ iotInfoData.code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ iotInfoData.deviceName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备位置">{{ iotInfoData.deptName || '' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <div v-else v-loading="isLoading" class="info-box">
        <div class="alarm-overview my-[10px]">{{ infoData.content }}</div>
        <div class="title">告警信息</div>
        <el-descriptions class="dialog-descriptions" :column="2" border>
          <el-descriptions-item label="告警时间">{{ infoData.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="告警名称">{{ infoData.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ infoData.device?.fields?.name?.display || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备位置">
            {{ infoData.device?.fields?.section?.display || '' }}
            {{ infoData.device?.fields?.pileNum?.display || '' }}
            {{ infoData.device?.fields?.direction?.display || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="设备类型">
            {{ infoData.device?.fields?.type?.display || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="告警等级">
            <el-tag v-if="!isEmpty(infoData.level)" :type="getDictValueByKey('alarm_level', infoData.level, 'style', 'info')">
              {{ getDictValueByKey('alarm_level', infoData.level, 'label', '') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警状态">
            <el-tag v-if="!isEmpty(infoData.handleState)" :type="getDictValueByKey('alarm_handle_status', infoData.handleState, 'style', 'info')">
              {{ getDictValueByKey('alarm_handle_status', infoData.handleState, 'label', '') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="归属系统">{{ infoData.device?.fields?.belongSystem?.display || '-' }}</el-descriptions-item>
          <el-descriptions-item label="持续时长">{{ formatSeconds(infoData.alarmDuration) || 0 + ' min' }}</el-descriptions-item>
          <el-descriptions-item label="数据来源">{{ infoData.sourceDesc || '-' }}</el-descriptions-item>
          <el-descriptions-item label="归属组织">{{ infoData.device?.fields?.ownDep?.display || '-' }}</el-descriptions-item>
          <el-descriptions-item label="运维组织">{{ infoData.device?.fields?.opsDep?.display || '-' }}</el-descriptions-item>
          <el-descriptions-item label="告警图片">
            <div v-if="imageUrls.length > 0" class="img-list">
              <el-image
                v-for="(imageUrl, index) in imageUrls"
                :key="imageUrl"
                class="img-item"
                fit="cover"
                :src="imageUrl"
                :preview-src-list="imageUrls"
                :initial-index="index"
              />
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
  import alarmApi from '@/api/melon/alarm/index';
  import { getDictValueByKey } from '@/hooks/dict';
  import { isEmpty } from '@/utils/index.js';
  import { formatSeconds } from '@/utils/common';
  // import lineChart from './lineChart.vue';

  const dialogId = ref('');
  const sourceType = ref('FIELD');
  const isLoading = ref(false);
  const isVisible = ref(false);
  const infoData = ref({ device: { fields: {} }, details: [] });
  const iotInfoData = ref({});

  const imageUrls = computed(() => {
    return (infoData.value.attachments || []).map((item) => {
      return item.mediaUrl.includes('http') ? item.mediaUrl : '/api' + item.mediaUrl;
    });
  });

  const open = async (data, type = 'FIELD') => {
    sourceType.value = type;
    dialogId.value = data.id;
    isVisible.value = true;
    if (type === 'IOT') {
      iotInfoData.value = data;
    } else {
      getData();
    }
  };

  const getData = async () => {
    isLoading.value = true;
    try {
      const res = await alarmApi.details(dialogId.value);
      infoData.value = res.data || {};
      if (!infoData.value.details) {
        infoData.value.details = [];
      }
    } catch (error) {
      // console.error(error);
    } finally {
      isLoading.value = false;
    }
  };

  const handleClose = () => {
    dialogId.value = '';
    isVisible.value = false;
    infoData.value = {};
    iotInfoData.value = {};
  };

  defineExpose({
    open,
  });
</script>

<style lang="scss" scoped>
  .img-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    .img-item {
      width: 120px;
      height: 120px;
      border: 1px solid var(--el-border-color-darker);
      border-radius: 8px;
    }
  }
</style>
