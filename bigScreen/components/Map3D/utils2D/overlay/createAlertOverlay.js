import Overlay from 'ol/Overlay.js';
import { v4 } from 'uuid';

/**
 * 创建告警动画overlay
 * @param {Array<number>} point 告警位置 [经度, 纬度]
 * @returns {Overlay}
 */
export const createAlertOverlay = (point) => {
  const alertElement = document.createElement('div');
  alertElement.classList.add('alert-ripple');

  const alertOverlay = new Overlay({
    id: v4(),
    position: point,
    element: alertElement,
    stopEvent: false,
    positioning: 'center-center',
  })
  return alertOverlay
}