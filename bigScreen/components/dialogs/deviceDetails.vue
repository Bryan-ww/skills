<template>
  <el-dialog v-model="isVisible" class="device-details screen-dark-dialog" :show-close="false" :width="isInformationBoard ? '14rem' : '11.5rem'" append-to-body>
    <template #header>
      <div class="header-title">
        <div class="left-box">
          <span class="title-label">设备详情</span>
        </div>
        <div class="right-box">
          <span class="close" @click="handleClose"></span>
        </div>
      </div>
    </template>

    <div v-loading="isLoading" class="dark-table-box flex">
      <div class="universal-module">
        <div class="info-top-box flex items-center justify-between">
          <div class="device-img-box">
            <!-- 情报板-INFO_BOARD 摄像机-CAMERA 门架-GANTRY -->
            <img v-if="deviceType === 'INFO_BOARD'" class="device-img" src="/assets/images/screen/dialog/device-info-board.png" alt="" />
            <img v-else-if="deviceType === 'CAMERA'" class="device-img" src="/assets/images/screen/dialog/device-camera.png" alt="" />
            <img v-else-if="deviceType === 'GANTRY'" class="device-img" src="/assets/images/screen/dialog/device-gantry.png" alt="" />
          </div>
          <div class="base-info">
            <div class="base-info-header flex items-center justify-between">
              <div class="flex items-end">
                <div>设备名称：</div>
                <div class="mr-[8px] text-[14px]">{{ infoData?.fields?.name?.display || infoData.modelName || '-' }}</div>
                <dict-tag :options="device_running_state" :value="infoData?.fields?.runningState.value"></dict-tag>
              </div>
              <div class="flex items-end">部署时间：{{ infoData?.fields?.deployTime?.display || '-' }}</div>
            </div>
            <el-descriptions class="dialog-descriptions" :column="9" direction="vertical" border>
              <el-descriptions-item label="管理单位">{{ infoData?.fields?.ownDep?.display || '-' }}</el-descriptions-item>
              <el-descriptions-item label="归属设施">{{ infoData?.fields?.belongLoc?.display || '-' }}</el-descriptions-item>
              <el-descriptions-item label="桩号">{{ infoData?.fields?.pileNum?.display || '-' }}</el-descriptions-item>
              <el-descriptions-item label="生产厂商">{{ infoData?.fields?.manufacturer?.display || '-' }}</el-descriptions-item>
              <el-descriptions-item label="所属路段">{{ infoData?.fields?.section?.display || '-' }}</el-descriptions-item>
              <el-descriptions-item label="供电方式">{{ infoData?.fields?.powerSupplyType?.display || '-' }}</el-descriptions-item>
              <el-descriptions-item label="运维组织">{{ infoData?.fields?.opsDep?.display || '-' }}</el-descriptions-item>
              <el-descriptions-item label="方向">{{ infoData?.fields?.direction?.display || '-' }}</el-descriptions-item>
              <el-descriptions-item label="安全运行时长">-</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
        <div class="bottom-info-box flex">
          <div v-loading="isGettingCameras" class="carousel-box info-box mr-[8px]">
            <div class="title">{{ infoData.playUrl ? '监控视频' : '附近摄像机' }}</div>
            <el-carousel v-if="infoData.playUrl" interval="5000" indicator-position="outside" height="240px">
              <el-carousel-item>
                <div class="camera-box">
                  <player :id="infoData.id" :videoName="infoData.name" :videoUrl="infoData.playUrl" />
                </div>
              </el-carousel-item>
            </el-carousel>
            <el-carousel v-else-if="cameraList.length > 0" interval="5000" indicator-position="outside" height="240px">
              <el-carousel-item v-for="item in cameraList" :key="item.id">
                <div class="camera-box">
                  <player :id="item.id" :videoName="item.name" :videoUrl="item.playUrl" />
                </div>
              </el-carousel-item>
            </el-carousel>
            <screen-empty v-else class="mt-[50px] screen-empty"></screen-empty>
          </div>
          <div class="info-box flex-1">
            <div class="title">设备监测</div>
            <div class="device-status-info">
              <div v-for="cItem in deviceStatusList" :key="cItem.code" class="device-item" :class="getDictLabel(cItem.value, dictObj[cItem.dictCode], 'value', 'style')">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <SvgIcon :name="cItem.displayConf?.icon || 'iconfont icon-xitongshezhi'" :size="18" />
                    <span class="device-name">{{ cItem.name }}</span>
                    <div class="status"></div>
                  </div>
                </div>
                <div v-if="!isEmpty(cItem.value) && cItem.displayConf?.isShowValue === '1'">
                  {{ cItem.dictCode ? getDictLabel(cItem.value, dictObj[cItem.dictCode]) : cItem.value }}
                  {{ cItem.unit || '' }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="isInformationBoard" class="info-board-box info-box ml-[8px]">
            <div class="title">当前条目</div>
            <el-carousel v-if="infBoardTextArr.length > 0" interval="5000" indicator-position="outside" arrow="never" height="240px">
              <el-carousel-item v-for="text in infBoardTextArr" :key="text">
                <div class="info-board">
                  <div class="info-text">{{ text }}</div>
                </div>
              </el-carousel-item>
            </el-carousel>
            <div v-else class="info-board">
              <div class="info-text"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
  import { Circle } from 'ol/geom';
  import { getDicts } from '/@/api/admin/dict';
  import { getDeviceAllLatest, getCameraRealPlayUrl } from '@/api/bigscreen/index';
  import { getDictValueByKey, useDict } from '@/hooks/dict';
  import { getDictLabel, isEmpty } from '@/utils/index.js';
  import { getCameraByBounds } from '@/views/bigScreen/components/Map3D/mini2d/utils/getPoi.js';
  import { metersToDegrees } from '@/views/bigScreen/components/Map3D/mini2d/utils/index.js';
  import player from '/@/components/Jessibuca/player.vue';

  const { device_state, device_running_state } = useDict('device_state', 'device_running_state');
  const dialogId = ref('');
  const isLoading = ref(false);
  const isGettingCameras = ref(false);
  const isVisible = ref(false);
  const infoData = ref({});
  const cameraList = ref([]); // 附近的摄像头
  const deviceType = ref(''); // 设备类型
  const infBoardTextArr = ref([]); // 情报板当前显示的文字
  const deviceStatusList = ref([]); // 设备的状态指标
  const dictObj = reactive({});

  const isInformationBoard = computed(() => {
    return deviceType.value === 'INFO_BOARD';
  })

  const open = (data) => {
    dialogId.value = data.id;
    infoData.value = data;
    deviceType.value = data?.fields?.type?.value;
    isVisible.value = true;
    getInfoData();
    if (data.fields?.type?.value === 'CAMERA' && data.fields?.serialNum?.value) {
      getCameraRealPlayUrl(data.fields.serialNum.value).then(res => {
        infoData.value.playUrl = res.data['http-flv'];
      });
    } else if (data.lng && data.lat) {
      findCamera([data.lng, data.lat], 5000);
    }
  };

  const getInfoData = () => {
    isLoading.value = true;
    getDeviceAllLatest({ deviceId: dialogId.value, }).then(({ code, data }) => {
      const statusList = (data || []);
      const displayStatus = statusList.find(item => item.code === 'info_board.displayItems');
      if (displayStatus && typeof displayStatus.value === 'string') {
        const textArrStr = displayStatus.value.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        infBoardTextArr.value = JSON.parse(textArrStr);
      }
      deviceStatusList.value = statusList.filter(item => item.showFlag).map((item, index) => {
        return {
          ...item,
          key: item.code?.split('.')[1],
        }
      });
      getDeviceStatusDict();
    }).finally(() => {
      isLoading.value = false;
    });
  };

  // 获取设备状态的字典数据
  const getDeviceStatusDict = () => {
    const dictCodes = deviceStatusList.value.filter(item => !!item.dictCode).map(item => item.dictCode);
    const dictTypes = [...new Set(dictCodes)];
    dictTypes.forEach(async (type) => {
      if (!dictObj[type]) {
        const { code, data } = await getDicts(type);
        code === 0 && (dictObj[type] = data || []);
      }
    })
  }

  /**
  * 范围查询摄像头
  * @param {Array} coordinate 经度纬度 [经度, 纬度]
  * @param {number} radius 搜索半径 单位：米
  */
  const findCamera = (coordinate, radius) => {
    const circle = new Circle(coordinate, metersToDegrees(radius, coordinate[1]));
    isGettingCameras.value = true;
    getCameraByBounds(circle).then(async res => {
      if (Array.isArray(res.list)) {
        const cameras = res.list.filter(item => !!item.properties?.CAMERA_ID).slice(0, 5);
        const promise = cameras.map(item => getVideoPlayUrl(item));
        await Promise.all(promise).then(resList => { });
        cameraList.value = cameras.filter(item => !!item.playUrl);
        isGettingCameras.value = false;
      } else {
        isGettingCameras.value = false;
      }
    }).catch(() => {
      isGettingCameras.value = false;
    })
  }

  const getVideoPlayUrl = (camera) => {
    return getCameraRealPlayUrl(camera.properties.CAMERA_ID).then(({ code, data }) => {
      if (data && data['http-flv']) {
        camera.playUrl = data['http-flv'];
      }
      return camera;
    })
  }

  const handleClose = () => {
    dialogId.value = '';
    isVisible.value = false;
    deviceType.value = '';
    infoData.value = {};
    cameraList.value = [];
    infBoardTextArr.value = [];
  };

  defineExpose({
    open,
  });
</script>

<style lang="scss" scoped>
  .device-details {
    .universal-module {
      flex: 1;
    }
    .info-top-box {
      padding: 16px;
      border-radius: 4px;
      border: 1px solid;
      box-shadow: inset 0px 0px 11px 0px #00274c;
      background: linear-gradient(0deg, rgba(0, 128, 255, 0.5) 0%, #002a54 100%);
      border-image: linear-gradient(360deg, rgba(91, 172, 255, 1), rgba(111, 182, 255, 1), rgba(9, 98, 160, 1)) 1 1;
      .device-img-box {
        width: 108px;
        height: 108px;
        border-radius: 2px;
        backdrop-filter: blur(1px);
        background: rgba(0, 20, 45, 0.8);
        .device-img {
          width: 100%;
          height: 100%;
        }
      }
      .base-info {
        width: calc(100% - 121px);
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
    .bottom-info-box {
      margin-top: 8px;
      .carousel-box {
        width: 300px;
        .camera-box {
          height: 230px;
          border-radius: 2px;
          backdrop-filter: blur(1px);
          background: rgba(0, 20, 45, 0.8);
        }
      }
      .device-status-info {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        align-content: flex-start;
        .device-name {
          font-size: 12px;
          font-weight: 400;
          white-space: nowrap;
        }
        .device-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          height: 44px;
          padding: 0 12px 0 10px;
          box-sizing: border-box;
          border-radius: 4px;
          color: #fff;
          background: linear-gradient(270deg, rgba(99, 105, 109, 0.8) 0%, rgba(91, 97, 98, 0.4) 100%);
          &.primary {
            background: linear-gradient(270deg, rgba(0, 146, 255, 0.8) 0%, rgba(0, 91, 159, 0.4) 100%);
            .status {
              background: #3ddcff;
            }
          }
          &.success {
            background: linear-gradient(270deg, rgba(0, 123, 44, 0.8) 0%, rgba(0, 91, 58, 0.4) 100%);
            .status {
              background: #00d63b;
            }
          }
          &.danger {
            background: linear-gradient(270deg, rgba(134, 24, 24, 0.8) 0%, rgba(118, 41, 41, 0.4) 100%);
            .status {
              background: #ff3500;
            }
          }
          &.warning {
            background: linear-gradient(270deg, rgba(224, 112, 5, 0.8) 0%, rgba(146, 58, 0, 0.4) 100%);
            .status {
              background: #ffa700;
            }
          }
          .status {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #c5c5c5;
          }
          .device-name {
            margin: 0 4px;
          }
        }
      }
    }

    .info-board-box {
      width: 290px;
    }
    .info-board {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 230px;
      background: #000;
      .info-text {
        line-height: 1;
        font-size: 24px;
        font-family: SimSun, NSimSun, 'AR PL SungtiL GB', serif;
        white-space: pre-wrap;
        color: rgb(0, 255, 0);
      }
    }
    .dark-table-box :deep(.el-carousel) {
      .el-carousel__indicator--horizontal {
        padding: 3px 6px;
        &:not(.is-active) .el-carousel__button {
          background: #0079ef;
        }
        .el-carousel__button {
          width: 6px;
          height: 6px;
          opacity: 1;
          border-radius: 50%;
        }
      }
    }
  }
</style>
