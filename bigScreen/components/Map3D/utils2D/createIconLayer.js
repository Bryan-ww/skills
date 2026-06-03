import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text } from 'ol/style.js';
import { Vector as VectorSource, Cluster } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { transformEventType, getEventColors } from '../utils/util';
import { getInfrasDataFns } from "../mini2d/utils/getPoi";

import {
  infrasData,
  baseIconColors,
  INFRAS_TYPE
} from '../utils/infrasData.js'

// 4, "交通拥堵"
// 101, "交通事故"
// 201, "道路施工"
// 301,"交通管制"
// 401, "气象环境"
// 901, "其他"
const eventTypes = {
  '4': {},
  '101': {},
  '201': {},
  '301': {},
  '401': {},
  '901': {},
}
const scaleFactor = 0.8
const cameraIconFactor = scaleFactor / 1.5
const scale = 0.4 * scaleFactor;
export const createStateIconStyle = (config = {}) => {
  const defaultConfig = {}
  let src = `/assets/images/infras/${config.baseIcon || 'normal'}.png`
  if (config.state === 'OFFLINE') {
    src = `/assets/images/infras/offline.png`
  }
  if (config.fullIcon) {
    src = config.fullIcon;
  }
  const iconStyle = new Style({
    image: new Icon({
      scale: scale,
      anchor: [0.5, 1],
      src: src,
    }),
    zIndex: 100,
  });
  return iconStyle
}

export const createIconStyle = (config = {}) => {
  let iconStyle;
  iconStyle = new Style({
    image: new Icon({
      scale: scale,
      anchor: config.anchor || [0.5, 3],
      src: `/assets/images/infras/${config.type}_f.png`,
    }),
    zIndex: 200,
  });

  return iconStyle
}

export const createEventIconStyle = (config = {}) => {
  let iconStyle;
  iconStyle = new Style({
    image: new Icon({
      scale: scale * 0.7,
      anchor: [0.5, 1],
      src: `/assets/images/event/${config.eventType}.png`,
    }),
    zIndex: 200,
  });

  return iconStyle
}

const initEventIconStyle = () => {
  for(const [key, value] of Object.entries(eventTypes)) {
    value.iconStyle = createEventIconStyle({ eventType: key })
  }
}
initEventIconStyle()


export const createIconFeature = (point) => {
  const iconFeature = new Feature({
    geometry: new Point(point)
  })
  return iconFeature
}

export const createIconLayer = (data, config = {}) => {
  const points = data.list
  let iconStyle = null
  let stateIconStyle = null
  let offLineIconStyle = null
  const isEvent = data.type === INFRAS_TYPE.TRAFFIC_EVENT
  if (!isEvent) {
    iconStyle = createIconStyle({ type: data.type, anchor: data.anchor })
    stateIconStyle = createStateIconStyle({ state: 'ONLINE', baseIcon: data.baseIcon, fullIcon: data.fullIcon })
    offLineIconStyle = createStateIconStyle({ state: 'OFFLINE', baseIcon: data.baseIcon, fullIcon: data.fullIcon })
  }

  const iconFeatures = points.map(point => {
    const iconFeature = createIconFeature(point.lnglat)
    iconFeature.set('data', {
      baseIcon: data.baseIcon,
      ...point
    })
    if (isEvent) {
      let eventType = transformEventType(point.eventType) 
      const temp = eventTypes[eventType] || eventTypes['901']
      iconFeature.setStyle([temp.iconStyle])
    } else {
      if (point.properties?.onlineStatus === 'OFFLINE') {
        iconFeature.setStyle([offLineIconStyle, iconStyle])
      } else {
        iconFeature.setStyle([stateIconStyle, iconStyle])
      }

    }

    return iconFeature
  })
  const vectorSource = new VectorSource({
    features: iconFeatures,
  });

  if (config.notUseCluster) {
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    vectorLayer.setZIndex(10)

    return vectorLayer

  } else {
    const clusterSource = new Cluster({
      distance: 55,
      source: vectorSource,
    });

    const clusters = new VectorLayer({
      source: clusterSource,
      style: clusterStyle,
    });
    clusters.isCluster = true
    clusters.setZIndex(10)

    return clusters
  }
}

const badgeCache = {}
function clusterStyle(feature) {
  const size = feature.get('features').length;
  if (size === 0) {
    return new Style({})
  }
  const originalFeature = feature.get('features')[0];
  
  const featureData = originalFeature.get('data')
  let badgeColor = baseIconColors[featureData.baseIcon] || '#ff0000'
  if (featureData.type === INFRAS_TYPE.TRAFFIC_EVENT) {
    badgeColor = getEventColors(featureData.eventType)
  }
  
  const styles = originalFeature.getStyle()
  if (size > 1) {
    const key = size + badgeColor
    let badge = badgeCache[key]
    if (!badge) {
      badge = createBadge({ width: 30 * cameraIconFactor, height: 30 * cameraIconFactor }, size, badgeColor)
      badgeCache[key] = badge
    }
    return [
      new Style({
        image: new Icon({
          img: badge,
          imgSize: [badge.width, badge.height],
          // anchor: featureData.type === INFRAS_TYPE.TRAFFIC_EVENT ? [-0.3, 2.7] : [-0.2, 2.5 ],
          // 2倍偏移
          anchor: featureData.type === INFRAS_TYPE.TRAFFIC_EVENT ? [-0.8, 2.6] : [-0.6, 2.65 ],
          zIndex: 300
        }),
      }),
      ...styles
    ];
  }

  return styles
}

function createBadge(size, text, badgeColor) {
  // 创建 Canvas 并设置尺寸
  const canvas = document.createElement('canvas');
  const lineWidth = 2 * cameraIconFactor
  canvas.width = size.width + lineWidth * 2;
  canvas.height = size.height + lineWidth * 2;
  const ctx = canvas.getContext('2d');
  const radius = size.width / 2;
  // 设置角标样式
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.width / 2, radius, 0, Math.PI * 2);
  ctx.strokeStyle = badgeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.fill();

  // 设置文字样式
  ctx.fillStyle = badgeColor;
  ctx.font = `bold ${16 * cameraIconFactor}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.width / 2);

  return canvas
}


export const createIconLayers = (map, initVisible = false) => {
  const layers = {}

  function createLayer(item) {
    const api = getInfrasDataFns[item.type]
    if (api) {
      return api().then(res => {
        if (res.list && res.list.length > 0) {
          item.list = res.list
          const layer = createIconLayer(res)
          layers[res.type] = layer
          layer.setVisible(initVisible)
          map.addLayer(layer)
        }
      })
    } else {
      if (item.list && item.list.length > 0) {
        const layer = createIconLayer(item)
        layers[item.type] = layer
        layer.setVisible(initVisible)
        map.addLayer(layer)
        return Promise.resolve(layer)
      }
      return Promise.resolve(null)
    }
  }

  return Promise.all(infrasData.map(item => {
    return createLayer(item)
  })).then(() => {
    return layers
  })
}

export const createIconLayerByType = (type, list, config = {}) => {
  const data = infrasData.find(i => i.type === type)
  if (data) {
    data.list = list
    const layer = createIconLayer(data, config)
    return layer
  } else {
    return null
  }
}

