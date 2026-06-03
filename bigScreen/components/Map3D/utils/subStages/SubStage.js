export class SubStage {
  constructor(options) {
    // 子阶段名称
    this.name = options.name;
    // 子阶段相机运动位置结点
    this.cameraPosition = options.cameraPosition
    // 子阶段相机运动限制
    this.controlLimit = options.controlLimit
    // 3D地图实例
    this.mapInstance = options.mapInstance
    // 子阶段的图层
    this.layers = []
  }
  /**
   * 新增子阶段的图层
   * @param {Layer} layer - 图层实例
   * @returns {SubStage} - 当前子阶段实例
   */
  addLayer(layer) {
    this.layers.push(layer)

    return this
  }
  // 子阶段可见性改变时处理方法，待子类实现
  visibleHandler(visible) {
      if (visible) {
        this.layers.forEach(layer => layer.show())
      } else {
        this.layers.forEach(layer => layer.hide())
      }
    }

  // 当相机和目标的距离改变时触发，调整sprite的大小
  distanceChange(distance) {
    this.layers.forEach(layer => layer.distanceChange(distance))
  }
  destroy() {
    this.layers.forEach(layer => layer.destroy())
  }
}