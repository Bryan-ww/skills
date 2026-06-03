<template>
  <el-dialog v-model="isVisible" class="screen-dark-dialog" width="10rem" :show-close="false" append-to-body>
    <template #header>
      <div class="header-title">
        <div class="left-box">
          <span class="title-label">{{ dialogData.title }}</span>
        </div>
        <div class="right-box">
          <span class="close" @click="handleClose"></span>
        </div>
      </div>
    </template>

    <div v-loading="isLoading" class="dark-table-box">
      <el-form :model="searchForm" inline class="form-card">
        <el-form-item>
          <el-input v-model="searchForm.name" placeholder="请输入设备名称" maxlength="100" clearable class="quick-search"> </el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="searchForm.ip" placeholder="请输入ip" maxlength="100" clearable class="quick-search"> </el-input>
        </el-form-item>
        <div class="ml-4">
          <el-button type="primary" :disabled="isLoading" @click="getTableData">查询</el-button>
          <el-button :disabled="isLoading" @click="handleReset">重置</el-button>
        </div>
      </el-form>
      <el-table :data="tableData" stripe height="550">
        <el-table-column label="序号" type="index" width="60" />
        <el-table-column label="设备编码" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">{{ row.fields?.code?.display }}</template>
        </el-table-column>
        <el-table-column label="设备名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.fields?.name?.display }}</template>
        </el-table-column>
        <el-table-column label="IP" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.fields?.ip?.display }}</template>
        </el-table-column>
        <el-table-column
          v-for="target of targets"
          :key="target.code"
          :label="target.name"
          :prop="target.value"
          :width="Math.max(target.name.length * 20 + 24, 100)"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tooltip
              :content="getTargetCollectTime(target.code, row.targets)"
              :disabled="!getTargetCollectTime(target.code, row.targets)"
              effect="dark"
              placement="top"
            >
              {{ getTargetValue(target.code, row.targets) }}
            </el-tooltip>
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
    </div>
  </el-dialog>
</template>

<script setup>
  import { getDeviceTargetPage } from '@/api/melon/model/index';
  import { getDictValueByKey, useDict } from '@/hooks/dict';
  import { useMessage } from '@/hooks/message';
  import { getDicts } from '/@/api/admin/dict';
  import { getDictLabel, isEmpty } from '@/utils/index.js';

  const { device_running_state, device_state } = useDict('device_running_state', 'device_state');

  const isLoading = ref(false);
  const isVisible = ref(false);
  const dialogData = reactive({
    title: '在线设备',
    type: 'online',
  });

  const tableData = ref([]);
  const targets = ref([]);
  const dictObj = reactive({
    device_running_state: device_running_state.value,
  });
  const searchForm = reactive({
    fieldPredicates: [], //精准搜索条件
    name: '',
    ip: '',
    modelId: '', //当前服务器模型id
    recursiveLoc: true, //是否递归查询子设施设备
  });
  const page = reactive({
    current: 1,
    size: 10,
    total: 0,
  });

  const titleMap = {
    online: '在线服务器',
    offline: '离线服务器',
    warning: '告警服务器',
  };

  const getTableData = () => {
    tableData.value = [];
    isLoading.value = true;
    if (searchForm.name) {
      searchForm.fieldPredicates.push({
        identifier: 'name',
        operator: 'LIKE',
        values: [searchForm.name],
      });
    }
    if (searchForm.ip) {
      searchForm.fieldPredicates.push({
        identifier: 'ip',
        operator: 'LIKE',
        values: [searchForm.ip],
      });
    }

    const { ip, name, ...rest } = searchForm;
    getDeviceTargetPage({ ...rest, current: page.current, size: page.size })
      .then(({ data }) => {
        page.total = data.total || 0;
        tableData.value = data.records || [];
        targets.value = data.records[0]?.targets || [];
        getTargetsDict();
      })
      .finally(() => {
        isLoading.value = false;
      });
  };

  const handleReset = () => {
    searchForm.fieldPredicates = [];
    searchForm.name = '';
    searchForm.ip = '';
    checkTypeQuery(dialogData.type);
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

  const open = async (type, modelId) => {
    checkTypeQuery(type);
    searchForm.modelId = modelId;
    dialogData.type = type;
    dialogData.title = titleMap[type];
    getTableData();
    isVisible.value = true;
  };

  const handleClose = () => {
    isVisible.value = false;
  };

  const checkTypeQuery = (type) => {
    switch (type) {
      case 'online':
        searchForm.fieldPredicates = [
          {
            identifier: 'runningState',
            operator: 'EQ',
            values: ['2'], // 0:未知 1:离线2在线3:故障
          },
        ];
        break;
      case 'offline':
        searchForm.fieldPredicates = [
          {
            identifier: 'runningState',
            operator: 'EQ',
            values: ['1'], // 0:未知 1:离线2在线3:故障
          },
        ];
        break;
      case 'warning':
        searchForm.fieldPredicates = [
          {
            identifier: 'alertState',
            operator: 'EQ',
            values: ['1'], // 0:正常 1:告警
          },
        ];
        break;

      default:
        break;
    }
  };

  // 获取指标的字典数据
  const getTargetsDict = () => {
    const dictCodes = targets.value.filter((item) => !!item.dictCode).map((item) => item.dictCode);
    const dictTypes = [...new Set(dictCodes)];
    dictTypes.forEach(async (type) => {
      if (!dictObj[type]) {
        const { code, data } = await getDicts(type);
        code === 0 && (dictObj[type] = data || []);
      }
    });
  };

  const getTargetValue = (code, targets = []) => {
    if (Array.isArray(targets)) {
      const target = targets.find((item) => item.code === code);
      if (!target) {
        return '-';
      }
      if (target.dictCode) {
        return getDictLabel(target.value, dictObj[target.dictCode]);
      }
      return target && !isEmpty(target.value) ? `${target.value}${target.unit || ''}` : '-';
    }
    return '-';
  };

  const getTargetCollectTime = (code, targets = []) => {
    if (Array.isArray(targets)) {
      const target = targets.find((item) => item.code === code);
      return target?.collectTime || null;
    }
    return null;
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
          width: 2rem;
        }
      }
    }
  }
</style>
