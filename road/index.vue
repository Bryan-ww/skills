<template>
  <div class="road-list" v-loading="loading" element-loading-text="加载中...">
    <div id="Stats-output" class="fpsStats"></div>
    <div class="road-status">
      <div class="legend-box">
        <div class="legend-item" v-for="item of lineTpiArr" :key="item.name">
          <div class="legend-item-tit" :style="{ backgroundColor: item.color }">{{ item.name }}</div>
        </div>
      </div>
    </div>
    <div class="right-legend" :class="{ 'is-hide': rightHide }">
      <div class="legend-tit" @click="toggleRight">
        <span class="name">{{ rightHide ? `展开` : `收起` }}</span>
      </div>
      <div class="traffic-legend">
        <el-popover placement="left" width="auto" effect="dark" popper-class="monitor-screen-popover" trigger="click">
          <template #reference>
            <div class="road-facility"><span>基础设施</span></div>
          </template>
          <div class="popover-form">
            <div class="form-label">
              <el-checkbox v-model="locCheckAll" :indeterminate="locIndeterminate" @change="locCheckAllChange">全选</el-checkbox>
            </div>
            <div class="form-content">
              <el-checkbox-group v-model="selections.locSelected">
                <el-checkbox v-for="item in locType" :key="item.description" :label="item.description" :value="item.value" />
              </el-checkbox-group>
            </div>
          </div>
        </el-popover>
        <el-popover placement="left" width="auto" effect="dark" popper-class="monitor-screen-popover" trigger="click">
          <template #reference>
            <div class="road-device"><span>道路设备</span></div>
          </template>
          <div class="popover-form">
            <div class="form-label">
              <el-checkbox v-model="deviceCheckAll" :indeterminate="deviceIndeterminate" @change="deviceCheckAllChange">全选</el-checkbox>
            </div>
            <div class="form-content">
              <el-checkbox-group v-model="selections.deviceSelected">
                <el-checkbox v-for="item in deviceType" :key="item.description" :label="item.description" :value="item.value" />
              </el-checkbox-group>
            </div>
          </div>
        </el-popover>
        <el-popover placement="left" width="auto" effect="dark" popper-class="monitor-screen-popover" trigger="click">
          <template #reference>
            <div class="road-event"><span>路网事件</span></div>
          </template>
          <div class="popover-form">
            <div class="form-label">
              <el-checkbox v-model="eventCheckAll" :indeterminate="eventIndeterminate" @change="eventCheckAllChange">全选</el-checkbox>
            </div>
            <div class="form-content">
              <el-checkbox-group v-model="selections.eventSelected">
                <el-checkbox v-for="item in event_type" :key="item.description" :label="item.description" :value="item.value" />
              </el-checkbox-group>
            </div>
          </div>
        </el-popover>
        <el-checkbox class="road-state" v-model="roadStatus" @change="roadStatusChange"> 路况信息</el-checkbox>
        <el-checkbox class="is-3D" v-model="is3D" @change="change3D">3D模式</el-checkbox>
        <template v-if="is3D">
          <div class="model-reset" @click="resetModel"><span>模型复位</span></div>
        </template>
      </div>
    </div>
    <div ref="threeRef" class="container-3d" @click="handleClick" @mousemove="handleMouseMove">
      <div class="plane" :style="planeStyle">
        <div class="content-main">
          <p v-if="currentData.name">{{ currentData.name }}</p>
          <p v-if="currentData.eventSubject">{{ currentData.eventSubject }}</p>
        </div>
        <div class="arrow"></div>
      </div>
    </div>
    <TrafficEventDialogView skin="2" ref="trafficEventDialogRef" />
    <!-- 服务区 -->
    <serviceAreaDialogView skin="2" ref="serviceAreaDialogRef" />
    <!-- 收费站 -->
    <tollStationDialogView skin="2" ref="tollStationDialogRef" />
    <!-- 情报板 -->
    <newsBoardDialogView skin="2" ref="newsBoardDialogRef" />
    <!-- 摄像头 -->
    <cameraDialog v-model:sectionId="props.sectionId" skin="2" ref="cameraLayerRef" />
    <!-- 气象监测 -->
    <meteoInsDialog skin="2" ref="meteoInsLayerRef" />
    <!-- 车检器 -->
    <carDialog skin="2" ref="carLayerRef" />
  </div>
