import { Group, TextureLoader, SpriteMaterial, Sprite, Vector3, SRGBColorSpace, Color, CanvasTexture, DoubleSide, } from 'three'
import { preloadImages } from '../util.js';
import { getInfoScale } from '../../mini3d/index.js';
import blue_bg from '../../images/blue_bg.png'
import yellow_bg from '../../images/yellow_bg.png'
import { Layer } from './Layer.js'
import subCentersBlueArrow from '../../texture/subCenters/blue_arrow.png';
import subCentersYellowArrow from '../../texture/subCenters/yellow_arrow.png';
import { mountComponentToContainer } from '../util.js'
import { InitStage } from '../subStages/InitStage.js' 

export class InfoCardLayer extends Layer {
  constructor(mapInstance, options = {}) {
    super()
    this.mapInstance = mapInstance;
    this.scene = mapInstance.scene;
    this.assets = mapInstance.assets;
    this.component = options.component
    this.className = options.className

    this.infoCardDatas = options.infoCardDatas || [{
      name: 'G30-吐哈段',
      lng: 88,
      lat: 42,
      "camera": {x: -2.7117871262085673, y: 5.374987462163099, z: 0.13335604174496263},
      "target": {x: -2.6227201262085664, y: 1.4600854621630992, z: -2.81499295825503}, 
    }]
    this.group = new Group();
    this.sprites = []
    this.labels = []
    this.nameSprites = []
    this.infoLabel = null
    this.spriteScale = 0.25
    this.nameSpriteScale = 0.3
    this.labelScale = 0.01
    this.nameSpriteRate = 288 / 68


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
  setInfoCardDatas(datas) {
    this.infoCardDatas = datas
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
    this.infoCardDatas.forEach(item => {
      const name = item.name
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
    this.controllerInfoLabel = new AbortController();
    this.controllerLabel = new AbortController();
    let label = this.mapInstance.label3d.create('', this.className, true);

    mountComponentToContainer(label.element, this.component, {data: {}})
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
      document.querySelector(`.${this.className}`)?.addEventListener('click', () => {
        this.mapInstance.clearCameraTl();
        this.mapInstance.changeCameraAndTarget(InitStage.name);
        this.reset()
      }, { signal: this.controllerInfoLabel.signal })
    }, 200)
  }
  showInfoLabel(data, position) {
    // const dom = document.querySelector('.road-section__info-card-box .a-box')
    // const name = data.shortName || data.company.replace('新疆交通投资(集团)有限责任公司', '')
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

    this.infoCardDatas.forEach(async (item) => {
      const name = item.name
      const { width, height } = this.texture.source.data
      const stateMaterial = new SpriteMaterial({
        map: this.texture,
        fog: false,
        transparent: true,
        depthWrite: false,
      });
      let [x, y] = this.mapInstance.geoProjection([item.lng, item.lat]);
      let position = [x, -y, this.mapInstance.depth + 0.6];

      console.log('position', position)
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
    this.mapInstance.toSpecialCameraAndTarget(data)
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
 
  // 复原选中状态和线的颜色
  reset() {
    this.hideInfoLabel()
    this.uncheckAllSprite()
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
    this.infoLabel?.destroy(this.infoLabel)
    this.infoLabel = null
    this.controllerInfoLabel?.abort()
    this.controllerLabel?.abort()
    if (this.group) {
      this.scene.remove(this.group)
      this.disposeGroup(this.group)
    }
    this.group = new Group()
    this.created = false;
  }
}
