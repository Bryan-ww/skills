import {
  Mesh,
  Vector2,
  Color,
  Group,
  Object3D,
  BufferAttribute,
  Shape,
  ExtrudeGeometry,
  MeshBasicMaterial,
  Float32BufferAttribute,
  DoubleSide,
  ShapeGeometry,
  Vector3,
} from 'three'
import { transfromMapGeoJSON, getBoundBox, randomColor } from '../mini3d'
import { geoMercator } from 'd3-geo'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { mapScale } from './config'

export class BaseMap {
  constructor({ }, config = {}) {
    this.mapGroup = new Group()
    this.coordinates = []
    this.config = Object.assign(
      {
        position: new Vector3(0, 0, 0),
        center: new Vector2(0, 0),
        data: '',
        renderOrder: 1,
        merge: false,
        setUv: false,
        material: new MeshBasicMaterial({
          color: 0x18263b,
          transparent: true,
          opacity: 1,
        }),
      },
      config
    )
    this.mapGroup.position.copy(this.config.position)
    let mapData = transfromMapGeoJSON(this.config.data)
    this.create(mapData)
  }
  geoProjection(args) {
    return geoMercator().center(this.config.center).scale(mapScale).translate([0, 0])(args)
  }
  create(mapData) {
    try {
      let { merge, setUv } = this.config
      let shapes = []
      mapData.features.forEach((feature) => {
        const group = new Object3D()

        let { name, adcode, center = [], centroid = [] } = feature.properties
        this.coordinates.push({ name, center, centroid })
        group.userData.name = name
        group.userData.adcode = adcode
        group.userData.center = center
        group.userData.centroid = centroid
        feature.geometry.coordinates.forEach((multiPolygon) => {
          multiPolygon.forEach((polygon) => {
            const shape = new Shape()
            for (let i = 0; i < polygon.length; i++) {
              if (!polygon[i][0] || !polygon[i][1]) {
                return false
              }
              const [x, y] = this.geoProjection(polygon[i])
              if (i === 0) {
                shape.moveTo(x, -y)
              }
              shape.lineTo(x, -y)
            }

            const geometry = new ShapeGeometry(shape)
            if (merge) {
              shapes.push(geometry)
            } else {
              const mesh = new Mesh(geometry, this.config.material)
              mesh.renderOrder = this.config.renderOrder
              mesh.userData.name = name
              mesh.userData.adcode = adcode
              mesh.userData.center = center
              mesh.userData.centroid = centroid
              if (this.config.shadow) {
                mesh.receiveShadow = true;
              }
              group.add(mesh)
            }
          })
        })
        if (!merge) {
          this.mapGroup.add(group)
        }
      })
      if (merge) {
        let geometry = mergeGeometries(shapes)
        if (setUv) {
          assignUVs(geometry, geometry)
        }

        const mesh = new Mesh(geometry, this.config.material)
        mesh.renderOrder = this.config.renderOrder
        if (this.config.shadow) {
          mesh.receiveShadow = true;
        }
        this.mapGroup.add(mesh)
      }
    } catch (err) {
      console.log('err', err);
    }
  }
  hide() {
    this.mapGroup.visible = false
  }
  show() {
    this.mapGroup.visible = true
  }
  getCoordinates() {
    return this.coordinates
  }
  setParent(parent) {
    parent.add(this.mapGroup)
  }
}

export function assignUVs(geometry, uvForGeometry) {
  geometry.computeBoundingBox();
  var max = geometry.boundingBox.max,
    min = geometry.boundingBox.min;
  var offset = new Vector2(0 - min.x, 0 - min.y);
  var range = new Vector2(max.x - min.x, max.y - min.y);
  const position = uvForGeometry.getAttribute('position')
  const points = position.array
  const uvs = []
  for (let i = 0; i < points.length; i += 3) {
    const x = points[i]
    const y = points[i + 1]
    const uvX = (x + offset.x) / range.x
    const uvY = (y + offset.y) / range.y
    uvs.push(uvX, uvY)
  }

  uvForGeometry.setAttribute('uv', new Float32BufferAttribute(new Float32Array(uvs), 2));
  uvForGeometry.getAttribute('uv').needsUpdate = true;
}