</template>

<script setup>
  let scene = null; // 场景
  let camera = null; // 摄像机
  let renderer = null; // 渲染器
  let controls = null; // 控制器
  let stats = null; // 帧率监测

  import gsap from 'gsap';
  import * as THREE from 'three';
  import { useDict } from '/@/hooks/dict';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import Stats from 'three/examples/jsm/libs/stats.module.js';
  import { initRoadFloor, getGroupDimensions, getRoadInfo, findObjectByName, loaderModel, addCss2dLabel } from './road.js';
  // 事件
  import TrafficEventDialogView from '/@/views/dialogs/trafficEventDialog/list.vue';
  const trafficEventDialogRef = ref();
  // 服务区
  import serviceAreaDialogView from '/@/views/dialogs/serviceAreaDialog/index.vue';
  const serviceAreaDialogRef = ref();
  // 收费站
  import tollStationDialogView from '/@/views/dialogs/tollStationDialog/index.vue';
  const tollStationDialogRef = ref();
  // 情报板
  import newsBoardDialogView from '/@/views/dialogs/newsBoardDialog/index.vue';
  const newsBoardDialogRef = ref();
  // 摄像头
  import cameraDialog from '/@/views/dialogs/cameraDialog/tree.vue';
  const cameraLayerRef = ref();
  // 气象监测
  import meteoInsDialog from '@/views/dialogs/meteoInsDialog/index.vue';
  const meteoInsLayerRef = ref();
  // 车检器
  import carDialog from '/@/views/dialogs/carDialog/index.vue';
  const carLayerRef = ref();
  const props = defineProps({
    loading: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Array,
      default: () => [],
    },
    type: {
      type: [String, Number],
      default: '',
    },
    status: {
      type: Array,
      default: () => [],
    },
    eventPile: {
      type: [String, Number],
      default: 0,
    },
    eventDirection: {
      type: [String, Number],
      default: '',
    },
    sectionId: {
      type: String,
      default: '',
    },
    middlePile: {
      type: [String, Number],
      default: 0,
    },
  });
  const lineTpiArr = [
    { min: 0, max: 2, name: '畅通', color: '#00b336' },
    { min: 2, max: 4, name: '基本畅通', color: '#b2d119' },
    { min: 4, max: 6, name: '轻度拥堵', color: '#ffb700' },
    { min: 6, max: 8, name: '中度拥堵', color: '#ff8800' },
    { min: 8, max: 10, name: '严重拥堵', color: '#f23030' },
  ];
  const is3D = ref(false);
  let roadList = []; // 路段
  const locIndeterminate = ref(false);
  const deviceIndeterminate = ref(false);
  const eventIndeterminate = ref(false);
  const { loc_type, device_type, event_type } = useDict('loc_type', 'device_type', 'event_type');
  const locType = computed(() => loc_type.value.filter((i) => i.style == 'danger'));
  const deviceType = computed(() => device_type.value.filter((i) => i.style == 'danger'));
  const selections = reactive({
    locSelected: [], // 设施选中
    deviceSelected: [], // 设备选中
    eventSelected: [], // 事件选中
  });

  const locCheckAll = ref(true);
  const deviceCheckAll = ref(true);
  const eventCheckAll = ref(true);

  const locCheckAllChange = (val) => {
    if (val) {
      selections.locSelected = locType.value.map((i) => i.value);
      locIndeterminate.value = false;
    } else {
      locIndeterminate.value = true;
      selections.locSelected = [];
    }
  };
  const deviceCheckAllChange = (val) => {
    if (val) {
      selections.deviceSelected = deviceType.value.map((i) => i.value);
      deviceIndeterminate.value = false;
    } else {
      deviceIndeterminate.value = true;
      selections.deviceSelected = [];
    }
  };
  const eventCheckAllChange = (val) => {
    if (val) {
      selections.eventSelected = event_type.value.map((i) => i.value);
      eventIndeterminate.value = false;
    } else {
      eventIndeterminate.value = false;
      selections.eventSelected = [];
    }
  };
  watch(
    () => locType.value,
    (val) => {
      selections.locSelected = val.length > 0 ? val.map((i) => i.value) : [];
    },
    { immediate: true },
    { deep: true }
  );
  watch(
    () => deviceType.value,
    (val) => {
      selections.deviceSelected = val.length > 0 ? val.map((i) => i.value) : [];
    },
    { immediate: true },
    { deep: true }
  );
  watch(
    () => event_type.value,
    (val) => {
      selections.eventSelected = val.length > 0 ? val.map((i) => i.value) : [];
    },
    { immediate: true },
    { deep: true }
  );
  const rightHide = ref(false);
  const toggleRight = () => {
    rightHide.value = !rightHide.value;
  };
  const eventType = [
    'TRAFFIC_EVENTS',
    'NATURAL_DISASTERS',
    'TRAFFIC_RESCUE',
    'SECURITY_RISKS',
    'SITE_EVENTS',
    'TRAFFIC_CONTROL',
    'CONSTRUCTION_TYPE',
    'TRAFFIC_CONGESTION',
    'OTHER_EVENTS',
    'HIGHWAY_DISEASES',
  ];
  const roadStatus = ref(true);
  // 当前选中的数据
  let currentData = ref({});
  let plane = reactive({
    left: 0,
    top: 0,
    display: 'none',
  });
  const planeStyle = computed(() => {
    return {
      left: `${plane.left}px`,
      top: `${plane.top}px`,
      display: plane.display,
    };
  });
  const threeRef = ref();
  let resizeObserver = null;
  const updateBillboards = () => {
    scene.traverse((object) => {
      if (object.userData.isBillboard && object.type === 'Mesh') {
        // 只绕 Y 轴旋转，让物体正面始终朝向相机
        object.quaternion.copy(camera.quaternion);
      }
    });
  };

  const render = () => {
    if (!renderer || !scene || !camera) {
      return;
    }
    requestAnimationFrame(render);
    if (Date.now() % 13 === 0) {
      updateBillboards();
      stats.update();
      controls.update();
      renderer.render(scene, camera);
      // console.log('camera.position', camera.position); // 可以根据此处的值来设置camera初始position
      // console.log('controls', controls); //浏览器控制台查看controls.target变化，辅助设置lookAt参数
    }
  };
  const initHelper = (num = 0) => {
    // 初始化helper(轴坐标)
    scene.add(new THREE.AxesHelper(num));
  };
  const initLight = () => {
    let ambientLight = new THREE.AmbientLight('#fff'); // 创建环境光
    scene.add(ambientLight); // 将环境光添加到场景
    let directionalLight = new THREE.DirectionalLight('#fff', 1.8);
    directionalLight.position.set(0, 1200, 0);
    scene.add(directionalLight);
    let beforeLight = new THREE.DirectionalLight('#fff', 1.8);
    beforeLight.position.set(0, 0, 1200);
    scene.add(beforeLight);
    let afterLight = new THREE.DirectionalLight('#fff', 1.8);
    afterLight.position.set(0, 0, -1200);
    scene.add(afterLight);
    let leftLight = new THREE.DirectionalLight('#fff', 1.8);
    leftLight.position.set(-1200, 0, 0);
    scene.add(leftLight);
    let rightLight = new THREE.DirectionalLight('#fff', 1.8);
    rightLight.position.set(1200, 0, 0);
    scene.add(rightLight);
  };
  const initStats = () => {
    stats = new Stats();
    //设置统计模式
    stats.setMode(0); // 0: fps, 1: ms
    //统计信息显示在左上角
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.getElementById('Stats-output').appendChild(stats.domElement);
  };
  const initControl = () => {
    controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(-310, -9.5, 21);

    controls.maxPolarAngle = Math.PI / 2.1; // 最大水平旋转角度
    // controls.screenSpacePanning = false; // 定义平移时如何平移相机的位置 控制不上下移动
    // controls.enableDamping = false;
    // controls.minDistance = 800;
    controls.maxDistance = 2999;
    // controls.enableZoom = false; // 是否开启缩放
    // controls.enableRotate = false; // 是否开启旋转
    // controls.enablePan = false; // 是否开启右键拖拽
    controls.update();
  };
  const initThree = () => {
    const { clientWidth, clientHeight } = threeRef.value;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 1, 18888);
    // 将相机放在高处，从正上方俯视
    camera.position.set(0, 1200, 0);
    // 设置相机朝向平行于地面
    // camera.lookAt(new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z));
    camera.lookAt(0, 0, 0);
    // 强制设置up向量（重要！）
    camera.up.set(0, 1, 0);

    // 如果仍有倾斜问题，更新投影矩阵
    camera.updateProjectionMatrix();
    renderer = new THREE.WebGLRenderer({
      antialias: true, // true/false表示是否开启反锯齿
      alpha: true, // true/false 表示是否可以设置背景色透明
      premultipliedAlpha: false, // 禁用预乘alpha
    });
    renderer.setSize(clientWidth, clientHeight); // 设置渲染区域宽高
    // renderer.shadowMap.enabled = true; // 允许渲染器产生阴影贴图
    renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setClearColor('#e0e0e2', 0.3); // 设置背景颜色
    threeRef.value.appendChild(renderer.domElement);
    initControl();
    initStats();
    initLight();
    // initHelper();
    render();
  };

  const createRoad = (data, type, startX) => {
    let roadGroup = new THREE.Group(); // 创建一个组来存放每一段路
    roadGroup.name = type == 0 ? '上行' : '下行';
    const roadData = data.filter((item) => item.direction === type);
    for (let i = 0; i < roadData.length; i++) {
      const road = initRoadFloor(roadData[i], type, i);
      roadGroup.add(road);
    }
    const roadGroupData = getGroupDimensions(roadGroup);
    console.log('roadGroupData', roadGroupData);
    roadGroup.position.x = -roadGroupData.width / 2;
    roadGroup.position.z = startX;
    return roadGroup;
  };
  const initRoad = (roadArr) => {
    if (scene) {
      scene.traverse((child) => {
        if (child.name === 'road') {
          scene.remove(child);
        }
      });
    }
    const roadInfo = getRoadInfo();
    roadList = [];
    const roadAll = new THREE.Group();
    roadAll.name = 'road';
    const road1X = -(roadInfo.RoadInterval / 2 + roadInfo.RoadWidth / 2);
    const road2X = roadInfo.RoadInterval / 2 + roadInfo.RoadWidth / 2;
    const upRoad = createRoad(roadArr, 0, road1X);
    const downRoad = createRoad(roadArr, 1, road2X);
    // 添加车辆路线
    roadAll.add(upRoad, downRoad);
    roadList.push(roadAll);
    scene.add(roadAll);
    change3D(is3D.value);
    moveToPile(props.middlePile);
  };
  // 监听高度变化
  const observeHeight = () => {
    if (!threeRef.value) return;
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        // 执行你的逻辑，比如重新渲染Three.js场景
        handleHeightChange(height);
      }
    });

    resizeObserver.observe(threeRef.value);
  };
  // 处理高度变化的函数
  const handleHeightChange = (height) => {
    // 在这里可以更新Three.js的相机、渲染器尺寸等
    handleResize();
  };
  const destroyThreeJs = () => {
    try {
      camera.updateProjectionMatrix = function () {}; // 防止错误提示
      scene.remove(camera); // 从场景中移除相机
      camera.matrixAutoUpdate = false; // 禁用矩阵自动更新
      scene.traverse((child) => {
        if (child.isMesh) {
          scene.remove(child);
        } else if (child.isLight) {
          child.intensity = 0;
        }
      });
      if (threeRef.value) {
        threeRef.value.removeChild(renderer.domElement);
      }
      scene = null;
      camera = null;
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement = null;
      renderer = null;
      controls.dispose();
      controls = null;
      stats.domElement.remove();
      stats = null;
    } catch (e) {
      console.error('Failed to destroy threejs', e);
    }
  };
  const handleResize = () => {
    const { clientWidth, clientHeight } = threeRef.value;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
  };

  const handleOpen = (item) => {
    const type = item.type || item.eventTypeId;
    if (eventType.includes(type)) {
      trafficEventDialogRef.value?.open(props.sectionId, item);
    } else if (type == 'SERVICE_ZONE') {
      serviceAreaDialogRef.value?.open(item);
    } else if (type == 'TOLL_STATION') {
      tollStationDialogRef.value?.open(item);
    } else if (type == 'INFO_BOARD') {
      newsBoardDialogRef.value?.open(item);
    } else if (type === 'METEOROLOGICAL_MONITORING_EQUIPMENT') {
      // 气象监测站
      meteoInsLayerRef.value?.open(data);
    } else if (type === 'CAR_DETECTOR') {
      // 车检器
      carLayerRef.value?.open(data);
    } else if (type === 'CAMERA') {
      // 摄像机
      const startMilePost = props.data[0].startMilePost;
      const endMilePost = props.data[props.data.length - 1].endMilePost;
      const data = { ...item, startMilePost, endMilePost };
      cameraLayerRef.value?.open(data);
    }
  };
  const handleClick = ({ clientX, clientY }) => {
    const mouse = new THREE.Vector2();
    const rayCaster = new THREE.Raycaster();
    const { width, height } = renderer.domElement;
    let getBoundingClientRect = renderer.domElement.getBoundingClientRect();
    const { left, top } = getBoundingClientRect;
    mouse.x = ((clientX - left) / width) * window.devicePixelRatio * 2 - 1;
    mouse.y = (-(clientY - top) / height) * window.devicePixelRatio * 2 + 1;
    console.log('mouse', mouse);
    rayCaster.setFromCamera(mouse, camera);
    const intersectObj = rayCaster.intersectObjects(roadList)[0]?.object || null;
    if (intersectObj && ['INFO_BOARD', 'CAMERA', 'TOLL_STATION', 'SERVICE_ZONE', ...eventType].includes(intersectObj.name)) {
      const { data } = intersectObj.userData;
      handleOpen(data);
    }
  };
  const handleMouseMove = ({ clientX, clientY }) => {
    if (renderer) {
      const mouse = new THREE.Vector2();
      const rayCaster = new THREE.Raycaster();
      const { width, height } = renderer.domElement;
      let getBoundingClientRect = renderer.domElement.getBoundingClientRect();
      const { left, top } = getBoundingClientRect;
      mouse.x = ((clientX - left) / width) * window.devicePixelRatio * 2 - 1;
      mouse.y = (-(clientY - top) / height) * window.devicePixelRatio * 2 + 1;
      rayCaster.setFromCamera(mouse, camera);
      const intersectObj = rayCaster.intersectObjects(roadList)[0]?.object || null;
      if (intersectObj && ['INFO_BOARD', 'CAMERA', 'TOLL_STATION', 'SERVICE_ZONE', ...eventType].includes(intersectObj.name)) {
        const { data } = intersectObj.userData;
        currentData.value = data;
        Object.assign(plane, {
          left: clientX,
          top: clientY,
          display: 'block',
        });
      } else {
        Object.assign(plane, {
          left: clientX,
          top: clientY,
          display: 'none',
        });
        currentData.value = {};
      }
    } else {
      Object.assign(plane, {
        left: 0,
        top: 0,
        display: 'none',
      });
      currentData.value = {};
    }
  };
  const roadStatusChange = (val) => {
    scene.traverse((object) => {
      if (object.name == 'state' && object.type === 'Mesh') {
        object.visible = val;
      }
    });
  };
  // 是否开启3D模式
  const change3D = (val) => {
    controls.enableRotate = val; // 是否开启旋转
    scene.traverse((object) => {
      if (object.name == 'horizontal') {
        object.visible = val;
      } else if (object.name == 'vertical') {
        object.visible = !val;
      }
      if (['pile', 'INFO_BOARD', 'CAMERA', 'facility-bg', ...eventType].includes(object.name)) {
        object.userData.isBillboard = val;
        object.rotation.set(0, 0, 0);
        if (!val) {
          // 2D模式：所有对象放平
          object.rotation.x = -Math.PI / 2;
        }
      }
      if (object.type === 'Mesh' && object.name == 'infoBoard') {
        if (val) {
          // 3D模式：infoBoard保持垂直于地面
          object.rotation.y = Math.PI / 2;
          object.rotation.x = 0; // 确保x轴不旋转
        }
      }
    });
    // 切换到2D模式，重置相机位置
    if (!val) {
      if (scene && camera) {
        const targetObject = findObjectByName(scene, props.middlePile, 'Group');
        const worldPosition = new THREE.Vector3();
        if (targetObject) {
          // 获取模型的世界位置
          targetObject.getWorldPosition(worldPosition);
          const targetPosition = worldPosition.clone();
          targetPosition.z -= 130; // 调整这个值来控制下移距离
          camera.position.set(worldPosition.x, 1200, worldPosition.z);
          camera.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
          camera.up.set(0, 1, 0);
          camera.updateProjectionMatrix();
          // // 更新控制器
          if (controls) {
            controls.target.copy(targetPosition);
            controls.update();
          }
        }
      }
    } else {
      const targetObject = findObjectByName(scene, props.middlePile, 'Group');
      const worldPosition = new THREE.Vector3();
      if (targetObject) {
        targetObject.getWorldPosition(worldPosition);
        camera.position.set(worldPosition.x, 600, 1200);
        camera.lookAt(worldPosition.x, worldPosition.y, worldPosition.z);
        camera.up.set(0, 1, 0);
        camera.updateProjectionMatrix();
      }
      if (controls) {
        controls.target.copy(worldPosition);
        controls.update();
      }
    }
  };
  // 模型复位
  const resetModel = () => {
    if (scene) {
      const targetObject = findObjectByName(scene, props.middlePile, 'Group');
      const worldPosition = new THREE.Vector3();
      if (targetObject) {
        targetObject.getWorldPosition(worldPosition);
        camera.position.set(worldPosition.x, 600, 1200);
        camera.lookAt(worldPosition.x, worldPosition.y, worldPosition.z);
        camera.up.set(0, 1, 0);
        camera.updateProjectionMatrix();
      }
      if (controls) {
        controls.target.copy(worldPosition);
        controls.update();
      }
    }
  };
  // 加载车辆模型
  const initCar = (data, direction = 0) => {
    if (scene) {
      loaderModel('/model/car.gltf', (model) => {
        console.log('car', model);
        model.traverse((mesh) => {
          if (mesh.type === 'Mesh') {
            mesh.frustumCulled = false;
            mesh.material.side = THREE.DoubleSide;
            mesh.castShadow = true;
          }
          mesh.receiveShadow = true;
        });
        model.name = '快递车';
        model.position.set(55444, 10, -56);
        model.scale.set(15, 15, 15);
        model.rotation.y = direction == 0 ? -Math.PI / 2 : Math.PI / 2;
        scene.add(model);
      });
    }
  };
  watch(
    () => props.data,
    (val) => {
      if (val.length > 0) {
        initRoad(val);
        // initCar();
      } else {
        if (scene) {
          scene.traverse((child) => {
            if (child.name === 'road') {
              scene.remove(child);
            }
          });
        }
      }
    },
    { immediate: true },
    { deep: true }
  );
  const moveToPile = (pile) => {
    if (scene && camera) {
      const targetObject = findObjectByName(scene, pile, 'Group');
      const worldPosition = new THREE.Vector3();
      if (targetObject) {
        targetObject.getWorldPosition(worldPosition);
        const targetPosition = worldPosition.clone();
        console.log('targetPosition', targetPosition);
        targetPosition.z -= 130; // 调整这个值来控制下移距离
        camera.position.set(worldPosition.x, 1200, worldPosition.z);
        camera.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
        camera.up.set(0, 1, 0);
        camera.updateProjectionMatrix();
        if (controls) {
          controls.target.copy(targetPosition); // 让controls也看向新目标点
          controls.update();
        }
      }
    }
  };
  watch(
    () => props.middlePile,
    (val) => {
      if (val) {
        moveToPile(val);
      }
    },
    { immediate: true },
    { deep: true }
  );
  // 监听整个对象
  watch(
    selections,
    (val) => {
      if (scene) {
        const allSelected = Object.values(val).flat();
        const allObject = [...locType.value, ...deviceType.value, ...event_type.value].map((i) => i.value);
        scene.traverse((object) => {
          if (allObject.includes(object.name)) {
            object.visible = allSelected.includes(object.name);
          }
        });
      }
    },
    { immediate: true },
    { deep: true }
  );

  onMounted(() => {
    initThree();
    observeHeight();
    window.addEventListener('resize', handleResize);
  });
  onUnmounted(() => {
    destroyThreeJs();
    window.removeEventListener('resize', handleResize);
    // 清理监听器
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
</script>
<style lang="scss" scoped>
  .road-list {
    width: 100%;
    height: 100%;
    position: relative;
    .container-3d {
      position: relative;
      width: 100%;
      height: 100%;
      .plane {
        position: absolute;
        top: 50%;
        left: 50%;
        width: auto;
        height: auto;
        min-height: 0.34rem;
        z-index: 28;
        transform: translate(-50%, calc(-100% - 0.8rem));

        border: 0.01rem solid rgba(29, 168, 255, 0.6);
        border-radius: 0.02rem;
        .arrow {
          position: absolute;
          top: calc(100% - 0.01rem);
          left: calc(50% - 0.1rem);
          height: 0.08rem;
          width: 0.14rem;
          overflow: hidden;
          &::after {
            content: '';
            position: absolute;
            bottom: 0.02rem;
            left: 0.02rem;
            height: 0.1rem;
            width: 0.1rem;
            background: linear-gradient(180deg, #002a63 0%, rgba(0, 49, 96, 0.9) 100%);
            border: 0.01rem solid rgba(29, 168, 255, 0.6);
            transform: rotate(45deg);
            z-index: -1;
          }
        }
        .content-main {
          width: 100%;
          height: 100%;
          display: flex;
          padding: 0.06rem 0.08rem;
          font-size: 0.14rem;
          color: #fff;
          background: linear-gradient(180deg, #002a63 0%, rgba(0, 49, 96, 0.9) 100%);
          box-shadow: 0rem 0.04rem 0.08rem 0rem rgba(0, 0, 0, 0.3), 0rem 0rem 0.09rem 0rem rgba(64, 204, 255, 0.3);
        }
      }
    }
    .fpsStats {
      position: absolute;
      display: none;
      top: 0;
      left: 0;
    }
    .road-status {
      display: inline-flex;
      gap: 15px;
      position: absolute;
      top: 0.36rem;
      left: 50%;
      z-index: 5;
      transform: translateX(-50%);
      .legend-box {
        display: flex;
        gap: 0.1rem;
        font-size: 0.1rem;
        align-items: center;
        align-content: center;
        .legend-item {
          width: 0.68rem;
          border-radius: 0.02rem;
          text-align: center;
          color: #fff;
        }
      }
    }
    .road-model {
      position: absolute;
      top: 0;
      left: 0;
    }
    .right-legend {
      position: absolute;
      right: 0.01rem;
      top: 1.2rem;
      z-index: 20;
      width: 0.92rem;
      display: inline-flex;
      align-items: center;
      transition: all 0.6s ease;
      .legend-tit {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 0.24rem;
        height: 0.68rem;
        background: linear-gradient(180deg, rgba(0, 32, 76, 0.8) 0%, rgba(0, 36, 69, 0.9) 100%);
        border: 0.01rem solid;
        border-image: linear-gradient(180deg, rgba(147, 213, 255, 0.7), rgba(166, 221, 255, 0.25)) 1 1;
        border-right: 0;
        transition: all 0.6s ease;
        cursor: pointer;
        .name {
          position: relative;
          display: inline-block;
          padding-top: 0.18rem;
          font-weight: 400;
          font-size: 0.12rem;
          color: #c0e1ff;
          line-height: 0.18rem;
          text-align: center;
          background: url('/assets/images/ledger/monitor/screen/legend-icon-arrow.png') top center no-repeat;
          background-size: 0.14rem 0.18rem;
        }
      }
      .traffic-legend {
        display: inline-flex;
        flex-direction: column;
        width: 0.68rem;
        gap: 0.08rem;
        padding: 0.13rem 0.08rem;
        background: linear-gradient(180deg, rgba(0, 32, 76, 0.8) 0%, rgba(0, 36, 69, 0.9) 100%);
        border: 1px solid;
        border-image: linear-gradient(180deg, rgba(29, 168, 255, 0.4), rgba(202, 234, 255, 1), rgba(29, 168, 255, 0.4)) 1 1;
        transition: all 0.6s ease;

        .road-facility {
          display: inline-flex;
          width: 100%;
          padding-top: 0.36rem;
          background: url('/assets/images/ledger/monitor/screen/facility.png') top center no-repeat;
          background-size: 0.32rem;
          cursor: pointer;
          text-align: center;
          > span {
            display: inline-flex;
            width: 100%;
            font-weight: 400;
            font-size: 0.12rem;
            color: #ffffff;
            line-height: 0.18rem;
            align-items: center;
          }
        }
        .road-device {
          display: inline-flex;
          width: 100%;
          padding-top: 0.36rem;
          background: url('/assets/images/ledger/monitor/screen/device.png') top center no-repeat;
          background-size: 0.32rem;
          cursor: pointer;
          text-align: center;
          > span {
            display: inline-flex;
            width: 100%;
            font-weight: 400;
            font-size: 0.12rem;
            color: #ffffff;
            line-height: 0.18rem;
            align-items: center;
          }
        }
        .road-event {
          display: inline-flex;
          width: 100%;
          padding-top: 0.36rem;
          background: url('/assets/images/ledger/monitor/screen/event.png') top center no-repeat;
          background-size: 0.32rem;
          cursor: pointer;
          text-align: center;
          > span {
            display: inline-flex;
            width: 100%;
            font-weight: 400;
            font-size: 0.12rem;
            color: #ffffff;
            line-height: 0.18rem;
            align-items: center;
          }
        }
        .model-reset {
          display: inline-flex;
          width: 100%;
          padding-top: 0.36rem;
          background: url('/assets/images/ledger/monitor/screen/icon-reset.png') top center no-repeat;
          background-size: 0.32rem;
          cursor: pointer;
          text-align: center;
          > span {
            display: inline-flex;
            width: 100%;
            font-weight: 400;
            font-size: 0.12rem;
            color: #ffffff;
            line-height: 0.18rem;
            align-items: center;
          }
        }
        :deep(.el-checkbox) {
          display: inline-flex;
          flex-direction: column;
          gap: 0.08rem;
          height: 0.54rem;
          margin-right: 0;
          &.is-3D {
            padding-top: 0.36rem;
            background: url('/assets/images/ledger/monitor/screen/icon-3D.png') top center no-repeat;
            background-size: 0.32rem;
            opacity: 0.6;
            .el-checkbox__input {
              display: none;
            }
            .el-checkbox__label {
              display: inline-flex;
              width: 100%;
              padding: 0;
              font-weight: 400;
              font-size: 0.12rem;
              cursor: pointer;
              color: #ffffff;
              border: 0;
              box-shadow: 0px 0 0 0;
              background: none;
              line-height: 0.18rem;
              align-items: center;
              white-space: normal;
              justify-content: center;
            }
            &.is-checked {
              opacity: 1;
            }
          }
          &.road-state {
            padding-top: 0.36rem;
            background: url('/assets/images/ledger/monitor/screen/icon-road-state.png') top center no-repeat;
            background-size: 0.32rem;
            opacity: 0.6;
            .el-checkbox__input {
              display: none;
            }
            .el-checkbox__label {
              display: inline-flex;
              width: 100%;
              padding: 0;
              font-weight: 400;
              font-size: 0.12rem;
              cursor: pointer;
              color: #ffffff;
              border: 0;
              box-shadow: 0px 0 0 0;
              background: none;
              line-height: 0.18rem;
              align-items: center;
              white-space: normal;
              justify-content: center;
            }
            &.is-checked {
              opacity: 1;
            }
          }
        }
      }
      &.is-hide {
        transform: translate(0.68rem, 0%);
        .legend-tit {
          .name {
            background: url('/assets/images/ledger/monitor/screen/legend-icon-arrow-left.png') top center no-repeat;
            background-size: 0.14rem 0.18rem;
          }
        }
      }
    }
  }
</style>
