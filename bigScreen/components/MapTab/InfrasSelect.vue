<template>
  <div v-if="show" class="layer-search-new">
    <!-- top -->
    <div v-if="searchModel === 'search'" class="top">
      <div class="top__search bigscreen-card-common-bg">
        <input class="top__input" v-model="searchText" :placeholder="placeholder"
          @keyup.enter="inputSearch()"></input>
        <div v-if="searchText" class="close-icon" style="margin-left: 0.1rem;" @click="inputSearchClear"></div>
        <div class="top__search-btn" @click="inputSearch()"></div>
      </div>
    </div>

    <div v-if="searchModel === 'searchBounds'" class="top">
      <div class="top__search bigscreen-card-common-bg">
        <input class="top__input" v-model="searchText" :placeholder="placeholder"
          @keyup.enter="inputSearch()"></input>
        <div v-if="searchText" class="close-icon" style="margin-left: 0.1rem;" @click="inputSearchClear"></div>
        <div class="top__search-btn" @click="inputSearch()"></div>
      </div>
      <div class="top__range bigscreen-card-common-bg">
        <div 
          class="top__range-item" 
          v-for="item of radiusList" 
          :class="{'active': item.key === radiusKey}" 
          :key="item.key" 
          @click="changeRadius(item)"
        >
          {{ item.label }}
        </div>
      </div>
      <div class="top__location-icon bigscreen-card-common-bg" @click="reSelectLnglat">
        <img src="/assets/images/layer_search/location.png" :style="{'height': '0.2rem'}" alt="">
      </div>
    </div>

    <div class="flex" style="margin-top: 0.1rem;">
      <div class="device-category bigscreen-card-common-bg">
        <div 
          class="tab-list" 
          v-for="(item, index) of layers" 
          :class="{ 'active': item.type === showResultLayer }"  
          :key="item.type" 
          @click="changeResultLayer(item)"
        >
          <div class="tab-left" :class="item.baseIcon">
            <span :class="item.type"></span>
            <span class="tab-name">{{ item.name }}</span>
          </div>
          <div class="layer-check__not-checked" :class="{ 'checked': item.checked }" @click.stop="toggleCheckLayer(item)"></div>
        </div>
      </div>

      <div class="result-box bigscreen-card-common-bg" >
        <div class="close-icon result-close-icon" @click="hide"></div>
       
        <div v-if="searchResult.list?.length === 0" style="padding-top: 0.4rem;">
          <screen-empty  class="bigscreen-empty"></screen-empty>
        </div>
        
        <ScreenLoading v-if="showLoading" />
        <div v-show="!showLoading" class="result-scroll">
          <div v-for="(item, index) of searchResult.list" :key="index" class="result-item"
            @click="toTarget(item, true)">
            <div class="result-item__left">
              {{ item.properties.name }}
            </div>
            <div v-if="item.properties.onlineStatus" class="result-item__right" :class="{
              'online-color': item.properties.onlineStatus === 'ONLINE',
              'offline-color': item.properties.onlineStatus === 'OFFLINE',
            }">
              {{ item.properties.onlineStatus === 'ONLINE' ? '在线' : '离线' }}
            </div>
            <div v-else class="result-item__right">
              {{ item.properties.road }}
            </div>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>
<script setup>
import { useEventbus } from '../Map3D/hooks/useEventBus';
import { INFRAS_TYPE, infrasData, pageInfrasTypeMap } from '../Map3D/utils/infrasData.js';
import { getInfrasDataFnsBySql, getInfrasDataFnsByBounds } from '../Map3D/mini2d/utils/getPoi.js'
import { maxZoom, initZoom, mapCenter, metersToDegrees } from '../Map3D/mini2d/utils';
import { Circle, Point } from 'ol/geom';
import Feature from 'ol/Feature.js';
import { Fill, Stroke, Style, Icon } from 'ol/style.js';
import LayerGroup from 'ol/layer/Group.js';
import Collection from 'ol/Collection.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';

const emits = defineEmits([
  'openDialog',
  'createLayer',
  'hideSpecifiedIconLayers',
  'hideAllIconLayers',
  'reSelectLnglat',
  'toDeviceTarget',
  'hideAllIconLayersExceptEvent'])

const layers = ref(infrasData.filter(i => pageInfrasTypeMap.infras.includes(i.type)).map(i => {
  return {
    ...i,
    checked: false,
  }
}))

const tabName = ref('')
const eventType = ref()

