import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { Icon, Style } from 'ol/style.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { preloadImages } from '../utils/util';

import gd_bg from '../images/gd_bg.png'
import sd_bg from '../images/sd_bg.png'
import gdgs_bg from '../images/gdgs_bg.png'
import sdgs_bg from '../images/sdgs_bg.png'

/**
 * 创建道路标牌图层
 * @param {Object} existList - 道路标牌数据列表
 * @param {string} existList.type - 道路标牌类型，可选'gd'、'sd'、'gdgs'、'sdgs'
 * @param {string} existList.name - 道路标牌名称
 * @param {Array<number>} existList.lnglat - 道路标牌经纬度 [88.0, 22.0]
 * @returns {Promise<VectorLayer>} - 返回创建好的道路标牌图层
 */
export const createRoadSignLayer = async (existList) => {
  const features = []
  const list = existList
  const imgs = await Promise.all([
    preloadImages([gd_bg]),
    preloadImages([sd_bg]),
    preloadImages([gdgs_bg]),
    preloadImages([sdgs_bg]),
  ]).then(res => {
    return res.flat()
  })
  for(const item of list) {
    features.push(createFeatures(item, imgs))
  }
  const vectorSource = new VectorSource({
    features: features,
  });
  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });
  vectorLayer.setZIndex(5)

  return vectorLayer
}

const createFeatures = (data, imgs) => {
  const feature = new Feature({
    geometry: new Point(data.lnglat)
  })
  const canvasImg = createCanvasImage(data, imgs)
  const style = new Style({
    image: new Icon({
      img: canvasImg,
      imgSize: [canvasImg.width, canvasImg.height],
      anchor: [0.5, 0.5],
      zIndex: 10
    }),
  })
  feature.setStyle([style])
  feature.set('data', data)
  feature.set('type', 'roadSign')

  return feature
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
  const scale = 0.26
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  // 设置角标样式
  ctx.beginPath();
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // 设置文字样式
  ctx.fillStyle = type === 'sd' ? 'black' : 'white';
  ctx.font = 'normal 10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.name, canvas.width / 2, canvas.height / 1.8);

  return canvas
}