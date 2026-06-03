import Overlay from 'ol/Overlay.js';
import { v4 } from 'uuid';

/**
 * 创建机房overlay
 * @param {Array<number>} point 人员位置 [经度, 纬度]
 * @returns {Overlay}
 */
export const createTollStationOverlay = ({ point, name }) => {
  const id = v4();
  const element = document.createElement('div');
  element.innerHTML = `
    <div class="name">${name}</div>
    <div class="icon"></div>
  `;
  element.dataset.overlayId = id;
  element.classList.add('toll-station-overlay');

  const overlay = new Overlay({
    id: id,
    position: point,
    element: element,
    stopEvent: false,
    positioning: 'bottom-center',
  });
  return overlay;
};