const isCollapse = ref(false)
const collapseClick = () => {
  isCollapse.value = !isCollapse.value;
};

const checkedLayers = computed(() => {
  return layers.value.filter(i => i.checked)
})
const toggleCheckLayer = (item) => {
  item.checked = !item.checked
  if (!item.checked) {
    emits('hideSpecifiedIconLayers', [item.type])
  } else {
    searchBoundsInfras([item.type])
  }
  
}
const reSelectLnglat = () => {
  emits('reSelectLnglat')
}
watch(tabName, () => {
  closeSearchBox()
})
const showResultLayer = ref('')
const showLoading = ref(false)
const changeResultLayer = (item) => {
  showResultLayer.value = item.type
  showLoading.value = true
  searchBoundsInfras([item.type]).then(() => {
    showLoading.value = false
  })
}
watch(checkedLayers, (newVal, oldVal) => {
  if (!showResultLayer.value && newVal.length > 0) {
    showResultLayer.value = newVal[0].type
  }
}, { immediate: true })
const topStyle = computed(() => {
  if (['road', 'smartMonitor'].includes(tabName.value)) {
    return { top: '1.9rem', left: '10.5rem' }
  }
  return { top: '1.9rem', left: '10.5rem' }
})
const lnglat = ref([0, 0])
const quanJiangLnglat = [86.8341115547018, 41.894363870304105]
const setLnglat = (data) => {
  lnglat.value = data
  searchBoundsInfras()
}
const radiusList = ref([
  { label: '1km', key: 1, value: 1 * 1000 },
  { label: '5km', key: 5, value: 5 * 1000 },
  { label: '10km', key: 10, value: 10 * 1000 },
  { label: '20km', key: 20, value: 20 * 1000 },
  { label: '无限制', key: 2000, value: 2000 * 1000 },
])
const radiusKey = ref(2000)
const isQuanJiangRange = computed(() => {
  return radiusKey.value === 2000
})
// 单位米
const circleRadius = computed(() => {
  const item = radiusList.value.find(i => i.key === radiusKey.value)
  return item?.value || 5 * 1000
})
const changeRadius = (item) => {
  radiusKey.value = item.key
  searchBoundsInfras()
}
const setSearchRadius = (data) => {
  radiusKey.value = data
}
const eventBus = useEventbus()
const aroundInfrasList = ref({})
const searchResult = computed(() => {
  return aroundInfrasList.value[showResultLayer.value] || {}
})
const show = ref(false)
const selectLayer = (data) => {
  searchClear()
  clearCircleLayer()

  if (data?.types) {
    const { types } = data
    if (!data.lnglat) {
      lnglat.value = quanJiangLnglat
      radiusKey.value = data.radius || 2000
    } else {
      lnglat.value = data.lnglat
      if (radiusKey.value === 2000) {
        radiusKey.value = data.radius || 5
        searchModel.value = 'searchBounds'
      }
    }

    layers.value.forEach(i => {
      i.checked = types.includes(i.type)
    })
    searchBoundsInfras()
  }
  show.value = data.showBox || false
}
const placeholder = computed(() => {
  return `请输入名称`
})
const searchText = ref('')
let map = null
let circleLayer = null
const clearCircleLayer = () => {
  if (circleLayer) {
    map?.removeLayer(circleLayer)
    circleLayer = null
  }
}
const isEventType = computed(() => {
  return false
})

// 查询单个设备设施图层
const searchSingle = (config) => {
  const type = config.type
  const api = getInfrasDataFnsBySql[type]
  emits('hideAllIconLayersExceptEvent')
  if (api) {
    api(config.searchText, config.sql).then(res => {
      if (res?.list?.length > 0) {
        createLayer(res)
        const first = res.list[0]
        if (!config.noAnimation) {
          map.getView().animate({
            center: first.lnglat,
            zoom: config.zoom || 13,
            duration: 1000
          });
        }
      
      }

    })
  }
}

// watch(show, () => {
//   resetZoom()
// })
const setMap = (data) => {
  map = data
}

