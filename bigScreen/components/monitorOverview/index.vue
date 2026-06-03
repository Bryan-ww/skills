<template>
  <div class="monitor-overview mt-[0.3rem]">
    <div class="basic-title2 title-box">
      <div class="title">机房环境、服务器监测</div>
    </div>
    <div class="flex items-center monitor-box">
      <div v-for="item in uesData" :key="item.deviceType" class="monitor-item">
        <div class="count-box">
          <div class="monitor-icon" :class="`device-${item.deviceType}`"></div>
          <div class="monitor-label">{{ item.name }}</div>
          <div class="monitor-value">{{ item.count }}</div>
        </div>
      </div>
    </div>
    <div class="flex server-camera-box">
      <div class="flex items-center justify-end item-room">
        <div class="text-center item-content">
          <div class="item-title">机房</div>
          <div class="item-count">{{ serverRoomCountObj.monitorPointCount }}</div>
        </div>
      </div>
      <div class="flex items-center justify-end item-server">
        <div class="text-center item-content">
          <div class="item-title">服务器</div>
          <div class="item-count">{{ serverRoomCountObj.youyunServerCount }}</div>
        </div>
      </div>
    </div>

    <!-- <div class="basic-title3 mt-[0.24rem]">
      <div class="title">服务器监测概览</div>
    </div> -->
    <!-- 暂时注释 -->
    <!-- <div class="you-yun-monitor-box mt-[0.1rem]">
      <div class="count-box">
        <div class="count-item">
          <div class="count-name">系统运行时间</div>
          <div class="count-num">
            <count-to class="num" :start-val="0" :end-val="youYunServerIndicators['youyun_system_uptime']" :decimals="2" separator="," />
            <span class="value-unit">天</span>
          </div>
        </div>
        <div class="count-item order-status-box">
          <div class="status-item wait-accept w-[44%]">
            <div class="count-name">CPU使用率</div>
            <div class="count-num">
              <count-to class="num" :start-val="0" :end-val="youYunServerIndicators['youyun_system_cpu_pct_usage']" :decimals="2" separator="," />
              <span class="value-unit">%</span>
            </div>
          </div>
          <div class="status-item handling">
            <div class="count-name">交换空间空闲率</div>
            <div class="count-num">
              <count-to class="num" :start-val="0" :end-val="youYunServerIndicators['youyun_system_swap_pct_free']" :decimals="2" separator="," />
              <span class="value-unit">%</span>
            </div>
          </div>
          <div class="status-item wait-allot w-[44%]">
            <div class="count-name">已使用inode占比</div>
            <div class="count-num">
              <count-to class="num" :start-val="0" :end-val="youYunServerIndicators['youyun_system_fs_inodes_in_use']" :decimals="2" separator="," />
              <span class="value-unit">%</span>
            </div>
          </div>
          <div class="status-item wait-confirm">
            <div class="count-name">近5分钟系统负载</div>
            <div class="count-num">
              <count-to class="num" :start-val="0" :end-val="youYunServerIndicators['youyun_system_load_5']" :decimals="2" separator="," />
              <span class="value-unit">%</span>
            </div>
          </div>
        </div>
      </div>
      <RatePie class="ml-[-0.3rem]" title="磁盘使用率" :rate="youYunServerIndicators['youyun_system_disk_pct_usage']" />
    </div> -->
    <div class="server-stats">
      <div v-for="(item, index) in serverStatsData" :key="index" class="server-stat-item" @click="openServer(item.type)">
        <!-- <div class="stat-icon">
          <img :src="item.icon" />
        </div> -->
        <div class="stat-label">{{ item.label }}</div>
        <!-- <div :class="['stat-num', item.type]">{{ item.value }}</div> -->
        <count-to :class="['stat-num', item.type]" :start-val="0" :end-val="item.value" separator="" />
      </div>
    </div>

    <!-- 服务器指标弹窗 -->
    <serverList ref="serverListRef" />
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { getInfrastructureCount, getYouYunServerIndicators } from '@/api/bigscreen/index';
  import { getSensors, getPeripheralPointCount } from '@/api/iot/index';
  import { IOT_DEVICE_TYPE } from '@/const/index';
  import RatePie from './ratePie.vue';
  import serverList from '@/views/bigScreen/components/dialogs/serverList.vue';

  const sensorData = ref([]);
  const serverListRef = ref();
  const serverModelId = ref('');
  const serverRoomCountObj = reactive({
    serverRoomCount: 0,
    monitorPointCount: 0,
    youyunServerCount: 0,
  });
  const youYunServerIndicators = reactive({
    youyun_system_disk_pct_usage: null, // 磁盘使用率
    youyun_system_uptime: null, // 系统运行时间
    youyun_system_cpu_pct_usage: null, // CPU使用率
    youyun_system_swap_pct_free: null, // 交换空间空闲率
    youyun_system_fs_inodes_in_use: null, // 已使用inode占比
    youyun_system_load_5: null, // 过去5分钟内系统负载
  });

  const serverStatsData = ref([
    { type: 'online', label: '在线服务器', value: 25, icon: '/assets/images/screen/overview/icon-online.png' },
    { type: 'offline', label: '离线服务器', value: 25, icon: '/assets/images/screen/overview/icon-offline.png' },
    { type: 'warning', label: '告警服务器', value: 45, icon: '/assets/images/screen/overview/icon-warning.png' },
  ]);

  const uesData = computed(() => {
    const data = sensorData.value.map((item) => {
      return {
        ...item,
        name: IOT_DEVICE_TYPE.find((type) => type.value === item.deviceType)?.label || '',
      };
    });
    // 市电检测仪、温湿度传感器、浸水监测器、UPS
    return data.filter((item) => [180, 100, 120, 170].includes(item.deviceType));
  });

  // const uesData = [
  //   {
  //     name: '市电检测仪',
  //     value: 0,
  //     deviceType: 180,
  //   },
  //   {
  //     name: '温湿度传感器',
  //     value: 0,
  //     deviceType: 100,
  //   },
  //   {
  //     name: '浸水监测器',
  //     value: 0,
  //     deviceType: 120,
  //   },
  //   {
  //     name: 'UPS',
  //     value: 0,
  //     deviceType: 170,
  //   },
  // ];

  onBeforeMount(() => {
    getSensorData();
    getOverviewData();
    getPointCount();
    getYouYunServerIndicatorsData();
  });

  const getSensorData = () => {
    getSensors().then(({ code, data }) => {
      sensorData.value = data || [];
    });
  };

  const getOverviewData = () => {
    getInfrastructureCount().then(({ code, data }) => {
      serverRoomCountObj.serverRoomCount = data.serverRoomCount || 0;
      serverRoomCountObj.youyunServerCount = data.youyunServerCount || 0;
      serverModelId.value = data.youyunServerModelId || '';
      const { youyunServerStat } = data;
      if (youyunServerStat) {
        // 0:未知 1:离线2在线3:故障
        serverStatsData.value[0].value = Number(youyunServerStat.runningStateStats.find((item) => item.runningState === 2)?.count) || 0;
        serverStatsData.value[1].value = Number(youyunServerStat.runningStateStats.find((item) => item.runningState === 1)?.count) || 0;
        serverStatsData.value[2].value = Number(youyunServerStat.alarmDeviceCount) || 0;
      }
    });
  };

  const getPointCount = () => {
    getPeripheralPointCount().then(({ code, data }) => {
      serverRoomCountObj.monitorPointCount = data?.monitorPointCount || 0;
    });
  };

  const getYouYunServerIndicatorsData = () => {
    getYouYunServerIndicators().then(({ data }) => {
      if (Array.isArray(data)) {
        const uptimeItem = data.find((item) => item.code === 'youyun_system_uptime.val') || {};
        const cpuItem = data.find((item) => item.code === 'youyun_system_cpu_pct_usage.val') || {};
        const freeItem = data.find((item) => item.code === 'youyun_system_swap_pct_free.val') || {};
        const inodeItem = data.find((item) => item.code === 'youyun_system_fs_inodes_in_use.val') || {};
        const loadItem = data.find((item) => item.code === 'youyun_system_load_5.val') || {};
        const diskItem = data.find((item) => item.code === 'youyun_system_disk_pct_usage.val') || {};
        youYunServerIndicators['youyun_system_uptime'] = uptimeItem.value ? uptimeItem.value / (60 * 60 * 24) : null;
        youYunServerIndicators['youyun_system_cpu_pct_usage'] = Number(cpuItem.value || null);
        youYunServerIndicators['youyun_system_swap_pct_free'] = Number(freeItem.value || null);
        youYunServerIndicators['youyun_system_fs_inodes_in_use'] = Number(inodeItem.value || null);
        youYunServerIndicators['youyun_system_load_5'] = Number(loadItem.value || null);
        youYunServerIndicators['youyun_system_disk_pct_usage'] = Number(diskItem.value || null);
      }
    });
  };

  const openServer = (type) => {
    serverListRef.value.open(type, serverModelId.value);
  };
