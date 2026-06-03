<template>
  <div class="warning-msg">
    <div class="basic-title2 title-box">
      <div class="title">告警信息</div>
      <div class="filter-box dark-select-box">
        <el-select
          v-show="searchForm.type !== 'IOT'"
          v-model="searchForm.level"
          class="custom-bg w-[112px]"
          :disabled="isLoading"
          size="small"
          :teleported="false"
          placeholder="请选择"
          clearable
          @change="handleLevelChange"
        >
          <el-option v-for="item in alarm_level" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
        <el-button size="small" type="primary" link @click="handleViewMore">更多</el-button>
      </div>
    </div>
    <div class="device-type-box">
      <div
        v-for="item in sourceTypes"
        :key="item.value"
        class="device-type-item"
        :class="{ 'is-active': item.value === searchForm.type, disabled: isLoading }"
        @click="handleTypeChange(item)"
      >
        {{ item.label }}
      </div>
    </div>

    <div v-loading="isLoading" class="big-screen-table scroll-table">
      <div class="main-box h-[2.4rem]">
        <vue3ScrollSeamless v-if="tableData.length > 0" ref="scrollRef" class="scroll-wrap" :classOptions="classOptions" :dataList="tableData">
          <div
            v-for="(row, index) in tableData"
            :key="index"
            class="cursor-pointer scroll-li"
            :data-event-index="index"
            @click="handleViewDetails(row)"
          >
            <div v-if="searchForm.type === 'IOT'" class="w-full column-box">
              <div class="flex items-center justify-between">
                <div class="text-center column-item ellipsis">{{ row.deptName }}</div>
                <div class="column-item column-time">{{ row.alarmTime }}</div>
              </div>
              <div class="msg-content ellipsis">{{ row.deviceName + ' ' + row.alarmData?.alarmDesc }}</div>
            </div>
            <div v-else-if="searchForm.type === 'NCE'" class="w-full column-box">
              <div class="flex items-center justify-between">
                <div class="column-item">
                  <div class="level" :class="['level-' + row.level]">{{ `【${levelMap[row.alarmLevel]}】` }}</div>
                </div>
                <div class="column-item column-time">{{ row.timeCreated }}</div>
              </div>
              <div class="flex items-center justify-between msg-content">
                <div class="flex-1 ellipsis">{{ row.alarmText }}</div>
                <el-tag :type="row.isCleared === 1 ? 'success' : 'warning'" size="small" class="status-tag">{{
                  getDictLabel(row.isCleared, NCE_ALARM_CLEAR_STATUS)
                }}</el-tag>
              </div>
            </div>
            <div v-else class="w-full column-box">
              <div class="flex items-center justify-between">
                <div class="column-item">
                  <div class="level" :class="['level-' + row.level]">{{ `【${levelMap[row.level]}】` }}</div>
                </div>
                <div class="flex-1 text-center column-item ellipsis">{{ row.device?.fields?.deployLoc?.display }}</div>
                <div class="column-item column-time">{{ row.startTime }}</div>
              </div>
              <div class="flex items-center justify-between msg-content">
                <div class="flex-1 ellipsis">{{ row.name }}</div>
                <el-tag class="status-tag ml-[10px]" size="small" :type="getDictValueByKey('alarm_handle_status', row.handleState, 'style', 'info')">
                  {{ getDictValueByKey('alarm_handle_status', row.handleState, 'label', '') }}
                </el-tag>
              </div>
            </div>
            <div
              v-if="row.handleState === 0 && !['IOT', 'NCE'].includes(searchForm.type)"
              class="transfer-btn"
              @click.stop="handleTransferWorkOrder(row)"
            >
              转工单
            </div>
          </div>
        </vue3ScrollSeamless>
      </div>
    </div>

    <warningMsgList ref="warningMsgListRef" />
    <warningMsgDetails ref="warningMsgDetailsRef" />
    <alarmToTicket ref="alarmToTicketRef" @close="handleTicketClose" />
    <nceDetails v-model="isShowDetail" :info-id="selectRuleId" @close="handleCloseView" />
  </div>
</template>

