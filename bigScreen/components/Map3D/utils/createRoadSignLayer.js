import { Group, Vector3, MeshBasicMaterial, Mesh, TextureLoader, CanvasTexture, DoubleSide, SRGBColorSpace, PlaneGeometry } from 'three';
import { preloadImages } from './util';
import GDGS from '../json/GDGS.json'
import SDGS from '../json/SDGS.json'
import { hideSDAndGD } from './config.js'

import gd_bg from '../images/gd_bg.png?url'
import sd_bg from '../images/sd_bg.png?url'
import gdgs_bg from '../images/gdgs_bg.png?url'
import sdgs_bg from '../images/sdgs_bg.png?url'

export const getRoadType = (roadName) => {
  if (roadName.startsWith('S')) {
    return roadName.length === 4 ? 'sd' : 'sdgs'
  }
  if (roadName.startsWith('G')) {
    return roadName.length === 4 ? 'gd' : 'gdgs'
  }
}


export const getRoadSigns = () => {
  let list = []
  const replaceRoads = {
    'G216': [88.411248,44.090632],
    'G7': [89.482189,43.922253],
    'G30': [91.609417,43.383715],
    'G3003': [87.824853,44.028459],
    'G3016': [80.814891,44.106346],
    'G219': [82.305951,44.907095],
    'G3018': [82.871747,44.720046],
    'G217': [84.841572,44.709977],
    'G0612': [83.734264,37.559611],
    'S22': [94.904284,42.455101],
  }
  const deleteRoads = ['G312']
  for(const name of Object.keys(SDGS)) {
    const type = getRoadType(name)
    // 把省道和国道剔除
    if (type === 'sd' && hideSDAndGD) {
      continue
    }
    const oneItem = SDGS[name][Math.floor(SDGS[name].length / 2)]
    list.push({
      name,
      type,
      lnglat: oneItem.roadCardLnglat
    })
  }
  for(const name of Object.keys(GDGS)) {
    const type = getRoadType(name)
    // 把省道和国道剔除
    if (type === 'gd' && hideSDAndGD) {
      continue
    }
    const oneItem = GDGS[name][Math.floor(GDGS[name].length / 2)]
    list.push({
      name,
      type,
      lnglat: oneItem.roadCardLnglat
    })
  }
  list = list.filter(i => !deleteRoads.includes(i.name))
  list.forEach(item => {
    const repalceData = replaceRoads[item.name]
    if (repalceData) {
      item.lnglat = repalceData
    }
  })

  return list
}

export const createCanvasImage = (data, imgs) => {
  const { type } = data
  const imgIndexMap = {
    'gd': 0,
    'sd': 1,
    'gdgs': 2,
    'sdgs': 3,
  }
  const img = imgs[imgIndexMap[type]]
  const canvas = document.createElement('canvas');
  const height = 76
  const width = data.name.length * 20 + 40
  const scale = 0.4
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  // 设置角标样式
  ctx.beginPath();
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // 设置文字样式
  ctx.fillStyle = type === 'sd' ? 'black' : 'white';
  ctx.font = 'normal 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.name, canvas.width / 2, canvas.height / 1.8);

  return canvas
}

export class CreateRoadSignLayer {
  constructor(thisObject) {
    this.thisObject = thisObject;
    this.assets = thisObject.assets;
    this.scene = thisObject.scene;
    this.textGroup = new Group();
    this.list = getRoadSigns();
    this.labels = []

    this.labelScale = 0.006
  }
  show() {
    this.textGroup.visible = true
  }
  hide() {
    this.textGroup.visible = false
  }
  createLayer() {
    this.textGroup.rotation.x = -Math.PI / 2;
    this.scene.add(this.textGroup);

    const labelScale = this.labelScale;
    const createLabel = (data, position) => {
      let label = this.thisObject.label3d.create('', `road-name-card ${data.type}`, false);
      
      let z = position[2];
      label.init(
        `${data.name}`,
        new Vector3(position[0], position[1], z)
      );
      const scale = labelScale;
      label.originZ = z;
      label.element.style.pointerEvents = 'none';
      label.scale.set(scale, scale, scale);
      label.setParent(this.textGroup);
      label.show();
      return label;
    };

    this.list.forEach(async (item) => {
      let [x, y] = this.thisObject.geoProjection(item.lnglat);
      let position = [x, -y, this.thisObject.depth + 0.3];

      const label = createLabel(item, position);
      this.labels.push(label);
    });
  }
  // 根据摄像头的距离试试调整sprite的大小
  distanceChange(distance) {
    if (!this.textGroup.visible) {
      return
    }
    const rate = distance / this.thisObject.toTargetDistance
    const labelScale = this.labelScale * rate
    this.labels.forEach(label => {
      label.scale.set(labelScale, labelScale, labelScale)
    })
  }
  destroy() {
  }
}

export class CreateRoadSignMesh {
  constructor(thisObject) {
    this.thisObject = thisObject;
    this.assets = thisObject.assets;
    this.scene = thisObject.scene;
    this.textGroup = new Group();
    this.textGroup.renderOrder = 3
    this.list = getRoadSigns();
    this.meshes = []
    this.scale = 0.007
  }
  show() {
    this.textGroup.visible = true
  }
  hide() {
    this.textGroup.visible = false
  }
  async createLayer() {
    const imgs = await Promise.all([
      preloadImages([gd_bg]),
      preloadImages([sd_bg]),
      preloadImages([gdgs_bg]),
      preloadImages([sdgs_bg]),
    ]).then(res => {
      return res.flat()
    })
    this.textGroup.rotation.x = -Math.PI / 2;
    this.scene.add(this.textGroup);
    const scale = this.scale

    this.list.forEach((item) => {
      let [x, y] = this.thisObject.geoProjection(item.lnglat);
      let position = [x, -y, this.thisObject.depth + 0.5, ];

      const canvasImg = createCanvasImage(item, imgs)
      const texture = new CanvasTexture(canvasImg)
      texture.colorSpace = SRGBColorSpace
      const g = new PlaneGeometry(canvasImg.width, canvasImg.height)
      const m = new MeshBasicMaterial({ map: texture, fog: false, side: DoubleSide, depthWrite: false })
      const mesh = new Mesh(g, m)
      mesh.position.set(...position)
      mesh.scale.set(scale, scale, scale)
      this.textGroup.add(mesh)
      this.meshes.push(mesh);
    });
  }
  // 根据摄像头的距离试试调整sprite的大小
  distanceChange(distance) {
    if (!this.textGroup.visible) {
      return
    }
    const rate = distance / this.thisObject.toTargetDistance
    const scale = this.scale * rate
    this.meshes.forEach(label => {
      label.scale.set(scale, scale, scale)
    })
  }
}
