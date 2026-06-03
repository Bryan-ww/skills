import { createApp, h } from 'vue';
import { ElButton } from 'element-plus';
import { ElMessage } from 'element-plus';
import Player from '@/components/Jessibuca/player.vue';
import Video from '@/components/Jessibuca/video.vue';

export const mapCenter = [87.574858, 43.831879];
export const initZoom = 11;

// 事故相关的覆盖物
const accidentMarker = [];

window._AMapSecurityConfig = {
  securityJsCode: import.meta.env.VITE_AMAP_KEY_SECRET, // 安全密钥
};

/**
 * 创建地图
 * @param {string} container - 地图容器id
 */
export const createMap = (container, isDark) => {
  return new Promise((resolve) => {
    AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY, // 申请好的Web端开发者 Key，调用 load 时必填
      version: '2.0', // 指定要加载的 JS API 的版本，缺省时默认为 1.4.15
    })
      .then((AMap) => {
        const map = new AMap.Map(container, {
          center: mapCenter,
          zoom: initZoom,
          mapStyle: isDark ? 'amap://styles/darkblue' : 'amap://styles/normal',
        });
        resolve(map);
      })
      .catch((e) => {
        console.error(e); // 加载错误提示
        resolve(null);
      });
  });
};

// 添加影响的道路路线
export const drawRoadLine = (map, { startPoint, endPoint, notFitView = false, hideDefaultStartEndMarkers = false, showTraffic = false, isUseCustomStartEndMarker = false, polylineOptions = {}, drawPolylineCallback, zoom }) => {
  if (!map) {
    return;
  }
  AMap.plugin('AMap.Driving', () => {
    const driving = new AMap.Driving({
      // 添加map后，线路规划会自动把线路绘制到地图上
      map: hideDefaultStartEndMarkers ? null : map,
      showTraffic: showTraffic, // 设置是否显示实时路况信息
      hideMarkers: hideDefaultStartEndMarkers, // 设置隐藏路径规划的起始点图标
      isOutline: true, // 使用map属性时，绘制的规划线路是否显示描边
      autoFitView: true, // 用于控制在路径规划结束后，是否自动调整地图视野使绘制的路线处于视口的可见范围
      policy: AMap.DrivingPolicy.LEAST_DISTANCE, // 驾车路线规划策略(LEAST_TIME-最短时间, LEAST_DISTANCE-最短距离, AVOID_HIGHWAY-避免高速, LEAST_TOLL-避免收费, LEAST_TOLL_ROAD-避免收费道路)
    });
    let startMarker = null;
    let endMarker = null;
    if (isUseCustomStartEndMarker) {
      startMarker = addRoadLinePointMarker(map, startPoint, `起点：${startPoint.stakeMark}`);
      endMarker = addRoadLinePointMarker(map, endPoint, `终点：${endPoint.stakeMark}`);
    }
    driving.search(
      startPoint.position, // 起点
      endPoint.position, // 终点
      // 可选参数：waypoints(途经点数组，如 [ [lng1,lat1], [lng2,lat2] ]), 例如：waypoints: [ [116.403322, 39.920255] ]
      (status, result) => {
        if (status === 'complete') {
          // console.log('路径规划完成：', result);
          // 可以从 result 中获取路线详情、距离、时间、步骤等
          const route = result.routes && result.routes[0];
          if (!route) {
            ElMessage.warning('未找到可用路线');
            return;
          }
          if (showTraffic) {
            setTimeout(() => {
              map.setZoom(map.getZoom() - 1);
            }, 800);
            return;
          }
          const path = route.steps.map((item) => item.path).flat(Infinity);
          // 使用 AMap.Polyline 绘制红色路线
          const polyline = new AMap.Polyline({
            path: path, // 路径点数组
            isOutline: true,
            outlineColor: 'rgb(255 0 0 / 75%)',
            borderWeight: 2,
            strokeColor: 'rgb(255 0 0 / 75%)',
            strokeOpacity: 1,
            strokeWeight: 6,
            strokeStyle: 'solid',
            lineJoin: 'round',
            lineCap: 'round',
            showDir: true,
            dirColor: '#fff', // 箭头颜色
            dirNumber: 100, // 箭头数量（默认根据长度自动计算）
            dirInterval: 50, // 箭头间隔（像素）
            zIndex: 50,
            ...polylineOptions,
          });
          if (drawPolylineCallback) {
            drawPolylineCallback({ path, polyline, startMarker, endMarker });
          }
          // 将路线添加到地图上
          map.add(polyline);
          accidentMarker.push(polyline);
          if (!notFitView) {
            // map.setFitView(accidentMarker);
            setTimeout(() => {
              map.setZoom(zoom || map.getZoom() - 2);
            }, 800);
          }
        } else {
          console.error('路径规划失败：', result);
        }
      }
    );
  });
};

