import Feature from 'ol/Feature.js';
import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { LineString, MultiLineString } from 'ol/geom';
import LayerGroup from 'ol/layer/Group.js';
import Collection from 'ol/Collection.js';
import { getGDGS, getSDGS, getJTSDGS, getJTGDGS } from '../mini2d/utils/getPoi';
import { groupBy } from 'lodash';
// import { getAreaJsonPub, getAllLinkStateMap } from '@/api/bigscreen/roadOperation';

// 创建国道高速
export const createGDGS = async (config = {}) => {
  const gdgs = await getGDGS();
  return createRoadLayers(gdgs, config);
};

// 创建省道高速
export const createSDGS = async (config = {}) => {
  const sdgs = await getSDGS();
  return createRoadLayers(sdgs, config);
};

// 创建交投国道高速
export const createJTGDGS = async (config = {}) => {
  const gdgs = await getJTGDGS();
  return createRoadLayers(gdgs, config);
};

// 创建交投省道高速
export const createJTSDGS = async (config = {}) => {
  const sdgs = await getJTSDGS();
  return createRoadLayers(sdgs, config);
};

export const createRoadLayers = async (geojson, config) => {
  let groupedRoads = null;
  if (!config.originalData) {
    groupedRoads = groupBy(geojson, (item) => item.properties.LXBM);
  } else {
    groupedRoads = geojson;
  }

  const layers = [];
  const layerGroup = new LayerGroup();
  for (const key of Object.keys(groupedRoads)) {
    // 把省道和国道剔除
    // if (key.length === 4) {
    //   continue
    // }
    const roadData = groupedRoads[key];
    const styles = config.style || [
      new Style({
        stroke: new Stroke({
          color: (config.color || '#04cdf6') + (config.opacity || 'ff'),
          width: config.width || 10,
        }),
      }),
    ];
    const coordinates = []
    roadData.forEach((i) => {
      if (i.geometry.type === 'MultiLineString') {
        i.geometry.coordinates.forEach(j => {
          coordinates.push(j)
        })
      } else {
        coordinates.push(i.geometry.coordinates)
      }
    })

    const multiLineString = new MultiLineString(coordinates);
    const feature = new Feature({
      geometry: multiLineString,
      type: 'ROAD_GDGS', // 设置可识别的类型
      roadData: {
        // 添加需要的道路数据
        name: key,
        properties: roadData[0].properties,
      },
    });

    feature.setStyle(styles);

    // const features = []
    // roadData.forEach(item => {
    //   const feature = new Feature({
    //     geometry: new LineString(item.geometry.coordinates),
    //     // name: key
    //   });
    //
    //   feature.setStyle(styles);
    //   features.push(feature);
    // })

    const vectorSource = new VectorSource({
      features: [feature],
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    vectorLayer.setZIndex(config.zIndex || 3);

    layers.push(vectorLayer);
  }
  layerGroup.setLayers(new Collection(layers));

  return layerGroup;
};

export const updateCongestionSituation = async (congestionStateMap) => {
  const { data } = await getAllLinkStateMap();
  const congestionStatePoints = {};
  let points = [];
  const features = [];
  for (let linkId in data) {
     // state 1畅通 2缓慢 3拥堵 4极度拥堵 5⽆数据
    const state = data[linkId]
    const coordListData = congestionStateMap[linkId]?.simpleListData
    if (!coordListData) {
      continue
    }
   
    for (let i = 0; i < coordListData.length; i += 2) {
      points.push([coordListData[i], coordListData[i + 1]]);
    }
    const feature = createCongestionSituationFeature(points, state);
    features.push(feature);
    const list = congestionStatePoints[state] || [];
    list.push(points);
    congestionStatePoints[state] = list;
    points = [];
  }
  const vectorSource = new VectorSource({
    features: features,
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });
  vectorLayer.setZIndex(3);

  return {
    vectorLayer,
    congestionStatePoints,
  };
};

// 展示线路拥堵情况
export const displayCongestionSituation = async () => {
  return getAreaJsonPub().then(({ data }) => {
    let points = [];
    const features = [];
    if (!data || data.length === 0) {
      return {};
    }
    const linkMap = {};
    const congestionStatePoints = {};
    for (const item of data) {
      // state 1畅通 2缓慢 3拥堵 4极度拥堵 5⽆数据
      const { simpleListData: coordListData, state } = item;
      linkMap[item.linkId] = item;
      if (!coordListData) {
        continue;
      }
      for (let i = 0; i < coordListData.length; i += 2) {
        points.push([coordListData[i], coordListData[i + 1]]);
      }
      // 全部状态变成1，拥堵状态用getAllLinkStateMap获取
      const feature = createCongestionSituationFeature(points, 1);
      features.push(feature);
      const list = congestionStatePoints[state] || [];
      list.push(points);
      congestionStatePoints[state] = list;
      points = [];
    }
    const vectorSource = new VectorSource({
      features: features,
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    vectorLayer.setZIndex(2);

    return {
      vectorLayer,
      congestionStatePoints,
      congestionStateMap: linkMap,
    };
  });
};
// 不同拥堵状态颜色
export const congestionSituationColors = {
  1: 'rgba(0, 177, 83, 0.4)',
  2: 'rgba(254, 253, 4, 0.4)',
  3: 'rgba(255, 144, 38, 0.4)',
  4: 'rgba(196, 1, 2, 0.4)',
  5: 'rgba(0, 177, 83, 0.4)',
};
export const createCongestionSituationFeature = (points, state) => {
  // state 1畅通 2缓慢 3拥堵 4极度拥堵 5⽆数据
  const feature = new Feature({
    geometry: new LineString(points),
  });

  const style = new Style({
    stroke: new Stroke({
      color: congestionSituationColors[state],
      width: 8,
    }),
    zIndex: 10 + state,
  });

  feature.setStyle(style);

  return feature;
}


const mergeMultiLineString = (list) => {
  if (list.length <= 1) {
    return list
  }
  const result = []
  let currentLine = list[0]
  for(let i = 1; i < list.length; i++) {
    const line = list[i]
    const lastPoint = currentLine[currentLine.length - 1]
    const nextFirstPoint = line[0]
    if (lastPoint[0] === nextFirstPoint[0]) {
      currentLine.push(...line)
    } else {
      result.push(currentLine)
      currentLine = line
    }
  }
  result.push(currentLine)

  return result
}
