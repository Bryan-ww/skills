import { groupBy, isEmpty, find, filter } from 'lodash';
import { Tile as TileLayer, Image as ImageLayer, Vector as VectorLayer } from 'ol/layer';
import TileWMS from 'ol/source/TileWMS';
import ImageStatic from 'ol/source/ImageStatic';
import ImageWMS from 'ol/source/ImageWMS';
import VectorSource from 'ol/source/Vector';
import LayerGroup from 'ol/layer/Group';
import { TileSuperMapRest } from '@supermapgis/iclient-ol';

/**
 * OpenLayers 图层管理组合式工具方法
 *
 * 封装了图层创建、添加、移除、查询等常用能力，
 * 支持 Tile、Image、ImageStatic、Vector、SuperMap 等多种图层类型。
 *
 * 使用方式：
 * const { initMap, addLayer, addLayers, getLayer, getLayerSource, ... } = layerComposition({
 *   getStyle: getStyleFunction,
 * });
 *
 * 初始化后在组件内调用：
 * layerManager.initMap(mapInstance);
 */
/**
 * OpenLayers 图层管理组合式工具方法
 *
 * 封装了图层创建、添加、移除、查询等常用能力，
 * 支持 Tile、Image、ImageStatic、Vector、SuperMap 等多种图层类型。
 *
 * @module Layer
 * @param {Object} options 配置选项
 * @param {Function} options.getStyle 样式生成函数，来自 styleComposition
 * @returns {Object} 图层管理方法集合
 * @example
 * // 使用方式：
 * const { getStyle } = styleComposition();
 * const { initMap, addLayer, addLayers, getLayer, getLayerSource, ... } = layerComposition({
 *   getStyle,
 * });
 *
 * // 初始化后在组件内调用：
 * layerManager.initMap(mapInstance);
 */
