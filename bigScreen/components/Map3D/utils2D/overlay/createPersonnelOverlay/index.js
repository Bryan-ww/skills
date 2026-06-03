import Overlay from 'ol/Overlay.js';
import { v4 } from 'uuid';

/**
 * 创建人员overlay
 * @param {Array<number>} point 人员位置 [经度, 纬度]
 * @returns {Overlay}
 */
export const createPersonnelOverlay = (point, data) => {
  const id = v4()
  const element = document.createElement('div');
  element.innerHTML = `
    <div class="name">${data.name}</div>
    <div class="icon"></div>
  `
  element.dataset.overlayId = id;
  element.classList.add('personnel-overlay');

  
  const overlay = new Overlay({
    id: id,
    position: point,
    element: element,
    stopEvent: false,
    positioning: 'center-center',
  })
  return overlay
}