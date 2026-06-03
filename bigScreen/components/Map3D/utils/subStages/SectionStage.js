import { SubStage } from './SubStage.js'

export class SectionStage extends SubStage {
  static name = 'sectionStage'
  constructor(mapInstance) {
    super({
      mapInstance,
      name: SectionStage.name,
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