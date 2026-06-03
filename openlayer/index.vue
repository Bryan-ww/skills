<template>
  <div ref="mapRef" class="map-container" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import { styleComposition } from './Style';
import { layerComposition } from './Layer';
import { featureComposition } from './Feature';

import Map from 'ol/Map';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';

import { defaults } from 'lodash';
import { isEmpty } from '@/utils';

/**
 * 基于 OpenLayers 的通用地图组件
 *
 * - 通过 `mapConfig`/`view`/`layers` 等属性进行配置
 * - 通过 `defineExpose` 暴露一组地图操作方法给父组件
 * - 提供基础的点标记能力和简单的点击事件分发
 */
const emits = defineEmits(['map-ready', 'map-click', 'marker-click', 'point-click', 'point-mouseover', 'point-mouseout']);

const props = defineProps({
  // Map 配置（除 target 与 view 外）
  // 文档：https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html
  mapConfig: {
    type: Object,
    default: () => ({}),
  },
  // View 配置对象
  // 文档：https://openlayers.org/en/latest/apidoc/module-ol_View-View.html
  view: {
    type: Object,
    default: () => ({}),
  },
  // 图层配置数组
  // 每一项与 `Layer.js` 中 `addLayers`/`addLayerGroup` 所使用的配置保持一致
  layers: {
    type: Array,
    default: () => [],
  },
  // 是否使用默认底图
  useDefaultBaseLayer: {
    type: Boolean,
    default: true,
  },
  // 点数据配置
  point: {
    type: Object,
    default: () => ({
      data: [],
    }),
  },
  // 点图层配置
  pointsLayer: {
    type: Object,
    default: () => ({ zIndex: 6 }),
  },
  // 地图中心点 [经度, 纬度]
  center: {
    type: Array,
    default: () => [87.58, 43.83], // 默认新疆
  },
  // 是否显示控件（缩放、旋转等默认控件）
  showControls: {
    type: Boolean,
    default: true,
  },
});

// #region 初始化与基础方法
let map = null;
const mapRef = ref();

// 供本组件内部使用的样式工具
const { getStyle } = styleComposition();

// 图层管理工具（将在 initMap 后初始化）
const layerManager = layerComposition({ getStyle });

const featureManager = featureComposition({
  getStyle,
  getLayerSource: layerManager.getLayerSource,
});

/**
 * 根据事件获取当前点和点的数据
 * 从地图点击或鼠标移动事件中提取对应的要素和数据
 *
 * @param {import('ol/Map').default} mapInstance 地图实例
 * @param {import('ol/MapBrowserEvent').default} evt 地图事件对象
 * @returns {{feature: import('ol/Feature').default|null, data: any}} 要素和数据对象
 * @example
 * map.on('click', (event) => {
 *   const { feature, data } = getFeatureByEvt(map, event);
 *   if (feature && data) {
 *     console.log('点击了要素:', data);
 *   }
 * });
 */
const getFeatureByEvt = (mapInstance, evt) => {
  const features = mapInstance.getFeaturesAtPixel(evt.pixel);
  const feature = isEmpty(features) ? null : features[0];
  const data = feature?.data;
  return { feature, data };
};

// View 默认配置
const defaultsView = {
  // 默认坐标系配置
  // 有EPSG:4326和EPSG:3857
  // 如无必要请勿修改
  projection: 'EPSG:4326',
  // projection: 'EPSG:3857',
  minZoom: 0,
  zoom: 12,
  maxZoom: 28,
};

// 默认底图配置（用于没有传入 layers 时的超图底图）
const defaultBaseLayer = {
  name: 'defaultBaseLayer',
  url: 'http://10.105.1.49:8090/iserver/services/map-zhdt/rest/maps/综合地图',
  type: 'base',
  title: '综合地图',
  layertype: 'SuperMap',
  epsgCode: 4490,
  projection: 'EPSG:4326',
  // epsgCode: 3857,
  // projection: 'EPSG:3857',
};

