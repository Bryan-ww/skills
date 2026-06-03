import { Resource } from '../mini3d';
import { FileLoader } from 'three';
import side from '../texture/side1.png';
import side2 from '../texture/side2.png';
import ocean from '../texture/ocean-bg.png';
import rotationBorder1 from '../texture/rotationBorder1.png';
import rotationBorder2 from '../texture/rotationBorder2.png';
import chinaBlurLine from '../texture/chinaBlurLine.png';
import guangquan1 from '../texture/guangquan01.png';
import guangquan2 from '../texture/guangquan02.png';
import huiguang from '../texture/huiguang.png';
import flyLine from '../texture/flyLine2.png';
import flyLineFocus from '../texture/guangquan01.png';
import pathLine from '../texture/pathLine2.png';
import arrow from '../texture/arrow.png';
import point from '../texture/point1.png';
import maintainArrow from '../texture/maintain_arrow.png';
import eventRedArrow from '../texture/event_red_arrow.png';
import circleGradient from '../texture/circle_gradient.png';
import xinjiang1 from '../texture/1.png';
import xinjiang2 from '../texture/2.png';
import xinjiang3 from '../texture/31.png';
import guangqiu from '../texture/guangqiu.png';
import tollstationBar from '../texture/tollstation_bar.png';
import guangzhu from '../texture/guangZhu1.png';
import subCentersBlueArrow from '../texture/subCenters/blue_arrow.png';
import subCentersYellowArrow from '../texture/subCenters/yellow_arrow.png';
import subCentersGuojiCity from '../texture/subCenters/guoji_city.png';
import subCentersGuoNeiCity from '../texture/subCenters/guonei_city.png';
import subCentersCity from '../texture/subCenters/city.png';

import xinjiang_line from '../json/xinjiang_line.json?url'
import xinjiang from '../json/xinjiang.json?url'
import siwei_xinjiang_line from '../json/siwei_xinjiang_line.json?url'
import china from '../json/china.json?url'
import worldZh from '../json/world.zh.json?url'
import wulumuqi from '../json/wulumuqi.json?url'
import machineRooms from '../json/machineRooms.json?url'  

// import bridge from '/assets/images/infras/bridge_f.png';
// import tunnel from '/assets/images/infras/tunnel_f.png';
// import serviceArea from '/assets/images/infras/serviceArea_f.png';
// import tollStation from '/assets/images/infras/tollStation_f.png';
// import roadLevel from '/assets/images/infras/roadLevel_f.png';
// import slope from '/assets/images/infras/slope_f.png';
// import parking from '/assets/images/infras/parking_f.png';
// import weatherStation from '/assets/images/infras/weatherStation_f.png';
// import trafficEvent from '/assets/images/infras/trafficEvent_f.png';
// import highwayDiseases from '/assets/images/infras/highwayDiseases_f.png';
// import specialProject from '/assets/images/infras/specialProject_f.png';
// import subCenter from '/assets/images/infras/subCenter_f.png';
// import camera from '/assets/images/infras/camera_f.png';
// import newsBoard from '/assets/images/infras/newsBoard_f.png';
// import longMenJia from '/assets/images/infras/longMenJia_f.png';
// import construct from '/assets/images/infras/construct_f.png';
// import shigong from '/assets/images/infras/shigong_f.png';
// import shigu from '/assets/images/infras/shigu_f.png';

// import infraNormal from '/assets/images/infras/normal.png';
// import infraError from '/assets/images/infras/error.png';
// import infraOffline from '/assets/images/infras/offline.png';

