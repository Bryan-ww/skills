<template>
  <el-dialog
    :model-value="modelValue"
    class="screen-dark-dialog"
    width="10rem"
    :showClose="false"
    append-to-body
    @update:modelValue="(value) => emits('update:modelValue', value)"
  >
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
      <div v-loading="isLoading" class="info-box">
        <div class="module-box">
          <div class="module-subtitle mb-[10px]">基本信息</div>
          <el-descriptions :column="3" border label-width="120" class="dialog-descriptions">
            <el-descriptions-item label="告警名称" label-align="right">{{ infoData.alarmText }}</el-descriptions-item>
            <el-descriptions-item label="告警级别" label-align="right">
              <el-tag :type="getDictValueByKey('alarm_level', infoData.alarmLevel, 'style', 'info')">{{
                getDictValueByKey('alarm_level', infoData.alarmLevel, 'label', '')
              }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="告警源" label-align="right">{{ infoData.neName }}</el-descriptions-item>
            <el-descriptions-item label="类型" label-align="right">{{ getDictLabel(infoData.eventType, nce_alarm_event_type) }}</el-descriptions-item>
            <el-descriptions-item label="告警源类型" label-align="right">{{ infoData.productType }}</el-descriptions-item>
            <el-descriptions-item label="IP地址" label-align="right">{{ infoData.ipAddress }}</el-descriptions-item>
            <el-descriptions-item label="告警流水号" label-align="right">{{ infoData.alarmSerialNumber }}</el-descriptions-item>
            <el-descriptions-item label="原因ID" label-align="right">{{ infoData.reasonId }}</el-descriptions-item>
            <el-descriptions-item label="层级" label-align="right">{{ infoData.layer }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="module-box mt-[16px]">
          <div class="module-subtitle mb-[10px]">时间信息</div>
          <el-descriptions :column="3" border label-width="120" class="dialog-descriptions">
            <el-descriptions-item label="创建时间" label-align="right">{{ infoData.timeCreated }}</el-descriptions-item>
            <el-descriptions-item label="EMS时间" label-align="right">{{ infoData.emsTime }}</el-descriptions-item>
            <el-descriptions-item label="最近变更时间" label-align="right">{{ infoData.lastChanged }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="module-box mt-[16px]">
          <div class="module-subtitle mb-[10px]">状态信息</div>
          <el-descriptions :column="2" border label-width="120" class="dialog-descriptions">
            <el-descriptions-item label="清除状态" label-align="right">
              <el-tag :type="infoData.isCleared === 1 ? 'success' : 'warning'">{{ getDictLabel(infoData.isCleared, NCE_ALARM_CLEAR_STATUS) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="确认状态" label-align="right">
              <el-tag :type="infoData.isAcked === 1 ? 'success' : 'danger'">{{ getDictLabel(infoData.isAcked, NCE_ALARM_ACK_STATUS) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="module-box mt-[16px]">
          <div class="module-subtitle mb-[10px]">详细描述</div>
          <el-descriptions :column="2" border label-width="120" class="dialog-descriptions">
            <el-descriptions-item label="位置信息" label-align="right">{{ infoData.locationInfo }}</el-descriptions-item>
            <el-descriptions-item label="可能原因" label-align="right">
              <div :title="infoData.probableCause">{{ infoData.probableCause }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="原生原因代码" label-align="right">{{ infoData.nativeProbableCause }}</el-descriptions-item>
            <el-descriptions-item label="附加信息" label-align="right">{{ infoData.otherInfo }}</el-descriptions-item>
            <el-descriptions-item label="修复建议" label-align="right">{{ infoData.repairAction }}</el-descriptions-item>
            <el-descriptions-item label="影响资源" label-align="right">{{
              Array.isArray(infoData.impactedResource) ? infoData.impactedResource.join(', ') : ''
            }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
  import { getNceAlarmDetail } from '@/api/melon/alarm/nceAlarm';
  import { NCE_ALARM_CLEAR_STATUS, NCE_ALARM_ACK_STATUS } from '@/const/index.js';
  import { getDictValueByKey, useDict } from '@/hooks/dict';
  import { getDictLabel } from '@/utils/index.js';
  import { stubFalse } from 'lodash';

  const emits = defineEmits(['close', 'update:modelValue']);

  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
    width: {
      type: Number,
      default: 1200,
    },
    infoId: {
      type: String,
      default: '',
    },
  });

  const { nce_alarm_event_type } = useDict('nce_alarm_event_type');
  const isLoading = ref(false);
  const infoData = ref({});

  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        getDetail();
      }
    }
  );

  const getDetail = () => {
    infoData.value = {};
    if (props.infoId) {
      isLoading.value = true;
      getNceAlarmDetail(props.infoId)
        .then(({ data }) => {
          infoData.value = data || {};
        })
        .finally(() => {
          isLoading.value = false;
        });
    }
  };

  const handleClose = () => {
    emits('update:modelValue', false);
    emits('close', false);
  };
</script>

<style scoped lang="scss">
  .info-box {
    :deep(.el-descriptions) {
      .el-descriptions__table.is-bordered .el-descriptions__cell {
        white-space: pre;
      }
    }
  }
</style>