// 初始化地图
const initMap = () => {
  if (!mapRef.value) return;
  // 组合 view 配置（props.view 优先，再用 defaultsView 填充）
  const viewOptions = defaults(props.view, defaultsView);

  // 创建地图视图
  const view = new View(viewOptions);

  // 创建地图
  map = new Map({
    target: mapRef.value,
    view,
    controls: props.showControls ? defaultControls() : [],
    layers: [],
    ...props.mapConfig,
  });

  layerManager.initMap(map);

  // 初始设置中心点
  if (props.center) {
    setCenter(props.center);
  }

  // 按照外部传入的图层配置构造底图/业务图层
  const layers = props.layers;
  if (props.useDefaultBaseLayer) {
    // 如果没有配置 layers，使用默认底图
    const options = defaults(props.view, defaultBaseLayer);
    layers.push(options);
  }
  // 添加默认底图或配置的图层
  if (!isEmpty(layers)) {
    // 如果有配置图层，添加配置的图层
    nextTick(() => {
      layerManager.addLayers(layers);
    });
  }

  // 地图点击事件
  map.on('click', (event) => {
    const { feature, data } = getFeatureByEvt(map, event);

    if (feature && data) {
      // 如果点击的是点数据，抛出 point-click 事件
      const coordinates = feature.getGeometry()?.getCoordinates();
      emits('point-click', {
        data,
        coordinates,
        event,
        map,
        feature,
      });
    } else if (feature) {
      // 点击了其他类型的 feature（非点数据）
      const onClick = feature.get('onClick');
      const featureData = feature.getProperties();
      if (onClick) {
        onClick(feature, event);
      }
      emits('marker-click', { feature, event, data: featureData });
    } else {
      // 点击了地图空白处
      emits('map-click', event);
    }
  });

  // 监听鼠标移动到点事件
  let hoveredFeature = null;

  // 触发移出事件的辅助函数
  const triggerMouseout = (feature, event) => {
    const prevData = feature?.data;
    if (prevData) {
      emits('point-mouseout', {
        data: prevData,
        feature,
        event,
        map,
      });
    }
  };

  map.on('pointermove', (event) => {
    const { feature, data } = getFeatureByEvt(map, event);

    // 改变鼠标形状
    map.getViewport().style.cursor = data ? 'pointer' : 'inherit';

    // 处理鼠标移入/移出事件
    if (feature !== hoveredFeature) {
      // 如果之前有悬停的 feature，先触发移出事件
      if (hoveredFeature) {
        triggerMouseout(hoveredFeature, event);
      }

      // 更新当前悬停的 feature
      hoveredFeature = feature;

      // 如果新 feature 有数据，触发移入事件
      if (feature && data) {
        const coordinates = feature.getGeometry()?.getCoordinates();
        emits('point-mouseover', {
          data,
          coordinates,
          event,
          map,
          feature,
        });
      }
    }
  });

  // 地图加载完成事件
  map.once('rendercomplete', () => {
    emits('map-ready', map);
  });
};

/**
 * 设置地图中心点
 *
 * @param {Array<number>} center 中心点坐标 [经度, 纬度]
 * @example
 * setCenter([87.58, 43.83]);
 */
const setCenter = (center) => {
  if (map && center && center.length === 2) {
    map.getView().setCenter(center);
  }
};

/**
 * 设置缩放级别
 *
 * @param {number} zoom 缩放级别，通常范围 0-28
 * @example
 * setZoom(15);
 */
const setZoom = (zoom) => {
  if (map && zoom) {
    map.getView().setZoom(zoom);
  }
};

/**
 * 获取缩放级别
 * @example
 * getZoom();
 */
const getZoom = () => {
  if (map) {
    return map.getView().getZoom();
  }
  return null;
};
/**
 * 地图动画 参考https://openlayers.org/en/latest/apidoc/module-ol_View-View.html#animate
 * @param {Object} options 动画选项
 * @param {Array<number>} options.center 中心点坐标 [经度, 纬度]
 * @param {number} options.zoom 缩放级别
 * @param {number} options.duration 动画时长，默认 1000ms
 */
const animate = (options) => {
  if (map && options) {
    map.getView().animate(options);
  }
};

