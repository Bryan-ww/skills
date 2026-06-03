

import Overlay from 'ol/Overlay.js';
import { v4 } from 'uuid';
import { mountComponentToContainer } from '../../../utils/util'
import SubCenterCard from './subCenterCard.vue'

/**
 * 创建分公司信息卡片
 * @param {Array<number>} point 位置 [经度, 纬度]
 * @param {Object} data 分公司信息
 * @returns {Overlay}
 */
export const createSubCenterCardOverlay = (point, data) => {
  const id = v4()
  const element = document.createElement('div');
  element.dataset.overlayId = id;
  element.classList.add('sub-center-card-overlay');
  mountComponentToContainer(element, SubCenterCard, { data: data })

  const overlay = new Overlay({
    id: id,
    position: point,
    element: element,
    offset: [0, -70],
    stopEvent: false,
    positioning: 'bottom-center',
  })
  return overlay
}