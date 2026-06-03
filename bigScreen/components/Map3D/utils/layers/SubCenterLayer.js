import { Group, TextureLoader, SpriteMaterial, Sprite, Vector3, SRGBColorSpace, Color, CanvasTexture, DoubleSide, } from 'three'
import { roadColor, hideSDAndGD } from '../config';
import cameraAndTarget from '../cameraPosition.js'
import { preloadImages } from '../util.js';
import { getInfoScale } from '../../mini3d/index.js';
import machineRooms from '../../json/machineRooms.json'
import blue_bg from '../../images/blue_bg.png'
import yellow_bg from '../../images/yellow_bg.png'
import { Layer } from './Layer.js'
import subCentersBlueArrow from '../../texture/subCenters/blue_arrow.png';
import subCentersYellowArrow from '../../texture/subCenters/yellow_arrow.png';
import SubCenterInfoCard from './components/SubCenterInfoCard.vue'
import { mountComponentToContainer } from '../util.js'
import { InitStage } from '../subStages/InitStage.js' 


const subCenterCamera = {
  // 阿克苏分公司
  '10911': {
    "camera": {x: -4.45647604755278, y: 4.671299704286303, z: 5.041795259381601},
    "target": {x: -4.036856047552782, y: 0.2583467042863037, z: -0.48570374061839555}, 
  },
  // 阿勒泰分公司
  '10903': {
    "camera": {x: -0.15150590028518582, y: 4.6798272879066865, z: 0.5005407238056043},
    "target": {x: 0.054533099714814674, y: 2.6357762879066993, z: -2.0619872761943845}, 
  },
  // 阿图什分公司
  '10912': {
    "camera": {x: -6.832072876571655, y: 4.89449404959739, z: 6.190982500968672},
    "target": {x: -6.3360086106436775, y: -0.2523103825355738, z: -0.25698204196761887}, 
  },
  // 博乐分公司
  '10904': {
    "camera": {x: -3.106563776891827, y: 4.727910927186756, z: 2.0388350423080253},
    "target": {x: -2.932972531568573, y: 1.594775106557538, z: -1.4725464426901902}, 
  },
  // 昌吉分公司
  '10906': {
    "camera": {x: 0.0031358471011425984, y: 4.991480472015352, z: 4.089279429746853},
    "target": {x: -0.03716132347921911, y: 1.1984326881947878, z: -1.0840749258469389}, 
  },
  // 哈密分公司
  '10909': {
    "camera": {x: 2.9732726317203007, y: 5.436433151390193, z: 3.726615317586644},
    "target": {x: 3.161683431802282, y: 0.8900368679173776, z: -0.7186910517515744}, 
  },
  // 和田分公司
  '10914': {
    "camera": {"x": -2.8610291670995096, "y": 4.949435347366231, "z": 8.201359184629748},
    "target": {"x": -2.579971318513905, "y": -0.9085791206514919, "z": 0.5148674160271314},
  },
  // 喀什分公司
  '10913': {
    "camera": {x: -6.4123816871038795, y: 5.298235519659509, z: 7.064198232808864},
    "target": {x: -5.915015583692769, y: -0.40655877374645094, z: -0.07277139121815458}, 
  },
  // 克拉玛依分公司
  '10905': {
    "camera": {x: -2.0695234888848097, y: 5.604272043589591, z: 1.6349738982749389},
    "target": {x: -1.8279454888848115, y: 1.5325330435895903, z: -2.03652310172506}, 
  },
  // 库尔勒分公司
  '10910': {
    "camera": {x: -0.04309482752845599, y: 5.489053909223463, z: 4.313341816882918},
    "target": {x: 0.10496050196702829, y: 0.3663010588012896, z: -0.5902999341810791}, 
  },
  // 奎屯分公司
  '10915': {
    "camera": {x: -1.6555405442312026, y: 5.514608892450523, z: 2.0763211643753063},
    "target": {x: -1.6082162942312026, y: 1.4976298424505237, z: -1.2496269356246923}, 
  },
  // 塔城分公司
  '10902': {
    "camera": {x: -2.7117871262085673, y: 5.374987462163099, z: 0.13335604174496263},
    "target": {x: -2.6227201262085664, y: 1.4600854621630992, z: -2.81499295825503}, 
  },
  // 吐鲁番分公司
  '10908': {
    "camera": {x: 0.2501061563959913, y: 5.234956048847984, z: 4.534555457074904},
    "target": {x: 0.7026192561752094, y: 1.0446478047961263, z: -0.7243754617136392}, 
  },
  // 乌鲁木齐分公司
  '10907': {
    "camera": {x: 0.207263777509624, y: 5.635166893836706, z: 4.250293240216316},
    "target": {x: 0.7104165337781136, y: 1.4467359417834014, z: -1.0159759036527134}, 
  },
  // 伊犁分公司
  '10901': {
    "camera": {x: -3.582308980721072, y: 5.675431891362708, z: 3.0570683569295722},
    "target": {x: -3.3657198107210724, y: 1.3998002363627082, z: -1.2737854680704255}, 
  },
  // 阿乌高速
  '10920': {
    "camera": {x: 0.207263777509624, y: 5.635166893836706, z: 4.250293240216316},
    "target": {x: 0.7104165337781136, y: 1.4467359417834014, z: -1.0159759036527134}, 
  },
  // 阿富高速
  '10921': {
    "camera": {x: -0.15150590028518582, y: 4.6798272879066865, z: 0.5005407238056043},
    "target": {x: 0.054533099714814674, y: 2.6357762879066993, z: -2.0619872761943845},
  },
  // 精阿高速
  '10922': {
    "camera": {x: -3.106563776891827, y: 4.727910927186756, z: 2.0388350423080253},
    "target": {x: -2.932972531568573, y: 1.594775106557538, z: -1.4725464426901902}, 
  },
   // 盛塔
  '10923': {
    "camera": {x: -2.7117871262085673, y: 5.374987462163099, z: 0.13335604174496263},
    "target": {x: -2.6227201262085664, y: 1.4600854621630992, z: -2.81499295825503}, 
  },
   // 云塔
  '10924': {
    "camera": {x: -2.7117871262085673, y: 5.374987462163099, z: 0.13335604174496263},
    "target": {x: -2.6227201262085664, y: 1.4600854621630992, z: -2.81499295825503}, 
  },
}

