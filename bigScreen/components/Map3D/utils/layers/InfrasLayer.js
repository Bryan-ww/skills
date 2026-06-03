import { Group, Vector3, SRGBColorSpace, CanvasTexture, SpriteMaterial, Sprite, BackSide } from 'three';

import { Layer } from './Layer.js';

export class InfrasLayer extends Layer {
  constructor(mapInstance) {
    super();
    this.mapInstance = mapInstance;
    this.scene = mapInstance.scene;
    this.assets = mapInstance.assets;
    this.label3d = mapInstance.label3d;

    this.labels = []

    this.created = false;
    this.mergedTextureMap = {}
    this.group = new Group();
    this.group.rotation.x = -Math.PI / 2;
    this.scene.add(this.group);
  }
  show() {
    this.group.visible = true;
  }
  hide() {
    this.labels.forEach(label => {
      label.destroy(label);
    })
    this.scene.remove(this.group);
    this.group = new Group();
    this.group.rotation.x = -Math.PI / 2;
    this.scene.add(this.group);
  }

  async createInfras(infrasData) {
    const infrasGroup = new Group();
    
    this.group.add(infrasGroup);
    this.infrasLabels = [];

    const createLabel = (data, position) => {
      let label = this.mapInstance.label3d.create('', 'infras-name-box', true);
      label.init(
        `<div class="">
        ${data.name}
    </div>`,
        new Vector3(position[0], position[1] + 0.5, position[2])
      );
      const scale = 0.01;
      label.element.style.pointerEvents = 'none';
      label.scale.set(scale, scale, scale);
      label.rotation['x'] = Math.PI / 2;
      label.originZ = position[2];
      label.setParent(infrasGroup);
      label.show();
      return label;
    };

    function mergeTexture(texture1, texture2) {
      texture1.colorSpace = SRGBColorSpace;
      texture2.colorSpace = SRGBColorSpace;
      const canvas = document.createElement('canvas');
      canvas.width = texture1.image.width;
      canvas.height = texture1.image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(texture1.image, 0, 0);

      ctx.drawImage(texture2.image, (texture1.image.width - texture2.image.width) / 2, 40);
      return new CanvasTexture(canvas);
    }

    // 缓存合并后的纹理
    const mergedTextureKey = `${infrasData.baseIcon || 'normal'}_${infrasData.type + '_w'}`;
    if (!this.mergedTextureMap[mergedTextureKey]) {
      const stateTexture = await this.mapInstance.loadTexture(`/assets/images/infras/${infrasData.baseIcon || 'normal'}.png`);
      const typeTexture = await this.mapInstance.loadTexture(`/assets/images/infras/${infrasData.type + '_f'}.png`);
      const mergedTexture = mergeTexture(stateTexture, typeTexture);
      mergedTexture.colorSpace = SRGBColorSpace;
      this.mergedTextureMap[mergedTextureKey] = mergedTexture;
    }
    const mergedTexture = this.mergedTextureMap[mergedTextureKey];
    const width = 112
    const height = 146

    let renderOrder = 20;
    console.log(infrasData)
    for (const item of infrasData.list) {
      const scale = 0.6;
      item.type = infrasData.type;

      const stateMaterial = new SpriteMaterial({
        map: mergedTexture,
        fog: false, 
        transparent: true,
        depthWrite: false,
      });
      const lnglat = item.geometry.coordinates;
      let [x, y] = this.mapInstance.geoProjection(lnglat);
      let position = [x, -y, this.mapInstance.depth + 0.7];
      const sprite = new Sprite(stateMaterial);
      sprite.scale.set((scale * width) / height, scale, 1);
      sprite.renderOrder = renderOrder;
      renderOrder++;

      sprite.position.set(...position);
      sprite.userData.position = [...position];
      sprite.userData = { ...item };
      infrasGroup.add(sprite);
      const label = createLabel(item, position);
      this.labels.push(label)

      // 事件
      this.mapInstance.interactionManager.add(sprite);
      sprite.addEventListener('mousedown', (ev) => {
        if (this.clicked) return false;
        this.clicked = true;
        const data = ev.target.userData;
        // this.refs[data.type]?.value.open(data);
      });
      sprite.addEventListener('mouseup', (ev) => {
        this.clicked = false;
      });
      sprite.addEventListener('mouseover', (event) => {
        document.body.style.cursor = 'pointer';
      });
      sprite.addEventListener('mouseout', (event) => {
        document.body.style.cursor = 'default';
      });
    }
  }

  // 根据摄像头的距离试试调整sprite的大小
  distanceChange(distance) {
    if (!this.group.visible) {
    }
  }
  destroy() {

  }
}
