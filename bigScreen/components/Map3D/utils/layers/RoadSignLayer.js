import { Layer } from './Layer.js'
import { CreateRoadSignMesh } from '../createRoadSignLayer';

export class RoadSignLayer extends Layer {
  constructor(mapInstance) {
    super()
    this.mapInstance = mapInstance
    this.createRoadSignLayer = null
  }
  show() {
     if (!this.createRoadSignLayer) {
        this.createRoadSignLayer = new CreateRoadSignMesh(this.mapInstance);
        this.createRoadSignLayer.createLayer()
      } else {
        this.createRoadSignLayer.show();
      }
  }
  hide() {
    // this.createRoadSignLayer?.hide();
  }
  distanceChange(distance) {
    this.createRoadSignLayer?.distanceChange(distance)
  }
}