export class SubCenterLayer extends Layer {
  constructor(mapInstance) {
    super()
    this.mapInstance = mapInstance;
    this.scene = mapInstance.scene;
    this.assets = mapInstance.assets;
    this.subCenterRoadLineMaterials = this.mapInstance.subCenterRoadLineMaterials;

    this.subCenters = machineRooms
    this.group = new Group();
    this.sprites = []
    this.labels = []
    this.nameSprites = []
    this.infoLabel = null
    this.spriteScale = 0.25
    this.nameSpriteScale = 0.3
    this.labelScale = 0.01
    this.nameSpriteRate = 288 / 68

    this.feeAndFlow = []
    this.subCenterInfo = {}

    this.controllerInfoLabel = new AbortController();
    this.controllerLabel = new AbortController();

    this.textureLoader = new TextureLoader()
    this.texture = null
    this.checkedTexture = null
    this.loadTexture(subCentersBlueArrow).then((texture) => {
      texture.colorSpace = SRGBColorSpace
      this.texture = texture
    })
    this.loadTexture(subCentersYellowArrow).then((texture) => {
      texture.colorSpace = SRGBColorSpace
      this.checkedTexture = texture
    })

    this.imgs = []
    this.blueTextures = {}
    this.yellowTextures = {}

    this.created = false
  }
  show() {
    if (!this.created) {
      this.createLayer()
    } else {
      this.group.visible = true
    }
  }
  hide() {
    this.group.visible = false
  }

  async createLayer() {
    const imgs = await Promise.all([
      preloadImages([blue_bg]),
      preloadImages([yellow_bg]),
    ]).then(res => {
      return res.flat()
    })
    this.imgs = imgs
    this.initCanvasTexture()
    this.createInfoLabel()
    this.fillGroup()
    this.bindEvent()
    this.created = true
  }
  initCanvasTexture() {
    this.subCenters.forEach(item => {
      const name = item.shortName || item.company.replace('新疆交通投资(集团)有限责任公司', '')
      this.blueTextures[name] = this.createCanvasTexture(name, 'blue')
      this.yellowTextures[name] = this.createCanvasTexture(name, 'yellow')
    })
  }
  createCanvasTexture(name, type) {
    const img = type === 'blue' ? this.imgs[0] : this.imgs[1]
    const canvas = document.createElement('canvas');
    const height = 68
    const width = 288
    const scale = 1
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    // 设置角标样式
    ctx.beginPath();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 设置文字样式
    ctx.fillStyle = 'white';
    ctx.font = 'normal 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);

    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }

