import { SubStage } from './SubStage.js'

export class DeviceStage extends SubStage {
  static name = 'deviceStage'
  constructor(mapInstance) {
    super({
      mapInstance,
      name: DeviceStage.name,
      cameraPosition: null,
      controlLimit: {
        // 水平方向
        minAzimuthAngle: -0.3,
        maxAzimuthAngle: 0.5,
        // 垂直方向
        minPolarAngle: 0.15,
        maxPolarAngle: 0.9,
      },
    })
  }
}