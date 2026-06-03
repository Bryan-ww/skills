import { Fill, Stroke, Circle, Style, Text, RegularShape, Icon } from 'ol/style';
import { isPlainObject, isFunction, isEmpty } from 'lodash';
import { clearObject } from '@/utils';

/**
 * OpenLayers 样式组合式工具
 *
 * 对官方样式类的一层「配置化」封装，便于在业务代码中用简单对象描述复杂样式。
 *
 * 主要封装的类：
 * - Style:        https://openlayers.org/en/latest/apidoc/module-ol_style_Style-Style.html
 * - Fill:         https://openlayers.org/en/latest/apidoc/module-ol_style_Fill-Fill.html
 * - Stroke:       https://openlayers.org/en/latest/apidoc/module-ol_style_Stroke-Stroke.html
 * - Text:         https://openlayers.org/en/latest/apidoc/module-ol_style_Text-Text.html
 * - Circle:       https://openlayers.org/en/latest/apidoc/module-ol_style_Circle-CircleStyle.html
 * - RegularShape: https://openlayers.org/en/latest/apidoc/module-ol_style_RegularShape-RegularShape.html
 * - Icon:         https://openlayers.org/en/latest/apidoc/module-ol_style_Icon-Icon.html
 *
 * 使用方式示例：
 * const { getStyle } = styleComposition();
 * const style = getStyle({
 *   fill: { color: 'rgba(255,0,0,0.5)' },
 *   stroke: { color: '#ff0000', width: 2 },
 *   text: { text: 'Hello', fill: { color: '#fff' } },
 * });
 *
 * 也支持按要素/分辨率动态返回样式配置：
 * const styleFn = getStyle((feature, resolution) => ({
 *   text: { text: feature.get('name') },
 *   // ...其它依赖 feature/resolution 的配置
 * }));
 */
