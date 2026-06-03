import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { TileSuperMapRest } from '@supermapgis/iclient-ol';
import { defaults as defaultControls } from 'ol/control.js'; // 引入默认控件
import { defaults as defaultInteractions, DoubleClickZoom } from 'ol/interaction';

export const mapCenter = [84.75374962713806, 42.04267930154598];
export const maxZoom = 18;
export const initZoom = 6.18;
export const createMap = (target, defaultLayer) => {
  // const projection = 'EPSG:3857';
  const projection = 'EPSG:4326';
  const url = localStorage.getItem('mapDefaultUrlStorageKey') || `${import.meta.env.VITE_ISERVER_URL}/services/XJyingxiang_2000/rest/maps/XJyingxiang_2000`;
  const blueUrl = `${import.meta.env.VITE_ISERVER_URL}/services/map-zhdt-2/rest/maps/综合地图_无路网`;
  // const blueUrl = `${import.meta.env.VITE_ISERVER_URL}/services/map-zhdt-2/rest/maps/综合地图_无路网_世界`;
  const whiteUrl = `${import.meta.env.VITE_ISERVER_URL}/services/map-zhdt/rest/maps/综合地图_无路网`;
  const map = new Map({
    target: target,
    view: new View({
      center: mapCenter,
      zoom: initZoom,
      maxZoom: maxZoom,
      projection: projection,
    }),
    interactions: defaultInteractions({ doubleClickZoom: false }),
    controls: defaultControls({
      attribution: false // 关键：设置为 false 隐藏默认版权控件
    })
  });
  const layer = new TileLayer({
    source: new TileSuperMapRest({
      url: url,
      format: 'webp',
      wrapX: true,
      wrapY: true,
      prjCoordSys: { epsgCode: 4490 },
    }),

    projection: projection,
  });
  layer.set('2dLayerType', 'yingxiang');
  layer.setZIndex(2);
  const blueLayer = new TileLayer({
    source: new TileSuperMapRest({
      url: blueUrl,
      wrapX: true,
      wrapY: true,
      prjCoordSys: { epsgCode: 4326 },
    }),

    projection: projection,
  });
  blueLayer.set('2dLayerType', 'blue');
  blueLayer.setZIndex(2);
  const whiteLayer = new TileLayer({
    source: new TileSuperMapRest({
      url: whiteUrl,
      wrapX: true,
      wrapY: true,
      prjCoordSys: { epsgCode: 4326 },
    }),

    projection: projection,
  });
  whiteLayer.set('2dLayerType', 'white');
  whiteLayer.setZIndex(2);

  // const defaultLayerType = sessionStorage.getItem('2dLayerType');
  const defaultLayerType = defaultLayer || 'yingxiang'
  switch (defaultLayerType) {
    case 'yingxiang':
      map.addLayer(layer);
      break;
    case 'blue':
      map.addLayer(blueLayer);
      break;
    case 'white':
      map.addLayer(whiteLayer);
      break;
    default:
      map.addLayer(blueLayer);
      break;
  }

  return { map, layer, blueLayer, whiteLayer };
};

// 米转度的计算函数（基于地球半径）
export function metersToDegrees(meters, latitude) {
  // 地球半径（米）
  const R = 6378137;
  // 计算纬度方向的米转度
  const degreesLat = meters / (111319.49079327358 * Math.cos(latitude * Math.PI / 180));
  return degreesLat;
}
