import {
  Mesh,
  Vector2,
  Vector3,
  Color,
  Group,
  Object3D,
  BufferAttribute,
  RepeatWrapping,
  Shape,
  ExtrudeGeometry,
  MeshBasicMaterial,
  DoubleSide,
  MeshLambertMaterial,
  AdditiveBlending,
  MultiplyBlending,
  MeshStandardMaterial, Float32BufferAttribute,
} from 'three';
import { transfromMapGeoJSON, randomColor } from '../mini3d'
import { geoMercator } from 'd3-geo'
import { mapScale } from './config'

export class ExtrudeMap {
  constructor({ assets, time }, config = {}) {
    this.mapGroup = new Group()
    this.assets = assets
    this.time = time
    this.coordinates = []
    this.config = Object.assign(
      {
        position: new Vector3(0, 0, 0),
        center: new Vector2(0, 0),
        data: '',
        renderOrder: 1,
        topFaceMaterial: new MeshBasicMaterial({
          color: 0x18263b,
          transparent: true,
          opacity: 1,
        }),
        sideMaterial: new MeshBasicMaterial({
          color: 0x07152b,
          transparent: true,
          opacity: 1,
        }),
        depth: 0.1,
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
    const excludeAdcodes = this.config.excludeAdcodes || []
    mapData.features.forEach((feature) => {
      const group = new Object3D()

      let { name, adcode, center = [], centroid = [] } = feature.properties
      if (excludeAdcodes.includes(adcode)) {
        return
      }
      this.coordinates.push({ name, center, centroid })

      const extrudeSettings = {
        depth: this.config.depth,
        bevelEnabled: true,
        bevelSegments: 1,
        bevelThickness: 0.1,
      }

      feature.geometry.coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon, index) => {
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

          const geometry = new ExtrudeGeometry(shape, extrudeSettings)
          let topMaterial = this.config.topFaceMaterial
          if (this.config.gradient) {
            geometry.computeBoundingBox();
              var max = geometry.boundingBox.max,
                min = geometry.boundingBox.min;
              var offset = new Vector2(0 - min.x, 0 - min.y);
              var range = new Vector2(max.x - min.x, max.y - min.y);
            topMaterial = this.config.topFaceMaterial.clone()
            setGradient(topMaterial, [min.x + range.x / 2, min.y + range.y / 2], range.x / 2)
          }
          if (this.config.setUv) {
            assignUVs(geometry, geometry)
          }
          let materials = [topMaterial, this.config.sideMaterial]
          const mesh = new Mesh(geometry, materials)

          if (this.config.shadow) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
          group.add(mesh)
        })
      })
      this.mapGroup.add(group)
    })
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

const setGradient = (material, center, radius) => {
  material.onBeforeCompile = (shader) => {
      shader.uniforms = {
        ...shader.uniforms,
        uRadius: { value: radius },
        uCenter: { value: new Vector3(center[0], center[1], 0) },
      };
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
        attribute float alpha;
        varying vec3 vPosition;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vPosition = position;
      `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        varying vec3 vPosition;
        varying float vAlpha;
        uniform float uRadius;
        uniform vec3 uCenter;
      
        void main() {
      `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        /* glsl */ `
      #ifdef OPAQUE
      diffuseColor.a = 1.0;
      #endif
      
      // https://github.com/mrdoob/three.js/pull/22425
      #ifdef USE_TRANSMISSION
      diffuseColor.a *= transmissionAlpha + 0.1;
      #endif
      float d = distance(uCenter, vPosition);
      
      diffuseColor.a *= vAlpha * (d / uRadius);

      float newAlpha = 0.5 * (d / uRadius);
      newAlpha = pow(newAlpha, 2.0);
      
      gl_FragColor = vec4( outgoingLight, newAlpha );
      `
      );
    };
}
