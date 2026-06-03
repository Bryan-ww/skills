import { LineBasicMaterial, Group, LineLoop, Line as OriginLine, Vector3, BufferGeometry } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
// import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { transfromMapGeoJSON, getBoundBox } from '../mini3d'
import { geoMercator } from 'd3-geo'
import { mapScale } from './config'

export class Line {
  /**
   * 线条类
   * @param {*} base this
   * @param {*} config
   */
  constructor({}, config = {}) {
    this.config = Object.assign(
      {
        visibelProvince: '',
        center: [0, 0],
        data: '',
        material: new LineBasicMaterial({ color: 0xffffff }),
        type: 'LineLoop',
        renderOrder: 1,
      },
      config
    )

    let mapData = transfromMapGeoJSON(this.config.data)
    let lineGroup = this.create(mapData)
    this.lineGroup = lineGroup
  }
  geoProjection(args) {
    return geoMercator().center(this.config.center).scale(mapScale).translate([0, 0])(args)
  }
  create(data) {
    const { type, visibelProvince, excludeAdcodes = [] } = this.config
    let features = data.features
    let lineGroup = new Group()
    for (let i = 0; i < features.length; i++) {
      const element = features[i]
      if (excludeAdcodes.includes(element.properties.adcode)) {
        continue
      }
      if (element.properties.name === visibelProvince) {
        continue
      }
      element.geometry.coordinates.forEach((coords) => {
        const points = []
        let line = null

        if (type === 'Line2') {
          coords[0].forEach((item) => {
            const [x, y] = this.geoProjection(item)
            points.push(x, -y, 0)
          })
          line = this.createLine2(points)
        } else {
          coords[0].forEach((item) => {
            const [x, y] = this.geoProjection(item)
            points.push(new Vector3(x, -y, 0))
          })
          line = this.createLine(points)
        }
        // 将线条插入到组中
        lineGroup.add(line)
      })
    }
    return lineGroup
  }
  createLine2(points) {
    const { material, renderOrder } = this.config
    const geometry = new LineGeometry()
    geometry.setPositions(points)
    let line = new Line2(geometry, material)
    line.name = 'mapLine2'
    line.renderOrder = renderOrder
    line.computeLineDistances()
    return line
  }
  createLine(points) {
    const { material, renderOrder, type } = this.config
    const geometry = new BufferGeometry()
    geometry.setFromPoints(points)
    let line = null
    if (type === 'Line') {
      line = new OriginLine(geometry, material)
    } else {
      line = new LineLoop(geometry, material)
    }

    line.renderOrder = renderOrder
    line.name = 'mapLine'
    return line
  }

  setParent(parent) {
    parent.add(this.lineGroup)
  }
}
