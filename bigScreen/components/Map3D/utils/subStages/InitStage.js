import { SubStage } from './SubStage.js'

export class InitStage extends SubStage {
  static name = 'initStage'
  constructor(mapInstance) {
    super({
      mapInstance,
      name: InitStage.name,
      cameraPosition: [
        {
          camera: {x: -1.4113389372149145, y: 14.229184234220078, z: 3.137401625559402},
          target: {x: -1.5626675970685282, y: -0.8065855229011739, z: 0.8700116126844548},
          duration: 2,
          delay: 0,
          ease: 'circ.out',
        },
        // {
        //   camera: {x: 1.5907755247942634, y: 7.5633487438280556, z: 10.099947752034799},
        //   target: {x: -1.908846, y: -0.7618429999999995, z: 0.490326},
        //   duration: 48,
        //   delay: 0,
        //   ease: 'linear',
        //   // 是否循环
        //   yoyo: true,
        // },
      ],
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