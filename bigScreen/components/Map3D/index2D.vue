<template>
  <div class="map-2d">
    <div ref="mapRef" class="map-container"></div>

    <!-- 设备详情弹窗 -->
    <deviceDetails ref="deviceDetailsRef" />
    <!-- 车辆详情弹窗 -->
    <vehicleDetails ref="vehicleDetailsRef" />
    <!-- 机房弹窗 -->
    <MachineRoomDialog ref="machineRoomDialogRef" />
    <!-- 收费站弹窗 -->
    <TollStationDetails ref="tollStationsRef" />
  </div>
</template>

<script setup>
  // 工具类
  import { createMap, initZoom, mapCenter } from './mini2d/utils';
  import { unByKey } from 'ol/Observable';
  import { createNamePopup } from './utils2D/popup/createNamePopup';
  import { createClusterPopup } from './utils2D/popup/createClusterPopup';
  import { createXinJiangLineLayerWithShadow, createProvinceAnimationLineLayer } from './utils2D/createProvinceLine';
  import { useEventbus } from '@/hooks/useEventbus';
  import { roadColor } from './utils/config';
  import { createRoadLayers } from './utils2D/createRoad';
  import { createRoadSignLayer } from './utils2D/createRoadSignLayer';
  import { mergeMultipleLineCoordinates } from './utils/util';
  import { ExtendClusterLayer } from './utils2D/extendClusterLayer';
  import { useMapConfigStore } from '@/views/bigScreen/components/MapTab/stores/useMapConfig.js';

  // 弹窗
  import deviceDetails from '@/views/bigScreen/components/dialogs/deviceDetails.vue';
  import vehicleDetails from '@/views/bigScreen/components/dialogs/vehicleDetails.vue';
  import MachineRoomDialog from '@/views/bigScreen/components/dialogs/machineRoom/index.vue';
  import TollStationDetails from '@/views/bigScreen/components/dialogs/tollStationDetails.vue';

  // stage
  import SubCenterStage from './utils2D/stage/SubCenterStage';
  import DeviceStage from './utils2D/stage/DeviceStage';
  import MachineRoomStage from './utils2D/stage/MachineRoomStage';
  import PersonnelStage from './utils2D/stage/PersonnelStage';
  import VehicleStage from './utils2D/stage/vehicleStage.js';

  // json数据
  import GDGS_ORIGIN from './json/GDGS_ORIGIN.json';
  import SDGS_ORIGIN from './json/SDGS_ORIGIN.json';

  const GDGS = mergeMultipleLineCoordinates(GDGS_ORIGIN);
  const SDGS = mergeMultipleLineCoordinates(SDGS_ORIGIN);

  // stage实例
  const stageMap = {
    [SubCenterStage.name]: null,
    [DeviceStage.name]: null,
    [MachineRoomStage.name]: null,
    [PersonnelStage.name]: null,
    [VehicleStage.name]: null,
  };

  const eventBus = useEventbus();
  const mapConfigStore = useMapConfigStore();

  const clusterPopupAbortController = new AbortController();
  let deviceNamePopup = createNamePopup();
  let clusterPopup = createClusterPopup();
  // 扩展聚合点图层
  let extendClusterLayer = null;

  // 地图图层
  const layerTypes = {
    yingxiang: null,
    blue: null,
    white: null,
  };
  // 国道高速图层
  let gdLayerGroup = null;
  // 省道高速图层
  let sdLayerGroup = null;

  const dialogRefs = ref({});
  const deviceDetailsRef = ref();
  const vehicleDetailsRef = ref();
  const machineRoomDialogRef = ref();
  const tollStationsRef = ref();

  // 地图点击事件绑定的key，用来取消事件监听
  const mapClickKey = ref();
  const mapMoveKey = ref();

  // 地图实例
  let map = null;
  const mapRef = ref();

  const currentDeviceTarget = shallowRef(null);
  let toDeviceTargetTimer = null;
  const toDeviceTarget = (data, timeout = 1500) => {
    currentDeviceTarget.value = data;
    clearTimeout(toDeviceTargetTimer);
    toDeviceTargetTimer = setTimeout(() => {
      const layer = layers.value[data.type];
      // 聚合点坐标
      let clusterLnglat = null;
      if (layer) {
        const source = layer.getSource();
        if (source instanceof Cluster) {
          const clusterFeatures = source.getFeatures();
          // 遍历聚合要素，获取每个聚合点的坐标
          for (const cluster of clusterFeatures) {
            // 获取聚合要素的几何对象（点）
            const geometry = cluster.getGeometry();
            if (geometry instanceof Point) {
              // 聚合点包含所有的原始点
              const features = cluster.get('features');
              for (const feature of features) {
                const originData = feature.get('data');
                if (originData?.id === data.id) {
                  clusterLnglat = geometry.getCoordinates();
                  break;
                }
              }
            }
            if (clusterLnglat) {
              break;
            }
          }
        }
      }
      const html = `
    <div>${data.properties.name}</div>
    `;
      deviceNamePopup.show(clusterLnglat || data.lnglat, html);
    }, timeout);
  };
  // const clearPopupData = () => {
  //   clearTimeout(toDeviceTargetTimer);
  //   currentDeviceTarget.value = null;
  //   deviceNamePopup.hide();
  // };

  const layers = shallowRef({});

  let clicked = false;
  const clickMap = (evt) => {
    // const pixel = evt.pixel;
    // const coordinate = map.getCoordinateFromPixel(pixel);

    const clusters = Object.values(layers.value);
    if (stageMap[DeviceStage.name]?.deviceLayer) {
      const deviceLayer = stageMap[DeviceStage.name]?.deviceLayer;
      if (deviceLayer) {
        clusters.push(...deviceLayer.getLayers().getArray());
      }
    }
    if (stageMap[VehicleStage.name]?.vehicleLayer) {
      const vehicleLayer = stageMap[VehicleStage.name]?.vehicleLayer;
      if (vehicleLayer) {
        clusters.push(...vehicleLayer.getLayers().getArray());
      }
    }

    extendClusterLayer?.removeLayer();
    clusters.forEach((cluster) => {
      if (!cluster.getVisible()) {
        return;
      }
      cluster.getFeatures(evt.pixel).then((clickedFeatures) => {
        if (clickedFeatures.length) {
          const feature = clickedFeatures[0];
          const features = feature.get('features');
          if (features.length > 1) {
            extendClusterLayer?.createLayer(features, feature, cluster, {
              currentDeviceTarget: currentDeviceTarget.value,
              popup: deviceNamePopup,
              clusterPopup: clusterPopup,
            });
          } else {
            // 重新计算位置
            if (currentDeviceTarget.value) {
              toDeviceTarget(currentDeviceTarget.value, 300);
            } else {
              const data = features[0].get('data');
              const refValue = data.type === 'vehicle' ? vehicleDetailsRef.value : deviceDetailsRef.value;
              refValue?.open(data);
            }
          }
        } else {
          // 重新计算位置
          if (currentDeviceTarget.value) {
            toDeviceTarget(currentDeviceTarget.value, 300);
          }
        }
      });
    });

    map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      // 避免一次性弹出多个弹窗
      if (clicked) {
        return;
      }
      // 获取聚合图层的features
      const features = feature.get('features') || [];
      if (features.length === 1) {
        const onlyFeature = features[0];
        const properties = onlyFeature.get('data');

        if (properties && dialogRefs.value[properties.type]) {
          dialogRefs.value[properties.type]?.value.open(properties);
          clicked = true;
          if (properties.type === INFRAS_TYPE.TRAFFIC_EVENT) {
            eventBus.customEmitObject('open2DLayerSearchBox', {
              radius: 5,
              lnglat: properties.lnglat,
              types: [INFRAS_TYPE.CAMERA],
            });
          }
        }
      }
      // const featureType = feature.get('type');

      // if (featureType === 'machineRoomCenter') {
      //   const userData = feature.get('data');
      //   machineRoomDialogRef.value?.open(userData);
      //   clicked = true;
      // }

      setTimeout(() => {
        clicked = false;
      }, 100);
    });
  };

  // 创建新疆边界阴影
  const createXinJiangLineLayerWithShadowFn = () => {
    createXinJiangLineLayerWithShadow().then(({ layer, layerWithShadow }) => {
      map.addLayer(layer);
      map.addLayer(layerWithShadow);
    });
  };

  let cancelAnimationLine = null;
  // 创建新疆边界流光效果
  const createProvinceAnimationLineLayerFn = () => {
    createProvinceAnimationLineLayer().then(({ layer, cancelRequestHandle }) => {
      map.addLayer(layer);
      cancelAnimationLine = cancelRequestHandle;
    });
  };

  // 创建道路标志图层
  const createRoadSignLayerFn = () => {
    createRoadSignLayer([
      { type: 'gdgs', lnglat: [95.404389, 43.144525], name: 'G7' },
      { type: 'gdgs', lnglat: [90.70224, 43.778472], name: 'G7' },
      { type: 'gdgs', lnglat: [89.975769, 42.891501], name: 'G30' },
      { type: 'gdgs', lnglat: [94.468391, 42.09835], name: 'G30' },
      { type: 'gdgs', lnglat: [83.741001, 44.458865], name: 'G30' },
      { type: 'gdgs', lnglat: [79.759791, 40.652494], name: 'G3012' },
      { type: 'gdgs', lnglat: [84.844714, 42.010575], name: 'G3012' },
      { type: 'gdgs', lnglat: [80.008269, 36.967728], name: 'G3012' },
      { type: 'gdgs', lnglat: [87.534162, 45.976603], name: 'S21' },
      { type: 'gdgs', lnglat: [94.975111, 42.453877], name: 'S22' },
      { type: 'gdgs', lnglat: [76.92351, 39.204382], name: 'S16' },
      { type: 'gdgs', lnglat: [89.541652, 45.590578], name: 'S11' },
      { type: 'gdgs', lnglat: [85.779472, 46.201726], name: 'G3014' },
      { type: 'gdgs', lnglat: [83.926413, 46.29238], name: 'G3015' },
      { type: 'gdgs', lnglat: [82.691664, 44.829093], name: 'G3018' },
    ]).then((layer) => {
      if (layer) {
        map.addLayer(layer);
      }
    });
  };

  const resetMap = () => {
    setMapCenter({
      center: mapCenter,
      zoom: initZoom,
    });
  };
  const setMapCenter = (data) => {
    if (map) {
      map.getView().animate({
        center: data.center,
        zoom: data.zoom || initZoom,
        duration: data.duration || 1000, // 动画持续时间（毫秒）
      });
    }
  };

  let currentMapStage = SubCenterStage.name;
  mapConfigStore.updateStage(currentMapStage);
  const mapStageChange = ({ id }) => {
    // 隐藏旧的stage
    stageMap[currentMapStage]?.hide();
    resetMap();

    currentMapStage = id;
    mapConfigStore.updateStage(currentMapStage);
    // 显示新的stage
    stageMap[id]?.show();
  };

  onMounted(() => {
    const mapData = createMap(mapRef.value);
    map = mapData.map;

    map.addOverlay(deviceNamePopup);
    map.addOverlay(clusterPopup);
    setTimeout(() => {
      clusterPopup.content.addEventListener(
        'click',
        (e) => {
          const target = e.target;
          if (target.classList.contains('item')) {
            const index = Number(target.dataset.index);
            const data = extendClusterLayer.tempList?.[index];

            if (data) {
              clusterPopup?.hide();
              deviceNamePopup?.hide();
              const refValue = data.type === 'vehicle' ? vehicleDetailsRef.value : deviceDetailsRef.value;
              refValue?.open(data);
            }
          }
        },
        { signal: clusterPopupAbortController.signal }
      );
    }, 1000);
    extendClusterLayer = new ExtendClusterLayer(map);
    layerTypes.yingxiang = mapData.layer;
    layerTypes.blue = mapData.blueLayer;
    layerTypes.white = mapData.whiteLayer;

    mapClickKey.value = map.on('click', clickMap);

    // 创建新疆边界阴影
    createXinJiangLineLayerWithShadowFn();
    // 创建新疆边界流光效果
    createProvinceAnimationLineLayerFn();

    // 创建国道高速
    createRoadLayers(GDGS, { color: roadColor.gd, width: 2, opacity: 'ff', originalData: true }).then((group) => {
      gdLayerGroup = group;
      map.addLayer(gdLayerGroup);
    });
    // 创建省道高速
    createRoadLayers(SDGS, { color: roadColor.sd, width: 2, opacity: 'ff', originalData: true }).then((group) => {
      sdLayerGroup = group;
      map.addLayer(sdLayerGroup);
    });
    // 创建道路标志图层
    createRoadSignLayerFn();

    // 分公司
    stageMap[SubCenterStage.name] = new SubCenterStage(map);
    // 延迟展示，不然有点卡
    setTimeout(() => {
      stageMap[SubCenterStage.name].show();
    }, 3000);

    // 设备
    stageMap[DeviceStage.name] = new DeviceStage(map);

    // 人员定位
    stageMap[PersonnelStage.name] = new PersonnelStage(map);

    // 机房
    stageMap[MachineRoomStage.name] = new MachineRoomStage(map);

    // 车辆位置
    stageMap[VehicleStage.name] = new VehicleStage(map);

    mapMoveKey.value = map.on('moveend', function () {
      extendClusterLayer?.removeLayer();
      // 地图缩放后，重新定位popup的位置
      if (currentDeviceTarget.value) {
        toDeviceTarget(currentDeviceTarget.value, 100);
      }
    });

    eventBus.customObjectOn('changeMapStage', mapStageChange);
    eventBus.customObjectOn('setMapCenter', setMapCenter);
    eventBus.customObjectOn('openDialog', ({ type, data }) => {
      switch (type) {
        case 'machineRoom':
          machineRoomDialogRef.value.open(data);
          break;
        case 'vehicle':
          vehicleDetailsRef.value.open(data);
          break;
        case 'device':
          deviceDetailsRef.value?.open(data);
          break;
        case 'tollStation':
          tollStationsRef.value?.open(data);
          break;
      }
    });
  });

  onUnmounted(() => {
    if (cancelAnimationLine) {
      cancelAnimationLine();
    }

    stageMap[SubCenterStage.name]?.destroy();
    stageMap[PersonnelStage.name]?.destroy();
    stageMap[MachineRoomStage.name]?.destroy();
    stageMap[VehicleStage.name]?.destroy();

    clusterPopupAbortController.abort();
    eventBus.customOff('changeMapStage', mapStageChange);
    eventBus.customOff('setMapCenter', setMapCenter);
    eventBus.customOff('openDialog');

    unByKey(mapClickKey.value);
    unByKey(mapMoveKey.value);
  });
</script>

<style lang="scss" scoped>
  .map-2d {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 2;
    background: url('/assets/images/screen/main_bg.jpg') no-repeat center center;
    background-size: 100% 100%;

    .map-container {
      width: 100%;
      height: 100%;
    }

    .test {
      position: absolute;
      top: 4rem;
      left: 10rem;
      z-index: 20;
    }
  }
</style>
