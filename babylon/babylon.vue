<template>
  <canvas class="webgl" ref="webgl"></canvas>
</template>

<script setup>
import App from "./index";
import { ref, onMounted } from "vue";
import camera_icon from "./assets/camera.png";

// 组件 Props 定义
const props = defineProps({
  videoShow: { // 是否显示视频
    type: Boolean,
    default: true,
  },
  cameraType: { // 初始相机模式 '2d' | '3d'
    type: String,
    default: "3d",
  },
  isLock: { // 是否锁定交互
    type: Boolean,
    default: false,
  },
});
// import CarPng from './assets/car.png?url'
const webgl = ref(null); // Canvas DOM 引用
let app; // Babylon 核心实例
let points = []; // 点位数据
const setVideo = (type) => {
  if (type) {
    app.loadVideos(points.filter((item) => item.type === "camera"));
    return;
  } else {
    app.loadVideos([]);
  }
};

const lock = (isLock) => {
  // console.log(isLock,"isLock")
  app.lock(isLock, props.cameraType);
};
const setCameraType = (type) => {
  // console.log(type,"type")
  app.setCameraType(type);
};

const setCurrentBox = (value) => {
  app.setCurrentBox(value);
};

onMounted(async () => {
  const _video = document.createElement("video");
  _video.src = "http://vjs.zencdn.net/v/oceans.mp4";
  _video.muted = true;
  _video.autoplay = true;
  _video.controls = false;
  _video.style.width = "100%";
  _video.style.height = "100%";
  _video.style.objectFit = "fill";
  points = [
    {
      device_code: "1",
      name: "摄像机",
      x: 0.1,
      y: 0.5,
      z: 0.1,
      type: "camera",
      background: camera_icon,
      el: _video,
      containerInversion: "3",
      width: 0.5,
      height: 0.5,
      road: 0,
      billboardMode: 7,
    },
    {
      device_code: "2",
      name: "摄像机",
      x: 0.25,
      y: 0.5,
      z: 0.1,
      type: "camera",
      background: camera_icon,
      el: _video.cloneNode(true),
      containerInversion: "4",
      width: 0.5,
      height: 0.5,
      road: 0,
      billboardMode: 7,
    },
    {
      device_code: "3",
      name: "摄像机",
      x: 0.3,
      y: 0.5,
      z: 0.1,
      type: "camera",
      background: camera_icon,
      el: _video.cloneNode(true),
      containerInversion: "1",
      style: {
        // translate: '0px -10px'
      },
      width: 0.5,
      height: 0.5,
      road: 1,
      billboardMode: 7,
    },
    {
      device_code: "4",
      name: "摄像机",
      x: 0.6,
      y: 0.5,
      z: 0.2,
      type: "camera",
      background: camera_icon,
      el: _video.cloneNode(true),
      containerInversion: "1",
      style: {
        // translate: '0px -10px'
      },
      width: 0.5,
      height: 0.5,
      road: 1,
    },
    {
      device_code: "5",
      name: "风机",
      x: 0.2,
      y: 0.5,
      z: 0.5,
      type: "fj",
      background: camera_icon,
      width: 0.5,
      height: 0.5,
      road: 1,
    },
  ];
  // 1. 初始化 Babylon 引擎实例
  app = new App(webgl.value, {
    viewPort: 1.2,
    cameraType: props.cameraType,
    isLock: props.isLock,
  });
  
  // 2. 定义道路结构配置
  const roads = [
    // { num: 4, name: '往梧州', type: 2 },
    { num: 2, name: "往梧州", type: 2, length: 2 }, // type: 2 反向
    { num: 2, name: "往昭平", type: 1, length: 2 }, // type: 1 正向
    // { num: 3, name: '往昭平', type: 1 }
  ];
  const length = 2; // 道路基础长度系数
  
  // 3. 加载场景内容：道路、点位、视频
  app.loadRoads(roads, {isResetCamera: true, setCameraType: true});
  app.loadPoints(points);
  setVideo(props.videoShow);
  // app.loadVideos(points.filter((item) => item.type === 'camera'))
  // app.loadVideoHtmlMeshs(points.filter((item) => item.type === 'camera'))

  // 4. 模拟生成车辆数据
  const cars = new Array(100).fill(1).map((item) => {
    const index = Math.floor(Math.random() * 2);
    const road = roads.at(index);
    // console.log(road, "road");
    return {
      device_code: (Math.random() * 1000).toString(),
      move: true,
      laneType: road.type,
      laneNum: road.num,
      roadNum: index,
      length: length,
      currentLength: Math.random() * 1.5,
      // path: CarPng,
      width: 4.8 / 4,
      height: 2 / 4,
      currentLane: Math.floor(Math.random() * road.num),
      speed: 60,
    };
  });
  
  // 5. 加载车辆模型资源并启动动画循环
  await app.carLoad();
  // app.setMeshToRoads(cars)
  app.setCarToRoads(cars);
  
  // 定时重置车辆位置（模拟无限车流）
  setInterval(() => {
    app.setCarToRoads(cars);
  }, 17 * 1000);
});

defineExpose({
  setVideo,
  lock,
  setCameraType,
  setCurrentBox,
});
</script>

<style lang="scss">
#css-container_overlay {
  z-index: 9999 !important;
  // width: 100vw;
  // height: auto!important;
}
#css-container_in_scene{
  width: 100vw;
  // height: auto!important;
}
.webgl {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  outline: none;
  touch-action: none;
}
</style>
