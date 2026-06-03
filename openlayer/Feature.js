import { circular as circularPolygon } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { LineString, Point } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import { assign, filter } from 'lodash';
import { transformObj } from '@/utils';

/**
 * OpenLayers 要素管理组合式工具方法
 *
 * 封装了要素创建、添加、移除、查询等常用能力，
 * 支持点、线、圆等多种几何要素类型。
 *
 * @module Feature
 * @example
 * // 使用方式：
 * const { getStyle } = styleComposition();
 * const { getLayerSource } = layerComposition({ getStyle });
 * const { createPoint, createLineFeature, createCircleFeature, addFeature, ... } = featureComposition({
 *   getStyle,
 *   getLayerSource,
 * });
 */
export const featureComposition = ({ getStyle, getLayerSource }) => {
  /**
   * 根据数据对象创建点要素
   * 自动从数据中提取经纬度坐标，并设置样式和额外数据
   *
   * @param {Object} data - 数据对象，需包含经纬度字段
   * @param {Object} params - 配置参数
   * @param {Object} params.fieldConfig - 字段映射配置
   * @param {string} params.fieldConfig.lon - 经度字段名称，默认 'lon'
   * @param {string} params.fieldConfig.lat - 纬度字段名称，默认 'lat'
   * @param {Object|Function} params.style - 样式配置或样式函数，详见 Style.js
   * @returns {import('ol/Feature').default} OpenLayers Feature 对象
   * @example
   * const feature = createPointByData(
   *   { longitude: 87.58, latitude: 43.83, name: '乌鲁木齐' },
   *   {
   *     fieldConfig: { lon: 'longitude', lat: 'latitude' },
   *     style: { image: { radius: 10, fill: { color: 'red' } } },
   *     data: { name: '乌鲁木齐' }
   *   },
   *  { epsgCode: 3857, projection: 'EPSG:3857' }
   * );
   */
  const createPointByData = (data, { fieldConfig, style }, view) => {
    const { lon, lat } = transformObj(data, fieldConfig);
    const coordinate = view && view.projection === 'EPSG:3857' ? fromLonLat([lon, lat]) : [lon, lat];
    return createPoint(coordinate, { data, style });
  };

  /**
   * 根据坐标创建点要素
   * 创建点几何对象，设置样式和额外数据
   *
   * @param {Array<number>} coordinate - 坐标 [经度, 纬度]
   * @param {Object} [params={}] - 配置参数
   * @param {Object|Function} [params.style] - 样式配置或样式函数
   * @param {any} [params.data] - 额外数据，会直接赋值到 feature 对象上
   * @param {any} [params.*] - 其他额外数据属性，会直接赋值到 feature 对象上
   * @returns {import('ol/Feature').default} OpenLayers Feature 对象
   * @example
   * const feature = createPoint([87.58, 43.83], {
   *   style: { image: { radius: 8, fill: { color: 'blue' } } },
   *   id: 'point-1',
   *   name: '标记点'
   * });
   */
  const createPoint = (coordinate, params) => {
    return createFeature(
      {
        geometry: new Point(coordinate),
      },
      params
    );
  };

  /**
   * 创建线段要素
   * 根据坐标数组创建线几何对象，设置样式和额外数据
   *
   * @param {Array<Array<number>>} coordinates - 坐标集合，每个元素为 [经度, 纬度]
   * @param {Object} [params={}] - 配置参数
   * @param {Object|Function} [params.style] - 样式配置或样式函数
   * @param {any} [params.data] - 额外数据，会直接赋值到 feature 对象上
   * @param {any} [params.*] - 其他额外数据属性，会直接赋值到 feature 对象上
   * @returns {import('ol/Feature').default} OpenLayers Feature 对象
   * @example
   * const feature = createLineFeature(
   *   [[87.58, 43.83], [87.60, 43.85], [87.62, 43.87]],
   *   {
   *     style: { stroke: { color: '#ff0000', width: 2 } },
   *     name: '路线1'
   *   }
   * );
   */
  const createLineFeature = (coordinates, params) => {
    return createFeature(new LineString(coordinates), params);
  };

  /**
   * 创建圆形要素
   * 根据中心坐标和半径创建圆形几何对象，设置样式和额外数据
   *
   * @param {Array} args - 圆形参数数组
   * @param {Array<number>} args[0] - 中心坐标 [经度, 纬度]
   * @param {number} args[1] - 圆的半径（单位：米）
   * @param {number} [args[2]] - 用多少个点绘制圆，默认 64
   * @param {number} [args[3]] - 球面半径，默认 6371008.8（地球半径）
   * @param {Object} [params={}] - 配置参数
   * @param {Object|Function} [params.style] - 样式配置或样式函数
   * @param {any} [params.data] - 额外数据，会直接赋值到 feature 对象上
   * @param {any} [params.*] - 其他额外数据属性，会直接赋值到 feature 对象上
   * @returns {import('ol/Feature').default} OpenLayers Feature 对象
   * @example
   * const feature = createCircleFeature(
   *   [[87.58, 43.83], 1000], // 中心点和半径1000米
   *   {
   *     style: {
   *       fill: { color: 'rgba(255,0,0,0.3)' },
   *       stroke: { color: '#ff0000', width: 2 }
   *     },
   *     name: '覆盖区域'
   *   }
   * );
   */
  const createCircleFeature = ([coordinate, radius, n, sphereRadius], params) => {
    return createFeature(circularPolygon(coordinate, radius, n, sphereRadius), params);
  };

  /**
   * 创建通用要素对象
   * 核心方法，用于创建任意类型的几何要素，并设置样式和额外数据
   *
   * @param {Object|import('ol/geom/Geometry').default} options - 几何配置或几何对象
   *   如果传入对象，需包含 geometry 字段；如果直接传入几何对象，则作为 geometry 使用
   * @param {Object} [params={}] - 配置参数
   * @param {Object|Function} [params.style] - 样式配置或样式函数
   * @param {any} [params.data] - 额外数据，会直接赋值到 feature 对象上
   * @param {any} [params.*] - 其他额外数据属性，会直接赋值到 feature 对象上
   * @returns {import('ol/Feature').default} OpenLayers Feature 对象
   * @example
   * const feature = createFeature(
   *   { geometry: new Point([87.58, 43.83]) },
   *   { style: { image: { radius: 10 } }, id: 'feature-1' }
   * );
   */
  const createFeature = (options, { style, ...data } = {}) => {
    // 创建几何对象
    const feature = new Feature(options);
    // 设置样式
    if (style && getStyle) {
      feature.setStyle(getStyle(style));
    }
    // 设置额外数据
    assign(feature, data);
    // 返回几何对象
    return feature;
  };

  /**
   * 向指定图层添加要素
   * 将创建好的要素添加到已存在的图层数据源中
   *
   * @param {string} name - 图层名称
   * @param {import('ol/Feature').default} feature - 要素对象
   * @throws {Error} 如果图层不存在或数据源不存在，会抛出错误
   * @example
   * const feature = createPoint([87.58, 43.83]);
   * addFeature('myLayer', feature);
   */
  const addFeature = (name, feature) => {
    // 根据图层获取数据源
    const source = getLayerSource(name);
    if (!source) {
      console.warn(`图层 "${name}" 不存在，无法添加要素`);
      return;
    }
    // 数据源添加几何对象
    source.addFeature(feature);
  };

  /**
   * 根据条件查询图层中的要素集合
   * 支持 lodash.filter 的所有查询方式
   *
   * @param {string} name - 图层名称
   * @param {Array|Function|Object|string} predicate - 过滤条件
   *   - Function: (feature) => boolean
   *   - Object: { property: value } 匹配属性
   *   - Array: ['property', value] 匹配属性
   *   - string: 匹配属性名存在
   * @returns {Array<import('ol/Feature').default>} 匹配的要素集合
   * @example
   * // 查询所有要素
   * const allFeatures = getFeatures('myLayer');
   *
   * // 根据属性查询
   * const redFeatures = getFeatures('myLayer', { color: 'red' });
   *
   * // 使用函数查询
   * const largeFeatures = getFeatures('myLayer', (f) => f.get('size') > 100);
   */
  const getFeatures = (name, predicate) => {
    const source = getLayerSource(name);
    if (!source) {
      console.warn(`图层 "${name}" 不存在，无法获取要素`);
      return [];
    }
    const list = source.getFeatures();
    return predicate ? filter(list, predicate) : list;
  };

  /**
   * 根据条件移除图层中的要素
   * 先查询匹配的要素，然后从图层数据源中移除
   *
   * @param {string} name - 图层名称
   * @param {Array|Function|Object|string} predicate - 过滤条件，同 getFeatures
   * @example
   * // 移除所有要素
   * removeFeature('myLayer');
   *
   * // 移除指定属性的要素
   * removeFeature('myLayer', { id: 'feature-1' });
   *
   * // 使用函数移除
   * removeFeature('myLayer', (f) => f.get('status') === 'deleted');
   */
  const removeFeature = (name, predicate) => {
    // 获取图层数据源
    const source = getLayerSource(name);
    if (!source) {
      console.warn(`图层 "${name}" 不存在，无法移除要素`);
      return;
    }
    // 根据特征获取要素集合
    const list = getFeatures(name, predicate);
    list.forEach((feature) => {
      // 移除要素
      source.removeFeature(feature);
    });
  };

  return {
    createPointByData,
    createPoint,
    createLineFeature,
    createCircleFeature,
    createFeature,
    addFeature,
    getFeatures,
    removeFeature,
  };
};
