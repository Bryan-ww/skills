import { WebGLRenderer } from 'three'
import Stats from 'three/addons/libs/stats.module.js'

export class Renderer {
  constructor({ canvas, sizes, scene, camera, postprocessing }) {
    this.canvas = canvas
    this.sizes = sizes
    this.scene = scene
    this.camera = camera
    this.postprocessing = postprocessing
    // this.stats = new Stats();
    // if (import.meta.env.DEV) {
    //   document.body.appendChild(this.stats.dom);
    // }
    this.setInstance()
  }
  setInstance() {
    this.instance = new WebGLRenderer({
      alpha: true,
      antialias: true,
      logarithmicDepthBuffer: false,
      canvas: this.canvas,
    })

    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
  }
  update() {
    // if (import.meta.env.DEV) {
    //   try {
    //     this.stats.update()
    //   } catch(err) {
    //     console.log('state.update()', err);
    //   }
    // }
    if (this.postprocessing) {
      this.postprocessing.update()
    } else {
      this.instance.render(this.scene, this.camera.instance)
    }
  }
  destroy() {
    this.instance.dispose()
    this.instance.forceContextLoss()
  }
}