  loadTexture(url) {
    return new Promise((resolve) => {
      this.textureLoader.load(
        url,
        (texture) => {
          resolve(texture)
        }
      )
    })
  }
  createInfoLabel() {
    let label = this.mapInstance.label3d.create('', `sub-center__info-label-box`, true);

    mountComponentToContainer(label.element, SubCenterInfoCard, {data: {}})
    // label.init(
    //   `<div class="">
    //     <div class="a-box"></div>
    // </div>`,
    //   new Vector3(0, 0, 0)
    // );
    const scale = getInfoScale();
    label.element.style.pointerEvents = 'all';
    label.scale.set(scale, scale, scale);
    label.rotation['x'] = Math.PI / 2;
    label.setParent(this.group);
    label.hide();
    this.infoLabel = label
    setTimeout(() => {
      document.querySelector('.sub-center__info-label-box')?.addEventListener('click', () => {
        this.mapInstance.clearCameraTl();
        this.mapInstance.changeCameraAndTarget(InitStage.name);
        this.reset()
      }, { signal: this.controllerInfoLabel.signal })
    }, 200)
  }
  showInfoLabel(data, position) {
    this.infoLabel.element.updateProps({data: data})
    this.infoLabel.position.copy(position);
    this.infoLabel.position.z += 1.35
    this.infoLabel.originZ = this.infoLabel.position.z
    this.infoLabel.show()
  }
  hideInfoLabel() {
    this.infoLabel.hide()
  }

