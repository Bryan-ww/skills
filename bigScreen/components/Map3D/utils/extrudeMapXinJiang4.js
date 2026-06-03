import {
  Mesh,
  Vector2,
  Vector3,
  Color,
  Group,
  Object3D,
  BufferAttribute,
  RepeatWrapping,
  ShapeGeometry,
  Shape,
  ExtrudeGeometry,
  MeshBasicMaterial,
  DoubleSide,
  MeshLambertMaterial,
  AdditiveBlending,
  MultiplyBlending,
  MeshStandardMaterial, 
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  BufferGeometry,
  Sprite,
  SpriteMaterial,
  PlaneGeometry,
  DstColorFactor,
  OneMinusSrcAlphaFactor,
  ZeroFactor,
  AddEquation,
  CustomBlending,
} from 'three';
import { transfromMapGeoJSON, randomColor } from '../mini3d'
import { geoMercator } from 'd3-geo'
import { mapScale } from './config'
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

export class ExtrudeMapXinJiang {
  constructor({ assets, time, scene, label3d }, config = {}) {
    this.mapGroup = new Group()
    // 用来展示收费站
    this.tollStationGroup = new Group()
    this.tollStationGroup.visible = false
    this.serviceAreaGroup = new Group()
    this.serviceAreaGroup.visible = false
    // 用来保存收费站label
    this.top3Group = new Group()
    this.top3Group.rotateX(-Math.PI / 2);
    this.top3Group.visible = false
    this.assets = assets
    this.scene = scene
    this.label3d = label3d
    this.time = time
    this.coordinates = []
    this.colors = [
      new Color(0x09D8F4),
      new Color(0x09F483),
      new Color(0x099FF4),
      new Color(0x093DF4),
      new Color(0x7FF409),
      new Color(0xF4C009),
    ]
    this.newColors = [
      new Color(0x3B8D1B),
      new Color(0x35882D),
      new Color(0x2F833E),
      new Color(0x297D4F),
      new Color(0x227760),
      new Color(0x1C7272),
      new Color(0x176D83),
      new Color(0x106793),
      new Color(0x0A61A5),
      new Color(0x085AA8),
      new Color(0x09519F),
      new Color(0x0B4796),
      new Color(0x0D3F8D),
      new Color(0x0F3584),
      new Color(0x102C7B),
      new Color(0x112371),
    ]
    this.shapeHeightOffset = 0.17
    this.colorIndex = 0
    this.cityScaleConfig = [
      { name: '乌鲁木齐', adcode: 650100, scale: 1.64 },
      { name: '吐鲁番', adcode: 650400, scale: 1.3 },
      { name: '阿克苏', adcode: 652900, scale: 1.4 },
    ]
    this.machineRooms = JSON.parse(this.assets.instance.getResource('machineRooms'))
    this.machineRooms.forEach(i => {
      i.length = i.machineRooms.length
    })
    this.machineRooms.sort((a, b) => {
      return b.length - a.length
    })
    this.top5 = this.machineRooms.slice(0, 5)
    this.maxMachineRoomNumber = this.machineRooms[0].length
    this.maxAddScale = 0.64
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
    this.tollStationGroup.position.copy(this.config.position)
    this.serviceAreaGroup.position.copy(this.config.position)

    let mapData = transfromMapGeoJSON(this.config.data)
    this.create(mapData)
    // this.createServiceArea()
    // this.createTollStation()
  }
  // createServiceArea() {
  //   getServiceArea(true).then(res => {
  //     const shapeMeshZ = this.config.depth + this.shapeHeightOffset
  //     this.serviceAreaGroup.add(this.createPlaneMeshNew(res.list, 0x009900, shapeMeshZ))
  //   })
  // }
  // createTollStation() {
  //   getTollStation(true).then(res => {
  //     const shapeMeshZ = this.config.depth + this.shapeHeightOffset
  //     this.tollStationGroup.add(this.createPlaneMeshNew(res.list, 0xffff00, shapeMeshZ))
  //   })
  // }
  geoProjection(args) {
    return geoMercator().center(this.config.center).scale(mapScale).translate([0, 0])(args)
  }
  randomColor() {
    if (this.colorIndex >= this.newColors.length) {
      this.colorIndex = this.newColors.length - 1
    }
    const color = this.newColors[this.colorIndex]
    this.colorIndex++
    return color
  }
  lerpColor(t) {
    const color1 = new Color(0x65FC03)
    const color2 = new Color(0x0000ff)
    const resultColor = new Color()
    resultColor.copy(color2).lerp(color1, t);
    return resultColor
  }
  create(mapData) {
    const excludeAdcodes = this.config.excludeAdcodes || []
    const shapeHeightOffset = 0.17
    const originOpacity = 0.6
    let topMaterial = this.config.topFaceMaterial
    // this.createLabels(this.top5)
    mapData.features.forEach((feature) => {
      const group = new Object3D()

      let { name, adcode, center = [], centroid = [] } = feature.properties
      if (excludeAdcodes.includes(adcode)) {
        return
      }
      
      this.coordinates.push({ name, center, centroid })

      const machineRoomData = this.machineRooms.find(i => adcode === i.adcode)
      // const scaleConfig = this.cityScaleConfig.find(i => i.adcode === adcode)
      // const t = machineRoomData ? machineRoomData.machineRooms.length / this.maxMachineRoomNumber / this.maxAddScale : 0
      // const depthScale = machineRoomData ? 1 + machineRoomData.machineRooms.length * this.maxAddScale / this.maxMachineRoomNumber : 1 
      const depthScale = 1
      const extrudeSettings = {
        depth: this.config.depth,
        bevelEnabled: true,
        bevelSegments: 1,
        bevelThickness: 0.1,
      }

      
      
      feature.geometry.coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon, index) => {
          const shape = new Shape()
          const linePoints = []
          for (let i = 0; i < polygon.length; i++) {
            if (!polygon[i][0] || !polygon[i][1]) {
              return false
            }
            const [x, y] = this.geoProjection(polygon[i])
            linePoints.push([x, y])
            if (i === 0) {
              shape.moveTo(x, -y)
            }
            shape.lineTo(x, -y)
          }

          const geometry = new ExtrudeGeometry(shape, extrudeSettings)
          
          if (this.config.setUv) {
            assignUVs({ min: this.config.min, max: this.config.max }, geometry)
          }
          let materials = [topMaterial, this.config.sideMaterial]
          const mesh = new Mesh(geometry, materials)
          mesh.originDepth = this.config.depth
          mesh.depthScale = depthScale
          mesh.scale.set(1, 1, depthScale)

          const meshGroup = new Group()

          meshGroup.add(mesh)
          group.add(meshGroup)
        })
      })
      this.mapGroup.add(group)
    })
  }
  createPointMesh(machineRooms, z) {
    const vertices = [];
    machineRooms.forEach(machineRoom => {
      const [x, y] = this.geoProjection([Number(machineRoom.lng), Number(machineRoom.lat)])
      vertices.push(x, -y, 0)
    })
    

    const geometry = new BufferGeometry();
    geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    const material = new PointsMaterial( { color: 0xff0000, size: 0.1, fog: false } );
    const points = new Points( geometry, material );
    points.position.z = z + 0.02
    return points
  }

  createSpriteMesh(machineRooms, z) {
    const group = new Group()
    const texture0 = this.assets.instance.getResource('tollstationBar')
    const material = new SpriteMaterial({
      map: texture0,
      fog: false,
      transparent: true,
      depthTest: false,
    });
    const scale = 1.6
    const aspectRatio0 = texture0.image.width / texture0.image.height;
    machineRooms.forEach(machineRoom => {
      const [x, y] = this.geoProjection([Number(machineRoom.lng), Number(machineRoom.lat)])
      const sprite = new Sprite(material);
      sprite.scale.set(scale * aspectRatio0, scale, scale);
      sprite.position.set(x, -y, z + 0.8);
      group.add(sprite)
    })

    return group
  }
  createPlaneMeshNew(list, color1, z) {
    const group = new Group()
    const texture0 = this.assets.instance.getResource('guangzhu')
    const material = new MeshBasicMaterial({
      map: texture0,
      fog: false,
      transparent: true,
      // depthTest: false,
      depthWrite: false,
      // blending: MultiplyBlending
    });
    const materialTime = { value: 0 }
    this.time.on('tick', ( delta, elapsedTime ) => {
      materialTime.value = elapsedTime
    })
    const shaderUniforms = {
      uTime: materialTime,
      uColor1: { value: new Color(color1)},
      uColor2: { value: new Color(0xffffff)},
    }
    modifyPlaneShader(material, shaderUniforms)
    const geometry = new PlaneGeometry(0.1, 0.4)
    list.forEach(item => {
      const [x, y] = this.geoProjection([item.lnglat[0], item.lnglat[1]])
      const mesh1 = new Mesh(geometry, material)
      mesh1.renderOrder = 1000
      mesh1.position.set(x, z + 0.5, y);
      const mesh2 = mesh1.clone()
      mesh2.rotateY(Math.PI * 2 / 3)
      const mesh3 = mesh1.clone()
      mesh3.rotateY(Math.PI * 4 / 3)
      group.add(mesh1)
      group.add(mesh2)
      group.add(mesh3)
    })

    return group
  }
  createPlaneMesh(machineRooms, z) {
    const group = new Group()
    const texture0 = this.assets.instance.getResource('guangzhu')
    const material = new MeshBasicMaterial({
      map: texture0,
      fog: false,
      transparent: true,
      // depthTest: false,
      depthWrite: false,
      // blending: MultiplyBlending
    });
    const materialTime = { value: 0 }
    this.time.on('tick', ( delta, elapsedTime ) => {
      materialTime.value = elapsedTime
    })
    const shaderUniforms = {
      uTime: materialTime,
      uColor1: { value: new Color(0xffff00)},
      uColor2: { value: new Color(0xffffff)},
    }
    modifyPlaneShader(material, shaderUniforms)
    const geometry = new PlaneGeometry(0.1, 0.4)
    machineRooms.forEach(machineRoom => {
      const [x, y] = this.geoProjection([Number(machineRoom.lng), Number(machineRoom.lat)])
      const mesh1 = new Mesh(geometry, material)
      mesh1.renderOrder = 1000
      mesh1.position.set(x, z + 0.5, y);
      const mesh2 = mesh1.clone()
      mesh2.rotateY(Math.PI * 2 / 3)
      const mesh3 = mesh1.clone()
      mesh3.rotateY(Math.PI * 4 / 3)
      group.add(mesh1)
      group.add(mesh2)
      group.add(mesh3)
    })

    return group
  }
  createLabels(machineRooms) {
    const beseHeight = 2
     machineRooms.forEach((machineRoom, index) => {
      const [x, y] = this.geoProjection([Number(machineRoom.lng), Number(machineRoom.lat)])
      this.labelStyle(machineRoom, index, [x, -y, index === 0 ? beseHeight + 0.5 : beseHeight])
    })
  }
  labelStyle(data, index, position) {
    let label = this.label3d.create('', 'tollstation-fee-bar-box', false);
    const name = data.company.replace('新疆交通投资(集团)有限责任公司', '')
    label.init(
      `<div class="bg bg-${index}">
      <div class="total-fee" style="margin-right: 10px;">
          <span class="number">TOP${index + 1}</span>
      </div>
      <div class="station-name">${name} ${data.length}个收费站</div>
  </div>`,
      new Vector3(position[0], position[1], position[2])
    );
    const scale = 0.01
    label.element.style.pointerEvents = 'none'
    label.scale.set(scale, scale, scale)
    label.rotation['x'] = Math.PI / 2
    label.originZ = position[2]
    label.setParent(this.top3Group);
    label.show()
    return label;
  }

  getCoordinates() {
    return this.coordinates
  }
  setParent(parent) {
    parent.add(this.mapGroup)
    this.scene.add(this.tollStationGroup)
    this.scene.add(this.serviceAreaGroup)
    // this.scene.add(this.top3Group)
  }
}