export const styleComposition = () => {
  /**
   * 获取描边对象
   * 如果传入的是配置对象则创建新的 Stroke 实例，如果已经是 Stroke 实例则直接返回
   *
   * @param {Object|import('ol/style/Stroke').default} param Stroke 配置或 Stroke 实例
   * @param {string} [param.color] 描边颜色，如 '#ff0000' 或 'rgba(255,0,0,0.5)'
   * @param {number} [param.width] 描边宽度，单位：像素
   * @param {string} [param.lineCap] 线端点样式：'butt'|'round'|'square'
   * @param {string} [param.lineJoin] 线连接样式：'bevel'|'round'|'miter'
   * @returns {import('ol/style/Stroke').default} Stroke 实例
   * @see https://openlayers.org/en/latest/apidoc/module-ol_style_Stroke-Stroke.html
   * @example
   * const stroke = getStroke({ color: '#ff0000', width: 2 });
   */
  const getStroke = (param) => (isPlainObject(param) ? new Stroke(param) : param);

  /**
   * 获取填充对象
   * 如果传入的是配置对象则创建新的 Fill 实例，如果已经是 Fill 实例则直接返回
   *
   * @param {Object|import('ol/style/Fill').default} param Fill 配置或 Fill 实例
   * @param {string} [param.color] 填充颜色，如 '#ff0000' 或 'rgba(255,0,0,0.5)'
   * @returns {import('ol/style/Fill').default} Fill 实例
   * @see https://openlayers.org/en/latest/apidoc/module-ol_style_Fill-Fill.html
   * @example
   * const fill = getFill({ color: 'rgba(255,0,0,0.3)' });
   */
  const getFill = (param) => (isPlainObject(param) ? new Fill(param) : param);

  /**
   * 获取圆形对象（作为 image）
   * 用于点要素的圆形标记样式
   *
   * @param {Object} param Circle 配置对象
   * @param {number} [param.radius] 圆的半径，单位：像素
   * @param {Object} [param.fill] 填充样式配置
   * @param {Object} [param.stroke] 描边样式配置
   * @returns {import('ol/style/Circle').default} Circle 样式实例
   * @see https://openlayers.org/en/latest/apidoc/module-ol_style_Circle-CircleStyle.html
   * @example
   * const circle = getCircle({
   *   radius: 10,
   *   fill: { color: 'rgba(255,0,0,0.5)' },
   *   stroke: { color: '#ff0000', width: 2 }
   * });
   */
  const getCircle = (param) => new Circle(createStyle(param));

  /**
   * 获取正多边形（如正方形、三角形等）对象
   * 用于点要素的正多边形标记样式
   *
   * @param {Object} param RegularShape 配置对象
   * @param {number} [param.points] 多边形边数，如 3（三角形）、4（正方形）
   * @param {number} [param.radius] 外接圆半径，单位：像素
   * @param {number} [param.angle] 旋转角度，单位：弧度
   * @param {Object} [param.fill] 填充样式配置
   * @param {Object} [param.stroke] 描边样式配置
   * @returns {import('ol/style/RegularShape').default} RegularShape 样式实例
   * @see https://openlayers.org/en/latest/apidoc/module-ol_style_RegularShape-RegularShape.html
   * @example
   * const square = getRegularShape({
   *   points: 4,
   *   radius: 10,
   *   fill: { color: 'blue' },
   *   stroke: { color: '#000', width: 1 }
   * });
   */
  const getRegularShape = (param) => new RegularShape(createStyle(param));

  /**
   * 获取图标对象
   * 用于点要素的图标标记样式，支持图片、SVG 等
   *
   * @param {Object} param Icon 配置对象
   * @param {string} [param.src] 图标图片地址（URL 或 base64）
   * @param {Array<number>} [param.size] 图标尺寸 [width, height]
   * @param {Array<number>} [param.anchor] 锚点位置 [x, y]，范围 0-1
   * @param {Array<number>} [param.offset] 偏移量 [x, y]，单位：像素
   * @param {number} [param.scale] 缩放比例
   * @param {number} [param.rotation] 旋转角度，单位：弧度
   * @returns {import('ol/style/Icon').default} Icon 样式实例
   * @see https://openlayers.org/en/latest/apidoc/module-ol_style_Icon-Icon.html
   * @example
   * const icon = getIcon({
   *   src: '/path/to/icon.png',
   *   size: [32, 32],
   *   anchor: [0.5, 1]
   * });
   */
  const getIcon = (param) => new Icon(createStyle(param));

  /**
   * 获取文字对象
   * 用于要素的文字标签样式
   *
   * @param {Object|import('ol/style/Text').default} param Text 配置对象或 Text 实例
   * @param {string} [param.text] 文字内容
   * @param {Object} [param.fill] 文字填充样式
   * @param {Object} [param.stroke] 文字描边样式
   * @param {string} [param.font] 字体样式，如 '12px Arial'
   * @param {number} [param.offsetX] 水平偏移，单位：像素
   * @param {number} [param.offsetY] 垂直偏移，单位：像素
   * @param {string} [param.textAlign] 文字对齐：'left'|'center'|'right'
   * @param {string} [param.textBaseline] 文字基线：'bottom'|'middle'|'top'
   * @returns {import('ol/style/Text').default} Text 样式实例
   * @see https://openlayers.org/en/latest/apidoc/module-ol_style_Text-Text.html
   * @example
   * const text = getText({
   *   text: '标签文字',
   *   fill: { color: '#fff' },
   *   stroke: { color: '#000', width: 1 },
   *   font: '14px Arial'
   * });
   */
  const getText = (param) => {
    if (isPlainObject(param)) {
      return new Text(createStyle(param));
    }
    return param;
  };

  /**
   * 获取 ImageStyle 对象
   * 根据 type 参数创建不同类型的图片样式（圆形、正多边形、图标）
   *
   * @param {Object} options 图片样式配置
   * @param {'regularShape'|'icon'} [options.type] 图片类型
   *   - 默认（不填）为圆形 Circle
   *   - 'regularShape' 创建 RegularShape（正多边形）
   *   - 'icon' 创建 Icon（图标）
   * @param {Object} param 具体图形配置（与对应 OpenLayers 类的构造参数一致）
   * @returns {import('ol/style/Image').default|null} 图片样式实例，如果 param 为空则返回 null
   * @example
   * // 创建圆形样式
   * const circleImg = getImg({ radius: 10, fill: { color: 'red' } });
   *
   * // 创建正方形样式
   * const squareImg = getImg({ type: 'regularShape', points: 4, radius: 10 });
   *
   * // 创建图标样式
   * const iconImg = getImg({ type: 'icon', src: '/icon.png' });
   */
  const getImg = ({ type, ...param } = {}) => {
    if (isEmpty(param)) {
      return null;
    }
    switch (type) {
      case 'regularShape':
        return getRegularShape(param);
      case 'icon':
        return getIcon(param);
      default:
        return getCircle(param);
    }
  };

  /**
   * 根据配置生成 Style 所需的 options 对象
   *
   * 简化了以下字段的创建：
   * - fill             -> Fill 实例
   * - image            -> Circle/RegularShape/Icon 实例
   * - stroke           -> Stroke 实例
   * - text             -> Text 实例
   * - backgroundFill   -> Fill 实例
   * - backgroundStroke -> Stroke 实例
   *
   * 其他参数会原样透传给 Style 构造函数
   *
   * @param {Object} config 样式配置对象
   * @param {Object|import('ol/style/Fill').default} [config.fill] 填充样式
   * @param {Object|import('ol/style/Image').default} [config.image] 图片样式（圆形/多边形/图标）
   * @param {Object|import('ol/style/Stroke').default} [config.stroke] 描边样式
   * @param {Object|import('ol/style/Text').default} [config.text] 文字样式
   * @param {Object|import('ol/style/Fill').default} [config.backgroundFill] 文字背景填充
   * @param {Object|import('ol/style/Stroke').default} [config.backgroundStroke] 文字背景描边
   * @param {...any} param 其他样式参数（如 zIndex、geometry 等）
   * @returns {Object} Style 构造函数所需的 options 对象
   * @see https://openlayers.org/en/latest/apidoc/module-ol_style_Style-Style.html
   * @example
   * const styleOptions = createStyle({
   *   fill: { color: 'rgba(255,0,0,0.5)' },
   *   stroke: { color: '#ff0000', width: 2 },
   *   image: { radius: 10 },
   *   text: { text: '标签', fill: { color: '#fff' } }
   * });
   */
  const createStyle = ({ fill, image, stroke, text, backgroundFill, backgroundStroke, ...param } = {}) => {
    return clearObject({
      fill: getFill(fill),
      image: getImg(image),
      stroke: getStroke(stroke),
      text: getText(text),
      backgroundFill: getFill(backgroundFill),
      backgroundStroke: getStroke(backgroundStroke),
      ...param,
    });
  };

  /**
   * 获取 Style 对象
   * 支持静态样式配置和动态样式函数两种方式
   *
   * @param {Object|Function} style 样式配置或样式函数
   *  - 传对象：直接作为 Style 的配置（会经过 createStyle 处理）
   *  - 传函数：按 (feature, resolution) => styleConfig 动态返回配置
   * @returns {import('ol/style/Style').default|Function} Style 实例或样式函数
   * @example
   * // 静态样式
   * const staticStyle = getStyle({
   *   fill: { color: 'rgba(255,0,0,0.5)' },
   *   stroke: { color: '#ff0000', width: 2 }
   * });
   *
   * // 动态样式（根据要素属性动态变化）
   * const dynamicStyle = getStyle((feature, resolution) => {
   *   const status = feature.get('status');
   *   return {
   *     fill: { color: status === 'active' ? 'green' : 'red' },
   *     text: { text: feature.get('name') }
   *   };
   * });
   */
  const getStyle = (style) => {
    // 如果是函数，则允许按要素/分辨率动态返回配置
    if (isFunction(style)) {
      return (feature, resolution) => {
        const cfg = style(feature, resolution);
        return getStyle(cfg);
      };
    }
    return new Style(createStyle(style || {}));
  };

  return {
    getStyle,
    createStyle,
    getStroke,
    getFill,
    getText,
    getImg,
    getCircle,
    getRegularShape,
    getIcon,
  };
};
