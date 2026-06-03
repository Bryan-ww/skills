<template>
  <div class="map-example">
    <div class="controls">
      <div class="control-group">
        <h3>基础操作</h3>
        <button @click="addRandomPoint">添加随机点</button>
        <button @click="clearAllPoints">清除所有点</button>
        <button @click="addLine">添加线段</button>
        <button @click="addCircle">添加圆形区域</button>
      </div>

      <div class="control-group">
        <h3>图层操作</h3>
        <button @click="addCustomLayer">添加自定义图层</button>
        <button @click="toggleLayer">切换图层显示</button>
        <button @click="removeCustomLayer">移除自定义图层</button>
      </div>

      <div class="control-group">
        <h3>地图操作</h3>
        <button @click="zoomIn">放大</button>
        <button @click="zoomOut">缩小</button>
        <button @click="resetView">重置视图</button>
      </div>

      <div class="control-group">
        <h3>样式示例</h3>
        <button @click="addStyledPoints">添加样式化点</button>
        <button @click="addIconPoints">添加图标点</button>
        <button @click="addLabelPoints">添加标签点</button>
      </div>
    </div>

    <div class="map-container">
      <OpenLayer
        ref="mapRef"
        :center="center"
        :zoom="zoom"
        :point="pointConfig"
        @point-click="handlePointClick"
        @point-mouseover="handlePointMouseover"
        @point-mouseout="handlePointMouseout"
        @map-click="handleMapClick"
        @map-ready="handleMapReady"
      />
    </div>

    <div class="info-panel">
      <h3>操作日志</h3>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import OpenLayer from './index.vue';

const mapRef = ref();
const center = ref([87.58, 43.83]);
const zoom = ref(12);
const logs = ref([]);

const pointConfig = reactive({
  data: [
    { lon: 87.58, lat: 43.83, name: '示例点1', type: 'default' },
    { lon: 87.60, lat: 43.85, name: '示例点2', type: 'default' },
  ],
  fieldConfig: {
    lon: 'lon',
    lat: 'lat',
  },
  style: {
    image: {
      radius: 10,
      fill: { color: 'rgba(255,0,0,0.5)' },
      stroke: { color: '#ff0000', width: 2 },
    },
  },
});

// 添加日志
function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  logs.value.unshift(`[${timestamp}] ${message}`);
  if (logs.value.length > 50) {
    logs.value.pop();
  }
}

// 地图事件处理
function handleMapReady(map) {
  addLog('地图加载完成');
  console.log('地图实例:', map);
}

function handleMapClick(event) {
  addLog(`点击了地图空白处: [${event.coordinate[0].toFixed(4)}, ${event.coordinate[1].toFixed(4)}]`);
}

function handlePointClick({ data, coordinates }) {
  addLog(`点击了点: ${data.name || '未命名'} (${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)})`);
  alert(`点击了: ${data.name || '未命名点'}`);
}

function handlePointMouseover({ data }) {
  addLog(`鼠标移入点: ${data.name || '未命名'}`);
}

function handlePointMouseout({ data }) {
  addLog(`鼠标移出点: ${data.name || '未命名'}`);
}

// 基础操作
function addRandomPoint() {
  const randomLon = 87.58 + (Math.random() - 0.5) * 0.1;
  const randomLat = 43.83 + (Math.random() - 0.5) * 0.1;
  
  const newPoint = {
    lon: randomLon,
    lat: randomLat,
    name: `随机点 ${Date.now()}`,
    type: 'random',
  };

  pointConfig.data.push(newPoint);
  addLog(`添加了随机点: ${newPoint.name}`);
}

function clearAllPoints() {
  pointConfig.data = [];
  addLog('清除了所有点');
}

function addLine() {
  if (!mapRef.value) return;

  // 确保有自定义图层
  let layer = mapRef.value.getLayer('customLayer');
  if (!layer) {
    mapRef.value.addLayer({
      name: 'customLayer',
      layerType: 'Vector',
      zIndex: 5,
    });
    addLog('创建了自定义图层');
  }

  // 创建线段
  const line = mapRef.value.createLineFeature(
    [
      [87.58, 43.83],
      [87.60, 43.85],
      [87.62, 43.87],
      [87.64, 43.89],
    ],
    {
      style: {
        stroke: {
          color: '#00ff00',
          width: 3,
          lineCap: 'round',
          lineJoin: 'round',
        },
      },
      name: `线段 ${Date.now()}`,
    }
  );

  mapRef.value.addFeature('customLayer', line);
  addLog('添加了线段');
}

function addCircle() {
  if (!mapRef.value) return;

  // 确保有自定义图层
  let layer = mapRef.value.getLayer('customLayer');
  if (!layer) {
    mapRef.value.addLayer({
      name: 'customLayer',
      layerType: 'Vector',
      zIndex: 5,
    });
    addLog('创建了自定义图层');
  }

  // 创建圆形区域（半径 2000 米）
  const circle = mapRef.value.createCircleFeature(
    [[87.58, 43.83], 2000],
    {
      style: {
        fill: { color: 'rgba(0,0,255,0.2)' },
        stroke: { color: '#0000ff', width: 2 },
      },
      name: `圆形区域 ${Date.now()}`,
    }
  );

  mapRef.value.addFeature('customLayer', circle);
  addLog('添加了圆形区域（半径 2000 米）');
}