const toTarget = (item, needEmit) => {
  if (map) {
    // 如果图层在地图上没有显示，就创建对应的图层
    const checkResult = checkedLayers.value.find(i => i.type === item.type)
    if (!checkResult) {
        layers.value.forEach(i => {
          if (i.type === item.type) {
            i.checked = true
          }
        })
        const res = aroundInfrasList.value[item.type]
        if (res) {
          createLayer({ type: item.type, list: res.list })
        }
    }
    const duration = 1000
    // const zoom = isQuanJiangRange.value ? initZoom : 13
    const zoom = 13
    map.getView().animate({
      center: item.lnglat,
      zoom: zoom,
      duration, // 动画持续时间（毫秒）
    });
  }
  if (needEmit) {
    emits('toDeviceTarget', item)
  }
}
const toSubTarget = (item) => {
  if (map) {
    const duration = 2000
    map.getView().animate({
      center: item.lnglat,
      zoom: maxZoom,
      duration, // 动画持续时间（毫秒）
    });
    setTimeout(() => {
      emits('openDialog', item)
    }, duration + 500)
  }
}

const inputSearch = () => {
  showLoading.value = true
  searchBoundsInfras().then(() => {
    showLoading.value = false
  })
}

/**
 * 查询指定范围周围的设备设施
 * @param {Array<string>} specifiedTypes 查询指定类型的设备设施，如果没有指定，就查所有选中的设备设施
 */
const searchBoundsInfras = async (specifiedTypes) => {
  const coordinates = isQuanJiangRange.value ? quanJiangLnglat : lnglat.value
  const circle = new Circle(coordinates, metersToDegrees(circleRadius.value, coordinates[1]))
  // api的搜索范围比circle明显要大一些，所以创建circleMap来显示扩大后的搜索范围
  let fator = radiusKey.value === 1 ? 1.5 : 1.1
  const circleMap = new Circle(coordinates, metersToDegrees(circleRadius.value, coordinates[1]) * fator)
  let types = []
  if (specifiedTypes?.length) {
    types = specifiedTypes
  } else {
    types = checkedLayers.value.map((item) => item.type)
    if (showResultLayer.value && !types.includes(showResultLayer.value)) {
      types.push(showResultLayer.value)
    }
    emits('hideAllIconLayersExceptEvent')
  }
  
  if (types.length === 0) {
    return
  }
  const promiseArr = []
  for (const type of types) {
    const api = getInfrasDataFnsByBounds[type]
    if (api) {
      const p = api(circle).then(res => {
        console.log(res)
        if (searchText.value) {
          res.list = res.list.filter(i => {
            if (i.properties.name) {
              return i.properties.name.includes(searchText.value)
            }
            return false
          })
        }
        aroundInfrasList.value[type] = markRaw(res)
        // 只有勾选中的才会在地图上显示对应的图层
        if (checkedLayers.value.find(i => i.type === type)) {
          createLayer({ type: type, list: res.list })
        }
      })
      promiseArr.push(p)
    }
  }
  clearCircleLayer()
  // 如果是全疆范围，就不用画圆圈范围啦
  if (!isQuanJiangRange.value) {
    circleLayer = createCircleLayer(circleMap)
    map.addLayer(circleLayer)
  }
  if (isQuanJiangRange.value) {
    resetZoom()
  } else {
    toTarget({ lnglat: coordinates }, false)
  }
  return Promise.all(promiseArr)
}

const createCircleLayer = (circleGeometry) => {
  const circleFeature = new Feature({
    geometry: circleGeometry
  });
  circleFeature.setStyle(new Style({
    fill: new Fill({
      color: 'rgba(0, 138, 255, 0.2)' // 填充颜色，半透明红色
    }),
    stroke: new Stroke({
      color: '#008aff', // 边框颜色
      width: 2 // 边框宽度
    })
  }));
  const iconFeature = new Feature({
    geometry: new Point(circleGeometry.getFirstCoordinate())
  })
  iconFeature.setStyle(new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: '/assets/images/event_location.png',
      scale: 0.8
    })
  }))
  const vectorSource = new VectorSource();
  vectorSource.addFeature(circleFeature);
  const vectorLayer = new VectorLayer({
    source: vectorSource
  });

  const vectorSource1 = new VectorSource();
  vectorSource1.addFeature(iconFeature);
  const vectorLayer1 = new VectorLayer({
    source: vectorSource1
  });
  vectorLayer.setZIndex(3)
  vectorLayer1.setZIndex(3)

  const group = new LayerGroup()
  group.setLayers(new Collection([vectorLayer, vectorLayer1]));

  return group
}

const resetZoom = () => {
  if (map) {
    const duration = 1000
    map.getView().animate({
      center: mapCenter,
      zoom: initZoom,
      duration, // 动画持续时间（毫秒）
    });
  }
}

