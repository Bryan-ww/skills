<template>
  <el-dialog v-model="isVisible" class="screen-dark-dialog" :show-close="false" append-to-body>
    <template #header>
      <div class="header-title">
        <div class="left-box">
          <span class="title-label">告警信息</span>
        </div>
        <div class="right-box">
          <span class="close" @click="handleClose"></span>
        </div>
      </div>
    </template>

    <div v-loading="isLoading" class="dark-table-box">
      <el-form :model="searchForm" inline class="form-card">
        <el-form-item label="告警平台">
          <el-select v-model="searchForm.type" placeholder="请选择" popper-class="dark-select-popper" clearable @change="getTableData">
            <el-option v-for="option in sourceTypes" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="searchForm.type !== 'IOT'" label="告警等级">
          <el-select v-model="searchForm.level" placeholder="请选择" popper-class="dark-select-popper" clearable>
            <el-option v-for="option in alarm_level" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="searchForm.type !== 'IOT'" label="告警状态">
          <el-select v-model="searchForm.handleState" placeholder="请选择" popper-class="dark-select-popper" clearable>
            <el-option v-for="option in alarm_handle_status" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="searchForm.type !== 'IOT'" label="告警内容">
          <el-input v-model="searchForm.content" placeholder="请输入" maxlength="100" clearable />
        </el-form-item>
        <div>
          <el-button type="primary" :disabled="isLoading" @click="getTableData">查询</el-button>
          <el-button :disabled="isLoading" @click="handleReset">重置</el-button>
        </div>
      </el-form>
      <el-table :data="tableData" stripe height="550">
        <el-table-column type="index" label="序号" width="56"></el-table-column>
        <el-table-column prop="deviceName" label="告警设备" width="150">
          <template #default="{ row }">
            <template v-if="searchForm.type === 'IOT'">{{ row.deviceName }}</template>
            <template v-else>{{ row.device?.modelName }}</template>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="告警等级" width="100">
          <template #default="{ row }">
            <el-tag v-if="searchForm.type !== 'IOT'" :type="getDictValueByKey('alarm_level', row.level, 'style', 'info')">
              {{ getDictValueByKey('alarm_level', row.level, 'label', '') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="告警内容" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="searchForm.type === 'IOT'">{{ row.alarmData?.alarmDesc }}</template>
            <template v-else>{{ row.content }}</template>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="时间" width="160">
          <template #default="{ row }">{{ row.startTime || row.alarmTime }}</template>
        </el-table-column>
        <el-table-column prop="handleState" label="状态" width="80">
          <template #default="{ row }">
            <el-tag
              v-if="searchForm.type !== 'IOT'"
              class="status-tag"
              size="small"
              :type="getDictValueByKey('alarm_handle_status', row.handleState, 'style', 'info')"
            >
              {{ getDictValueByKey('alarm_handle_status', row.handleState, 'label', '') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="handleViewDetails(row)">详情</el-button>
            <el-button v-if="searchForm.type !== 'IOT' && row.handleState == 0 && isMelon" type="primary" text @click="handleToConvertWorkOrder(row)"
              >转工单</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="page.current"
          :page-size="page.size"
          :total="page.total"
          layout="total, prev, pager, next, jumper"
          @current-change="onPageNumChange"
          @size-change="onPageSizeChange"
        />
      </div>

      <warningMsgDetails ref="warningMsgDetailsRef" />
    </div>
  </el-dialog>
</template>

<script setup>
  import { useRoute } from 'vue-router';
  import { getAbnormalLogList } from '@/api/iot/index';
  import { getScreenAlarms } from '@/api/bigscreen/index';
  import { getDictValueByKey, useDict } from '@/hooks/dict';
  import { useMessage } from '@/hooks/message';
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';
  import warningMsgDetails from './warningMsgDetails.vue';


  const { alarm_level, alarm_handle_status } = useDict('alarm_level', 'alarm_handle_status');

  const subCenterStore = useSubCenterStore();
  const route = useRoute();
  const isLoading = ref(false);
  const isVisible = ref(false);

  const warningMsgDetailsRef = ref();
  const tableData = ref([]);
  const searchForm = reactive({
    type: 'FIELD',
    level: '',
    handleState: '',
    content: '',
  });
  const page = reactive({
    current: 1,
    size: 10,
    total: 0,
  });
  const sourceTypes = ref([
    { label: '外场设备', value: 'FIELD' },
    { label: '动环', value: 'IOT' },
    { label: '优云', value: 'SERVER' },
  ]);

  const isMelon = computed(() => {
    return route.path.startsWith('/ledger') ? false : true;
  });

  watch(
    () => subCenterStore.checkedId,
    () => {
      nextTick(() => {
        getTableData();
      });
    },
    { immediate: true }
  );

  const getTableData = () => {
    tableData.value = [];
    isLoading.value = true;
    const opsDeptId = subCenterStore.checkedId || '';
    if (searchForm.type === 'IOT') {
      getAbnormalLogList({ ...searchForm, opsDeptId, alarmDesc: searchForm.content, pageNum: page.current, pageSize: page.size })
        .then(({ data }) => {
          page.total = data?.total || 0;
          tableData.value = (data?.list || []).map((item) => {
            item.alarmData = JSON.parse(item.alarmData || '{}');
            return item;
          });
        })
        .finally(() => {
          isLoading.value = false;
        });
    } else {
      getScreenAlarms({ ...searchForm, opsDeptId, current: page.current, size: page.size })
        .then(({ data }) => {
          page.total = data.total || 0;
          tableData.value = data.records || [];
        })
        .finally(() => {
          isLoading.value = false;
        });
    }
  };

  const handleReset = () => {
    searchForm.level = '';
    searchForm.handleState = '';
    searchForm.content = '';
    getTableData();
  };

  function onPageNumChange(current) {
    page.current = current;
    getTableData();
  }

  function onPageSizeChange(size) {
    page.size = size;
    getTableData();
  }

  const handleViewDetails = (data) => {
    warningMsgDetailsRef.value?.open(data, searchForm.type);
  };

  // 转工单
  async function handleToConvertWorkOrder() {
    useMessage().info('开发中....');
  }

  const open = async () => {
    isVisible.value = true;
  };

  const handleClose = () => {
    isVisible.value = false;
  };

  defineExpose({
    open,
  });
</script>

<style lang="scss" scoped>
  .screen-dark-dialog {
    display: flex;
    height: 100%;
    .dark-table-box {
      :deep(.el-form--inline) {
        .el-select,
        .el-input {
          width: 200px;
        }
      }
    }
  }
</style>