  fillGroup() {
    this.group.rotation.x = -Math.PI / 2;
    this.scene.add(this.group);

    const labelScale = this.labelScale

    let renderOrder = 21;
    const scale = this.spriteScale;

    this.subCenters.forEach(async (item) => {
      const name = item.shortName || item.company.replace('新疆交通投资(集团)有限责任公司', '')
      item.name = name
      const { width, height } = this.texture.source.data
      const stateMaterial = new SpriteMaterial({
        map: this.texture,
        fog: false,
        transparent: true,
        depthWrite: false,
      });
      let [x, y] = this.mapInstance.geoProjection([item.lng, item.lat]);
      let position = [x, -y, this.mapInstance.depth + 0.6];
      const sprite = new Sprite(stateMaterial);
      sprite.scale.set(scale * width / height, scale, 1);
      sprite.renderOrder = renderOrder;

      sprite.position.set(...position);
      sprite.userData = { ...item };
      this.group.add(sprite);
      this.sprites.push(sprite)

      const nameMaterial = new SpriteMaterial({
        map: this.blueTextures[name],
        // map: this.texture,
        fog: false,
        transparent: true,
        depthWrite: false,
      });
      const nameSprite = new Sprite(nameMaterial);
      nameSprite.scale.set(this.nameSpriteScale * this.nameSpriteRate, this.nameSpriteScale, 1);
      nameSprite.renderOrder = renderOrder;
      let z = position[2] + 0.4
      // 防止昌吉和乌鲁木齐label重合，所以把昌吉位置定的高一些
      if (item.buMenCode === '10906') {
        z += 0.2
      }
      nameSprite.position.set(position[0], position[1], z)
      nameSprite.userData = { ...item };
      this.group.add(nameSprite);
      this.nameSprites.push(nameSprite)
    });
  }
  bindEvent() {
    this.sprites.forEach((sprite, index) => {
      const nameSprite = this.nameSprites[index]
      this.mapInstance.interactionManager.add(sprite);
      this.mapInstance.interactionManager.add(nameSprite);
      const data = sprite.userData;
      // const label = this.labels[index]
      // label?.element.addEventListener('click', () => {
      //   this.eventHandler(data, index)
      // }, { signal: this.controllerInfoLabel.signal })
      sprite.addEventListener('mousedown', (ev) => {
        if (this.mapInstance.clicked) return false;
        this.mapInstance.clicked = true;
        const data = ev.target.userData;
        this.eventHandler(data, index)
      });
      sprite.addEventListener('mouseup', (ev) => {
        this.mapInstance.clicked = false;
      });
      nameSprite.addEventListener('mousedown', (ev) => {
        if (this.mapInstance.clicked) return false;
        this.mapInstance.clicked = true;
        const data = ev.target.userData;
        this.eventHandler(data, index)
      });
      nameSprite.addEventListener('mouseup', (ev) => {
        this.mapInstance.clicked = false;
      });
    })
  }
  async eventHandler(data, index) {
    if (!this.group.visible) {
      return
    }
    this.checkSprite(data, index)
    this.highLightLine(data)
    this.mapInstance.toSpecialCameraAndTarget(subCenterCamera[data.buMenCode])
  }
  uncheckAllSprite() {
    this.sprites.forEach((sprite, index) => {
      const userData = sprite.userData
      const nameSprite = this.nameSprites[index]
      nameSprite.material.map = this.blueTextures[userData.name]
      nameSprite.material.needsUpdate = true
      if (sprite.material.map !== this.texture) {
        sprite.material.map = this.texture
        sprite.material.needsUpdate = true
      }
      // const label = this.labels[index]
      // label.element.classList.remove('checked')
    })
  }
  checkSprite(userData, indexChecked) {
    this.uncheckAllSprite()
    const nameSprite = this.nameSprites[indexChecked]
    nameSprite.material.map = this.yellowTextures[userData.name]
    nameSprite.material.needsUpdate = true

    const sprite = this.sprites[indexChecked]
    sprite.material.map = this.checkedTexture
    sprite.material.needsUpdate = true
    // const label = this.labels[indexChecked]
    // label.element.classList.add('checked')
    this.showInfoLabel(userData, nameSprite.position)
  }
  // 重置线路颜色
  resetLineColor() {
    // for(const m of Object.values(this.subCenterRoadLineMaterials.sd)) {
    //   m.color.set(roadColor.jtsd)
    // }
    // for(const m of Object.values(this.subCenterRoadLineMaterials.gd)) {
    //   m.color.set(roadColor.jtgd)
    // }
  }
  // 高亮路线
  highLightLine({ buMenCode }) {
    // const sd = this.subCenterRoadLineMaterials.sd[buMenCode]
    // const gd = this.subCenterRoadLineMaterials.gd[buMenCode]
    // this.resetLineColor()
    // if (sd) {
    //   sd.color.set(0xff0000)
    // }
    // if (gd) {
    //   gd.color.set(0xff0000)
    // }
  }
  // 复原选中状态和线的颜色
  reset() {
    this.hideInfoLabel()
    this.uncheckAllSprite()
    this.resetLineColor()
  }
  // 根据摄像头的距离试试调整sprite的大小
  distanceChange(distance) {
    if (!this.group.visible || !this.infoLabel) {
      return
    }
    const rate = distance / this.mapInstance.toTargetDistance
    const rate3 = rate ** 0.5
    const rate2 = rate ** 0.2
    const spriteScale = this.spriteScale * rate3
    const nameSpriteScale = this.nameSpriteScale * rate3
    const labelScale = this.labelScale * rate3
    this.infoLabel.position.z = this.infoLabel.originZ * rate2
    // this.infoLabel.scale.set(labelScale, labelScale, labelScale)
    this.sprites.forEach(sprite => {
      sprite.scale.set(spriteScale, spriteScale, spriteScale)
    })
    this.nameSprites.forEach(sprite => {
      sprite.scale.set(nameSpriteScale * this.nameSpriteRate, nameSpriteScale, nameSpriteScale)
    })
    //  this.labels.forEach(label => {
    //   label.scale.set(labelScale, labelScale, labelScale)
    //   label.position.z = label.originZ * rate2
    // })
  }
  destroy() {
    this.infoLabel?.element?.unmount()
    this.infoLabel?.destroy()
    this.controllerInfoLabel.abort()
    this.controllerLabel.abort()
    if (this.group) {
      this.scene.remove(this.group)
      this.disposeGroup(this.group)
    }
  }
}
