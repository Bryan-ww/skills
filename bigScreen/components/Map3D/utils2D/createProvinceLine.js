import { Fill, Stroke, Style } from 'ol/style.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Mask from 'ol-ext/filter/Mask';
import Crop from 'ol-ext/filter/Crop.js';
import { LineString } from 'ol/geom';
import Feature from 'ol/Feature.js';
import xinjiang_line from '../json/xinjiang_line.json?url'

const addMask = (options) => {
  return new Mask({
    feature: options.feature,
    wrapX: false,
    inner: options.inner || false,
    fill: new Fill({ color: options.fillColor }),
    shadowColor: options.shadowColor || 'rgba(0,0,0,0.5)',
    shadowWidth: options.shadowWidth || 10,
    antiAlias: false,
    // shadowMapUnits:true,
  });
};
const setLayerFilterCrop = (layer, feature) => {
  const crop = new Crop({
    feature: feature,
    inner: false,
    active: true,
    wrapX: true,
    shadowWidth: 10,
    shadowColor: '#000',
  });
  layer.addFilter(crop);
};

export const createAnimationLineLayer = (coordinates, options = {}) => {
  const len = coordinates.length;
  const isClose = options.isClose
  // 流光线需要的点数
  const lineLen = options.lineLen || 200;
  // 流光速度
  const speed = options.speed || 6
  let start = 0;
  let end = start + lineLen;
  const getLinePoints = () => {
    if (end < len) {
      return coordinates.slice(start, end);
    } else {
      let result = coordinates.slice(start);

      if (isClose) {
        let rest = coordinates.slice(0, end - len);
        return [...result, ...rest];
      } else {
        return result
      }
    }
  };
  const points = getLinePoints();
  const lineFeature = new Feature({
    geometry: new LineString(points),
  });
  const layer = new VectorLayer({
    source: new VectorSource({
      features: [lineFeature],
    }),
    style: options.style || new Style({
      stroke: new Stroke({
        color: options.color || '#43FBFF',
        width: options.width || 3,
      }),
    }),
    zIndex: 1,
  });

  let cancelRequest = null;
  function updateLine() {
    start += speed;
    if (start >= len) {
      start = 0;
    }
    end = start + lineLen;

    lineFeature.setGeometry(new LineString(getLinePoints()));

    // 继续下一帧动画
    cancelRequest = requestAnimationFrame(updateLine);
  }

  // 启动动画
  cancelRequest = requestAnimationFrame(updateLine);

  const cancelRequestHandle = () => {
    cancelAnimationFrame(cancelRequest);
  };
  layer.setZIndex(options.zIndex || 4)

  return { layer, cancelRequestHandle };
}

// 创建新疆边缘流光线
export const createProvinceAnimationLineLayer = async () => {
  const geoJson = await getJson(xinjiang_line);
  const featureOne = geoJson.features[0];
  const coordinates = featureOne.geometry.coordinates[0][0];

  return createAnimationLineLayer(coordinates, { isClose: true })
};

export const createProvinceLineLayerWithShadow = (geoJson, withShadow = false) => {
  const features = new GeoJSON().readFeatures(geoJson);

  const styles = [];

  if (!withShadow) {
    styles.push(
      new Style({
        stroke: new Stroke({
          color: '#3cbefd',
          width: 3,
        }),
      })
    );
  } else {
    styles.push(
      ...[
        new Style({
        stroke: new Stroke({
          color: '#3cbefd',
          width: 2,
        }),
      }),
        new Style({
          stroke: new Stroke({
            color: 'rgba(60, 190, 253, 0.5)',
            width: 3,
          }),
        }),
        new Style({
          stroke: new Stroke({
            color: 'rgba(60, 190, 253, 0.4)',
            width: 5,
          }),
        }),
        new Style({
          stroke: new Stroke({
            color: 'rgba(60, 190, 253, 0.3)',
            width: 10,
          }),
        }),
        new Style({
          stroke: new Stroke({
            color: 'rgba(60, 190, 253, 0.1)',
            width: 15,
          }),
        }),
        new Style({
          stroke: new Stroke({
            color: 'rgba(60, 190, 253, 0.03)',
            width: 20,
          }),
        }),
      ]
    );
  }

  const layer = new VectorLayer({
    source: new VectorSource({
      features: features,
    }),
    style: styles,
  });

  // 这种阴影效果好，但是极其耗费性能
  // if (withShadow) {
  //   //内发光
  //   let mask = addMask({
  //     fillColor: "rgba(59, 130, 246, 0.0)",
  //     shadowColor: "#3cbefd",
  //     feature: features[0],
  //     inner: false,
  //   });
  //   console.log('mask', mask)
  //   //设置裁切
  //   setLayerFilterCrop(layer, features[0]);
  //   layer.addFilter(mask);
  // }

  layer.setZIndex(withShadow ? 0 : 3);

  return layer;
};

export const createXinJiangLineLayerWithShadow = async () => {
  const geoJson = await getJson(xinjiang_line);

  const layerWithShadow = createProvinceLineLayerWithShadow(geoJson, true);
  const layer = createProvinceLineLayerWithShadow(geoJson, false);

  return { layer, layerWithShadow };
};

export const getJson = async (url) => {
  const geoJson = await fetch(url, {
    method: 'GET',
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      return data;
    })
    .catch((error) => {
      return {};
    });
  return geoJson;
};