// 添加影响的道路起止点
export const addRoadLinePointMarker = (map, point, pointName) => {
  if (!map) {
    return;
  }
  const content = `
    <div class="map-marker-box road-line-point">
      <img class="marker-icon w-[0.28rem]" src="/assets/images/road-line-point.png" alt="" />
      <div class="point-name">${pointName}</div>
    </div>
  `;
  const marker = new AMap.Marker({
    content: content,
    position: point.position,
    offset: new AMap.Pixel(0, 0),
  });
  map.add(marker);
  accidentMarker.push(marker);

  return marker;
};

/**
 * 创建类型1起始点marker
 * @param {Map} map 地图实例
 * @param {Array} lnglat 经纬度 [lng, lat]
 * @param {Object} options 配置项
 * @returns {Marker} 返回marker实例
 */
export const addStartEndMarkerType1 = (map, lnglat, options = {}) => {
  if (!map) {
    return;
  }

  const content = `
    <div class="start-end-marker1"></div>
  `;

  const marker = new AMap.Marker({
    content: content,
    position: lnglat,
    offset: new AMap.Pixel(0, 0),
    anchor: 'center',
  });
  map.add(marker);

  return marker;
};

export const addStartEndMarkerType2 = (map, { position, iconUrl, name, bubble = false }) => {
  if (!map) {
    return;
  }
  const content = `
    <div class="map-marker-box road-line-point">
      <img class="marker-icon w-[0.28rem]" src="${iconUrl}" alt="" />
      <div class="point-name">${name}</div>
    </div>
  `;
  const marker = new AMap.Marker({
    content: content,
    position: position,
    offset: new AMap.Pixel(0, 0),
    bubble,
  });
  map.add(marker);
  accidentMarker.push(marker);

  return marker;
};