export const layerComposition = ({ getStyle }) => {
  let map;

  /**
   * 初始化地图实例
   * 必须在调用其他图层管理方法之前调用此方法
   *
   * @param {import('ol/Map').default} oMap OpenLayers 地图实例
   * @example
   * const map = new Map({ ... });
   * layerManager.initMap(map);
   */
  const initMap = (oMap) => {
    map = oMap;
  };

  /**
   * 获取所有图层
   *
   * @returns {Array<import('ol/layer/Base').default>} 图层集合，如果地图未初始化则返回空数组
   * @example
   * const allLayers = getAllLayers();
   * console.log(`地图共有 ${allLayers.length} 个图层`);
   */
  const getAllLayers = () => {
    if (!map) return [];
    return map.getLayers().getArray();
  };

  /**
   * 根据特征获取图层集合
   * 支持 lodash.filter 的所有查询方式
   *
   * @param {Array|Function|Object|string} [predicate] 过滤条件，内部透传给 lodash.filter
   *   - Function: (layer) => boolean
   *   - Object: { property: value } 匹配属性
   *   - Array: ['property', value] 匹配属性
   *   - string: 匹配属性名存在
   *   - 不传则返回所有图层
   * @returns {Array<import('ol/layer/Base').default>} 图层集合
   * @example
   * // 获取所有图层
   * const allLayers = getLayers();
   *
   * // 获取所有可见图层
   * const visibleLayers = getLayers((layer) => layer.getVisible());
   *
   * // 根据名称获取图层
   * const myLayers = getLayers({ name: 'myLayer' });
   */
  const getLayers = (predicate) => {
    return filter(getAllLayers(), predicate);
  };

  /**
   * 根据名称获取指定图层
   *
   * @param {string} name 图层名称（在 createLayer/addLayer 时的 name 字段）
   * @returns {import('ol/layer/Base').default|null} 图层对象，不存在则返回 null
   * @example
   * const layer = getLayer('myLayer');
   * if (layer) {
   *   layer.setVisible(false);
   * }
   */
  const getLayer = (name) => {
    return find(getAllLayers(), { name });
  };

  /**
   * 获取图层数据源
   * 通过图层名称获取对应的数据源对象，用于直接操作图层数据（如添加/移除要素）
   *
   * @param {string} name 图层名称
   * @returns {import('ol/source/Source').default|null} 图层数据源对象，图层不存在则返回 null
   * @example
   * const source = getLayerSource('vectorLayer');
   * if (source) {
   *   source.addFeature(newFeature);
   * }
   */
  const getLayerSource = (name) => {
    const layer = getLayer(name);
    return layer ? layer.getSource() : null;
  };

  /**
   * 创建图层
   *
   * @param {Object} params 图层配置
   * @param {string} params.name 图层名称
   * @param {string} [params.layerType='Vector'] 图层类型
   *   - 'Tile': 瓦片图层，对应 ol/layer/Tile，数据源 ol/source/TileWMS
   *   - 'Image': 图片图层，对应 ol/layer/Image，数据源 ol/source/ImageWMS
   *   - 'ImageStatic': 静态图片图层，对应 ol/layer/Image，数据源 ol/source/ImageStatic
   *   - 'SuperMap': 超图瓦片图层，对应 ol/layer/Tile，数据源 TileSuperMapRest
   *   - 默认: 矢量图层，对应 ol/layer/Vector，数据源 ol/source/Vector
   * @param {Object|Function} [params.style] 图层样式配置或回调，具体用法见 Style 组合工具
   * @param {Object} [params.source] 数据源配置
   * @param {string} [params.source.url] 数据源 URL
   * @param {Object} [params.source.params] 数据源参数（WMS 等）
   * @param {number} [params.source.epsgCode] EPSG 代码（SuperMap 用）
   * @param {...any} params 其他图层配置参数（如 visible、zIndex 等）
   * @returns {{layer: import('ol/layer/Base').default, source: import('ol/source/Source').default}|null}
   */
  const createLayer = ({ name, layerType, style, source, ...params } = {}) => {
    let layer = null;
    let layerSource = null;

    // 处理样式
    if (style && getStyle) {
      params.style = getStyle(style);
    }

    switch (layerType) {
      case 'SuperMap':
        // 超图瓦片底图
        // 处理 SuperMap 图层的数据源配置
        // 将 epsgCode 和 projection 转换为 prjCoordSys 格式
        const superMapParams = { ...params, ...source };
        if (superMapParams.epsgCode) {
          superMapParams.prjCoordSys = { epsgCode: superMapParams.epsgCode };
          delete superMapParams.epsgCode;
        }
        if (superMapParams.projection) {
          delete superMapParams.projection;
        }
        layerSource = new TileSuperMapRest(superMapParams);
        layer = new TileLayer(params);
        break;

      case 'Tile':
        // 标准 WMS 瓦片图层
        layerSource = new TileWMS(source);
        layer = new TileLayer(params);
        break;

      case 'Image':
        // WMS 图片图层
        layerSource = new ImageWMS(source);
        layer = new ImageLayer(params);
        break;

      case 'ImageStatic':
        // 静态图片图层
        layerSource = new ImageStatic(source);
        layer = new ImageLayer(params);
        break;

      default:
        // 矢量图层
        layerSource = new VectorSource(source);
        layer = new VectorLayer(params);
        break;
    }

    // 设置图层名称，便于后续通过 name 进行查找/移除
    if (name) {
      layer.name = name;
    }
    // 为图层设置数据源
    layer.setSource(layerSource);

    return { layer, source: layerSource };
  };

  /**
   * 创建图层并添加到地图
   * 如果图层已存在（根据名称判断），则直接返回现有图层；否则创建新图层并添加到地图
   *
   * @param {Object} params 图层配置（同 createLayer）
   * @param {boolean} [isMultiple=false] 是否支持重名
   *   假如需要添加多张静态底图时允许重名，设为 true 时即使名称相同也会创建新图层
   * @returns {import('ol/layer/Base').default|null} 图层对象，如果地图未初始化则返回 null
   * @example
   * // 添加一个矢量图层
   * const layer = addLayer({
   *   name: 'myVectorLayer',
   *   zIndex: 5,
   *   style: { fill: { color: 'rgba(255,0,0,0.5)' } }
   * });
   *
   * // 允许重名添加多个图层
   * addLayer({ name: 'baseLayer', ... }, true);
   */
  const addLayer = (params = {}, isMultiple = false) => {
    if (!map) return null;

    const { name } = params;
    // 根据图层名称获取图层，如果支持重名则不获取
    let layer = isMultiple ? null : getLayer(name);

    if (!layer) {
      // 如果图层不存在，创建图层
      const layerResult = createLayer(params);
      if (layerResult && layerResult.layer) {
        layer = layerResult.layer;
        // 添加图层
        map.addLayer(layer);
      }
    }

    return layer;
  };

  /**
   * 创建图层->添加图层->添加特性对象
   * 一次性完成图层的创建、添加和要素加载，适用于矢量图层批量添加要素的场景
   *
   * @param {Object} params 图层配置（同 createLayer）
   * @param {Array<import('ol/Feature').default>} features 要素对象集合
   * @example
   * const features = [feature1, feature2, feature3];
   * loadLayer({ name: 'vectorLayer', zIndex: 5 }, features);
   */
  const loadLayer = (params, features) => {
    const layer = addLayer(params);
    if (layer) {
      const source = layer.getSource();
      if (source && source.addFeatures) {
        source.addFeatures(features);
      }
    }
  };

  /**
   * 根据特征移除图层
   * 支持 lodash.filter 的所有查询方式
   *
   * @param {Array|Function|Object|string} predicate 过滤条件
   *   - Function: (layer) => boolean
   *   - Object: { property: value } 匹配属性
   *   - Array: ['property', value] 匹配属性
   *   - string: 匹配属性名存在
   * @example
   * // 移除所有不可见的图层
   * removeLayer((layer) => !layer.getVisible());
   *
   * // 移除指定名称的图层
   * removeLayer({ name: 'myLayer' });
   */
  const removeLayer = (predicate) => {
    const list = getLayers(predicate);
    list.forEach((layer) => {
      map.removeLayer(layer);
    });
  };

  /**
   * 根据名称移除图层
   *
   * @param {string} name 图层名称
   * @example
   * removeLayerByName('myLayer');
   */
  const removeLayerByName = (name) => {
    removeLayer({ name });
  };

  /**
   * 根据配置组生成底图组并添加到地图中
   * 将多个图层配置组合成一个图层组，便于统一管理
   *
   * @param {Array<Object>} list 图层配置数组，每个配置项同 createLayer 的参数
   * @param {string} title 组标题，用于图层组标识
   * @example
   * addLayerGroup([
   *   { name: 'layer1', url: '...', layertype: 'Tile' },
   *   { name: 'layer2', url: '...', layertype: 'Image' }
   * ], '底图组');
   */
  const addLayerGroup = (list, title) => {
    if (isEmpty(list)) return;

    const layerList = [];

    // 遍历配置组
    list.forEach((item) => {
      // 获取相关配置
      const { url, layertype, params, ...layersParams } = item;
      const { layer } = createLayer({
        layerType: layertype,
        ...layersParams,
        source: {
          url,
          params: params,
        },
      });

      // 将生成的底图添加到底图组中
      layerList.push(layer);

      // 生成底图组
      const layerGroup = new LayerGroup({
        title: title,
        layers: [layer],
      });

      // 新增标识，移除地图时使用
      layerGroup.name = item.name || 'baseLayer';

      // 添加到地图中
      map.addLayer(layerGroup);
    });
  };

  /**
   * 根据底图配置组添加底图
   * 自动根据 type 字段将图层分为 'base'（底图）和 'map'（数据图）两类，分别创建图层组
   *
   * @param {Array<Object>} list 图层配置数组
   * @param {string} list[].type 图层类型：'base' 表示底图，'map' 表示数据图
   * @param {string} list[].name 图层名称
   * @param {string} list[].url 图层服务地址
   * @param {string} list[].layertype 图层类型：'Tile'|'Image'|'SuperMap'|'Vector' 等
   * @param {Object} [options={}] 选项配置
   * @example
   * addLayers([
   *   { type: 'base', name: '底图1', url: '...', layertype: 'SuperMap' },
   *   { type: 'map', name: '数据层', url: '...', layertype: 'Tile' }
   * ]);
   */
  const addLayers = (list, options = {}) => {
    // 将数据根据类型分组
    const data = groupBy(list, 'type');
    if (!isEmpty(data)) {
      const { map: mapLayers, base } = data;

      // 添加底图
      if (base && base.length > 0) {
        addLayerGroup(base, '底图', options);
      }

      // 添加数据图
      if (mapLayers && mapLayers.length > 0) {
        addLayerGroup(mapLayers, '数据图', options);
      }
    }
  };

  /**
   * 移除所有底图（通过 layers 配置和 addLayers 方法添加的底图）
   * 注意：只移除通过 addLayers 方法添加的底图组（name 为 'baseLayer'），底图插件本身不会被删除
   *
   * @example
   * // 切换底图时先移除旧底图
   * removeAllBaselayer();
   * addLayers([{ type: 'base', ... }]);
   */
  const removeAllBaselayer = () => {
    removeLayerByName('baseLayer');
  };

  return {
    initMap,
    getAllLayers,
    getLayers,
    getLayer,
    getLayerSource,

    // 图层创建和管理
    createLayer,
    addLayer,
    loadLayer,
    removeLayer,
    removeLayerByName,

    // 底图组管理
    addLayerGroup,
    addLayers,
    removeAllBaselayer,
  };
};