const inputSearchClear = () => {
  searchClear()
  inputSearch()
}
const searchClear = () => {
  searchText.value = ''
  searchResult.value = {}
  eventType.value = ''
  
}
// 关闭搜索框
const closeSearchBox = () => {
  show.value = false
  searchClear()
  clearCircleLayer()
  emits('hideAllIconLayersExceptEvent')
}

const hide = () => {
  show.value = false
}

const createLayer = (data) => {
  emits('createLayer', { type: data.type, baseIcon: data.baseIcon, list: data.list })
}

const searchLayerChangeCallback = (value) => {
  selectLayer(value)
}

const checkLayers = (types) => {
  layers.value.forEach(i => i.checked = false)
  types.forEach(type => {
    const layer = layers.value.find(j => j.type === type)
    if (layer) {
      layer.checked = true
    }
  })
}
// 搜索模式 search or searchBounds
const searchModel = ref('search')
// 搜索模式
const openSearchModel = () => {
  setSearchRadius(2000)
  searchModel.value = 'search'
  show.value = true
  checkLayers([INFRAS_TYPE.SERVICE_AREA])
  searchBoundsInfras()
}
// 范围搜索模式
const openSearchBoundsModel = () => {
  setSearchRadius(5)
  searchModel.value = 'searchBounds'
  show.value = true
  checkLayers([INFRAS_TYPE.CAMERA])
  showResultLayer.value = ''
  if (lnglat.value[0] !== 0 && lnglat.value[1] !== 0) {
    searchBoundsInfras()
  } else {
    const view = map.getView();
    const center = view.getCenter();
    
    setLnglat(center)
  }
}

onMounted(() => {
  eventBus.customObjectOn('open2DLayerSearchBox', searchLayerChangeCallback);
  eventBus.customObjectOn('createSingleLayerByType', searchSingle);
})
onUnmounted(() => {
  eventBus.customOff('open2DLayerSearchBox', searchLayerChangeCallback)
  eventBus.customOff('createSingleLayerByType', searchSingle)
})

