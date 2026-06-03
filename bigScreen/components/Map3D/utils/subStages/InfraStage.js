import { SubStage } from './SubStage.js'

export class InfraStage extends SubStage {
  static name = 'infraStage'
  constructor(mapInstance) {
    super({
      mapInstance,
      name: InfraStage.name,
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