import { Layer } from './Layer.js'
import { createRoadGroup } from '../createRoad';
import JTSDGS from '../../json/JTSDGS.json'
import JTGDGS from '../../json/JTGDGS.json'
import GDGS from '../../json/GDGS.json'
import SDGS from '../../json/SDGS.json'
import { roadColor, hideSDAndGD } from '../config';

import machineRooms from '../../json/machineRooms.json'
import { MeshLineMaterial } from 'meshline'
import { Vector2 } from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

// import GDGS_ORIGIN from '@/assets/json/GDGS_ORIGIN.json'
// console.log('JTGDGS', JTGDGS)
// console.log('JTSDGS', JTSDGS)
// console.log('GDGS_ORIGIN', GDGS_ORIGIN)
// console.log('GDGS', GDGS)
// console.log('SDGS', SDGS)
// console.log('JTSDGS', JTSDGS)
// console.log('JTGDGS', JTGDGS)

export class RoadNetworkLayer extends Layer {
  constructor(mapInstance) {
    super()
    this.mapInstance = mapInstance

    // 交投管养国道高速图层
    this.JTGDGroup = null;
    // 交投管养省道高速图层
    this.JTSDGroup = null;
    // 国道高速图层
    this.GDGSGroup = null;
    // 省的高速图层
    this.SDGSGroup = null;

    this.lineType = 'line2'
    this.mergeRoadCoordinates = true
    this.roadWidth = this.lineType === 'meshLine' ? 5 : 2
    this.jtRoadY = 0.92
    this.roadY = 0.92

      // 所有分公司路线的材质
    this.subCenterRoadLineMaterials = {
      // 国道
      gd: {},
      // 省道
      sd: {}
    }

    this.createSubCenterRoadLineMaterials()
  }
  show() {
    this.showRoads();
  }
  hide() {
    // this.hideRoads();
  }

  // 显示交投管养的道路
  showJTRoads() {
    if (!this.JTGDGroup) {
      this.createJTGD();
      this.createJTSD();
    } else {
      this.JTGDGroup.visible = true;
      this.JTSDGroup.visible = true;
    }
  }
  // 隐藏交投管养的道路
  hideJTRoads() {
    if (this.JTGDGroup) {
      this.JTGDGroup.visible = false;
      this.JTSDGroup.visible = false;
    }
  }
  // 显示全疆的道路
  showRoads() {
    if (!this.GDGSGroup) {
      this.createGDGS();
      this.createSDGS();
    } else {
      this.GDGSGroup.visible = true;
      this.SDGSGroup.visible = true;
    }
  }
  // 隐藏全疆的道路
  hideRoads() {
    if (this.GDGSGroup) {
      this.GDGSGroup.visible = false;
      this.SDGSGroup.visible = false;
    }
  }

  // 创建交投省道线路
  async createJTSD() {
    const lineGroup = createRoadGroup({
      groupedRoadData: JTSDGS,
      lineType: this.lineType,
      color: roadColor.jtsd,
      sizes: this.mapInstance.sizes,
      hideSDAndGD,
      mergeRoadCoordinates: this.mergeRoadCoordinates,
      roadWidth: this.roadWidth,
      pointCenter: this.mapInstance.pointCenter,
      isJT: true,
      subCenterRoadLineMaterials: this.subCenterRoadLineMaterials,
    });

    lineGroup.rotateX(Math.PI / 2);
    lineGroup.position.y += this.jtRoadY;
    lineGroup.renderOrder = 2;
    this.JTSDGroup = lineGroup;
    this.mapInstance.scene.add(lineGroup);
  }

  // 创建交投国道线路
  async createJTGD() {
    const lineGroup = createRoadGroup({
      groupedRoadData: JTGDGS,
      lineType: this.lineType,
      color: roadColor.jtgd,
      sizes: this.mapInstance.sizes,
      hideSDAndGD,
      mergeRoadCoordinates: this.mergeRoadCoordinates,
      roadWidth: this.roadWidth,
      pointCenter: this.mapInstance.pointCenter,
      isJT: true,
      subCenterRoadLineMaterials: this.subCenterRoadLineMaterials,
    });

    lineGroup.rotateX(Math.PI / 2);
    lineGroup.position.y += this.jtRoadY;
    lineGroup.renderOrder = 2;
    this.JTGDGroup = lineGroup;
    this.mapInstance.scene.add(lineGroup);
  }

  // 创建国道线路
  async createGDGS() {
    const lineGroup = createRoadGroup({
      groupedRoadData: GDGS,
      lineType: this.lineType,
      color: roadColor.gd,
      sizes: this.mapInstance.sizes,
      hideSDAndGD,
      mergeRoadCoordinates: this.mergeRoadCoordinates,
      roadWidth: this.roadWidth,
      pointCenter: this.mapInstance.pointCenter,
      isJT: false,
    });

    lineGroup.rotateX(Math.PI / 2);
    lineGroup.position.y += this.roadY;
    lineGroup.renderOrder = 1;
    this.GDGSGroup = lineGroup;
    this.mapInstance.scene.add(lineGroup);
  }

  // 创建省道线路
  async createSDGS() {
    const lineGroup = createRoadGroup({
      groupedRoadData: SDGS,
      lineType: this.lineType,
      color: roadColor.sd,
      sizes: this.mapInstance.sizes,
      hideSDAndGD,
      mergeRoadCoordinates: this.mergeRoadCoordinates,
      roadWidth: this.roadWidth,
      pointCenter: this.mapInstance.pointCenter,
      isJT: false,
    });

    lineGroup.rotateX(Math.PI / 2);
    lineGroup.position.y += this.roadY;
    lineGroup.renderOrder = 1;
    this.SDGSGroup = lineGroup;
    this.mapInstance.scene.add(lineGroup);
  }

  // 创建分公司路线材质
  createSubCenterRoadLineMaterials() {
    const subCenters = machineRooms
    subCenters.forEach((subCenter) => {
      if (this.lineType === 'meshLine') {
         this.subCenterRoadLineMaterials.gd[subCenter.buMenCode] = new MeshLineMaterial({
          sizeAttenuation: 0,
          fog: false,
          useMap: false,
          color: roadColor.jtgd,
          lineWidth: this.roadWidth,
          resolution: new Vector2(this.mapInstance.sizes.width, this.mapInstance.sizes.height),
        })
        this.subCenterRoadLineMaterials.sd[subCenter.buMenCode] = new MeshLineMaterial({
          sizeAttenuation: 0,
          fog: false,
          useMap: false,
          color: roadColor.jtsd,
          lineWidth: this.roadWidth,
          resolution: new Vector2(this.mapInstance.sizes.width, this.mapInstance.sizes.height),
        })
      } else {
         this.subCenterRoadLineMaterials.gd[subCenter.buMenCode] = new LineMaterial({
          color: roadColor.jtgd,
          linewidth: this.roadWidth + 2,
          vertexColors: false,
          dashed: false,
          fog: false,
          alphaToCoverage: false,
        })
        this.subCenterRoadLineMaterials.sd[subCenter.buMenCode] = new LineMaterial({
          color: roadColor.jtsd,
          linewidth: this.roadWidth + 2,
          vertexColors: false,
          dashed: false,
          fog: false,
          alphaToCoverage: false,
        })
      }
     
    })
  }
}
