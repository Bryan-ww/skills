import Overlay from 'ol/Overlay.js';
import { v4 } from 'uuid';

/**
 * 创建告警动画overlay
 * @param {Array<number>} point 告警位置 [经度, 纬度]
 * @returns {Overlay}
 */
export const createSubCenterOverlay = ({point, name}) => {
  const id = v4()
  const element = document.createElement('div');
  element.dataset.overlayId = id
  element.innerHTML = `<div class="name">${name}</div><div class="arrow"></div>`;
  element.classList.add('sub-center-overlay');

  const overlay = new Overlay({
    id: id,
    position: point,
    element: element,
    stopEvent: false,
    positioning: 'bottom-center',
  })
  return overlay
}