<script setup>
  import { vue3ScrollSeamless } from 'vue3-scroll-seamless';
  import { getScreenAlarms } from '@/api/bigscreen/index';
  import { getAbnormalLogList } from '@/api/iot/index';
  import { getNceAlarmPage } from '@/api/melon/alarm/nceAlarm';
  import { NCE_ALARM_CLEAR_STATUS } from '@/const/index.js';
  import { useDict, getDictValueByKey } from '@/hooks/dict';
  import { getDictObject } from '@/utils/index.js';
  import { getDictLabel } from '@/utils/index.js';
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';
  import warningMsgDetails from '../dialogs/warningMsgDetails.vue';
  import warningMsgList from '../dialogs/warningMsgList.vue';
  import nceDetails from '../dialogs/nceDetails.vue';
  import alarmToTicket from '../dialogs/alarmToTicket.vue';

  const { alarm_level, alarm_handle_status } = useDict('alarm_level', 'alarm_handle_status');

  const scrollRef = ref(null);
  const subCenterStore = useSubCenterStore();
  const warningMsgListRef = ref();
  const warningMsgDetailsRef = ref();
  const alarmToTicketRef = ref();
  const isLoading = ref(false);
  const isShowDetail = ref(false);
  const selectRuleId = ref('');
  const searchForm = reactive({
    level: '',
    type: 'FIELD',
  });
  const sourceTypes = ref([
    { label: '外场设备', value: 'FIELD' },
    { label: '动环', value: 'IOT' },
    { label: '优云', value: 'SERVER' },
    { label: '通信', value: 'NCE' },
  ]);
  const tableData = shallowRef([]);
  const levelMap = computed(() => getDictObject(alarm_level.value));
  const classOptions = {
    singleHeight: 0,
    waitTime: 2000,
    limitMoveNum: 6,
    hoverStop: true,
  };

  watch(
    () => subCenterStore.checkedId,
    () => {
      nextTick(() => {
        getData();
      });
    },
    { immediate: true }
  );

  const handleLevelChange = () => {
    getData();
  };

  const handleTypeChange = (item) => {
    if (isLoading.value) {
      return;
    }
    searchForm.type = item.value;
    getData();
  };

  const getData = () => {
    tableData.value = [];
    isLoading.value = true;
    const opsDeptId = subCenterStore.checkedId || '';
    if (searchForm.type === 'IOT') {
      getAbnormalLogList({ opsDeptId, pageNum: 1, pageSize: 20 })
        .then(({ data }) => {
          tableData.value = (data?.list || []).map((item) => {
            item.alarmData = JSON.parse(item.alarmData || '{}');
            return item;
          });
        })
        .finally(() => {
          isLoading.value = false;
        });
    } else if (searchForm.type === 'NCE') {
      getNceAlarmPage({ opsDeptId, pageNum: 1, pageSize: 100 })
        .then(({ data }) => {
          tableData.value = data.records || [];
        })
        .finally(() => {
          isLoading.value = false;
        });
    } else {
      getScreenAlarms({ ...searchForm, opsDeptId, current: 1, size: 100 })
        .then(({ data }) => {
          tableData.value = data.records || [];
        })
        .finally(() => {
          isLoading.value = false;
        });
    }
  };

  const handleViewMore = () => {
    warningMsgListRef.value?.open();
  };

  const handleCloseView = () => {
    selectRuleId.value = '';
    isShowDetail.value = false;
  };

  const handleTicketClose = () => {
    getData();
  };

  const handleViewDetails = (data) => {
    if (searchForm.type === 'NCE') {
      selectRuleId.value = data.id;
      isShowDetail.value = true;
      return;
    }
    warningMsgDetailsRef.value?.open(data, searchForm.type);
  };

  const handleTransferWorkOrder = (data) => {
    console.log('转工单:', data);
    alarmToTicketRef.value?.open(data);
  };
</script>

<style lang="scss" scoped>
  .warning-msg {
    .title-box {
      display: flex;
      justify-content: space-between;
      .filter-box {
        display: flex;
        align-items: center;
        gap: 0.08rem;
      }
    }
  }
  .device-type-box {
    position: relative;
    display: flex;
    gap: 0.08rem;
    padding: 0.07rem;
    margin-bottom: 0.1rem;
    border-radius: 0.02rem;
    border: 0.01rem solid;
    backdrop-filter: blur(0.01rem);
    border-image: linear-gradient(180deg, rgba(0, 98, 189, 0.3), rgba(0, 98, 189, 1)) 1 1;
    &:before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 1;
      opacity: 0.31;
      background: linear-gradient(180deg, #00142d 0%, #0050ae 100%);
    }
    .device-type-item {
      position: relative;
      z-index: 2;
      padding: 0.02rem 0.18rem;
      font-size: 0.12rem;
      border-radius: 0.02rem;
      color: #46b1ff;
      cursor: pointer;
      transition: all 0.2s ease-in;
      &.is-active {
        color: #fff;
        background: linear-gradient(180deg, #013476 0%, #0071f6 100%);
      }
      &.disabled {
        cursor: not-allowed;
      }
    }
  }
  .scroll-table {
    margin-top: 0.1rem;
    .scroll-wrap {
      height: 100%;
      .scroll-li {
        height: 0.5rem;
        gap: 0.16rem;
        background: rgba(0, 98, 178, 0.2);
        position: relative;
        overflow: hidden;
        &:hover {
          background: rgba(0, 98, 178, 0.4);
          .transfer-btn {
            transform: translateX(0);
          }
        }
        .transfer-btn {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          color: #fff;
          font-size: 0.12rem;
          font-weight: 550;
          transform: translateX(100%);
          z-index: 100;
          transition: transform 0.3s ease-in-out;
          background: linear-gradient(180deg, #013476 0%, #0071f6 100%);
        }
        .column-box {
          font-size: 0.12rem;
          color: #fff;
          .msg-content {
            margin-top: -0.02rem;
          }
          .status-tag {
            background: transparent;
            &.el-tag--primary {
              --el-tag-text-color: #00b7ff;
              --el-tag-border-color: #00b7ff;
            }
            &.el-tag--success {
              --el-tag-border-color: var(--el-color-success);
            }
            &.el-tag--warning {
              --el-tag-border-color: var(--el-color-warning);
            }
            &.el-tag--danger {
              --el-tag-border-color: var(--el-color-danger);
            }
            &.el-tag--info {
              --el-tag-border-color: var(--el-color-info);
            }
          }
        }
      }
    }
    .column-item {
      font-size: 0.12rem;
      line-height: 0.32rem;
      color: #fff;
      &.column-time {
        white-space: nowrap;
      }
      .level {
        &::before {
          content: '';
          display: inline-block;
          width: 0.08rem;
          height: 0.08rem;
        }
        &.level-1::before {
          background: #ff2e2e;
        }
        &.level-2::before {
          background: #fb6707;
        }
        &.level-3::before {
          background: #fbd901;
        }
        &.level-4::before {
          background: #00da7a;
        }
      }
    }
  }
</style>
