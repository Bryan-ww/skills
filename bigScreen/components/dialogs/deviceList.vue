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
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入设备名称、路网、路段、所属系统、设备类型、桩号等信息搜索"
            maxlength="100"
            clearable
            class="quick-search"
          >
            <template #prepend>快速搜索</template>
          </el-input>
        </el-form-item>
        <div class="ml-4">
          <el-button type="primary" :disabled="isLoading" @click="getTableData">查询</el-button>
          <el-button :disabled="isLoading" @click="handleReset">重置</el-button>
        </div>
      </el-form>
      <el-table :data="tableData" stripe height="550">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="设备名称" show-overflow-tooltip align="center">
          <template #default="{ row }">
            <div>
              {{ row.fields?.name.display || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="road" label="路网" show-overflow-tooltip align="center">
          <template #default="{ row }">
            <div>
              {{ row.fields?.road.display || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="section" label="路段" show-overflow-tooltip align="center">
          <template #default="{ row }">
            <div>
              {{ row.fields?.section.display || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="belongSystem" label="所属系统" show-overflow-tooltip align="center">
          <template #default="{ row }">
            <div>
              {{ row.fields?.belongSystem.display || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="设备类型" show-overflow-tooltip align="center">
          <template #default="{ row }">
            <div>
              {{ row.fields?.type.display || '-' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="pileNum" label="桩号" show-overflow-tooltip align="center">
          <template #default="{ row }">
            <div>
              {{ row.fields?.pileNum.display || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="direction" label="方向" show-overflow-tooltip align="center">
          <template #default="{ row }">
            <div>
              {{ row.fields?.direction.display || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="opsDep" label="运维单位" show-overflow-tooltip align="center">
          <template #default="{ row }">
            <div>
              {{ row.fields?.opsDep.display || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="state" label="设备状态" align="center">
          <template #default="{ row }">
            <dict-tag :options="device_state" :value="row.fields.state.value"></dict-tag>
          </template>
        </el-table-column>
        <el-table-column prop="runningState" label="运行状态" align="center">
          <template #default="{ row }">
            <dict-tag :options="device_running_state" :value="row.fields.runningState.value || 0"></dict-tag>
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
  import { getSearchDeviceList } from '@/api/bigscreen/index';
  import { getDictValueByKey, useDict } from '@/hooks/dict';
  import { useMessage } from '@/hooks/message';

  const { device_running_state, device_state } = useDict('device_running_state', 'device_state');

  const isLoading = ref(false);
  const isVisible = ref(false);
  const dialogData = reactive({
    title: '在线设备',
    type: 'online',
  });

  const tableData = ref([]);
  const searchForm = reactive({
    fieldPredicates: [], //精准搜索条件
    keyword: '',
    fieldCodes: ['name', 'road', 'section', 'belongSystem', 'type', 'pileNum'], //关键字搜索:根据设备名称、路网、路段、所属系统、设备类型、桩号等信息搜索
  });
  const page = reactive({
    current: 1,
    size: 10,
    total: 0,
  });

  const titleMap = {
    online: '在线设备',
    offline: '离线设备',
    warning: '告警设备',
    maintain: '维保设备',
  };

  const getTableData = () => {
    tableData.value = [];
    isLoading.value = true;
    getSearchDeviceList({ ...searchForm, current: page.current, size: page.size })
      .then(({ data }) => {
        page.total = data.total || 0;
        tableData.value = data.records || [];
      })
      .finally(() => {
        isLoading.value = false;
      });
  };

  const handleReset = () => {
    searchForm.fieldPredicates = [];
    searchForm.keyword = '';
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

  const open = async (type) => {
    checkTypeQuery(type);
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
      case 'maintain':
        searchForm.fieldPredicates = [
          {
            identifier: 'faultCount',
            operator: 'GT',
            values: [0],
          },
        ];
        break;

      default:
        break;
    }
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
