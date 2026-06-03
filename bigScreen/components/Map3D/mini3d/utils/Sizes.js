import { EventEmitter } from './EventEmitter'

export class Sizes extends EventEmitter {
  constructor({ canvas, options }) {
    super()
    this.canvas = canvas
    this.options = canvas
    this.pixelRatio = 0
    this.init()
    window.addEventListener('resize', () => {
      this.init()
      this.emit('resize')
    })
  }
  init() {
    const container = document.querySelector(this.options.container || '.big-screen')
    this.width = container.clientWidth
    this.height = container.clientHeight
    this.pixelRatio = this.pixelRatio || Math.min(window.devicePixelRatio, 2)
  }
  destroy() {
    this.off('resize')
  }
}
