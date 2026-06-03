import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import MultiLineString from 'ol/geom/MultiLineString';
import Feature from 'ol/Feature';
import { Fill, Stroke, Circle, Style, Text, Icon } from 'ol/style';
import { TileSuperMapRest } from '@supermapgis/iclient-ol';
import Overlay from 'ol/Overlay';
import { getVueMarkerData } from '@/utils/map';
import Player from '@/components/Jessibuca/player.vue';
import Video from '@/components/Jessibuca/video.vue';
import { boundingExtent } from 'ol/extent';
import LayerGroup from 'ol/layer/Group.js';
import Collection from 'ol/Collection.js';
import { getVectorContext } from 'ol/render';

export const createDeviceLayer = (devices, config) => {
  const features = [];
  const styles = {
    CAMERA: new Style({
      image: new Icon({
        src: `/assets/images/map-marker/CAMERA.png`,
        anchor: [0.5, 1],
        scale: 0.5,
      }),
    }),
    INFO_BOARD: new Style({
      image: new Icon({
        src: `/assets/images/map-marker/INFO_BOARD.png`,
        anchor: [0.5, 1],
        scale: 0.5,
      }),
    }),
  };

  devices.forEach((i) => {
    const feature = new Feature({
      geometry: new Point([i.lng, i.lat]),
      type: 'DEVICE', // 设置可识别的类型
      extData: i.extData || {},
    });
    feature.setStyle(styles[i.deviceType]);
    features.push(feature);
  });

  const vectorSource = new VectorSource({
    features: features,
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });
  vectorLayer.setZIndex(config.zIndex || 3);

  return vectorLayer;
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
    const roadData = groupedRoads[key];
    const styles = config.style || [
      new Style({
        stroke: new Stroke({
          color: (config.color || '#04cdf6') + (config.opacity || 'aa'),
          width: config.width || 10,
        }),
      }),
    ];
    const coordinates = [];
    roadData.forEach((i) => {
      if (i.geometry.type === 'MultiLineString') {
        i.geometry.coordinates.forEach((j) => {
          coordinates.push(j);
        });
      } else {
        coordinates.push(i.geometry.coordinates);
      }
    });

    const multiLineString = new MultiLineString(coordinates);
    const feature = new Feature({
      geometry: multiLineString,
      type: 'ROAD_GDGS', // 设置可识别的类型
    });

    feature.setStyle(styles);

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

/**
 * 调整地图视图以适应多个overlay
 * @param {Array<Overlay>} overlays 要调整视图的overlay数组
 * @param {Map} map 地图实例
 * @param {Array<number>} padding 视图边距，[上, 右, 下, 左] 格式
 * @param {number} [maxZoom=20] 最大缩放级别
 */
export const setOverlaysFitView = (overlays, map, padding, maxZoom = 20) => {
  if (overlays.length === 0) {
    return;
  }

  const points = [];

  overlays.forEach((overlay) => {
    const position = overlay.getPosition();
    if (position) {
      points.push(position);
    }
  });

  const extent = boundingExtent(points);

  try {
    map.getView().fit(extent, {
      size: map.getSize(), // 地图容器尺寸
      padding: padding || [0, 200, 0, 200], // 边距（上、右、下、左），避免要素贴边
      maxZoom: maxZoom, // 最大缩放级别
      duration: 1000, // 动画过渡时间（毫秒），0表示无动画
    });
  } catch (error) {
    console.log('error', error);
  }
};

/**
 * 判断地图是否包含指定的overlay
 * @param {Map} map 地图实例
 * @param {Overlay} overlay 要判断的overlay
 * @returns {boolean} 是否包含指定的overlay
 */
export const hasOverlay = (map, overlay) => {
  return map.getOverlays().getArray().includes(overlay);
};

/**
 * 创建高速国道图层
 * @returns {VectorLayer} 高速国道图层
 */
export const createGDGSLayer = () => {
  const projection = 'EPSG:4326';
  const url = `${import.meta.env.VITE_ISERVER_URL}/services/map-luxian/rest/maps/年报高速国道大屏`;

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
  layer.setZIndex(3);

  return layer;
};

/**
 * 为路网图层添加箭头
 * @param {VectorLayer} roadLayer 路网图层
 * @param {Map} map 地图实例
 * @param {Object} options 配置选项
 * @param {number} [options.imageScale=0.4] 箭头图片缩放比例
 * @param {number} [options.gap=100] 箭头间距（像素）
 * @param {boolean} [options.animation=false] 是否启用动画
 */
export const attachArrowToRoad = (roadLayer, map, { imageScale = 0.4, gap = 100, animation = false }) => {
  let offset = 0.01;
  const arrowImage = new Image(32, 32);
  arrowImage.src = '/assets/images/up-arrow.png';

  const postrenderHandle = (evt) => {
    const vct = getVectorContext(evt);

    const features = roadLayer.getSource().getFeatures();

    features.forEach((street) => {
      const numArr = Math.ceil(street.getGeometry().getLength() / map.getView().getResolution() / gap);
      const points = [];
      const positions = [];
      for (let i = 0; i <= numArr; i++) {
        let fracPos = i / numArr + offset;
        if (fracPos > 1) fracPos -= 1;
        const coordinate = street.getGeometry().getCoordinateAt(fracPos);
        positions.push(fracPos);
        const pf = new Feature(new Point(coordinate));
        points.push(pf);
      }

      points.forEach((item, index) => {
        const coord = item.getGeometry().getFirstCoordinate();
        const cPoint = street.getGeometry().getCoordinateAt(positions[index] - 0.0001);

        const dx = cPoint[0] - coord[0];
        const dy = cPoint[1] - coord[1];
        let rotation = Math.atan(dx / dy);
        rotation = dy > 0 ? rotation : Math.PI + rotation;
        vct.setStyle(
          new Style({
            image: new Icon({
              img: arrowImage,
              imgSize: [32, 32],
              scale: imageScale,
              rotation: rotation,
            }),
          })
        );
        vct.drawGeometry(item.getGeometry());
      });
    });

    if (animation) {
      offset = offset + 0.003;
      if (offset >= 1) offset = 0.001;
      map.render();
    }
  };

  roadLayer.on('postrender', postrenderHandle);

  roadLayer.postrenderHandle = postrenderHandle;
};

/**
 * 创建高速国道图层
 * @param {Array<number[]>} points 点数组，每个点为 [经度, 纬度] 格式
 * @param {{color: string, width: number}} [options={}] 样式选项，包含 color（线颜色）和 width（线宽度）
 * @returns {VectorLayer} 线路图层
 */
export const createRoadLayer = (points, options = {}) => {
  const lineString = new LineString(points);

  const feature = new Feature({
    geometry: lineString,
  });

  const source = new VectorSource({
    features: [feature],
  });

  const style = new Style({
    stroke: new Stroke({
      color: options.color || '#ff0000',
      width: options.width || 3,
    }),
  });

  const layer = new VectorLayer({
    source: source,
    style: style,
  });

  layer.setZIndex(5);

  return layer;
};

/**
 * 创建类型1起始点marker
 * @param {Array} lnglat 经纬度 [lng, lat]
 * @param {Object} options 配置项
 * @returns {Overlay} 返回Overlay实例
 */
export const addStartEndOverlayType1 = (lnglat, options = {}) => {
  const element = document.createElement('div');
  element.className = 'start-end-marker1';

  const overlay = new Overlay({
    element: element,
    position: lnglat,
    positioning: 'center-center',
    stopEvent: false,
  });

  return overlay;
};

/**
 * 创建类型2起始点marker
 * @param {Object} options 配置项
 * @returns {Overlay} 返回Overlay实例
 */
export const addStartEndOverlayType2 = ({ position, iconUrl, name, offset = [0, 0], bubble = false }) => {
  const element = document.createElement('div');
  element.className = 'map-marker-box road-line-point';
  element.innerHTML = `
    <img class="marker-icon w-[0.28rem]" src="${iconUrl}" alt="" />
    <div class="point-name">${name}</div>
  `;

  const overlay = new Overlay({
    element: element,
    position: position,
    positioning: 'center-center',
    offset: offset,
    stopEvent: !bubble,
  });

  return overlay;
};

// 添加路线上的救援信息
export const addRescueOverlay = (rescueData, { direction, offset }) => {
  const { title, position = [], contacts = [] } = rescueData;

  const element = document.createElement('div');
  element.innerHTML = `
      <div class="map-marker-box">
        <div class="screen-event-card marker-info">
          <div class="marker-title">${title}</div>
          ${contacts.map((item) => `<div class="rescue-contact">${item.contactName}:<a href="tel:${item.contactPhone}">${item.contactPhone}</a></div>`).join('')}
        </div>
        <div class="car-${direction}">
          <img class="marker-icon w-[0.54rem]" src="/assets/images/rescue-car.png" alt="" />
        </div>
      </div>
    `;

  const overlay = new Overlay({
    element: element,
    position: position,
    positioning: 'center-center',
    offset: offset || [0, 0],
    stopEvent: false,
  });

  return overlay;
};

/**
 * 创建拥堵路段详情overlay
 * @param {Object} options 配置项
 * @returns {Overlay} 返回Overlay实例
 */
export const addCongestionDetailOverlay = ({ notFitView = false, position, positioning, offset, eventTitle, className, style, content1, content2, content2Title }) => {
  const title = eventTitle || '拥堵路段详情';
  const boxClass = className || '';
  const boxStyle = style || '';

  const element = document.createElement('div');
  element.className = `map-marker-box video-marker ${boxClass}`;
  element.style.paddingBottom = '0.1rem';
  element.style.cssText += boxStyle;
  element.innerHTML = `
    <div class="screen-event-card monitor-info" style="display: flex; flex-direction: column;height: auto;">
      <div class="marker-title">${title}</div>
      <div class="content1">${content1}</div>
      <div class="content2">
        <div class="content2-title">${content2Title}</div>
        <div class="content2-content">${content2}</div>
      </div>
    </div>
  `;

  const overlay = new Overlay({
    element: element,
    position: position,
    positioning: positioning || 'center-center',
    stopEvent: false,
    zIndex: 13,
    offset,
  });

  return overlay;
};

/**
 * 添加信息overlay
 * @param {Object} options 配置项
 * @param {String} options.title 标题
 * @param {String} options.value 数字
 * @param {String} options.unit 单位
 * @param {String} options.themeColor 主题颜色
 * @param {String} options.direction 气泡箭头方向
 * @param {Array} options.position 定位坐标[lng, lat]
 * @param {Array} options.offset 偏移 [0, 0]
 * @param {String} options.positioning bottom-left
 * @param {Number} options.timeout 延迟将overlay加入到地图上的时间 单位ms
 * @param {String} options.content overlay的内容，设置了content后，title value unit direction themeColor将无效
 * @returns {Overlay}
 */
export const addInfoOverlay = (options) => {
  const content =
    options.content ||
    `
    <div class="ai-info-marker ${options.direction} ${options.themeColor}">
      <div class="title">${options.title}</div>
      <div class="content">
        <span>
          <span class="value">${options.value}</span>
          <span class="unit">${options.unit}</span>
        </span>
      </div>
    </div>
  `;

  const element = document.createElement('div');
  element.innerHTML = content;

  const overlay = new Overlay({
    element: element.firstElementChild,
    position: options.position,
    positioning: options.positioning || 'bottom-left',
    offset: options.offset || [0, 0],
    stopEvent: false,
  });

  return overlay;
};

// 添加事故点附近的视频信息
export const addVideoOverlay = (map, video, { eventTypeName, eventLevelName, eventLevel, offset, notFitView = false, eventTitle, className, style }) => {
  if (!map) {
    return;
  }
  const { position = [], playUrl } = video;
  const title = eventTitle || '事故点附近监控视频画面';
  const boxClass = className || '';
  const boxStyle = style || '';
  const content = `
    <div class="map-marker-box video-marker ${boxClass}" style="padding-bottom: 0.6rem;${boxStyle};z-index: 13;">
      <div class="screen-event-card monitor-info">
      <div class="marker-top">
        <div class="marker-title">${title}</div>
        <div class=close>关闭</div>
        </div>
        <div class="monitor-video"></div> <!-- 目标容器 -->
      </div>
    </div>
  `;
  // 配置播放器组件
  const config = {
    component: Video, // 播放器组件
    props: {
      videoUrl: playUrl,
      autoplay: true,
    },
    slotContent: null, // 无插槽内容
    targetSelector: '.monitor-video', // 目标容器选择器
  };

  const markerData = getVueMarkerData(content, config);

  if (markerData) {
    const overlay = new Overlay({
      element: markerData.content,
      position: position,
      offset: offset || [0, 0],
      positioning: 'bottom-center',
      stopEvent: false,
    });

    const controller = new AbortController();

    // 绑定关闭事件
    markerData.content.querySelector('.close').addEventListener(
      'click',
      () => {
        map.removeOverlay(overlay); // 移除overlay
      },
      { signal: controller.signal }
    );

    overlay.cancelEvents = () => {
      controller.abort();
    };
    return overlay;
  }
};

// 添加事故点
export const addEventOverlay = (map, position, { eventTypeName, eventLevelName, eventTypeId, eventLevel, notFitView = false }, eventCallback) => {
  if (!map) {
    return;
  }
  const eventLevelNameMap = {
    1: '一级',
    2: '二级',
    3: '三级',
    4: '四级',
    5: '五级',
  };

  const element = document.createElement('div');
  element.className = 'map-marker-box event-marker';
  element.innerHTML = `
    <div class="marker-jump">
      <div class="event-text">
        <div class="event-level-${eventLevel}">${eventLevelNameMap[eventLevel]}${eventTypeName}</div>
      </div>
      <img class="marker-icon w-[0.3rem]" src="/assets/images/marker/event/${eventTypeId}/level-${eventLevel}.png" alt="" />
    </div>
  `;

  const overlay = new Overlay({
    element: element,
    position: position,
    positioning: 'bottom-center',
    stopEvent: false,
  });

  const controller = new AbortController();

  element.addEventListener(
    'click',
    () => {
      eventCallback();
    },
    { signal: controller.signal }
  );

  overlay.cancelEvents = () => {
    controller.abort();
  };

  return overlay;
};

// 添加事故点附近的监控信息
export const addCameraOverlay = (map, camera, { notFitView = false, offset, eventTitle, zIndex, className, style, additionalContent = '' }) => {
  if (!map) {
    return;
  }
  const { position = [], playUrl } = camera;
  const title = eventTitle || '事故点附近监控视频画面';
  const boxClass = className || '';
  const boxStyle = style || '';

  const content = `
    <div class="map-marker-box video-marker ${boxClass}" style="padding-bottom: 0.5rem;${boxStyle}">
      <div class="screen-event-card monitor-info" style="display: flex; flex-direction: column;">
        <div class="marker-title">${title}</div>
        <div class="monitor-camera" style="width: 100%;height: 0;flex: 1;"></div> <!-- 目标容器 -->
        ${additionalContent}
      </div>
    </div>
  `;

  // 配置播放器组件
  const playerConfig = {
    component: Player, // 播放器组件
    props: {
      videoUrl: playUrl,
      id: Date.now(),
    },
    slotContent: null, // 无插槽内容
    targetSelector: '.monitor-camera', // 目标容器选择器
  };

  // 获取带播放器的地图标记
  const markerData = getVueMarkerData(content, playerConfig);

  if (markerData) {
    const overlay = new Overlay({
      element: markerData.content,
      position: position,
      offset: offset || [0, 0],
      positioning: 'bottom-center',
      stopEvent: false,
      zIndex: zIndex,
    });

    return overlay;

    // 后续可通过 markerData.app._instance.proxy 调用Player组件的方法
  }
  return null;
};