/**
 * 获取地图实例
 *
 * @returns {import('ol/Map').default|null} OpenLayers 地图实例
 * @example
 * const mapInstance = getMap();
 * if (mapInstance) {
 *   mapInstance.on('click', handleClick);
 * }
 */
const getMap = () => {
  return map;
};

/**
 * 获取地图视图
 *
 * @returns {import('ol/View').default|null} OpenLayers 地图视图实例
 * @example
 * const view = getView();
 * if (view) {
 *   const currentZoom = view.getZoom();
 * }
 */
const getView = () => {
  return map ? map.getView() : null;
};

// 监听 props 变化（动态设置中心点）
watch(
  () => props.center,
  (newVal) => {
    if (newVal && map) {
      setCenter(newVal);
    }
  },
  { deep: true }
);
// #endregion

// #region 点数据

const pointsLayerName = 'pointsLayer';
// 默认点配置
const defaultsPoint = {
  // 数据源
  data: [],
  zIndex: 6,
  // 字段映射配置
  fieldConfig: {
    // 经度字段名称
    lon: 'lon',
    // 纬度字段名称
    lat: 'lat',
  },
};

// 监听 finalPoint.data 变化，当数据发生变化时先清除点层再添加点数据
watch(
  () => props.point.data,
  (v) => {
    nextTick(() => {
      // 数据更新前清除点图层
      clearPointsLayer();
      const finalPoint = defaults(props.point, defaultsPoint);
      // 添加点数据
      addPoints(v, finalPoint, { name: pointsLayerName, ...props.pointsLayer });
    });
  },
  { deep: true }
);

/**
 * 添加点数据
 * 批量创建点要素并添加到指定图层
 *
 * @param {Array<Object>} data 点数据数组，每个对象需包含经纬度字段
 * @param {Object} params 点数据配置参数
 * @param {Object} [params.fieldConfig] 字段映射配置
 * @param {string} [params.fieldConfig.lon] 经度字段名称，默认 'lon'
 * @param {string} [params.fieldConfig.lat] 纬度字段名称，默认 'lat'
 * @param {Object|Function} [params.style] 点样式配置或样式函数
 * @param {Object} layerConfig 图层配置
 * @param {string} [layerConfig.name] 图层名称，默认 'pointsLayer'
 * @param {number} [layerConfig.zIndex] 图层层级
 * @example
 * addPoints(
 *   [{ lon: 87.58, lat: 43.83, name: '点1' }, { lon: 87.60, lat: 43.85, name: '点2' }],
 *   { style: { image: { radius: 8, fill: { color: 'blue' } } } },
 *   { name: 'myPoints', zIndex: 6 }
 * );
 */
const addPoints = (data, params, layerConfig) => {
  if (isEmpty(data)) return;
  const list = [];
  data.forEach((item) => {
    const feature = featureManager.createPointByData(item, params, props.view);
    list.push(feature);
  });
  layerManager.loadLayer(layerConfig, list);
};

/**
 * 清除点图层
 * 移除指定名称的点图层及其所有要素
 *
 * @param {string} [name='pointsLayer'] 图层名称，默认使用 pointsLayerName
 * @example
 * clearPointsLayer(); // 清除默认点图层
 * clearPointsLayer('myPoints'); // 清除指定名称的点图层
 */
const clearPointsLayer = (name = pointsLayerName) => {
  layerManager.removeLayerByName(name);
};
// #endregion

onMounted(() => {
  initMap();
});

onBeforeUnmount(() => {
  if (map) {
    map.setTarget(null);
    map = null;
  }
});

// 暴露方法供父组件调用，方便业务页面按需操作地图/图层
defineExpose({
  getMap,
  getView,
  setCenter,
  setZoom,
  getZoom,
  animate,
  addPoints,
  clearPointsLayer,
  getFeatureByEvt,
  ...layerManager,
  ...featureManager,
});
</script>

<style scoped lang="scss">
.map-container {
  width: 100%;
  height: 100%;
  position: relative;

  :deep(.ol-viewport) {
    width: 100%;
    height: 100%;
  }
}
</style>