const drawLine2 = (points, options = {}) => {
  const defaultOptions = {
    color: 0xffffff,
    linewidth: 5,
    vertexColors: false,
    dashed: false,
    fog: false,
    alphaToCoverage: false,
  };
  const transformedPoints = points.map(i => {
    const [x, y] = i
    return new Vector3(x, -y, 0);
  })
  const geometry = new LineGeometry();

  geometry.setFromPoints( transformedPoints);
  const matLine = new LineMaterial({ ...defaultOptions, ...options });

  const line = new Line2(geometry, matLine);

  return line;
};

export function assignUVs({ min, max }, uvForGeometry) {
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

const setGradient = (material, geometry) => {
  geometry.computeBoundingBox();
  const max = geometry.boundingBox.max,
    min = geometry.boundingBox.min;
  const offset = new Vector2(0 - min.x, 0 - min.y);
  const range = new Vector2(max.x - min.x, max.y - min.y);
  const center = [min.x + range.x / 2, min.y + range.y / 2]
  const radius = range.x / 2
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


export const modifyPlaneShader = (material, uniforms) => {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('void main() {', () => {
      return `
        varying vec3 vWordPosition;
        void main() {
          vWordPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        `
    })
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', () => {
      return `
        varying vec3 vWordPosition;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        void main() {
        `
    })
    shader.fragmentShader = shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', () => {
      return `
        // vec3 tempColor = mix(uColor1, uColor2, abs(sin(uTime / 4.0)));
        float x = vWordPosition.x;
        float tempOpacity = abs(sin(x / 2.0 + uTime / 2.0));
        vec4 diffuseColor = vec4( uColor1, tempOpacity );
        `
    })
  }
}

