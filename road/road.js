import * as THREE from 'three';
import { THREE_GetGifTexture } from 'threejs-gif-texture'; // 加载gif用作贴图
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
const config = {
  roadLane: 4, // 道路车道数
  RoadWidth: 186, // 公路宽度
  RoadHeight: 2, // 公路厚度
  RoadLength: 333, // 每段长度
  RoadInterval: 64, // 道路间隔
  fogLightInterval: 20, // 雾灯间隔
  entryWidth: 80, // 出入口宽度
  entryLength: 259, // 出入口长度
  pileWidth: 46, // 桩号牌宽度
  pileLength: 50, // 桩号牌长度
  facilityBottomLength: 192, // 基础设施底部宽度
  facilityBottomWidth: 47, // 基础设施底部厂度
  upRoadBorder: 10,
  downRoadBorder: 6,
};
// 交通拥堵指数颜色
const trafficStateColor = {
  1: '#00c214',
  2: '#ffd300',
  3: '#ff9e00',
  4: '#ff2400',
  5: '#00c214',
};

// 创建道路底座
export function initRoadFloor(data, type, index) {
  let roadGroup = new THREE.Group(); // 创建一个组来存放每一段路
  roadGroup.name = data.startMilePost;
  const typeName = type === 0 ? 'up' : 'down';
  let texture = new THREE.TextureLoader().load(`./assets/images/road/${typeName}-road.png`);
  texture.colorSpace = THREE.SRGBColorSpace; // 修正颜色偏差
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  let cubeMaterial = new THREE.MeshLambertMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });
  let sidleMaterial = new THREE.MeshLambertMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
  });
  let materials = [
    sidleMaterial, // x正 (右)
    sidleMaterial, // x负 (左)
    cubeMaterial, // y正 (上)
    cubeMaterial, // y负 (下)
    cubeMaterial, // z正 (前)
    cubeMaterial, // z负 (后)
  ];
  // 创建几何体并确保法线正确
  const geometry = new THREE.BoxGeometry(config.RoadLength, config.RoadHeight, config.RoadWidth);
  geometry.computeVertexNormals();
  let road = new THREE.Mesh(geometry, materials);
  road.name = data.startMilePost;
  road.renderOrder = 2;
  // 1. 禁用阴影投射和接收
  road.castShadow = false;
  road.receiveShadow = false;
  roadGroup.add(road);
  // 道路箭头
  if (index % 4 == 0) {
    const arrow = createArrow(data, type);
    roadGroup.add(arrow);
  }
  // 创建匝道入口
  if (data.isEntrance) {
    const entry = createEntry(data, type);
    roadGroup.add(entry);
  }
  // 创建匝道出口
  if (data.isExport) {
    const Export = createExport(data, type);
    roadGroup.add(Export);
  }
  // 创建桩号牌
  if (data.startMilePost && type === 0) {
    const pile = createMilePost(data, type);
    roadGroup.add(pile);
  }
  // 创建拥堵指数覆盖层
  if (data.state) {
    const trafficCongestion = createTrafficCongestion(data, type);
    roadGroup.add(trafficCongestion);
  }
  //  创建交通拥堵指数线条
  if (data.state) {
    const roadState = createRoadState(data, type);
    roadGroup.add(roadState);
  }
  // 创建饱和度、交通量
  if (data.saturation || data.voc) {
    const trafficVolume = createTrafficVolume(data, type);
    roadGroup.add(trafficVolume);
  }
  // 创建设施(收费站、服务区)
  if (data.facilityArr.length > 0) {
    const facilityInfo = data.facilityArr[0];
    const facility = createFacility(facilityInfo, type);
    roadGroup.add(facility);
  }
  // 创建摄像头
  if (data.cameraList.length > 0) {
    const camera = createCamera(data.cameraList, type);
    roadGroup.add(camera);
  }
  // 创建事件
  if (data.eventList.length > 0) {
    const event = createEvent(data.eventList, type);
    roadGroup.add(event);
  }
  // 创建情报板(2D模式显示)
  if (data.infoBoardList.length > 0) {
    const infoBoard = createInfoBoardLabel(data, type);
    infoBoard.name = 'vertical';
    roadGroup.add(infoBoard);
  }
  // 创建横向情报板（3D模型显示）
  if (data.infoBoardList.length > 0) {
    const infoBoard = createInfoBoardLabelByHorizontal(data, type);
    infoBoard.name = 'horizontal';
    infoBoard.visible = false;
    roadGroup.add(infoBoard);
  }
  roadGroup.position.x = config.RoadLength * index + config.RoadLength / 2;
  return roadGroup;
}
// 创建道路箭头
export function createArrow(data, type) {
  const trafficGroup = new THREE.Group();
  for (let i = 0; i < config.roadLane; i++) {
    createDirectionNameTexture(data, type).then((texture) => {
      const material = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });

      const sidleMaterial = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        opacity: 0,
      });
      let materials = [
        sidleMaterial, // x正 (右)
        sidleMaterial, // x负 (左)
        material, // y正 (上)
        material, // y负 (下)
        sidleMaterial, // z正 (前)
        sidleMaterial, // z负 (后)
      ];
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(150, 6, 32), materials);
      mesh.position.y = 0;
      mesh.position.x = -config.RoadLength / 2 + 75;
      mesh.position.z = type == 0 ? config.RoadWidth / 2 - (config.roadLane - i) * 33 + 6 : -config.RoadWidth / 2 + (config.roadLane - i) * 33 - 8;
      mesh.castShadow = true;
      mesh.receiveShadow = true; // 盒子可以接收阴影
      mesh.name = '路段方向';
      mesh.renderOrder = 3;
      trafficGroup.add(mesh);
    });
  }
  return trafficGroup;
}
// 创建匝道入口
export function createEntry(data, type) {
  const typeName = type === 0 ? 'up' : 'down';
  let entryTexture = new THREE.TextureLoader().load(`./assets/images/road/${typeName}-interconnect-entry.png`);
  entryTexture.colorSpace = THREE.SRGBColorSpace; // 修正颜色偏差
  entryTexture.wrapS = entryTexture.wrapT = THREE.RepeatWrapping;
  let entryMaterial = new THREE.MeshLambertMaterial({
    map: entryTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  // 创建翻转贴图(底部)
  const flippedTexture = entryTexture.clone();
  flippedTexture.repeat.y = -1; // 翻转Y轴
  const bottomMaterial = new THREE.MeshLambertMaterial({
    map: flippedTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const blackMaterial = new THREE.MeshLambertMaterial({
    color: 0x123153,
    transparent: true,
    alphaTest: 0.5, // 关键：设置alphaTest值控制透明度
    opacity: 0.1, // 设置透明度级别（0-1）
    side: THREE.DoubleSide,
  });
  // 分割几何体并应用材质
  const materials = [blackMaterial, blackMaterial, entryMaterial, flippedTexture, blackMaterial, blackMaterial];
  let entry = new THREE.Mesh(new THREE.BoxGeometry(config.entryLength, config.RoadHeight + 0.2, config.entryWidth), materials);
  entry.name = 'INTERCHANGE';
  entry.position.z = type === 0 ? -(config.RoadInterval / 2 + config.RoadWidth / 2 - 1.2) : config.RoadInterval / 2 + config.RoadWidth / 2 - 3.3;
  entry.renderOrder = 1; // 设置渲染顺序
  entry.userData.name = `${data.startMilePost}-入口`;
  return entry;
}
// 创建匝道出口
export function createExport(data, type) {
  const typeName = type === 0 ? 'up' : 'down';
  let topTexture = new THREE.TextureLoader().load(`./assets/images/road/${typeName}-interconnect-export.png`);
  topTexture.colorSpace = THREE.SRGBColorSpace; // 修正颜色偏差
  topTexture.wrapS = topTexture.wrapT = THREE.RepeatWrapping;
  let topMaterial = new THREE.MeshLambertMaterial({
    map: topTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  // 创建翻转贴图(底部)
  const flippedTexture = topTexture.clone();
  flippedTexture.repeat.y = -1; // 翻转Y轴
  const bottomMaterial = new THREE.MeshLambertMaterial({
    map: flippedTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const blackMaterial = new THREE.MeshLambertMaterial({
    color: 0x123153,
    transparent: true,
    alphaTest: 0.5, // 关键：设置alphaTest值控制透明度
    opacity: 0.1, // 设置透明度级别（0-1）
    side: THREE.DoubleSide,
  });
  // 分割几何体并应用材质
  const materials = [blackMaterial, blackMaterial, topMaterial, flippedTexture, blackMaterial, blackMaterial];
  let Export = new THREE.Mesh(new THREE.BoxGeometry(config.entryLength, config.RoadHeight + 0.2, config.entryWidth), materials);
  Export.name = 'INTERCHANGE';
  Export.position.z = type === 0 ? -(config.RoadInterval / 2 + config.RoadWidth / 2 - 1.2) : config.RoadInterval / 2 + config.RoadWidth / 2 - 3.3;
  Export.renderOrder = 1; // 设置渲染顺序
  Export.userData.name = `${data.startMilePost}-出口`;
  return Export;
}
// 创建桩号牌
export function createMilePost(data) {
  let pileTexture = new THREE.TextureLoader().load(`./assets/images/road/pile.png`);
  pileTexture.colorSpace = THREE.SRGBColorSpace; // 修正颜色偏差
  pileTexture.wrapS = pileTexture.wrapT = THREE.RepeatWrapping;

  let pileMaterial = new THREE.MeshLambertMaterial({
    map: pileTexture,
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.1,
  });
  let pile = new THREE.Mesh(new THREE.PlaneGeometry(config.pileLength, config.pileWidth), pileMaterial);
  pile.name = `pile`;
  pile.position.y = 23;
  pile.position.x = -config.RoadLength / 2 + 20;
  pile.position.z = config.RoadInterval / 2 + config.RoadWidth / 2;
  pile.rotation.x = -Math.PI / 2; // 旋转90度放平
  pile.renderOrder = 1; // 设置渲染顺序
  pile.userData.isBillboard = false;
  const textTexture = createPileTexture(getPileString(data.startMilePost));
  const textMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    alphaTest: 0.5, // 提高alpha测试阈值
    depthWrite: false, // 禁用深度写入
    depthTest: true, // 启用深度测试
  });
  // 创建文字平面（稍小一些）
  const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(config.pileLength * 0.6, config.pileWidth * 0.3), textMaterial);
  // 将文字平面放置在pile的上方
  textPlane.position.set(0, config.pileWidth / 5, 1); // 向上偏移，向前偏移
  textPlane.renderOrder = 2; // 文字渲染顺序更高
  // 将文字添加到pile
  pile.add(textPlane);

  return pile;
}
// 创建道路拥堵状态
export function createRoadState(data, type) {
  const state = data.state || 5;
  let color = trafficStateColor[state];
  let stateMaterial = new THREE.MeshLambertMaterial({
    color: color,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide, // 确保两面都可见
  });

  let roadState = new THREE.Mesh(new THREE.BoxGeometry(config.RoadLength, config.RoadHeight, 4), stateMaterial);
  roadState.position.y = 3;
  roadState.position.z = type == 0 ? 90 : -94;
  return roadState;
}
// 创建情报板(竖向)
export function createInfoBoardLabel(data, type) {
  const infoBoardList = data.infoBoardList || [];

  if (infoBoardList.length > 0) {
    console.log('创建情报板', infoBoardList);
    const infoBoardGroup = new THREE.Group();
    // infoBoardGroup.name = infoBoardList[0].type;
    infoBoardList.forEach((item, index) => {
      console.log('item', item);
      const [infoBoardTxt] = item.infoBoardTxtData;
      console.log('infoBoardTxt', infoBoardTxt);
      const info_board_size = item.fields.info_board_size.value;
      const [infoBoardWidth, infoBoardHeight] = info_board_size.split('*');
      console.log('info_board_size', info_board_size);
      console.log('infoBoardWidth', infoBoardWidth, infoBoardHeight / 2);
      const canvas = document.createElement('canvas');

      // 调整画布尺寸为竖向（宽度变小，高度变大）
      canvas.width = 26; // 宽度变窄
      canvas.height = 132; // 高度变长

      const ctx = canvas.getContext('2d');
      // 绘制渐变背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 26, 132);

      // 添加边框
      ctx.strokeStyle = '#7F9BB8';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 25, 131);

      // 获取文本内容
      const text = infoBoardTxt?.contentList?.[0]?.content || '';
      // 竖排文字绘制
      ctx.fillStyle = '#FF2828';
      ctx.font = '12px Microsoft YaHei, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 将文字竖排显示
      const characters = text.replace('\n', ' ').split('');
      const startY = 66; // 垂直方向的起始位置
      const charSpacing = 13; // 字符间距

      characters.forEach((char, i) => {
        // 保存当前上下文状态
        ctx.save();

        // 移动到每个字符的位置
        ctx.translate(13, startY + (i - (characters.length - 1) / 2) * charSpacing);

        // 绘制字符
        ctx.fillText(char, 0, 0);

        // 恢复上下文状态
        ctx.restore();
      });

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      // 创建竖向的平面几何体（宽高交换）
      const geometry = new THREE.PlaneGeometry(26, 132); // 宽高交换，现在是竖向
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        toneMapped: false,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = 5; // 设置渲染顺序
      mesh.userData.isBillboard = false;
      mesh.userData.data = item;
      mesh.name = item.type;
      mesh.position.y = 6;
      infoBoardGroup.position.x = -config.RoadLength / 2 + 260;
      infoBoardGroup.position.z = type == 0 ? config.RoadWidth / 2 - 76.5 : -(config.RoadWidth / 2 - 74);
      infoBoardGroup.add(mesh);
    });
    return infoBoardGroup;
  }
}
// 创建情报板(横向)
export function createInfoBoardLabelByHorizontal(data, type) {
  const infoBoardList = data.infoBoardList || [];

  if (infoBoardList.length > 0) {
    const infoBoardGroup = new THREE.Group();
    infoBoardGroup.name = 'device';
    infoBoardList.forEach((item, index) => {
      console.log('item', item);
      const [infoBoardTxt] = item.infoBoardTxtData;
      console.log('infoBoardTxt', infoBoardTxt);
      const info_board_size = item.fields.info_board_size.value;
      const [infoBoardWidth, infoBoardHeight] = info_board_size.split('*');
      console.log('info_board_size', info_board_size);
      console.log('infoBoardWidth', infoBoardWidth, infoBoardHeight / 2);
      const canvas = document.createElement('canvas');
      canvas.width = 132;
      canvas.height = 26;
      const ctx = canvas.getContext('2d');
      // 绘制渐变背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 132, 26);
      // 添加边框
      ctx.strokeStyle = '#7F9BB8';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 131, 25);

      // 绘制文字
      const text = infoBoardTxt?.contentList?.[0]?.content || '';
      ctx.fillStyle = '#FF2828';
      ctx.font = '12px Microsoft YaHei, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, 66, 13);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      // 创建平面几何体（放平）
      const geometry = new THREE.PlaneGeometry(132, 26); // 宽高交换
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        toneMapped: false,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = 5; // 设置渲染顺序
      mesh.userData.isBillboard = false;
      mesh.userData.data = item;
      mesh.name = item.type;
      mesh.position.y = 46;
      infoBoardGroup.position.x = -config.RoadLength / 2 + 260;
      infoBoardGroup.position.z = type == 0 ? config.RoadWidth / 2 - 76 : -(config.RoadWidth / 2 - 74);
      infoBoardGroup.add(mesh);
    });
    return infoBoardGroup;
  }
}
// 创建交通拥堵 颜色
export function createTrafficCongestion(data, type) {
  const state = data.state || 5;
  let color = trafficStateColor[state];
  let trafficMaterial = new THREE.MeshLambertMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide, // 确保两面都可见
  });
  let sidleMaterial = new THREE.MeshLambertMaterial({
    color: color,
    transparent: true,
    opacity: 0,
  });
  let materials = [
    sidleMaterial, // x正 (右)
    sidleMaterial, // x负 (左)
    trafficMaterial, // y正 (上)
    trafficMaterial, // y负 (下)
    trafficMaterial, // z正 (前)
    trafficMaterial, // z负 (后)
  ];
  let trafficState = new THREE.Mesh(new THREE.BoxGeometry(config.RoadLength, config.RoadHeight, 132), materials);
  trafficState.name = `state`;
  // 添加调试信息
  trafficState.renderOrder = 2;
  trafficState.position.y = 1.3;
  trafficState.position.z = type == 0 ? -(config.RoadWidth / 2 - 110) : config.RoadWidth / 2 - 112;
  return trafficState;
}
//创建交通量
export function createTrafficVolume(data, type) {
  // console.log('创建交通量', data);
  const state = data.state || 5;
  const fillStyle = trafficStateColor[state];
  // 创建组
  const trafficGroup = new THREE.Group();
  const saturationText = `饱和度 ${(data.saturation || 0).toFixed(1)}`;
  const saturationTexture = createSingleTextTexture(saturationText, fillStyle);
  const saturationMaterial = new THREE.MeshBasicMaterial({
    map: saturationTexture,
    transparent: true,
    alphaTest: 0.3,
    side: THREE.DoubleSide,
  });

  // 创建交通量文字
  const volumeText = `交通量 ${data.voc || 0}`;
  const volumeTexture = createSingleTextTexture(volumeText, fillStyle);
  const volumeMaterial = new THREE.MeshBasicMaterial({
    map: volumeTexture,
    transparent: true,
    alphaTest: 0.3,
    side: THREE.DoubleSide,
  });

  // 创建分隔符
  const separatorTexture = createSingleTextTexture('/', fillStyle);
  const separatorMaterial = new THREE.MeshBasicMaterial({
    map: separatorTexture,
    transparent: true,
    alphaTest: 0.3,
    side: THREE.DoubleSide,
  });

  // 测量文字尺寸（假设每个字符宽度大约为字体大小的一半）
  const charWidth = 14 * 0.6; // 24px字体，每个字符大约14.4px
  const saturationWidth = saturationText.length * charWidth;
  const separatorWidth = 1 * charWidth;
  const volumeWidth = volumeText.length * charWidth;

  const totalWidth = saturationWidth + separatorWidth + volumeWidth;
  const planeWidth = config.pileLength * 1.2;
  const scale = planeWidth / totalWidth;

  // 创建三个平面
  const saturationPlane = new THREE.Mesh(new THREE.PlaneGeometry(saturationWidth * scale, 30), saturationMaterial);

  const separatorPlane = new THREE.Mesh(new THREE.PlaneGeometry(separatorWidth * scale, 30), separatorMaterial);

  const volumePlane = new THREE.Mesh(new THREE.PlaneGeometry(volumeWidth * scale, 30), volumeMaterial);

  // 设置名称和用户数据
  saturationPlane.name = 'saturation';
  saturationPlane.userData = {
    type: 'traffic_text',
    part: 'saturation',
    visible: true,
    originalVisible: true,
  };

  separatorPlane.name = 'separator';
  separatorPlane.userData = {
    type: 'traffic_text',
    part: 'separator',
    visible: true,
    originalVisible: true,
  };

  volumePlane.name = 'volume';
  volumePlane.userData = {
    type: 'traffic_text',
    part: 'volume',
    visible: true,
    originalVisible: true,
  };

  // 计算位置（水平排列）
  const startX = (-(saturationWidth + separatorWidth + volumeWidth) * scale) / 2;
  saturationPlane.position.x = startX + (saturationWidth * scale) / 2;
  separatorPlane.position.x = startX + saturationWidth * scale + (separatorWidth * scale) / 2;
  volumePlane.position.x = startX + saturationWidth * scale + separatorWidth * scale + (volumeWidth * scale) / 2;

  // 添加到组
  trafficGroup.add(saturationPlane, separatorPlane, volumePlane);
  trafficGroup.rotation.x = -Math.PI / 2; // 旋转90度放平
  trafficGroup.position.y = 3;
  trafficGroup.position.z = type == 0 ? config.RoadWidth / 2 + 8 : -(config.RoadWidth / 2 + 8);
  trafficGroup.renderOrder = 4;
  return trafficGroup;
}
// 创建雾灯
export async function createFogLights(data) {
  const { startMilePost, redLedFrequency, yellowLedFrequency } = data;
  // 1. 构建GIF URL
  const url = `/assets/images/road/fog-light/light-${redLedFrequency}-${yellowLedFrequency}.gif`;
  // 2. 异步加载GIF纹理
  const texture = await THREE_GetGifTexture(url);
  // 3. 设置纹理参数
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  // 4. 创建平面几何体 - 根据GIF尺寸调整比例
  const geometry = new THREE.PlaneGeometry(16, 30);
  // 5. 创建材质
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: false, // 禁用色调映射，保持原始颜色
    depthWrite: false, // 改善透明物体渲染
    alphaTest: 0.1, // 设置alpha测试阈值
  });
  const planeGroup = new THREE.Group();
  for (let i = 0; i < fogLightCount; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    // 计算位置
    mesh.position.set(0, 12, -(config.width - 6) * i);
    mesh.name = i == 0 ? '左雾灯' : '右雾灯';
    // 做标记, 保证雾灯始终保持正面
    mesh.userData.isBillboard = false;
    planeGroup.add(mesh);
    planeGroup.name = `${data.startMilePost}-雾灯`;
  }
  return planeGroup;
}
// 获取桩号字符串
export function getPileString(value) {
  if (!value || value === -1) {
    return 'K0';
  }
  let intPart = Math.floor(value / 1000) + '';
  if (intPart) {
    intPart = intPart.padStart(3, '000');
  }
  return `K${intPart}`;
}
// 创建基础设施
export function createFacility(data, type) {
  const facility = new THREE.Group();
  facility.name = data.type;
  facility.userData.data = data;
  facility.userData.isJump = false;
  console.log('创建基础设施', data);
  const typeName = type === 0 ? 'up' : 'down';
  // 基础设施底座
  const bottomTexture = new THREE.TextureLoader().load(`./assets/images/road/${typeName}-facility-bg.png`);
  bottomTexture.colorSpace = THREE.SRGBColorSpace; // 修正颜色偏差
  bottomTexture.wrapS = bottomTexture.wrapT = THREE.RepeatWrapping;
  let bottomMaterial = new THREE.MeshLambertMaterial({
    map: bottomTexture,
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.1,
  });
  let bottom = new THREE.Mesh(new THREE.PlaneGeometry(config.facilityBottomLength, config.facilityBottomWidth), bottomMaterial);
  bottom.rotation.x = -Math.PI / 2; // 旋转90度放平
  bottom.position.y = 1.1;
  bottom.position.z = type === 0 ? -(config.RoadInterval / 2 + config.RoadWidth / 2 - 18.8) : config.RoadInterval / 2 + config.RoadWidth / 2 - 21.6;
  // 基础设施立牌背景
  const bgTexture = new THREE.TextureLoader().load(`./assets/images/road/${data.type}.png`);
  bgTexture.colorSpace = THREE.SRGBColorSpace; // 修正颜色偏差
  bgTexture.wrapS = bgTexture.wrapT = THREE.RepeatWrapping;

  let bgMaterial = new THREE.MeshLambertMaterial({
    map: bgTexture,
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.1,
  });
  let facilityBg = new THREE.Mesh(new THREE.PlaneGeometry(47, 54), bgMaterial);
  facilityBg.name = `facility-bg`;
  facilityBg.position.y = 26;
  facilityBg.position.z = type === 0 ? -(config.RoadInterval / 2 + config.RoadWidth / 2 - 24) : config.RoadInterval / 2 + config.RoadWidth / 2 - 30;
  facilityBg.rotation.x = -Math.PI / 2; // 旋转90度放平
  facilityBg.userData.isBillboard = false; // 文字也面向相机
  // 基础设施名称
  const textTexture = createFacilityTexture(data.name);
  const textMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    alphaTest: 0.5, // 提高alpha测试阈值
    depthWrite: false, // 禁用深度写入
    depthTest: true, // 启用深度测试
  });
  // 创建文字平面（稍小一些）
  const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(47 * 0.9, 54 * 0.5), textMaterial);
  textPlane.name = `${data.type}`;
  textPlane.userData.data = data;
  // 将文字平面放置在pile的上方
  textPlane.position.set(0, 2, 0.1); // 向上偏移，向前偏移
  // textPlane.userData.isBillboard = true; // 文字也面向相机
  textPlane.renderOrder = 5; // 文字渲染顺序更高
  // 将文字添加到pile
  facilityBg.add(textPlane);
  facility.add(bottom, facilityBg);
  return facility;
}
// 创建摄像头
export function createCamera(cameraData, type) {
  const cameraSystem = new THREE.Group();
  cameraSystem.name = cameraData.type;

  const groupedCameras = groupCamerasByLane(cameraData);
  Object.keys(groupedCameras).forEach((lane) => {
    groupedCameras[lane].forEach((item, index) => {
      let cameraTexture = new THREE.TextureLoader().load(`./assets/images/road/device/camera.png`);
      cameraTexture.colorSpace = THREE.SRGBColorSpace; // 修正颜色偏差
      cameraTexture.wrapS = cameraTexture.wrapT = THREE.RepeatWrapping;
      let cameraMaterial = new THREE.MeshLambertMaterial({
        map: cameraTexture,
        transparent: true,
        side: THREE.DoubleSide,
        alphaTest: 0.1,
      });
      let camera = new THREE.Mesh(new THREE.PlaneGeometry(44, 38), cameraMaterial);
      camera.name = `CAMERA`;
      camera.position.y = 25;
      camera.position.x = -config.RoadLength / 2 + (index + 2) * 44;
      console.log('摄像头位置', item.roadLane);
      camera.position.z = type == 0 ? config.RoadWidth / 2 - item.roadLane * 36 + 20 : config.RoadWidth / 2 + item.roadLane * 36 - 210;
      camera.userData.isBillboard = false;
      camera.renderOrder = 5;
      camera.userData.isJump = false;
      camera.userData.data = { ...item, direction: type };
      cameraSystem.add(camera);
    });
  });
  return cameraSystem;
}
// 创建事件
export function createEvent(eventData, type) {
  console.log('创建事件', eventData);
  const eventGroup = new THREE.Group();

  eventData.forEach((item, index) => {
    let eventTexture = new THREE.TextureLoader().load(`./assets/images/road/event/${item.eventTypeId}/level-${item.eventLevel}.png`);
    eventTexture.colorSpace = THREE.SRGBColorSpace; // 修正颜色偏差
    eventTexture.wrapS = eventTexture.wrapT = THREE.RepeatWrapping;
    let eventMaterial = new THREE.MeshLambertMaterial({
      map: eventTexture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.1,
    });
    let event = new THREE.Mesh(new THREE.PlaneGeometry(44, 38), eventMaterial);
    event.name = item.eventTypeId;
    event.position.y = 25;
    event.position.x = -config.RoadLength / 2 + (index + 2) * 48;
    event.userData.isBillboard = false;
    event.userData.isJump = false;
    event.userData.data = { ...item, direction: type };
    event.renderOrder = 5;
    eventGroup.add(event);
  });
  return eventGroup;
}
// 创建桩号文字平面
export function createPileTexture(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // 设置画布尺寸
  const width = 256;
  const height = 128;
  canvas.width = width;
  canvas.height = height;
  // 绘制黑色半透明背景
  ctx.fillStyle = 'rgb(28,105, 46, 0.2)';
  ctx.fillRect(0, 0, width, height);

  // 设置文字样式
  ctx.font = '600 88px PingFangSC, PingFang SC';
  ctx.fillStyle = 'rgb(255, 255, 255, 0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // 绘制文字
  ctx.fillText(text, width / 2, height / 2);
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}
// 创建基础设施文字
export function createFacilityTexture(text) {
  console.log('创建基础设施文字', text);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // 设置画布尺寸
  const width = 300;
  const height = 128;
  canvas.width = width;
  canvas.height = height;
  // 绘制黑色半透明背景
  ctx.fillStyle = 'rgb(28,105, 46, 0.2)';
  ctx.fillRect(0, 0, width, height);

  // 设置文字样式
  ctx.font = '600 36px PingFangSC, PingFang SC';
  ctx.fillStyle = 'rgb(255, 255, 255, 0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // 绘制文字
  ctx.fillText(text, width / 2, height / 1.5);
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// 创建交通量、饱和度文字
export function createSingleTextTexture(text, fillStyle = '#ffffff') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // 测量文字尺寸
  ctx.font = '600 16px PingFangSC, PingFang SC';
  const textWidth = ctx.measureText(text).width;

  // 设置画布尺寸
  const width = textWidth + 20; // 左右留白
  const height = 33;
  canvas.width = width;
  canvas.height = height;

  // 绘制文字
  ctx.font = '600 16px PingFangSC, PingFang SC';
  ctx.fillStyle = fillStyle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// 创建路段方向文字
export function createDirectionNameTexture(data, type) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 512;
    canvas.height = 126;
    const arrowWidth = 76;
    const arrowHeight = 32;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.fillStyle = 'rgb(28,105, 46, 0.6)';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 加载图片
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = type === 0 ? './assets/images/road/icon-arrow-left-one.png' : './assets/images/road/icon-arrow-right-one.png';

    img.onload = function () {
      // 根据 type 值决定绘制顺序和位置
      if (type === 0) {
        // type 为 0：先绘制箭头（左侧），再绘制文字（右侧）

        // 绘制箭头（左侧）
        let arrowX = 0;
        let arrowY = canvas.height / 2 - arrowHeight / 2;
        ctx.drawImage(img, arrowX, arrowY, arrowWidth, arrowHeight);

        // 绘制文字（右侧，紧挨着箭头）
        const directionTxt = `${data.directionName}方向`;
        ctx.font = '600 36px PingFangSC, PingFang SC';
        ctx.fillStyle = '#CDD1E3';
        ctx.textAlign = 'left'; // 左对齐
        ctx.textBaseline = 'middle';
        ctx.fillText(directionTxt, arrowWidth + 10, canvas.height / 2); // 箭头右侧留10px间距
      } else {
        // 绘制文字（左侧）
        const directionTxt = `${data.directionName}方向`;
        ctx.font = '600 36px PingFangSC, PingFang SC';
        ctx.fillStyle = '#CDD1E3';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(directionTxt, 0, canvas.height / 2);

        // 测量文字宽度，确定箭头位置
        const textWidth = ctx.measureText(directionTxt).width;

        // 绘制箭头（右侧，紧挨着文字）
        let arrowX = textWidth + 20; // 文字右侧留20px间距
        let arrowY = canvas.height / 2 - arrowHeight / 2;
        ctx.drawImage(img, arrowX, arrowY, arrowWidth, arrowHeight);
      }

      // 创建纹理
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      resolve(texture);
    };
    img.onerror = function () {
      console.error('箭头图片加载失败');
      // 图片加载失败时，只显示文字
      const directionTxt = `${data.directionName}方向`;
      ctx.font = '600 36px PingFangSC, PingFang SC';
      ctx.fillStyle = '#CDD1E3';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(directionTxt, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      resolve(texture);
    };
  });
}
// 获取mesh 尺寸
export function getMeshSize(mesh) {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  return {
    width: box.max.x - box.min.x,
    height: box.max.y - box.min.y,
    depth: box.max.z - box.min.z,
    size: new THREE.Vector3(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z),
  };
}
// 获取group 的尺寸
export function getGroupDimensions(group) {
  if (!group) return { width: 0, height: 0, depth: 0 };
  const box = new THREE.Box3();
  // 更新世界矩阵
  group.updateWorldMatrix(true, true);

  // 遍历所有子元素
  group.traverse((child) => {
    if (child.isMesh && child.geometry) {
      // 获取几何体的包围盒（局部坐标）
      const geometryBox = new THREE.Box3().setFromBufferAttribute(child.geometry.attributes.position);

      // 应用对象的变换矩阵
      geometryBox.applyMatrix4(child.matrixWorld);
      // 合并到总包围盒
      box.union(geometryBox);
    }
  });
  const size = new THREE.Vector3();
  box.getSize(size);

  return {
    width: size.x,
    height: size.y,
    depth: size.z,
    boundingBox: box,
  };
}
// 摄像头根据车道分组
export function groupCamerasByLane(cameraArray) {
  const grouped = {};
  cameraArray.forEach((camera) => {
    const roadLane = camera.roadLane || camera.fields?.roadLane?.value || 'unknown';
    const laneKey = String(roadLane);
    // 初始化分组
    if (!grouped[laneKey]) {
      grouped[laneKey] = [];
    }
    // 添加到分组
    grouped[laneKey].push(camera);
  });
  return grouped;
}
// 获取配置信息
export function getRoadInfo() {
  return config;
}
// 加载模型
export function loaderModel(path, callback, progress) {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader(); // 如果是gltf压缩的模型，需要设置dracoLoader 否则报错
  dracoLoader.setDecoderPath('resources/draco/');
  dracoLoader.setDecoderConfig({ type: 'js' });
  loader.setDRACOLoader(dracoLoader);
  loader.load(
    path,
    (gltf) => {
      console.log('模型加载完成', gltf);
      callback(gltf.scene);
    },
    (xhr) => {
      progress && progress((xhr.loaded / xhr.total).toFixed(2) * 100); // 加载进度
    }
  );
}
// 添加css2d文本标签
export function addCss2dLabel(position = { x: 0, y: 0, z: 0 }, text = '') {
  const domDiv = document.createElement('div');
  domDiv.className = 'label';
  domDiv.textContent = text;
  let textLabel = new CSS2DObject(domDiv);
  textLabel.position.set(position.x, position.y, position.z);
  textLabel.name = text;
  return textLabel;
}

export function findObjectByName(scene, name, type) {
  let targetObject = null;

  scene.traverse((object) => {
    if (object.name === name && object.type === type) {
      targetObject = object;
    }
  });

  return targetObject;
}
