export const hideOverlays = (overlays) => {
  overlays.forEach(overlay => {
    if (!overlay?.getElement()) return
    overlay.getElement().style.display = 'none'
  })
}
export const showOverlays = (overlays, displayType = 'inline-block') => {
  overlays.forEach(overlay => {
    if (!overlay?.getElement()) return
    overlay.getElement().style.display = displayType
  })
}

/**
 * 设置overlay父元素的z-index
 * @param {ol.Overlay} overlay - overlay实例
 * @param {number} zIndex - z-index值
 */
export const setOverlayParentZIndex = (overlay, zIndex) => {
  if (overlay && overlay.getElement()) {
    const parent = overlay.getElement().parentElement
    if (parent) {
      parent.style.zIndex = zIndex
    }
  }
}

/**
 * 委托点击事件
 * @param {string} ancestorClassName - 父元素类名
 * @param {string} targetClassName - 目标元素类名
 * @param {function} callback - 点击事件回调函数
 * @returns {function|null} 取消事件监听的方法，如果找不到祖先元素则返回null
 */
export const delegateClick = (targetClassName, callback, ancestorClassName = 'ol-overlaycontainer') => {
  const ancestor = document.querySelector(`.${ancestorClassName}`)
  if (!ancestor) return null
  const handler = (event) => {
    let target = event.target
    while (target && target !== ancestor) {
      if (target.classList && target.classList.contains(targetClassName)) {
        callback(event, target)
        return
      }
      target = target.parentElement
    }
  }
  ancestor.addEventListener('click', handler)
  return () => {
    ancestor.removeEventListener('click', handler)
  }
}

