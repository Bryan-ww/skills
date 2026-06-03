# OpenLayers 地图组件使用文档

基于 OpenLayers 的通用地图组件，提供了完整的图层管理、要素管理和样式配置能力。

## 目录

- [快速开始](#快速开始)
- [组件 API](#组件-api)
- [样式系统](#样式系统)
- [图层管理](#图层管理)
- [要素管理](#要素管理)
- [完整示例](#完整示例)

## 快速开始

### 基础使用

```vue
<template>
  <OpenLayer
    :center="[87.58, 43.83]"
    :zoom="12"
    :point="{
      data: [
        { lon: 87.58, lat: 43.83, name: '乌鲁木齐' },
        { lon: 87.60, lat: 43.85, name: '另一个点' }
      ]
    }"
    @point-click="handlePointClick"
    @map-ready="handleMapReady"
  />
</template>

<script setup>
import OpenLayer from '@/components/openlayer/index.vue';

function handlePointClick({ data, coordinates, feature }) {
  console.log('点击了点:', data);
}

function handleMapReady(map) {
  console.log('地图加载完成:', map);
}
</script>
```

## 组件 API

### Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `mapConfig` | `Object` | `{}` | Map 配置对象（除 target 与 view 外） |
| `view` | `Object` | `{}` | View 配置对象 |
| `layers` | `Array` | `[]` | 图层配置数组 |
| `useDefaultBaseLayer` | `Boolean` | `true` | 是否使用默认底图 |
| `point` | `Object` | `{ data: [] }` | 点数据配置 |
| `pointsLayer` | `Object` | `{ zIndex: 6 }` | 点图层配置 |
| `center` | `Array` | `[87.58, 43.83]` | 地图中心点 [经度, 纬度] |
| `showControls` | `Boolean` | `true` | 是否显示控件（缩放、旋转等） |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `map-ready` | `map` | 地图加载完成时触发 |
| `map-click` | `event` | 点击地图空白处时触发 |
| `marker-click` | `{ feature, event, data }` | 点击非点数据要素时触发 |
| `point-click` | `{ data, coordinates, event, map, feature }` | 点击点数据时触发 |
| `point-mouseover` | `{ data, coordinates, event, map, feature }` | 鼠标移入点数据时触发 |
| `point-mouseout` | `{ data, feature, event, map }` | 鼠标移出点数据时触发 |

### 暴露的方法

通过 `ref` 可以访问以下方法：

```vue
<template>
  <OpenLayer ref="mapRef" />
</template>

<script setup>
import { ref } from 'vue';
import OpenLayer from '@/components/openlayer/index.vue';

const mapRef = ref();

// 获取地图实例
const map = mapRef.value?.getMap();

// 设置中心点
mapRef.value?.setCenter([87.58, 43.83]);

// 设置缩放级别
mapRef.value?.setZoom(15);

// 添加点数据
mapRef.value?.addPoints(
  [{ lon: 87.58, lat: 43.83, name: '点1' }],
  { style: { image: { radius: 8 } } },
  { name: 'myPoints' }
);

// 清除点图层
mapRef.value?.clearPointsLayer();
</script>
```

## 样式系统

样式系统提供了配置化的样式创建方式，支持静态样式和动态样式。

### 基础样式配置

```javascript
// 点样式（圆形）
const pointStyle = {
  image: {
    radius: 10,
    fill: { color: 'rgba(255,0,0,0.5)' },
    stroke: { color: '#ff0000', width: 2 }
  }
};

// 线样式
const lineStyle = {
  stroke: {
    color: '#00ff00',
    width: 3,
    lineCap: 'round',
    lineJoin: 'round'
  }
};

// 面样式
const polygonStyle = {
  fill: { color: 'rgba(0,0,255,0.3)' },
  stroke: { color: '#0000ff', width: 2 }
};

// 带文字的样式
const labelStyle = {
  image: { radius: 8, fill: { color: 'blue' } },
  text: {
    text: '标签文字',
    fill: { color: '#fff' },
    stroke: { color: '#000', width: 1 },
    font: '14px Arial',
    offsetY: -15
  }
};
```

### 图标样式

```javascript
// 使用图标
const iconStyle = {
  image: {
    type: 'icon',
    src: '/path/to/icon.png',
    size: [32, 32],
    anchor: [0.5, 1], // 锚点在底部中心
    scale: 1
  }
};

// 正多边形样式（正方形、三角形等）
const shapeStyle = {
  image: {
    type: 'regularShape',
    points: 4, // 4 边形（正方形）
    radius: 10,
    fill: { color: 'red' },
    stroke: { color: '#000', width: 1 }
  }
};
```

### 动态样式

样式可以是函数，根据要素属性或分辨率动态返回：

```javascript
const dynamicStyle = (feature, resolution) => {
  const status = feature.get('status');
  const size = feature.get('size');
  
  return {
    image: {
      radius: size || 10,
      fill: { 
        color: status === 'active' ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.5)' 
      }
    },
    text: {
      text: feature.get('name') || '',
      fill: { color: '#fff' }
    }
  };
};
```

## 图层管理

### 图层配置

图层通过 `layers` prop 或暴露的方法进行管理：

```vue
<template>
  <OpenLayer :layers="layerConfig" />
</template>

<script setup>
const layerConfig = [
  {
    type: 'base', // 底图类型
    name: '底图1',
    url: 'http://example.com/map',
    layertype: 'SuperMap', // SuperMap|Tile|Image|Vector
    epsgCode: 4490,
    projection: 'EPSG:4326'
  },
  {
    type: 'map', // 数据图类型
    name: '数据层',
    url: 'http://example.com/data',
    layertype: 'Tile',
    params: {
      LAYERS: 'layer1',
      FORMAT: 'image/png'
    }
  }
];
</script>
```

### 图层类型

- **SuperMap**: 超图瓦片图层
- **Tile**: 标准 WMS 瓦片图层
- **Image**: WMS 图片图层
- **ImageStatic**: 静态图片图层
- **Vector**: 矢量图层（默认）

### 图层操作方法

```javascript
// 通过 ref 访问图层管理方法
const mapRef = ref();

// 添加单个图层
mapRef.value?.addLayer({
  name: 'myLayer',
  layerType: 'Vector',
  zIndex: 5,
  style: { fill: { color: 'rgba(255,0,0,0.5)' } }
});

// 获取图层
const layer = mapRef.value?.getLayer('myLayer');

// 获取图层数据源
const source = mapRef.value?.getLayerSource('myLayer');

// 移除图层
mapRef.value?.removeLayerByName('myLayer');

// 获取所有图层
const allLayers = mapRef.value?.getAllLayers();
```

## 要素管理

### 创建要素

```javascript
const mapRef = ref();

// 创建点要素
const point = mapRef.value?.createPoint([87.58, 43.83], {
  style: { image: { radius: 10, fill: { color: 'red' } } },
  id: 'point-1',
  name: '标记点'
});

// 根据数据创建点要素
const pointFromData = mapRef.value?.createPointByData(
  { longitude: 87.58, latitude: 43.83, name: '乌鲁木齐' },
  {
    fieldConfig: { lon: 'longitude', lat: 'latitude' },
    style: { image: { radius: 8, fill: { color: 'blue' } } }
  }
);

// 创建线段要素
const line = mapRef.value?.createLineFeature(
  [[87.58, 43.83], [87.60, 43.85], [87.62, 43.87]],
  {
    style: { stroke: { color: '#ff0000', width: 2 } },
    name: '路线1'
  }
);

// 创建圆形要素
const circle = mapRef.value?.createCircleFeature(
  [[87.58, 43.83], 1000], // 中心点和半径（米）
  {
    style: {
      fill: { color: 'rgba(255,0,0,0.3)' },
      stroke: { color: '#ff0000', width: 2 }
    },
    name: '覆盖区域'
  }
);
```

### 添加要素

```javascript
// 添加要素到指定图层
mapRef.value?.addFeature('myLayer', point);

// 批量添加要素
const features = [point1, point2, point3];
features.forEach(feature => {
  mapRef.value?.addFeature('myLayer', feature);
});
```

### 查询要素

```javascript
// 获取所有要素
const allFeatures = mapRef.value?.getFeatures('myLayer');

// 根据属性查询
const redFeatures = mapRef.value?.getFeatures('myLayer', { color: 'red' });

// 使用函数查询
const largeFeatures = mapRef.value?.getFeatures('myLayer', (f) => {
  return f.get('size') > 100;
});
```

### 移除要素

```javascript
// 移除所有要素
mapRef.value?.removeFeature('myLayer');

// 根据属性移除
mapRef.value?.removeFeature('myLayer', { id: 'feature-1' });

// 使用函数移除
mapRef.value?.removeFeature('myLayer', (f) => {
  return f.get('status') === 'deleted';
});
```

## 完整示例

### 示例 1: 基础地图与点标记

```vue
<template>
  <div class="map-wrapper">
    <OpenLayer
      ref="mapRef"
      :center="center"
      :zoom="zoom"
      :point="pointConfig"
      @point-click="handlePointClick"
      @map-ready="handleMapReady"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OpenLayer from '@/components/openlayer/index.vue';

const mapRef = ref();
const center = ref([87.58, 43.83]);
const zoom = ref(12);

const pointConfig = ref({
  data: [
    { lon: 87.58, lat: 43.83, name: '点1', status: 'active' },
    { lon: 87.60, lat: 43.85, name: '点2', status: 'inactive' }
  ],
  fieldConfig: {
    lon: 'lon',
    lat: 'lat'
  },
  style: {
    image: {
      radius: 10,
      fill: { color: 'rgba(255,0,0,0.5)' },
      stroke: { color: '#ff0000', width: 2 }
    }
  }
});

function handlePointClick({ data, coordinates }) {
  console.log('点击了点:', data);
  alert(`点击了: ${data.name}`);
}

function handleMapReady(map) {
  console.log('地图加载完成');
}
</script>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 600px;
}
</style>
```

### 示例 2: 自定义图层和要素

```vue
<template>
  <div class="map-wrapper">
    <OpenLayer
      ref="mapRef"
      :center="[87.58, 43.83]"
      :zoom="12"
      @map-ready="handleMapReady"
    />
    <div class="controls">
      <button @click="addCustomLayer">添加自定义图层</button>
      <button @click="addLineFeature">添加线段</button>
      <button @click="addCircleFeature">添加圆形区域</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OpenLayer from '@/components/openlayer/index.vue';

const mapRef = ref();

function handleMapReady(map) {
  console.log('地图加载完成');
}

function addCustomLayer() {
  // 添加矢量图层
  mapRef.value?.addLayer({
    name: 'customLayer',
    layerType: 'Vector',
    zIndex: 5,
    style: {
      fill: { color: 'rgba(0,255,0,0.3)' },
      stroke: { color: '#00ff00', width: 2 }
    }
  });
}

function addLineFeature() {
  const line = mapRef.value?.createLineFeature(
    [[87.58, 43.83], [87.60, 43.85], [87.62, 43.87]],
    {
      style: {
        stroke: { color: '#ff0000', width: 3, lineCap: 'round' }
      },
      name: '路线1'
    }
  );
  mapRef.value?.addFeature('customLayer', line);
}

function addCircleFeature() {
  const circle = mapRef.value?.createCircleFeature(
    [[87.58, 43.83], 2000], // 半径 2000 米
    {
      style: {
        fill: { color: 'rgba(0,0,255,0.2)' },
        stroke: { color: '#0000ff', width: 2 }
      },
      name: '覆盖区域'
    }
  );
  mapRef.value?.addFeature('customLayer', circle);
}
</script>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 600px;
  position: relative;
}

.controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover {
  background: #f0f0f0;
}
</style>
```

### 示例 3: 动态样式

```vue
<template>
  <div class="map-wrapper">
    <OpenLayer
      ref="mapRef"
      :center="[87.58, 43.83]"
      :zoom="12"
      @map-ready="handleMapReady"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OpenLayer from '@/components/openlayer/index.vue';

const mapRef = ref();

function handleMapReady(map) {
  // 添加图层
  mapRef.value?.addLayer({
    name: 'dynamicLayer',
    layerType: 'Vector',
    zIndex: 5
  });

  // 创建带动态样式的要素
  const features = [
    { lon: 87.58, lat: 43.83, name: '活跃点', status: 'active', size: 15 },
    { lon: 87.60, lat: 43.85, name: '非活跃点', status: 'inactive', size: 8 }
  ];

  features.forEach(item => {
    const feature = mapRef.value?.createPointByData(
      item,
      {
        fieldConfig: { lon: 'lon', lat: 'lat' },
        // 动态样式函数
        style: (feature, resolution) => {
          const status = feature.get('status');
          const size = feature.get('size') || 10;
          
          return {
            image: {
              radius: size,
              fill: {
                color: status === 'active' 
                  ? 'rgba(0,255,0,0.6)' 
                  : 'rgba(255,0,0,0.6)'
              },
              stroke: {
                color: status === 'active' ? '#00ff00' : '#ff0000',
                width: 2
              }
            },
            text: {
              text: feature.get('name'),
              fill: { color: '#fff' },
              stroke: { color: '#000', width: 1 },
              offsetY: -size - 5
            }
          };
        }
      }
    );
    
    // 将数据附加到要素
    Object.assign(feature, item);
    mapRef.value?.addFeature('dynamicLayer', feature);
  });
}
</script>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 600px;
}
</style>
```

## 注意事项

1. **坐标系**: 默认使用 `EPSG:4326`（WGS84），如需修改请在 `view` prop 中配置
2. **图层顺序**: 通过 `zIndex` 控制图层显示顺序，数值越大越在上层
3. **性能优化**: 大量点数据建议使用聚合或分页加载
4. **内存管理**: 组件卸载时会自动清理地图资源，无需手动处理

## 相关链接

- [OpenLayers 官方文档](https://openlayers.org/)
- [SuperMap iClient for OpenLayers](https://github.com/SuperMap/iClient-JavaScript)