export class Assets {
  constructor(onLoadCallback = null) {
    this.onLoadCallback = onLoadCallback;
    this.init();
  }
  init() {
    this.instance = new Resource();

    this.instance.addLoader(FileLoader, 'FileLoader');

    this.instance.on('onLoad', () => {
      this.onLoadCallback && this.onLoadCallback();
    });

    let base_url = '/';
    let assets = [
      { type: 'Texture', name: 'huiguang', path: huiguang },
      { type: 'Texture', name: 'rotationBorder1', path: rotationBorder1 },
      { type: 'Texture', name: 'rotationBorder2', path: rotationBorder2 },
      { type: 'Texture', name: 'guangquan1', path: guangquan1 },
      { type: 'Texture', name: 'guangquan2', path: guangquan2 },
      { type: 'Texture', name: 'chinaBlurLine', path: chinaBlurLine },
      { type: 'Texture', name: 'ocean', path: ocean },
      { type: 'Texture', name: 'side', path: side },
      { type: 'Texture', name: 'side2', path: side2 },
      { type: 'Texture', name: 'flyLine', path: flyLine },
      { type: 'Texture', name: 'flyLineFocus', path: flyLineFocus },
      { type: 'Texture', name: 'pathLine', path: pathLine },
      { type: 'Texture', name: 'arrow', path: arrow },
      { type: 'Texture', name: 'point', path: point },
      { type: 'Texture', name: 'maintainArrow', path: maintainArrow },
      { type: 'Texture', name: 'eventRedArrow', path: eventRedArrow },
      { type: 'Texture', name: 'circleGradient', path: circleGradient },
      { type: 'Texture', name: 'xinjiang1Texture', useCache: true, path: xinjiang1 },
      { type: 'Texture', name: 'xinjiang2Texture', useCache: true, path: xinjiang2 },
      { type: 'Texture', name: 'xinjiang3Texture', useCache: true, path: xinjiang3 },
      { type: 'Texture', name: 'guangqiu', path: guangqiu },
      { type: 'Texture', name: 'tollstationBar', path: tollstationBar },
      { type: 'Texture', name: 'guangzhu', path: guangzhu },

      { type: 'Texture', name: 'subCentersBlueArrow', path: subCentersBlueArrow },
      { type: 'Texture', name: 'subCentersYellowArrow', path: subCentersYellowArrow },
      { type: 'Texture', name: 'subCentersGuojiCity', path: subCentersGuojiCity },
      { type: 'Texture', name: 'subCentersGuoNeiCity', path: subCentersGuoNeiCity },
      { type: 'Texture', name: 'subCentersCity', path: subCentersCity },

      // { type: 'Texture', name: 'bridge', path: bridge },
      // { type: 'Texture', name: 'tunnel', path: tunnel },
      // { type: 'Texture', name: 'serviceArea', path: serviceArea },
      // { type: 'Texture', name: 'tollStation', path: tollStation },
      // { type: 'Texture', name: 'roadLevel', path: roadLevel },
      // { type: 'Texture', name: 'slope', path: slope },
      // { type: 'Texture', name: 'parking', path: parking },
      // { type: 'Texture', name: 'weatherStation', path: weatherStation },
      // { type: 'Texture', name: 'trafficEvent', path: trafficEvent },
      // { type: 'Texture', name: 'highwayDiseases', path: highwayDiseases },
      // { type: 'Texture', name: 'specialProject', path: specialProject },
      // { type: 'Texture', name: 'subCenter', path: subCenter },
      // { type: 'Texture', name: 'camera', path: camera },
      // { type: 'Texture', name: 'newsBoard', path: newsBoard },
      // { type: 'Texture', name: 'longMenJia', path: longMenJia },
      // { type: 'Texture', name: 'construct', path: construct },
      // { type: 'Texture', name: 'shigong', path: shigong },
      // { type: 'Texture', name: 'shigu', path: shigu },

      // { type: 'Texture', name: 'infraNormal', path: infraNormal },
      // { type: 'Texture', name: 'infraError', path: infraError },
      // { type: 'Texture', name: 'infraOffline', path: infraOffline },

      {
        type: 'File',
        name: 'xinjiang',
        path: xinjiang,
      },
      {
        type: 'File',
        name: 'xinjiang_line',
        path: xinjiang_line,
      },
      {
        type: 'File',
        name: 'siwei_xinjiang_line',
        path: siwei_xinjiang_line,
      },
      {
        type: 'File',
        name: 'wulumuqi',
        path: wulumuqi,
      },
      {
        type: 'File',
        name: 'china',
        path: china,
      },
      {
        type: 'File',
        name: 'world',
        path: worldZh,
      },
      {
        type: 'File',
        name: 'machineRooms',
        path: machineRooms,
      },
    ];

    this.instance.loadAll(assets);
  }
}
