import { Group } from 'three';

import { Layer } from './Layer.js';

import { getSectionCoordinates } from '../../mini2d/utils/getPoi.js';
import { drawLineSegments2 } from '../drawLine';
import SubCenterInfoCard from './components/SubCenterInfoCard.vue'
import { InfoCardLayer } from './InfoCardLayer.js'

export class RoadSectionLayer extends Layer {
  constructor(mapInstance) {
    super();
    this.mapInstance = mapInstance;
    this.scene = mapInstance.scene;
    this.assets = mapInstance.assets;
    this.infoCardLayer = new InfoCardLayer(mapInstance, {
      component: SubCenterInfoCard,
      className: 'road-section__info-card-box',
    })

    this.group = new Group();
    this.created = false;
    this.sectionData = {
      sectionName: 'G30哈土段',
      roadName: 'G30',
      start: 3017,
      end: 3362,
    };
  }
  show() {
    if (!this.created) {
      this.createLayer();
    } else {
      this.group.visible = true;
      this.infoCardLayer.show();
    }
  }
  hide() {
    this.group.visible = false;
    this.infoCardLayer.hide();
  }
  
  setSectionData(sectionData) {
    this.sectionData = sectionData;
    const visible = this.group.visible;
    this.destroy();
    this.group = new Group();
    this.created = false;
    if (visible) {
      this.createLayer();
    }
  }

  async createLayer() {
    const res = await getSectionCoordinates(this.sectionData.roadName, this.sectionData.start, this.sectionData.end);

    const coordinates = res.geometry.coordinates;
    const middlePoint = coordinates[Math.floor(coordinates.length / 2)];
    this.infoCardLayer.setInfoCardDatas([
      {
        name: this.sectionData.sectionName,
        lng: middlePoint[0],
        lat: middlePoint[1],
        "camera": {x: 2.9732726317203007, y: 5.436433151390193, z: 3.726615317586644},
        "target": {x: 3.161683431802282, y: 0.8900368679173776, z: -0.7186910517515744}, 
      }
    ]);
    this.infoCardLayer.show();

    const lineGroup = drawLineSegments2(
      [res],
      {
        color: '#ff0000',
        linewidth: 3,
      },
      {
        center: this.mapInstance.pointCenter,
        transformed: false,
        jsJT: true,
        // material,
      }
    );
    this.group.add(lineGroup);

    lineGroup.rotateX(Math.PI / 2);
    lineGroup.position.y += 0.92;
    lineGroup.renderOrder = 2;
    this.mapInstance.scene.add(this.group);
    this.created = true;
  }

  // 根据摄像头的距离试试调整sprite的大小
  distanceChange(distance) {
    if (!this.group.visible) {
      this.infoCardLayer.distanceChange(distance);
      return;
    }
  }
  destroy() {
    this.scene.remove(this.group);
    this.group = new Group();
    this.infoCardLayer.destroy();
    this.created = false;
  }
}
