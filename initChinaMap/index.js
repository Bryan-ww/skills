import * as THREE from "three";
// 引入d3.js
import * as d3 from "d3";
// 片元着色器代码
import outputFragment from "./output_fragment.glsl.js";
// 省份名称对象
import { createProvinceName } from "../provinceName/index.js";
// 创建地图标牌函数
import { createMapTag } from "../mapTag/index.js";
// 创建光柱函数
import { createCylinder } from "../cylinder/index.js";

// 地图模型
const nationMapModel = new THREE.Group();
nationMapModel.rotateX(-Math.PI / 2);
nationMapModel.name = "国";
// 墨卡托投影转换
const projection = d3.geoMercator().center([107.067641, 36.226277]).translate([0, 0]);
// const projection = d3.geoMercator().center([104.0, 37.5]).translate([0, 0]);
// 地图模型侧边材质
const sideMaterial = new THREE.MeshBasicMaterial({
  // color: '#00BFFF',
  color: "#00E6E6",
  transparent: true,
  opacity: 1,
});
// 侧边材质uniform
let mapUf = {
  uTime: { value: 0.0 },
  uHeight: { value: 10 },
  uColor: { value: new THREE.Color("#00ffff") },
  uStart: { value: -10 },
  uSpeed: { value: 6 },
};
sideMaterial.onBeforeCompile = (shader) => {
  shader.uniforms = {
    ...shader.uniforms,
    ...mapUf,
  };
  shader.vertexShader = shader.vertexShader.replace(
    "void main() {",
    `
              varying vec3 vPosition;
              void main() {
                vPosition = position;
            `
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "void main() {",
    `
              varying vec3 vPosition;
              uniform float uTime;
              uniform vec3 uColor;
              uniform float uSpeed;
              uniform float uStart;
              uniform float uHeight;
              void main() {
            `
  );
  shader.fragmentShader = shader.fragmentShader.replace("vec3 outgoingLight = reflectedLight.indirectDiffuse;", outputFragment);
};
// 全国地图纹理
const quanGuoTexture = new THREE.TextureLoader().load("./map3.jpg");
quanGuoTexture.flipY = false;
quanGuoTexture.wrapS = THREE.RepeatWrapping;
quanGuoTexture.wrapT = THREE.RepeatWrapping;
quanGuoTexture.repeat.set(0.00608, 0.00825);
quanGuoTexture.offset.set(0.5448, 0.549);

// 模型顶部材质
const topMaterial = new THREE.MeshStandardMaterial({
  // 默认先使用深蓝色，不适用计算插值的color
  color: new THREE.Color("#00E6E6"),
  map: quanGuoTexture,
  emissiveIntensity: 0.1,
  transparent: true,
  opacity: 1,
});

// 加载全国地图数据
async function initMap() {
  // 加载地图数据
  //let url = "http://211.143.122.110:18062/mapdata/geojson/areas_v3_full/all/100000.json";
  let url = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json'
  return await new Promise((resolve) => {
    fetch(url)
      .then((response) => response.json())
      .then(async (data) => {
        // 文件加载器，设置类型为json
        const fileLoader = new THREE.FileLoader();
        fileLoader.responseType = "json";
        // 加载全国降水量数据
        const waterData = await fileLoader.loadAsync("./water.json");
        const waterObj = {};
        waterData.arr.forEach((obj) => {
          waterObj[obj["name"]] = obj["value"];
        });
        operationData(data, waterObj, resolve);
      });
  });

  // // 加载全国地图数据
  // const mapData = await fileLoader.loadAsync('./map.json');
  // operationData(mapData, waterObj);
}

// 解析地图json数据
function operationData(data, waterObj, resolve) {
  // 全国信息
  const features = data.features;
  features.map((feature) => {
    // 地图名称
    const name = feature.properties.name;
    // 单个省份
    const province = new THREE.Object3D();
    province.name = name; // 设置省份名称
    province.userData.animationActive = false; // 新增属性来跟踪浮动动画状态
    province.userData.animationTimer = null; // 用于存储定时器的引用
    province.userData.adcode = feature.properties.adcode; // 存储每个省份adcode用于获取省级市级数据
    nationMapModel.add(province);
    const coordinates = feature.geometry.coordinates;
    // 绘制地级市边界线
    if (feature.geometry.type === "MultiPolygon") {
      coordinates.forEach((coordinate) => {
        coordinate.forEach((rows) => {
          // 城市模型
          const mesh = drawExtrudeMesh(rows);
          mesh.rotateX(Math.PI);
          province.add(mesh);
          // 边线
          const line = lineDraw(rows);
          line.name = "边线";
          line.position.z += 0.15;
          province.add(line);
        });
      });
    }
    // 创建省份边界线和模型-单个多边形
    if (feature.geometry.type === "Polygon") {
      coordinates.forEach((coordinate) => {
        // 城市模型
        const mesh = drawExtrudeMesh(coordinate);
        mesh.rotateX(Math.PI);
        province.add(mesh);
        // 边线
        const line = lineDraw(coordinate);
        line.position.z += 0.15;
        line.name = "边线";
        province.add(line);
      });
    }

    if (name) {
      // 中心经纬度或面心经纬度
      const center = feature.properties.centroid ? feature.properties.centroid : feature.properties.center;
      // 经纬度转换墨卡托投影坐标
      const pos = projection(center);

      // 创建地图名称
      const provinceName = createProvinceName(pos, name);
      // 创建地图标牌
      const mapTag = createMapTag(
        {
          name: name,
          x: pos[0],
          y: -pos[1],
        },
        waterObj[name]
      );
      // 创建光柱
      const cylinder = createCylinder(
        {
          name: name,
          x: pos[0],
          y: -pos[1],
        },
        waterObj[name]
      );
      // 添加省份名称、光柱、标牌
      province.add(provinceName, mapTag, cylinder);
      // 存储中心位置
      province.userData.center = [pos[0], -pos[1]];
      // 存储地图数据
      province.userData.mapData = feature.geometry;
    }
  });
  resolve();
}

// 绘制模型
function drawExtrudeMesh(polygon) {
  // 创建形状
  const shape = new THREE.Shape();
  // 遍历坐标数组，绘制形状
  polygon.forEach((row, i) => {
    // 坐标点转换
    const [x, y] = projection(row);
    if (i === 0) {
      shape.moveTo(x, y);
    }
    shape.lineTo(x, y);
  });
  // 将形状进行拉伸
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 10,
    bevelEnabled: true,
    bevelSegments: 10,
    bevelThickness: 0.1,
  });
  // // 模型顶部材质
  // const material = new THREE.MeshStandardMaterial({
  //     // 默认先使用深蓝色，不适用计算插值的color
  //     color: new THREE.Color('#00E6E6'),
  //     map: quanGuoTexture,
  //     emissiveIntensity: 0.1,
  //     transparent: true,
  //     opacity: 1,
  // })
  const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial]);
  mesh.texture = quanGuoTexture;
  return mesh;
}
// 绘制边界线
function lineDraw(polygon) {
  const lineGeometry = new THREE.BufferGeometry();
  const pointsArray = new Array();
  polygon.forEach((row) => {
    const [x, y] = projection(row);
    // 创建三维点
    pointsArray.push(new THREE.Vector3(x, -y, 0));
  });
  // 放入多个点
  lineGeometry.setFromPoints(pointsArray);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: "#00ffff",
  });
  return new THREE.Line(lineGeometry, lineMaterial);
}

export { initMap, nationMapModel, mapUf, projection, topMaterial, sideMaterial };
