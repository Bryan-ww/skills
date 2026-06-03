<template>
  <el-dialog v-model="visible" class="screen-dark-dialog" :show-close="false" append-to-body width="1000">
    <template #header>
      <div class="header-title">
        <div class="left-box">
          <span class="title-label">机房信息</span>
        </div>
        <div class="right-box">
          <span class="close" @click="handleClose"></span>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="machine-room-content max-h-[70vh]">
      <div class="flex gap-3 content-top">
        <div class="flex-1 min-w-0 info-box">
          <div class="title">设备数量统计</div>
          <div class="device-count">
            <div class="device-count-item">
              <img class="count-item-icon" src="/assets/images/screen/monitor-overview/machine-room.png" alt="" />
              <div class="flex count-item-content">
                <div>
                  <div class="count-item-label">监测机房</div>
                  <div class="count-item-value">{{ stasData.monitorRoomCount ?? 0 }}</div>
                </div>
                <!-- <div class="ml-[8px]">
                  <div class="count-item-label">监控传感器</div>
                  <div class="count-item-value">{{ stasData.monitorSensorCount ?? 0 }}</div>
                </div> -->
              </div>
            </div>
            <div class="device-count-item">
              <img class="count-item-icon" src="/assets/images/screen/monitor-overview/monitor-device.png" alt="" />
              <div class="count-item-content">
                <div class="count-item-label">监控传感器</div>
                <div class="count-item-value">{{ stasData.monitorSensorCount ?? 0 }}</div>
              </div>
            </div>
            <div class="device-count-item">
              <img class="count-item-icon" src="/assets/images/screen/monitor-overview/server-warning.png" alt="" />
              <div class="count-item-content">
                <div class="count-item-label">报警机房</div>
                <div class="count-item-value is-warning">{{ stasData.abnormalRoomCount ?? 0 }}</div>
              </div>
            </div>
            <div class="device-count-item">
              <img class="count-item-icon" src="/assets/images/screen/monitor-overview/sensor-warning.png" alt="" />
              <div class="count-item-content">
                <div class="count-item-label">报警传感器</div>
                <div class="count-item-value is-warning">{{ stasData.abnormalSensorCount ?? 0 }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col flex-1 min-w-0 info-box">
          <div class="title">远程控制面板</div>
          <control :data="controllerData" class="flex-1 min-h-0" />
        </div>
      </div>
      <!-- <div class="content-center flex-1 info-box">
        <div class="title">视频配置</div>
        <div class="video-camera-box">
          <div class="camera-item"></div>
          <div class="camera-item"></div>
          <div class="camera-item"></div>
          <div class="camera-item"></div>
          <div class="camera-item"></div>
          <div class="camera-item"></div>
        </div>
        <div class="dark-table-box mt-[12px]">
          <el-table :data="tableData" height="200px">
            <el-table-column prop="serviceName" label="服务器名称" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.businessTypeDesc }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="" label="环境" show-overflow-tooltip> </el-table-column>
            <el-table-column prop="" label="部署系统" show-overflow-tooltip> </el-table-column>
            <el-table-column prop="" label="监测项" show-overflow-tooltip> </el-table-column>
            <el-table-column prop="" label="监测项" show-overflow-tooltip> </el-table-column>
            <el-table-column prop="" label="监测项" show-overflow-tooltip> </el-table-column>
            <el-table-column prop="type" label="状态" width="100" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag :type="getDictValueByKey('alarm_handle_status', row.handleState, 'style', 'info')">
                  {{ getDictValueByKey('alarm_handle_status', row.handleState, 'label', '') }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div> -->
      <div class="flex-1 info-box flex flex-col min-h-0 !p-0 content-bottom">
        <div class="px-4 pt-4 title shrink-0">当前监测点：{{ roomData.roomName }}</div>
        <equipment v-bind="monitorData" class="h-full min-h-0" />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
  import alarmApi from '@/api/melon/alarm/index';
  import { getRoomMonitor, getRoomController, getRoomStas } from '@/api/iot/index';
  // import { getDictValueByKey, useDict } from '@/hooks/dict';
  // import { useMessageBox, useMessage } from '@/hooks/message';
  // 动环IOT系统 src/views/screen/generator下
  import control from './control.vue';
  import equipment from './equipment.vue';
  // const { alarm_handle_status } = useDict('alarm_handle_status');

  const loading = ref(false);
  const visible = ref(false);
  const stasData = ref({});
  const tableData = ref([]);
  const roomData = ref({});
  const monitorData = ref({});
  const controllerData = ref({});

  const getList = async () => {
    await alarmApi.fetchList({ current: 1, size: 10 }).then(({ data }) => {
      tableData.value = data.records || [];
    });
  };

  const getRoomMonitorData = async () => {
    const { data } = await getRoomMonitor({ boardId: roomData.value.boardId });
    monitorData.value.sensorTempHumidity = data[0]?.data.map((item) => {
      const { currentData } = item;
      const parseData = JSON.parse(currentData);
      return {
        title: item.peripheralCode,
        temperature: parseData?.at || '',
        humidity: parseData?.ah || '',
      };
    });
    monitorData.value.waterLeak = data[1]?.data.map((item) => {
      const { currentData } = item;
      const parseData = JSON.parse(currentData);
      return {
        label: item.peripheralCode,
        value: parseData?.rwis == '0' ? '无水' : '有水',
      };
    });
    monitorData.value.upsList = data[2]?.data.map((item) => {
      const { currentData } = item;
      const parseData = JSON.parse(currentData);
      return {
        name: item.peripheralCode,
        // 市电
        mains: {
          a: parseData?.mpva || '',
          b: '',
          c: '',
        },
        // 输出电压
        output: { a: parseData?.ova || '', b: '', c: '' },
        load: { a: parseData?.lra || '', b: '', c: '' },
        batteryVoltage: parseData?.bvn || '',
      };
    });
    monitorData.value.mainsDetect = data[3]?.data.map((item) => {
      const { currentData } = item;
      const parseData = JSON.parse(currentData);
      return {
        label: item.peripheralCode,
        value: parseData?.outage == '0' ? '无电' : '有电',
      };
    });
  };

  const getController = async () => {
    const { data } = await getRoomController({ boardId: roomData.value.boardId });
    controllerData.value = {
      name: data[0]?.roomName,
      deviceList: data.map((item) => {
        return {
          ...item,
          name: item.deviceType === 150 ? '空调控制器' : '通用控制器',
          icon:
            item.deviceType === 150 ? '/assets/images/screen/monitor-overview/aircondition.png' : '/assets/images/screen/monitor-overview/common.png',
          extra: 'COM4',
          state: item.onlineStatus,
        };
      }),
    };
  };

  const getRoomStasData = async () => {
    const { data } = await getRoomStas({ deptId: roomData.value.deptId });
    stasData.value = data;
  };

  const open = async (data) => {
    roomData.value = data;
    visible.value = true;
    getList();
    getRoomStasData();
    getController();
    getRoomMonitorData();
  };

  const handleClose = () => {
    visible.value = false;
  };
  // getRoomMonitorData();
  // getController();

  defineExpose({
    open,
  });
</script>

<style lang="scss" scoped>
  .machine-room-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    .device-count {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      .device-count-item {
        display: flex;
        align-items: center;
        min-width: calc(50% - 5px);
        padding: 4px;
        border-radius: 2px;
        border: 1px solid;
        backdrop-filter: blur(1px);
        background: linear-gradient(90deg, rgba(0, 20, 45, 0) 0%, rgba(0, 81, 174, 0.1) 100%);
        border-image: linear-gradient(90deg, rgba(0, 98, 189, 0), rgba(0, 98, 189, 1)) 1 1;
        .count-item-icon {
          width: 60px;
          margin-right: 12px;
        }
        .count-item-label {
          font-size: 13px;
          line-height: 1;
          color: #fff;
        }
        .count-item-value {
          margin-top: 6px;
          font-size: 24px;
          font-weight: 500;
          line-height: 1;
          color: #27a3e6;
          &.is-warning {
            color: #ff8f00;
          }
        }
      }
    }
    .video-camera-box {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      .camera-item {
        min-width: calc(50% - 6px);
        height: 152px;
        border-radius: 2px;
        border: 1px solid #0062bd;
        backdrop-filter: blur(1);
        background: rgba(0, 20, 45, 0.8);
      }
    }
    .dark-table-box {
      :deep(.el-table) {
        .el-table__header th,
        .el-table__body-wrapper tr,
        .el-table__body-wrapper td {
          font-size: 12px;
          color: #00feff !important;
        }
      }
    }
  }
</style>