defineExpose({
  setMap,
  setLnglat,
  openSearchModel,
  openSearchBoundsModel,
  hide,
  clearCircleLayer,
})
</script>
<style lang="scss" scoped>
.layer-search-new {
  position: absolute;
  left: 1.1rem;
  width: 5.8rem;
  z-index: 1000;
  top: 0rem;
  transform: scale(0.7);
  transform-origin: top left;

  .online-color {
    color: #37ec37 !important;
  }

  .offline-color {
    color: red !important;
  }

  .r-collapse {
    width: 0.20rem;
    height: 0.20rem;
    cursor: pointer;
    background: url("/assets/images/collapse_right.png") no-repeat center;
    background-size: 100% 100%;

    &.b {
      background: url("/assets/images/collapse_left.png") no-repeat center;
      background-size: 100% 100%;
    }
  }

  .close-icon {
    position: absolute;
    right: 0.4rem;
    top: 0.11rem;
    width: 0.14rem;
    height: 0.14rem;
    background: url("/assets/images/layer_search/close.png") no-repeat center center;
    background-size: 100% 100%;
    cursor: pointer;
  }

  .result-close-icon {
    right: 0.1rem;
    top: 0.12rem;
  }

  .top {
    display: flex;
    height: 0.4rem;
    gap: 0.1rem;

    .top__location-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 0.5rem;
      height: 0.4rem;
      color: #30D8EE;
      font-size: 0.16rem;
      cursor: pointer;
    }

    .top__icon-img {
      width: 60%;
    }

    .top__search {
      display: flex;
      width: 0;
      flex: 1;
      align-items: center;
      padding: 0 0.1rem;
    }

    .top__input {
      width: 0;
      flex: 1;
      font-size: 0.16rem;
      color: #fff;
      height: 100%;
      background: transparent;
    }

    .top__search-btn {
      width: 0.24rem;
      height: 0.24rem;
      border-radius: 0.02rem;
      background: #1963D0 url("/assets/images/layer_search/search.png") no-repeat center center;
      background-size: 80% 80%;
      cursor: pointer;
    }
    .top__range {
      display: inline-flex;
      font-size: 0.16rem;
    }
    .top__range-item {
      display: flex;
      align-items: center;
      margin: 0 0.1rem;
      cursor: pointer;
      height: 100%;
      color: #fff;
      opacity: 0.5;

      &.active {
        opacity: 1;
      }
    }
  }

  .event-icon-box {
    display: flex;

    .event-icon__item {
      width: 0.4rem;
      height: 0.4rem;
      margin: 0.1rem;
      cursor: pointer;

      img {
        width: 100%;
      }
    }
  }

  .result-box {
    width: 0;
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 5.3rem;
    overflow: auto;
    padding: 0.4rem 0.1rem 0;

  }

  .result-tip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: rgba(216, 240, 255, 0.5);
    font-size: 0.16rem;
    margin: 0.1rem 0;
  }

  .result-scroll {
    flex: 1;
    height: 0;
    overflow: auto;

    &::-webkit-scrollbar-track-piece {
      background: transparent !important;
    }

    &::-webkit-scrollbar-thumb {
      background: #114BA0;
      border-radius: 0.05rem;
    }
  }

  .result-item {
    display: flex;
    align-items: center;
    height: 0.4rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 0 0.1rem;
    margin-bottom: 0.1rem;
    cursor: pointer;

    .result-item__left {
      width: 0;
      flex: 1;
      margin-right: 0.1rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.16rem;
      color: #32bcd7;
    }

    .result-item__right {
      font-size: 0.12rem;
      color: #fff;
    }
  }

  .range-box {
    display: flex;
    height: 0.4rem;
    align-items: center;
    margin-bottom: 0.1rem;
  }

  .range-box__list {
    display: flex;
    align-items: center;
    width: 0;
    flex: 1;
    height: 100%;
  }

  .range-box__list-item {
    display: flex;
    align-items: center;
    position: relative;
    color: #30D8EE;
    font-size: 0.16rem;
    height: 100%;
    margin-right: 0.2rem;
    cursor: pointer;

    &.active::before {
      width: 80%;
      height: 0.02rem;
      content: "";
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translate(-50%);
      background: #30D8EE;
      border-radius: 0.01rem;
    }
  }

  .range-box__back-icon {
    width: 0.16rem;
    height: 0.16rem;
    background: url("/public/assets/images/layer_search/back.png") no-repeat center center;
    background-size: 100% 100%;
    cursor: pointer;
  }

  .infras-card {
    padding: 0.1rem;
    background: rgba(0, 0, 0, 0.2);
    margin-bottom: 0.15rem;
  }

  .infras-card__title {
    color: #30D8EE;
    font-size: 0.18rem;
    height: 0.4rem;
    display: flex;
    align-items: center;
  }

  .infras-card__arrow {
    margin-left: 0.15rem;
    width: 0.14rem;
    height: 0.8rem;
    background: url("/assets/images/layer_search/arrow.png") no-repeat center center;
    background-size: 100% auto;
    transform: rotate(180deg);
  }

  .infras-card__item {
    color: #fff;
    font-size: 0.12rem;
    line-height: 0.26rem;
    cursor: pointer;
  }

  .infras-card__empty {
    height: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.2rem;
    color: #fff;
  }

  .layer-check {
    display: flex;
    flex-wrap: wrap;
  }

  .layer-check__item {
    display: inline-flex;
    align-items: center;
    margin: 0.1rem;
    cursor: pointer;
  }

  .layer-check__text {
    color: #fff;
    margin-left: 0.05rem;
    font-size: 0.14rem;
  }

  .layer-check__not-checked {
    width: 0.2rem;
    height: 0.2rem;
    background: url("/assets/images/layer_search/not_check.png") no-repeat center center;
    background-size: 100% 100%;

    &.checked {
      background: url("/assets/images/layer_search/check.png") no-repeat center center;
      background-size: 100% 100%;
    }
  }


  .device-category {
    width: 2.0rem;
    margin-right: 0.1rem;
    padding: 0 0.1rem;
  }


  .tab-list {
    position: relative;
    width: 100%;
    height: 0.65rem;
    display: inline-flex;
    gap: 0.1rem;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
    margin-top: 0.05rem;
    margin-bottom: 0.05rem;
    padding: 0 0.1rem;
    position: relative;
    cursor: pointer;

    .tab-left {
      display: inline-flex;
      align-items: center;
      height: 100%;
      padding-left: 0.52rem;
      font-size: 0.16rem;
      color: #fff;
      font-style: normal;

      .tab-name {
        display: inline-block;
        width: max-content;
      }

      &.base0 {
        background: url('/assets/images/infras/base0.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base1 {
        background: url('/assets/images/infras/base1.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base2 {
        background: url('/assets/images/infras/base2.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base3 {
        background: url('/assets/images/infras/base3.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base4 {
        background: url('/assets/images/infras/base4.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base5 {
        background: url('/assets/images/infras/base5.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base6 {
        background: url('/assets/images/infras/base6.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base7 {
        background: url('/assets/images/infras/base7.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base8 {
        background: url('/assets/images/infras/base8.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base9 {
        background: url('/assets/images/infras/base9.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base10 {
        background: url('/assets/images/infras/base10.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base11 {
        background: url('/assets/images/infras/base11.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base12 {
        background: url('/assets/images/infras/base12.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base13 {
        background: url('/assets/images/infras/base13.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base14 {
        background: url('/assets/images/infras/base14.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base15 {
        background: url('/assets/images/infras/base15.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base16 {
        background: url('/assets/images/infras/base16.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base17 {
        background: url('/assets/images/infras/base17.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base18 {
        background: url('/assets/images/infras/base18.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base19 {
        background: url('/assets/images/infras/base19.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      .bridge {
        position: absolute;
        left: 0.24rem;
        top: 0.15rem;
        width: 0.23rem;
        height: 0.15rem;
        background: url('/assets/images/infras/bridge_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .camera {
        position: absolute;
        left: 0.26rem;
        top: 0.14rem;
        width: 0.19rem;
        height: 0.18rem;
        background: url('/assets/images/infras/camera_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .construct {
        position: absolute;
        left: 0.22rem;
        top: 0.12rem;
        width: 0.24rem;
        height: 0.24rem;
        background: url('/assets/images/infras/construct_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .highwayDiseases {
        position: absolute;
        left: 0.26rem;
        top: 0.13rem;
        width: 0.2rem;
        height: 0.19rem;
        background: url('/assets/images/infras/highwayDiseases_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .longMenJia {
        position: absolute;
        left: 0.23rem;
        top: 0.12rem;
        width: 0.23rem;
        height: 0.18rem;
        background: url('/assets/images/infras/longMenJia_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .newsBoard {
        position: absolute;
        left: 0.26rem;
        top: 0.15rem;
        width: 0.18rem;
        height: 0.18rem;
        background: url('/assets/images/infras/newsBoard_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .parking {
        position: absolute;
        left: 0.26rem;
        top: 0.15rem;
        width: 0.2rem;
        height: 0.2rem;
        background: url('/assets/images/infras/parking_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .roadLevel {
        position: absolute;
        left: 0.22rem;
        top: 0.15rem;
        width: 0.23rem;
        height: 0.15rem;
        background: url('/assets/images/infras/roadLevel_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .serviceArea {
        position: absolute;
        left: 0.25rem;
        top: 0.15rem;
        width: 0.22rem;
        height: 0.18rem;
        background: url('/assets/images/infras/serviceArea_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .slope {
        position: absolute;
        left: 0.22rem;
        top: 0.15rem;
        width: 0.23rem;
        height: 0.15rem;
        background: url('/assets/images/infras/slope_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .specialProject {
        position: absolute;
        left: 0.24rem;
        top: 0.15rem;
        width: 0.21rem;
        height: 0.19rem;
        background: url('/assets/images/infras/specialProject_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .subCenter {
        position: absolute;
        left: 0.26rem;
        top: 0.15rem;
        width: 0.23rem;
        height: 0.15rem;
        background: url('/assets/images/infras/subCenter_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .tollStation {
        position: absolute;
        left: 0.25rem;
        top: 0.15rem;
        width: 0.19rem;
        height: 0.18rem;
        background: url('/assets/images/infras/tollStation_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .trafficEvent {
        position: absolute;
        left: 0.26rem;
        top: 0.16rem;
        width: 0.19rem;
        height: 0.18rem;
        background: url('/assets/images/infras/trafficEvent_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .tunnel {
        position: absolute;
        left: 0.25rem;
        top: 0.13rem;
        width: 0.2rem;
        height: 0.2rem;
        background: url('/assets/images/infras/tunnel_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .weatherStation {
        position: absolute;
        left: 0.27rem;
        top: 0.14rem;
        width: 0.17rem;
        height: 0.2rem;
        background: url('/assets/images/infras/weatherStation_f.png') left center no-repeat;
        background-size: auto 100%;
      }
    }

    &.active {
      &::before {
        content: '';
        width: 0.02rem;
        height: 100%;
        position: absolute;
        left: -0.01rem;
        top: 0;
        background: #59d5f0;
      }
    }
  }
}
</style>
