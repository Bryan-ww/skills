<template>
  <div class="map-3d">
    <canvas id="canvas"></canvas>

  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import { World } from "./index";
import { useEventbus } from "./hooks/useEventBus";
import { useEventListener } from '@vueuse/core'
import { useMapStore } from './hooks/useMapStore'

// 初始化阶段
import { InitStage } from './utils/subStages/InitStage.js'
// 初始化阶段的图层
import { RoadNetworkLayer } from './utils/layers/RoadNetworkLayer.js' // 路网图层
import { RoadSignLayer } from './utils/layers/RoadSignLayer.js' // 路线名字图层
import { SubCenterLayer } from './utils/layers/SubCenterLayer.js' // 分公司图层

// 路段阶段
import { SectionStage } from './utils/subStages/SectionStage.js' 
// 路段阶段的图层
import { RoadSectionLayer } from './utils/layers/RoadSectionLayer.js' // 路段图层

 // 基础设施阶段
import { InfraStage } from './utils/subStages/InfraStage.js'
import { InfrasLayer } from './utils/layers/InfrasLayer.js' // 基础设施图层

const eventBus = useEventbus()
const mapStore = useMapStore()
let app = null;
let cleanUp = null
let cleanWheel = null

const change3DMapStageCallback = (value) => {
  app.subStageChange(value)
}

const resetMapCallback = (value) => {
  app.resetCamera(value)
}

onMounted(() => {
  const canvasDom = document.getElementById("canvas")
  
  app = new World(canvasDom, {
    center: [87.617733, 43.792818],
    mapStore: mapStore,
    eventBus: eventBus,
    map3dLimit: true,
    hideGui: true,
    // 默认子阶段
    defaultSubStage: InitStage.name,
    isDev: import.meta.env.DEV,
  });

  // 新增初始化阶段
  app.addSubStage(
    new InitStage(app)
    .addLayer(new RoadNetworkLayer(app))
    .addLayer(new RoadSignLayer(app))
    .addLayer(new SubCenterLayer(app))
  )
  // 新增路段阶段
  const roadSectionLayer = new RoadSectionLayer(app)
  app.addSubStage(
    new SectionStage(app)
    .addLayer(roadSectionLayer)
  )

  // 新增基础设施阶段
  const infrasLayer = new InfrasLayer(app)
  app.addSubStage(
    new InfraStage(app)
    .addLayer(infrasLayer)
  )

  // 必须在新增默认子阶段后，才能开始动画
  setTimeout(() => {
    app.startAnimation({ delay: 0 })
  }, 1000)

  eventBus.customObjectOn('createInfrasLayer', (data) => {
    infrasLayer.createInfras(data)
    app.subStageChange({id: InfraStage.name})
  })

  eventBus.customObjectOn('changeRoadSection', (data) => {
    roadSectionLayer.setSectionData(data)
    app.subStageChange({id: SectionStage.name})
  })

  // startAnimation 事件，用于开始地图的进入动画
  eventBus.customObjectOn('startAnimation', (data) => {
    app.startAnimation(data)
  })

  // change3DMap 事件，用于切换3D地图底图
  eventBus.customObjectOn('3dMapStyleChange', (data) => {
    app.mapStyleChange(data)
  })

  // change3DMapStage 事件，用于切换子阶段
  eventBus.customObjectOn('change3DMapStage', change3DMapStageCallback)

  // reset3DMapCamera 事件，用于重置子阶段相机位置和目标
  eventBus.customObjectOn('reset3DMapCamera', resetMapCallback)

  // 点击地图停止相机运动
  cleanUp = useEventListener(canvasDom, 'mousedown', (evt) => {
    app.clearCameraTl()
    eventBus.customEmitObject('stopAnimation', {})
  })

  // 滚轮事件停止相机运动
  cleanWheel = useEventListener(canvasDom, 'wheel', (evt) => {
    app.clearCameraTl()
    eventBus.customEmitObject('stopAnimation', {})
  })
  // app.setRefs({
  //   [INFRAS_TYPE.TOLL_STATION]: tollStationDialogRef,
  //   [INFRAS_TYPE.SUB_CENTER]: subCenterDialogRef,
  // });

});
onBeforeUnmount(() => {
  eventBus.customOff('startAnimation')
  eventBus.customOff('3dMapStyleChange')
  eventBus.customOff('createInfrasLayer')
  eventBus.customOff('changeRoadSection')
  eventBus.customOff('change3DMapStage', change3DMapStageCallback)
  eventBus.customOff('reset3DMapCamera', resetMapCallback)
  cleanUp && cleanUp();
  cleanWheel && cleanWheel();
  app && app.destroy();
});
</script>

<style lang="scss" scoped>
#canvas {
  width: 100%;
  height: 100%;
}
.map-3d {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 2;
}
</style>