// 图层操作
function addCustomLayer() {
  if (!mapRef.value) return;

  const layer = mapRef.value.addLayer({
    name: 'customLayer',
    layerType: 'Vector',
    zIndex: 5,
    visible: true,
    style: {
      fill: { color: 'rgba(255,255,0,0.3)' },
      stroke: { color: '#ffff00', width: 2 },
    },
  });

  if (layer) {
    addLog('添加了自定义图层');
  } else {
    addLog('图层已存在');
  }
}

function toggleLayer() {
  if (!mapRef.value) return;

  const layer = mapRef.value.getLayer('customLayer');
  if (layer) {
    const visible = layer.getVisible();
    layer.setVisible(!visible);
    addLog(`${visible ? '隐藏' : '显示'}了自定义图层`);
  } else {
    addLog('自定义图层不存在');
  }
}

function removeCustomLayer() {
  if (!mapRef.value) return;

  mapRef.value.removeLayerByName('customLayer');
  addLog('移除了自定义图层');
}

// 地图操作
function zoomIn() {
  if (!mapRef.value) return;

  const view = mapRef.value.getView();
  if (view) {
    const currentZoom = view.getZoom();
    view.setZoom(currentZoom + 1);
    addLog(`放大到级别: ${currentZoom + 1}`);
  }
}

function zoomOut() {
  if (!mapRef.value) return;

  const view = mapRef.value.getView();
  if (view) {
    const currentZoom = view.getZoom();
    view.setZoom(currentZoom - 1);
    addLog(`缩小到级别: ${currentZoom - 1}`);
  }
}

function resetView() {
  if (!mapRef.value) return;

  mapRef.value.setCenter([87.58, 43.83]);
  mapRef.value.setZoom(12);
  addLog('重置了地图视图');
}

// 样式示例
function addStyledPoints() {
  if (!mapRef.value) return;

  // 确保有样式图层
  let layer = mapRef.value.getLayer('styledLayer');
  if (!layer) {
    mapRef.value.addLayer({
      name: 'styledLayer',
      layerType: 'Vector',
      zIndex: 6,
    });
  }

  // 添加不同样式的点
  const colors = ['red', 'green', 'blue', 'yellow', 'purple'];
  const baseLon = 87.58;
  const baseLat = 43.83;

  colors.forEach((color, index) => {
    const lon = baseLon + (index - 2) * 0.01;
    const lat = baseLat + (index - 2) * 0.01;

    const point = mapRef.value.createPoint([lon, lat], {
      style: {
        image: {
          radius: 8 + index * 2,
          fill: { color: color === 'yellow' ? 'rgba(255,255,0,0.7)' : `rgba(0,0,0,0.7)` },
          stroke: { color: color, width: 2 },
        },
      },
      name: `${color}点`,
      color: color,
    });

    mapRef.value.addFeature('styledLayer', point);
  });

  addLog('添加了样式化点（不同颜色和大小）');
}

function addIconPoints() {
  if (!mapRef.value) return;

  // 确保有图标图层
  let layer = mapRef.value.getLayer('iconLayer');
  if (!layer) {
    mapRef.value.addLayer({
      name: 'iconLayer',
      layerType: 'Vector',
      zIndex: 7,
    });
  }

  // 注意：这里使用圆形代替图标，实际使用时替换为真实图标路径
  const positions = [
    [87.55, 43.83],
    [87.60, 43.83],
    [87.65, 43.83],
  ];

  positions.forEach((pos, index) => {
    const point = mapRef.value.createPoint(pos, {
      style: {
        image: {
          type: 'icon',
          // 实际使用时替换为真实图标路径
          // src: '/icons/marker.png',
          // 这里用圆形样式代替
          radius: 12,
          fill: { color: 'rgba(255,165,0,0.8)' },
          stroke: { color: '#ff8800', width: 2 },
        },
      },
      name: `图标点 ${index + 1}`,
    });

    mapRef.value.addFeature('iconLayer', point);
  });

  addLog('添加了图标点（示例使用圆形代替）');
}

function addLabelPoints() {
  if (!mapRef.value) return;

  // 确保有标签图层
  let layer = mapRef.value.getLayer('labelLayer');
  if (!layer) {
    mapRef.value.addLayer({
      name: 'labelLayer',
      layerType: 'Vector',
      zIndex: 8,
    });
  }

  const positions = [
    { lon: 87.58, lat: 43.80, name: '标签点1' },
    { lon: 87.60, lat: 43.82, name: '标签点2' },
    { lon: 87.62, lat: 43.84, name: '标签点3' },
  ];

  positions.forEach((item) => {
    const point = mapRef.value.createPoint([item.lon, item.lat], {
      style: {
        image: {
          radius: 8,
          fill: { color: 'rgba(0,128,255,0.6)' },
          stroke: { color: '#0080ff', width: 2 },
        },
        text: {
          text: item.name,
          fill: { color: '#fff' },
          stroke: { color: '#000', width: 2 },
          font: 'bold 14px Arial',
          offsetY: -15,
        },
      },
      name: item.name,
    });

    mapRef.value.addFeature('labelLayer', point);
  });

  addLog('添加了带标签的点');
}
</script>

<style scoped lang="scss">
.map-example {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.controls {
  display: flex;
  gap: 20px;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
  overflow-x: auto;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;

  h3 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  button {
    padding: 8px 12px;
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.2s;

    &:hover {
      background: #0056b3;
    }

    &:active {
      background: #004085;
    }
  }
}

.map-container {
  flex: 1;
  min-height: 400px;
  position: relative;
}

.info-panel {
  min-height: 200px;
  max-height: 200px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  h3 {
    margin: 0;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    border-bottom: 1px solid #e0e0e0;
  }
}

.log-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  padding: 4px 0;
  color: #666;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}
</style>
