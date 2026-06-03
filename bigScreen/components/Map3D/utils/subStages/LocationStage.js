import { SubStage } from './SubStage.js'

export class LocationStage extends SubStage {
  static name = 'locationStage'
  constructor(mapInstance) {
    super({
      mapInstance,
      name: LocationStage.name,
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