// 添加路线上的救援信息
export const addRescueMarker = (map, rescueList, { direction }) => {
  if (!map) {
    return;
  }
  const markerList = rescueList.map((item) => {
    const { title, position = [], contacts = [] } = item;
    const content = `
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
    return new AMap.Marker({
      content: content,
      position: position,
      offset: new AMap.Pixel(0, 0),
    });
  });
  map.add(markerList);
  accidentMarker.push(markerList);
  map.setFitView(accidentMarker);
};

// 创建拥堵详情marker
export const addCongestionDetailMarker = (map, { notFitView = false, position, eventTitle, className, style, content1, content2, content2Title }) => {
  if (!map) {
    return;
  }
  const title = eventTitle || '拥堵路段详情';
  const boxClass = className || '';
  const boxStyle = style || '';
  const content = `
    <div class="map-marker-box video-marker ${boxClass}" style="padding-bottom: 0.44rem;${boxStyle}">
      <div class="screen-event-card monitor-info" style="display: flex; flex-direction: column;height: auto;">
        <div class="marker-title">${title}</div>
        <div class="content1">${content1}</div>
        <div class="content2">
          <div class="content2-title">${content2Title}</div>
          <div class="content2-content">${content2}</div>
        </div>
      </div>
    </div>
  `;

  const marker = new AMap.Marker({
    content: content,
    position: position,
    offset: new AMap.Pixel(0, 0),
    zIndex: 13,
  });
  map.add(marker);
  accidentMarker.push(marker);
  if (!notFitView) {
    map.setFitView(accidentMarker);
  }

  return marker;
};

// 添加事故点附近的监控信息
export const addCameraMarker = (map, camera, { notFitView = false, offset, eventTitle, zIndex, className, style, additionalContent = '' }) => {
  if (!map) {
    return;
  }
  const { position = [], playUrl } = camera;
  const title = eventTitle || '事故点附近监控视频画面';
  const boxClass = className || '';
  const boxStyle = style || '';
  const content = `
    <div class="map-marker-box video-marker ${boxClass}" style="padding-bottom: 0.84rem;${boxStyle}">
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
    const marker = new AMap.Marker({
      content: markerData.content,
      position: position,
      offset: offset || new AMap.Pixel(0, 0),
      zIndex: zIndex || 13,
    });
    map.add(marker);
    accidentMarker.push(marker);
    if (!notFitView) {
      map.setFitView(accidentMarker);
    }

    return marker;

    // 后续可通过 markerData.app._instance.proxy 调用Player组件的方法
  }
  return null;
};

// 添加事故点附近的视频信息
export const addVideoMarker = (map, video, { eventTypeName, eventLevelName, eventLevel, offset, notFitView = false, eventTitle, className, style }, eventId) => {
  if (!map) {
    return;
  }
  const { position = [], playUrl } = video;
  const title = eventTitle || '事故点附近监控视频画面';
  const boxClass = className || '';
  const boxStyle = style || '';
  const content = `
    <div class="map-marker-box video-marker ${boxClass}" style="padding-bottom: 0.98rem;${boxStyle}">
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
    const marker = new AMap.Marker({
      content: markerData.content,
      position: position,
      offset: offset || new AMap.Pixel(0, 0),
      extData: { title: eventId }, // 添加唯一标识
      zIndex: 13,
    });
    map.add(marker);
    accidentMarker.push(marker);
    if (!notFitView) {
      map.setFitView(accidentMarker);
    }
    // 绑定关闭事件
    markerData.content.querySelector('.close').addEventListener('click', () => {
      marker.hide(); // 隐藏标记
    });
    return marker;
  }
};

// 添加事故点
export const addEventMarker = (map, position, { eventTypeName, eventLevelName, eventTypeId, eventLevel, notFitView = false }, eventId) => {
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
  const content = `
    <div class="map-marker-box event-marker">
      <div class="marker-jump">
        <div class="event-text">
          <div class="event-level-${eventLevel}">${eventLevelNameMap[eventLevel]}${eventTypeName}</div>
        </div>
        <img class="marker-icon w-[0.3rem]" src="/assets/images/marker/event/${eventTypeId}/level-${eventLevel}.png" alt="" />
      </div>
      
    </div>
  `;
  const marker = new AMap.Marker({
    content: content,
    position: position,
    offset: new AMap.Pixel(0, 0),
  });
  map.add(marker);
  accidentMarker.push(marker);
  if (!notFitView) {
    map.setFitView(accidentMarker);
  }
  marker.on('click', () => {
    map.getAllOverlays('marker').forEach((marker) => {
      if (marker.getExtData().title === eventId) {
        marker.show();
      }
    });
  });

  return marker;
};

/**
 * 添加信息marker
 * @param {Object} map 地图示例
 * @param {Object} options 配置项
 * @param {String} options.title 标题
 * @param {String} options.value 数字
 * @param {String} options.unit 单位
 * @param {String} options.themeColor 主题颜色
 * @param {String} options.direction 气泡箭头方向
 * @param {Array} options.position 定位坐标[lng, lat]
 * @param {Array} options.offset 偏移 [0, 0]
 * @param {String} options.anchor bottom-left
 * @param {Number} options.timeout 延迟将marker加入到地图上的时间 单位ms
 * @param {String} options.content marker的内容，设置了content后，title value unit direction themeColor将无效
 * @returns {null}
 */
export const addInfoMarker = (map, options) => {
  if (!map) {
    return;
  }

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
  const marker = new AMap.Marker({
    content: content,
    position: options.position,
    offset: options.offset || new AMap.Pixel(0, 0),
    anchor: options.anchor || 'bottom-left',
  });
  if (options.timeout) {
    setTimeout(() => {
      map.add(marker);
    }, options.timeout);
  } else {
    map.add(marker);
  }

  marker.on('click', () => {});

  return marker;
};

// const { content, app } = createVueMarker(ElButton, { size: 'mini', type: 'danger' }, '确定');
function createVueMarker(component, props, slotContent) {
  const content = document.createElement('div');
  // 使用 h 函数创建虚拟节点，处理默认插槽
  const vNode = h(component, props, slotContent);
  const app = createApp(vNode);
  app.mount(content);
  return { content, app };
}

/**
 * 创建包含 Vue 组件的地图标记
 * @param {string} htmlTemplate - HTML 模板字符串
 * @param {Object} config - 组件配置 { component, props, slotContent, targetSelector }
 */
export function getVueMarkerData(htmlTemplate, config) {
  // 1. 创建容器并填充HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = htmlTemplate;
  // 2. 查找目标容器
  const targetContainer = wrapper.querySelector(config.targetSelector);
  if (!targetContainer) {
    console.error(`DOM节点 - '${config.targetSelector}' 未找到`);
    return null;
  }
  // 3. 在目标容器内挂载Vue组件
  const app = mountVueComponent(config.component, config.props || {}, config.slotContent || null, targetContainer);

  return {
    app, // Vue应用实例
    content: wrapper, // 完整的DOM结构
    targetContainer: targetContainer, // 组件容器
  };
}

/**
 * 在指定容器内渲染 Vue 组件
 * @param {Object} component - Vue 组件对象
 * @param {Object} props - 组件属性
 * @param {VNode|string} slotContent - 插槽内容
 * @param {HTMLElement} container - 目标容器元素
 */
export function mountVueComponent(component, props, slotContent, container) {
  // 清空容器（可选）
  container.innerHTML = '';
  // 创建虚拟节点
  const vNode = h(component, props, slotContent);
  // 创建独立应用实例
  const app = createApp(vNode);
  // 挂载到容器
  app.mount(container);
  return app;
}

export const drawHighway = (map, name) => {
  // 核心：调用WebService接口获取G30完整坐标
  const webServiceKey = import.meta.env.VITE_AMAP_WEB_API_SERVICE_KEY;
  // 发送请求获取道路数据
  fetch(`https://restapi.amap.com/v3/road/roadname?keywords=${encodeURIComponent(name)}&key=${webServiceKey}&output=json`)
    .then((res) => res.json())
    .then((result) => {
      if (result.status === '1' && result.roads && result.roads.length > 0) {
        let allPath = [];
        // 解析接口返回的polylines坐标（可能分段存储）
        result.roads.forEach((road) => {
          if (road.polylines && road.polylines.length > 0) {
            road.polylines.forEach((polyline) => {
              // 坐标格式转换："lng1,lat1;lng2,lat2" → [[lng1,lat1],...]
              const path = polyline.split(';').map((point) => {
                const [lng, lat] = point.split(',').map(Number);
                return [lng, lat];
              });
              allPath = allPath.concat(path);
            });
          }
        });
        // 绘制高亮线路
        drawHighway(allPath);
      } else {
        console.error('获取G30数据失败', result.info);
      }
    })
    .catch((err) => console.error('请求失败', err));
};

export const drawHighway1 = (map, { startPoint, endPoint, waypoints, notFitView = false, hideDefaultStartEndMarkers = false, showTraffic = false, isUseCustomStartEndMarker = false, polylineOptions = {}, drawPolylineCallback, zoom }) => {
  if (!map) {
    return;
  }
  AMap.plugin('AMap.Driving', () => {
    const driving = new AMap.Driving({
      // 添加map后，线路规划会自动把线路绘制到地图上
      map: hideDefaultStartEndMarkers ? null : map,
      showTraffic: showTraffic, // 设置是否显示实时路况信息
      hideMarkers: hideDefaultStartEndMarkers, // 设置隐藏路径规划的起始点图标
      isOutline: true, // 使用map属性时，绘制的规划线路是否显示描边
      autoFitView: true, // 用于控制在路径规划结束后，是否自动调整地图视野使绘制的路线处于视口的可见范围
      policy: AMap.DrivingPolicy.LEAST_TIME, // 驾车路线规划策略(LEAST_TIME-最短时间, LEAST_DISTANCE-最短距离, AVOID_HIGHWAY-避免高速, LEAST_TOLL-避免收费, LEAST_TOLL_ROAD-避免收费道路)
    });

    const opts = {};
    if (waypoints) {
      opts.waypoints = waypoints;
    }
    driving.search(
      startPoint, // 起点
      endPoint, // 终点
      opts,
      // 可选参数：waypoints(途经点数组，如 [ [lng1,lat1], [lng2,lat2] ]), 例如：waypoints: [ [116.403322, 39.920255] ]
      (status, result) => {
        if (status === 'complete') {
          // console.log('路径规划完成：', result);
          // 可以从 result 中获取路线详情、距离、时间、步骤等
          const route = result.routes && result.routes[0];
          if (!route) {
            ElMessage.warning('未找到可用路线');
            return;
          }
          const path = route.steps.map((item) => item.path).flat(Infinity);
          // 使用 AMap.Polyline 绘制红色路线
          const polyline = new AMap.Polyline({
            path: path, // 路径点数组
            isOutline: true,
            outlineColor: 'rgb(255 0 0 / 75%)',
            borderWeight: 2,
            strokeColor: 'rgb(255 0 0 / 75%)',
            strokeOpacity: 1,
            strokeWeight: 6,
            strokeStyle: 'solid',
            lineJoin: 'round',
            lineCap: 'round',
            showDir: true,
            dirColor: '#fff', // 箭头颜色
            dirNumber: 100, // 箭头数量（默认根据长度自动计算）
            dirInterval: 50, // 箭头间隔（像素）
            zIndex: 50,
            ...polylineOptions,
          });
          if (drawPolylineCallback) {
            drawPolylineCallback({ path, polyline, startMarker, endMarker });
          }
          // 将路线添加到地图上
          map.add(polyline);
        } else {
          console.error('路径规划失败：', result);
        }
      }
    );
  });
};