</script>

<style scoped lang="scss">
  .monitor-overview {
    .monitor-box {
      gap: 0.1rem;
      .monitor-item {
        flex: 1;
        position: relative;
        padding: 0.1rem 0 0;
        border-radius: 0.02rem;
        border: 0.01rem solid;
        backdrop-filter: blur(0.01rem);
        border-image: linear-gradient(180deg, rgba(0, 98, 189, 0), rgba(0, 98, 189, 1)) 1 1;
        &:before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 1;
          opacity: 0.2;
          background: linear-gradient(180deg, rgba(0, 20, 45, 0) 0%, #002756 31.83%, #0050ae 100%);
        }
        .count-box {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          font-size: 0.13rem;
          color: #fff;
          .monitor-icon {
            width: 0.6rem;
            height: 0.6rem;
            background: url(/assets/images/screen/monitor-overview/monitor-device.png) center center no-repeat;
            background-size: 100% 100%;
            &.device-100 {
              background-image: url(/assets/images/screen/monitor-overview/device-100.png);
            }
            &.device-120 {
              background-image: url(/assets/images/screen/monitor-overview/device-120.png);
            }
            &.device-170 {
              background-image: url(/assets/images/screen/monitor-overview/device-170.png);
            }
            &.device-180 {
              background-image: url(/assets/images/screen/monitor-overview/device-180.png);
            }
          }
          .monitor-label {
            margin: 0.1rem 0 0.02rem;
          }
          .monitor-value {
            font-size: 0.3rem;
            font-weight: 500;
            color: #27a3e6;
          }
        }
      }
    }
    .server-camera-box {
      gap: 0.12rem;
      margin-top: 0.2rem;
      .item-server,
      .item-room {
        flex: 1;
        height: 1.1rem;
        background: url(/assets/images/screen/monitor-overview/server-bg.png) center center no-repeat;
        background-size: 100% 100%;
      }
      .item-room {
        background-image: url(/assets/images/screen/monitor-overview/machine-room-bg.png);
      }
      .item-content {
        width: 65%;
        padding-bottom: 0.05rem;
        font-size: 0.14rem;
        font-weight: 500;
        color: #e6f2ff;
        .item-count {
          font-size: 0.3rem;
          color: #27a3e6;
        }
      }
    }
    .server-stats {
      display: flex;
      gap: 0.1rem;
      margin-top: 0.12rem;
      height: 1.4rem;
      .server-stat-item {
        position: relative;
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.15rem 0;
        border-radius: 0.04rem;
        background: url(/assets/images/screen/monitor-overview/server-card.png) center center no-repeat;
        background-size: 100% 100%;
        color: #e6f2ff;
        cursor: pointer;
        .stat-label {
          position: absolute;
          top: 0.14rem;
          left: 28%;
          font-size: 0.14rem;
          font-weight: 500;
          margin-bottom: 0.04rem;
        }
        .stat-num {
          font-size: 0.28rem;
          font-weight: 600;
          &.online {
            color: #00da7a;
          }
          &.offline {
            color: #ff0000;
          }
          &.warning {
            color: #ff9900;
          }
        }
      }
    }
    .you-yun-monitor-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      .count-box {
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 0.2rem;
        padding: 0.05rem 0 0.12rem 0.1rem;
        background: url('/assets/images/screen/manger/maintain/count-box-bg.png') left center no-repeat;
        background-size: 100% 100%;
      }
      .count-item {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: center;
        .count-name {
          position: relative;
          padding: 0 0.05rem 0 0.16rem;
          font-weight: 400;
          font-size: 0.11rem;
          color: #fff;
          &::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0.02rem;
            display: inline-block;
            width: 0.06rem;
            height: 0.06rem;
            border-radius: 50%;
            box-shadow: 0rem 0rem 0.06rem 0.02rem rgb(31, 240, 240);
            background: #2ee6ff;
            transform: translate(0, -56%);
          }
        }
        .count-num {
          .num {
            display: inline-flex;
            font-family: screenTitleFont;
            font-size: 0.32rem;
            letter-spacing: 0.01rem;
            color: #00da7a;
            background: -webkit-linear-gradient(180deg, #00da7a 0%, #a1ffd6 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .value-unit {
            font-size: 0.14rem;
            color: #00da7a;
          }
        }
        &.order-status-box {
          .status-item {
            display: flex;
            align-items: center;
            .count-name {
              &::before {
                box-shadow: unset;
              }
            }
            .count-num .num {
              font-size: 0.18rem;
            }
            &.wait-accept {
              .count-name::before {
                background: #ff2e2e;
              }
              .count-num .num {
                background-image: linear-gradient(257deg, #ff0c0c 0%, #ff7979 100%);
              }
              .count-num .value-unit {
                color: #ff2e2e;
              }
            }
            &.handling {
              .count-name::before {
                background: #fb6707;
              }
              .count-num .num {
                background-image: linear-gradient(257deg, #fb6707 0%, #fbc107 100%);
              }
              .count-num .value-unit {
                color: #fb6707;
              }
            }
            &.wait-allot {
              .count-name::before {
                background: #ffcc00;
              }
              .count-num .num {
                background-image: linear-gradient(257deg, #d18b00 0%, #ffcc00 100%);
              }
              .count-num .value-unit {
                color: #ffcc00;
              }
            }
            &.wait-confirm {
              .count-name::before {
                background: #36d4ff;
              }
              .count-num .num {
                background-image: linear-gradient(257deg, #009be8 0%, #35d4ff 100%);
              }
              .count-num .value-unit {
                color: #36d4ff;
              }
            }
          }
        }
      }
    }
  }
</style>
