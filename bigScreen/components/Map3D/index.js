import {
  Fog,
  Group,
  MeshBasicMaterial,
  DirectionalLight,
  SpotLight,
  DirectionalLightHelper,
  AmbientLight,
  PointLight,
  Vector3,
  Vector2,
  PointLightHelper,
  CanvasTexture,
  MeshLambertMaterial,
  LineBasicMaterial,
  Color,
  MeshStandardMaterial,
  PlaneGeometry,
  Mesh,
  DoubleSide,
  RepeatWrapping,
  SRGBColorSpace,
  LinearSRGBColorSpace,
  AdditiveBlending,
  VideoTexture,
  BoxGeometry,
  TubeGeometry,
  QuadraticBezierCurve3,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
  CatmullRomCurve3,
  MeshPhysicalMaterial,
  TextureLoader,
  LinearMipmapNearestFilter,
  LinearMipmapLinearFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  LinearFilter,
  NearestFilter,
} from 'three';
import { Mini3d, Grid, Label3d, randomColor } from './mini3d';
import { Assets } from './utils/assets';
import { ExtrudeMap } from './utils/extrudeMap';
import { ExtrudeMapXinJiang } from './utils/extrudeMapXinJiang4';
import { BaseMap } from './utils/baseMap';
import { Line } from './utils/line';
import { geoMercator } from 'd3-geo';

import { mapScale } from './utils/config';
import gsap from 'gsap';
import { InteractionManager } from 'three.interactive';
import { groupBy } from 'lodash';


import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { modifyWorldShader } from './utils/shaders/worldShader';

import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { modifyChinaTopShader } from './utils/shaders/chinaShader';
import { modifyXinJiangSideShader } from './utils/shaders/xinJiangSideShader';
import { mapTransitionShader } from './utils/shaders/mapTransitionShader';
import { roadColor } from './utils/config';
import { INFRAS_TYPE } from './utils/infrasData.js';

import { cacheLargeFiles } from './utils/cacheLargeFile.js'

// 需要缓存的图片
import xinjiang1 from './texture/1.png';
import xinjiang2 from './texture/2.png';
import xinjiang3 from './texture/31.png';

export class World extends Mini3d {
  constructor(canvas, options) {
    super(canvas, options);
    this.refs = {};

    // 配置的所有子阶段
    this.subStages = {}
  
    this.xinJiangMockHeight = 0.5;
    this.toTargetDistance = 13.1
    this.eventBus = options.eventBus;
    this.defaultSubStage = options.defaultSubStage;
    this.mapStore = options.mapStore;
    this.map3dLimit = options.map3dLimit;
    this.hideGui = options.hideGui;
    this.isDev = options.isDev;
    // 子公司牌子是否触发了点击事件
    this.subCenterClicked = false

    // 相机移动角度限制
    this.controlLimit =  {
      'init': {
        // 水平方向
        minAzimuthAngle: -0.3,
        maxAzimuthAngle: 0.5,
        // 垂直方向
        minPolarAngle: 0.15,
        maxPolarAngle: 0.9,
      },
    }

    // 各子阶段的相机运动位置结点
    this.subStageCameraPosition = {
      // 初始化阶段
      init: [
        {
          camera: {x: -3.1348267289343763, y: 7.388187447606406, z: 10.784740572641441},
          target: {x: -1.908846, y: -0.7618429999999995, z: 0.490326},
          duration: 2,
          delay: 0,
          ease: 'circ.out',
        },
        {
          camera: {x: 1.5907755247942634, y: 7.5633487438280556, z: 10.099947752034799},
          target: {x: -1.908846, y: -0.7618429999999995, z: 0.490326},
          duration: 48,
          delay: 0,
          ease: 'linear',
          // 是否循环
          yoyo: true,
        },
      ],
    }
    // 当前展示的地图
    this.currentMapStyle = sessionStorage.getItem('3dMapStyle') || 'map1'
    this.mapStyles = {
      'map1': null,
      'map2': null,
      'map3': null,
    }
    // 当前展示的地图以及备用地图
    this.currentMapStyles = {
      'texture1': { value: null },
      'texture2': { value: null },
    }
    this.chinaLineMaterial = null
    this.mapStyleChangeRatio = { value: 0 }
    this.mapChanging = false
    this.xinJiangLineColors = {
      'map1': 0x7affff,
      'map2': 0x31cdf2,
      'map3': 0xffffff,
    }
    this.min = new Vector3(-7.388638019561768, -6.395110607147217, 0);
    this.max = new Vector3(4.591155052185059, 4.098245143890381, 0);

    this.panel = new GUI({ width: 800 });
    this.preSubStage = '';
    this.nextSubStage = '';
    this.cameraTl = null;
    if (this.hideGui) {
      this.hideGUI();
    }
   
    this.xinJiangExtrude = null;
    this.provinceTL = null;
 
    this.xinJiangMockTop = null;
    
    this.cityInfoLabel = null;

    this.textureLoader = new TextureLoader();

    // 中心坐标
    this.pointCenter = options.center || [113.280637, 23.125178];
    this.flyLineCenter = options.center || [113.544372, 23.329249];
    // 路网拥堵图层
    this.congestionLayer = null;
    this.depth = 0.5;
    this.clicked = false;
    const fogColor = 0x0b111b;
    this.scene.fog = new Fog(fogColor, 1, 20);
    this.scene.background = new Color(fogColor);

    this.camera.controls.zoomSpeed = 0.5;
    // 相机初始位置
    this.camera.instance.position.set(-13.767695123014105, 12.990152163077308, 39.28228164159694);
    const target = {x: -1.908846, y: -0.7618429999999995, z: 0.490326}
    this.camera.controls.target.set(target.x, target.y, target.z);

    this.camera.controls.addEventListener('change', () => {
      const distance = this.getCameraToTargetDistance()
      for (const subStage of Object.values(this.subStages)) {
        subStage.distanceChange(distance)
      }
    })

    // 生成路网的json文件
    // this.getRoadFileJSONs();
    // return

    // setInterval(() => {
    //   const a = this.camera.instance.position
    //   const b = this.camera.controls.target
    //   console.log('camera', { x: a.x, y: a.y, z: a.z })
    //   console.log('target', { x: b.x, y: b.y, z: b.z })
    // }, 3000)

    this.camera.instance.near = 1;
    this.camera.instance.far = 10000;
    this.camera.instance.updateProjectionMatrix();
    // 创建交互管理
    this.interactionManager = new InteractionManager(this.renderer.instance, this.camera.instance, this.canvas);
    // 播放状态
    this.playing = false;
    // 创建环境光
    this.initEnvironment();
    // 初始化获取数据
    this.companies = [];

    this.assets = new Assets(() => {
      cacheLargeFiles([
        xinjiang1, 
        xinjiang2, 
        xinjiang3,
      ])
      this.labelGroup = new Group();
      this.label3d = new Label3d(this);
      this.labelGroup.rotateX(-Math.PI / 2);
      this.scene.add(this.labelGroup);
      // 事件元素
      this.eventElement = [];
      // 鼠标移上移除的材质
      this.defaultMaterial = null; // 默认材质
      this.defaultLightMaterial = null; // 高亮材质
      this.infrasGroup = null;
      // 模糊边线
      this.createChinaBlurLine();
      // 扩散网格
      this.createGrid();

      // 创建地图
      this.createMap();
      // 绑定事件
      this.createEvent();

      // 创建城市信息点
      this.createCityInfoLabel();
      // 创建城市名字
      this.createCityNames();
      
    });
  }
  
  // 限制相机移动角度和距离
  limitCameraMoveAngle() {
    if (!this.map3dLimit) {
      return
    }
    const limit = this.controlLimit[this.preSubStage] || {
      minAzimuthAngle: -Math.PI / 2,
      minAzimuthAngle: Math.PI / 2,
      minPolarAngle: -Math.PI / 2,
      maxPolarAngle: Math.PI / 2,
    }
    if (limit) {
      // 水平方向角度限制
      this.camera.controls.minAzimuthAngle = limit.minAzimuthAngle;
      this.camera.controls.maxAzimuthAngle = limit.maxAzimuthAngle;

      // 垂直方向角度限制
      this.camera.controls.minPolarAngle = limit.minPolarAngle;
      this.camera.controls.maxPolarAngle = limit.maxPolarAngle;
    }
    this.camera.controls.minDistance = 2
    this.camera.controls.maxDistance = 35
    
    // setInterval(() => {
    //   console.log('水平', this.camera.controls.getAzimuthalAngle());
    //   console.log('垂直', this.camera.controls.getPolarAngle());
    //   console.log('距离', this.camera.controls.getDistance());
    // }, 3000)
    // const folder = this.panel.addFolder('controls');
    // folder.add(this.camera.controls, 'minAzimuthAngle', -Math.PI / 2, Math.PI / 2);
    // folder.add(this.camera.controls, 'maxAzimuthAngle', -Math.PI / 2, Math.PI / 2);
    // folder.add(this.camera.controls, 'minPolarAngle', -Math.PI / 2, Math.PI / 2);
    // folder.add(this.camera.controls, 'maxPolarAngle', -Math.PI / 2, Math.PI / 2);
    // folder.open();
  }

  // 地图底图样式切换
  mapStyleChange(data) {
    if (data.type !== this.currentMapStyle && this.mapStyles.map1 && !this.mapChanging) {
      this.mapChanging = true
      this.currentMapStyle = data.type
      const oldRatio = this.mapStyleChangeRatio.value
      if (oldRatio == 0) {
        this.currentMapStyles.texture2.value = this.mapStyles[this.currentMapStyle]
      } else {
        this.currentMapStyles.texture1.value = this.mapStyles[this.currentMapStyle]
      }
      let tl = gsap.timeline();
      tl.addLabel('mapStyleChange');
      tl.add(
        gsap.to(this.mapStyleChangeRatio, {
          duration: 1,
          value: oldRatio === 0 ? 1 : 0,
          onComplete: () => {
            this.xinJiangLineMaterial.color.setHex(this.xinJiangLineColors[this.currentMapStyle])
            this.mapChanging = false
          }
        }),
        'mapStyleChange'
      );
    }
  }

  // 地图进入动画
  enterAnimation() {
    // 创建动画时间线
    let tl = gsap.timeline();

    const baseTime = 2;
    tl.addLabel('focusMap', baseTime);
    tl.addLabel('focusMapOpacity', baseTime + 0.5);
    tl.addLabel('bar', baseTime + 1.5);
    setTimeout(() => {
      this.changeCameraAndTarget(this.defaultSubStage);
    }, 1000);

    tl.add(
      gsap.to(this.focusMapGroup.position, {
        duration: 1,
        x: 0,
        y: 0,
        z: 0,
      }),
      'focusMap'
    );
    tl.add(
      gsap.to(this.focusMapGroup.scale, {
        duration: 1,
        x: 1,
        y: 1,
        z: 1,
        ease: 'circ.out',
      }),
      'focusMap'
    );

    // tl.add(
    //   gsap.to(this.focusMapTopMaterial, {
    //     duration: 1,
    //     opacity: 0,
    //     ease: 'circ.out',
    //   }),
    //   'focusMapOpacity'
    // );
    tl.add(
      gsap.to(this.focusMapSideMaterial, {
        duration: 1,
        opacity: 1,
        ease: 'circ.out',
        onComplete: () => {
          this.focusMapSideMaterial.transparent = false;
        },
      }),
      'focusMapOpacity'
    );
    tl.add(
      gsap.to(this.xinJiangLineMaterial, {
        duration: 0.5,
        delay: 0.3,
        opacity: 1,
      }),
      'focusMapOpacity'
    );
  }

  // 切换相机位置和目标
  changeCameraAndTarget(subStage) {
    const list = this.subStageCameraPosition[subStage]
    if (!list || list.length === 0) {
      console.warn(`子阶段${subStage}的相机位置和目标配置不存在`)
      return
    }

    const tl = gsap.timeline();
    this.cameraTl = tl;
    let key = 'camera';
    let time = 0;
    list.forEach(({ target, camera, duration, delay, ease, yoyo = false }, index) => {
      key += index;
      tl.addLabel('key', time);
      time += duration + delay;
      const repeat = yoyo ? -1 : 0;
      tl.add(
        gsap.to(this.camera.instance.position, {
          duration,
          delay,
          ease,
          yoyo,
          repeat,
          ...camera,
        }),
        key
      );
      tl.add(
        gsap.to(this.camera.controls.target, {
          duration,
          delay,
          ease,
          yoyo,
          repeat,
          ...target,
        }),
        key
      );
    });
  }

  toSpecialCameraAndTarget(cameraAndTarget) {
    if (!cameraAndTarget) {
      return
    }
    this.clearCameraTl();
    const tl = gsap.timeline();
    // 防止点击事件把运动关了，所以加一个延迟赋值
    setTimeout(() => {
      this.cameraTl = tl;
    }, 100)
    let key = 'camera';
    tl.add(
      gsap.to(this.camera.instance.position, {
        duration: 1,
        delay: 0,
        ease: 'power2.inOut',
        ...cameraAndTarget.camera,
      }),
      key
    );
    tl.add(
      gsap.to(this.camera.controls.target, {
        duration: 1,
        delay: 0,
        ease: 'power2.inOut',
        ...cameraAndTarget.target,
      }),
      key
    );
  }

  // 开始动画
  startAnimation(data = { delay: 0 }) {
    setTimeout(() => {
      this.setSubStageAnimating(true);
      if (!this.focusMapGroup) {
        setTimeout(() => {
          this.startAnimation(data);
        }, 1000);
        return;
      }

      setTimeout(() => {
        this.setSubStageVisible(this.defaultSubStage, true);
        this.preSubStage = this.defaultSubStage;

        setTimeout(() => {
          this.setSubStageAnimating(false);
          this.limitCameraMoveAngle()
        }, 1000);
      }, 3500);

      this.enterAnimation();
    }, data.delay);
  }

  setSubStageAnimating(subStageAnimating) {
    this.subStageAnimating = subStageAnimating;
    this.eventBus.customEmitObject('subStageAnimatingChange', {
      subStageAnimating,
    });
  }
  getCameraToTargetDistance() {
    const distance = this.camera.instance.position.distanceTo(this.camera.controls.target);
    return distance;
  }

  
  resetCamera() {
    if (this.preSubStage) {
      this.changeCameraAndTarget(this.preSubStage)
    }
  }
  clearCameraTl() {
    if (this.cameraTl) {
      this.cameraTl.clear();
      this.cameraTl = null;
    }
  }

  // 切换子阶段
  subStageChange(subStageData) {
    if (subStageData.id === this.preSubStage) {
      return;
    }
    this.nextSubStage = subStageData.id;
    // 隐藏
    this.setSubStageAnimating(true);
    this.setSubStageVisible(this.preSubStage, false);
    this.clearCameraTl();
    // 调整子阶段相机位置和目标
    this.changeCameraAndTarget(subStageData.id);
    // 显示
    setTimeout(() => {
      this.setSubStageVisible(subStageData.id, true);
      setTimeout(() => {
        this.setSubStageAnimating(false);
      }, 1000);
    }, 1500);
    this.preSubStage = subStageData.id;
    this.limitCameraMoveAngle()
  }

  /**
   * 设置子阶段可见性
   * @param {string} subStage - 子阶段
   * @param {boolean} visible - 是否可见
   */
  setSubStageVisible(subStageName, visible) {
    const subStage = this.subStages[subStageName]
    if (!subStage) {
      console.error(`子阶段${subStageName}不存在`)
      return
    }
    subStage.visibleHandler(visible)
  }

  // 新增子阶段
  addSubStage(subStage) {
    this.subStages[subStage.name] = subStage
    this.subStageCameraPosition[subStage.name] = subStage.cameraPosition
    this.controlLimit[subStage.name] = subStage.controlLimit
  }

  // 移除子阶段
  removeSubStage(subStage) {
    delete this.subStages[subStage.name]
    delete this.subStageCameraPosition[subStage.name]
    delete this.controlLimit[subStage.name]
  }

  // 隐藏调试窗口
  hideGUI() {
    const guiContainers = document.querySelectorAll('.lil-gui');
    const arr = Array.from(guiContainers);
    if (arr.length > 0) {
      arr.forEach((item, index) => {
        item.style.display = 'none';
      });
    }
  }

  // 初始化环境光
  initEnvironment() {
    let sun = new AmbientLight(0xffffff, 5);
    this.scene.add(sun);
    // 方向光
    // let directionalLight = new DirectionalLight(0xffffff, 6);
    // // directionalLight.position.set(-30, 6, -8);
    // directionalLight.position.set(30, 4, -8);
    // directionalLight.castShadow = true;
    // directionalLight.shadow.radius = 20;
    // directionalLight.shadow.mapSize.width = 1024;
    // directionalLight.shadow.mapSize.height = 1024;
    // this.scene.add(directionalLight);
    // const helper = new DirectionalLightHelper( directionalLight, 2 );
    // this.scene.add( helper );
    // const folder = this.panel.addFolder('directionalLight')
    // folder.add(directionalLight.position, 'x', -100, 100)
    // folder.add(directionalLight.position, 'y', -100, 100)
    // folder.add(directionalLight.position, 'z', -100, 100)
    // folder.add(directionalLight, 'intensity', 0, 20)
    // folder.open()

    let spotLight = new SpotLight(0xffffff, 10);
    spotLight.castShadow = true;
    spotLight.position.set(0, 7, 0);
    spotLight.angle = Math.PI * 0.3;
    this.scene.add(spotLight);

    // this.createPointLight({
    //   color: '#1d5e5e',
    //   intensity: 600,
    //   distance: 10000,
    //   x: -9,
    //   y: 3,
    //   z: -3,
    // });
    // this.createPointLight({
    //   color: '#1d5e5e',
    //   intensity: 230,
    //   distance: 10000,
    //   x: 6,
    //   y: 2,
    //   z: 5,
    // });
  }

  // 模型渲染
  createMap() {
    let mapGroup = new Group();
    let focusMapGroup = new Group();
    this.focusMapGroup = focusMapGroup;
    let { china, chinaTopLine, chinaExtrude } = this.createChina();
    let { worldMesh, worldTopLine } = this.createWorld();
    let { xinJiangMesh, xinJiangTop, xinJiangLine } = this.createProvince();
    china.setParent(mapGroup);
    chinaExtrude.setParent(mapGroup);
    chinaTopLine.setParent(mapGroup);
    worldMesh.setParent(mapGroup);
    worldTopLine.setParent(mapGroup);

    xinJiangMesh.setParent(focusMapGroup);
    xinJiangTop.setParent(focusMapGroup);
    xinJiangLine.setParent(focusMapGroup);
    setTimeout(() => {
      // xinJiangMockTop.setParent(focusMapGroup);
    }, 3000);

    focusMapGroup.position.set(0, 0, -0.01);
    focusMapGroup.scale.set(1, 1, 0.2);
    mapGroup.add(focusMapGroup);
    mapGroup.rotateX(-Math.PI / 2);
    mapGroup.position.set(0, 0.2, 0);

    this.scene.add(mapGroup);
  }

  // 创建世界地图
  createWorld() {
    let worldData = this.assets.instance.getResource('world');
    const worldMeshMaterial = new MeshLambertMaterial({
      color: 0x9191ee,
      transparent: true,
      opacity: 0.5,
    });
    const shaderUniforms = {
      uRadius: { value: 19 },
      uColor1: { value: new Color(0xffffff) },
      uColor2: { value: new Color(0x9191ee) },
    };
    modifyWorldShader(worldMeshMaterial, shaderUniforms);

    let worldMesh = new BaseMap(this, {
      data: worldData,
      center: this.pointCenter,
      merge: false,
      material: worldMeshMaterial,

      shadow: true,
      renderOrder: 2,
    });

    const lineMaterial = new LineBasicMaterial({ color: 0xf3f3f3 });
    let worldTopLine = new Line(this, {
      center: this.pointCenter,
      data: worldData,
      type: 'Line',
      material: lineMaterial,
      renderOrder: 3,
    });
    worldTopLine.lineGroup.position.z += 0.01;
    const halfX = 120;
    const speed = 0.5;
    const uX = { value: -halfX };
    const uWidth = { value: 20 };
    lineMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace('void main() {', () => {
        return `
        varying vec3 vWordPosition;
        void main() {
          vWordPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        `;
      });
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', () => {
        return `
        varying vec3 vWordPosition;
        uniform float uX;
        uniform float uWidth;
        void main() {
        `;
      });
      shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', () => {
        return `
        #include <dithering_fragment>
        float x = vWordPosition.x;
        if (x > uX && x < uWidth + uX) {
            gl_FragColor.rgb = vec3(0.278, 0.537, 0.82);
        }
        `;
      });

      shader.uniforms.uX = uX;
      shader.uniforms.uWidth = uWidth;
    };
    this.time.on('tick', () => {
      uX.value += speed;
      if (uX.value > halfX) {
        uX.value = -halfX;
      }
    });
    const folder = this.panel.addFolder('世界板块颜色');
    folder
      .addColor(lineMaterial, 'color')
      .name('世界线颜色')
      .onChange((val) => {
        lineMaterial.color = new Color(val.r, val.g, val.b);
      });
    folder
      .addColor(worldMeshMaterial, 'color')
      .name('世界平面颜色')
      .onChange((val) => {
        lineMaterial.color = new Color(val.r, val.g, val.b);
      });
    folder.add(worldMeshMaterial, 'opacity', 0, 1).name('世界平面透明度');
    folder.add(shaderUniforms.uRadius, 'value', 0, 50).name('渐变半径');
    folder
      .addColor(shaderUniforms.uColor1, 'value')
      .name('渐变半径开始颜色')
      .onChange((val) => {
        shaderUniforms.uColor1.value = new Color(val.r, val.g, val.b);
      });
    folder
      .addColor(shaderUniforms.uColor2, 'value')
      .name('渐变半径终止颜色')
      .onChange((val) => {
        shaderUniforms.uColor2.value = new Color(val.r, val.g, val.b);
      });
    folder.open();

    return { worldMesh, worldTopLine };
  }

  // 创建中国地图
  createChina() {
    let chinaData = this.assets.instance.getResource('china');
    const chinaMeshMaterial = new MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.6,
      side: DoubleSide,
    });
    let china = new BaseMap(this, {
      data: chinaData,
      center: this.pointCenter,
      merge: true,
      material: chinaMeshMaterial,

      renderOrder: 12,
    });
    china.mapGroup.position.z = -2;
    china.mapGroup.position.x = -0.4;
    china.mapGroup.position.y = -0.4;
    gsap.to(china.mapGroup.position, {
      duration: 1,
      delay: 5,
      z: 0.12,
      ease: 'power1.out',
    });
    // const folder1 = this.panel.addFolder('中国板块背影')
    // folder1.add(china.mapGroup.position, 'x', -10, 10)
    // folder1.add(china.mapGroup.position, 'y', -10, 10)
    // folder1.add(china.mapGroup.position, 'z', -10, 10)
    // folder1.addColor(chinaMeshMaterial, 'color').name('背景颜色').onChange((val) => {
    //   chinaMeshMaterial.color = new Color(val.r, val.g, val.b)
    // })
    // folder1.open()

    // const topLineMaterial = new LineBasicMaterial({ color: 0x0d0d0d })
    const topLineMaterial = new LineMaterial({ color: 0xffffff, linewidth: 2, opacity: 0.4, transparent: true });
    this.chinaLineMaterial = topLineMaterial;
    let chinaTopLine = new Line(this, {
      center: this.pointCenter,
      data: chinaData,
      material: topLineMaterial,
      type: 'Line2',
      renderOrder: 3,
      excludeAdcodes: [650000],
    });

    chinaTopLine.lineGroup.position.z += 0.5;

    const topMaterial = new MeshLambertMaterial({
      // color: 0xd7dde5,
      color: 0x707e93,
      transparent: true,
      opacity: 0.5,
      side: DoubleSide,
    });
    // const topFolder = this.panel.addFolder('chinaTopMaterial')
    // topFolder.open()
    // topFolder.add(topMaterial, 'roughness', 0, 1)
    // topFolder.add(topMaterial, 'metalness', 0, 1)
    // topFolder.add(topMaterial, 'transmission', 0, 1)
    // topFolder.add(topMaterial, 'ior', 0, 5)
    const topMaterialTime = { value: 0 };
    this.time.on('tick', (delta, elapsedTime) => {
      topMaterialTime.value = elapsedTime;
    });
    const shaderUniforms = {
      uTime: topMaterialTime,
      uColor: { value: new Color(0x0a416f) },
    };
    modifyChinaTopShader(topMaterial, shaderUniforms);
    const sideMaterial = new MeshLambertMaterial({
      // color: 0xbebebe,
      color: 0x28394f,
      side: DoubleSide,
    });
    let chinaExtrude = new ExtrudeMap(this, {
      center: this.pointCenter,
      position: new Vector3(0, 0, 0.11),
      data: chinaData,
      depth: 0.2,
      topFaceMaterial: topMaterial,

      sideMaterial: sideMaterial,
      renderOrder: 6,
      excludeAdcodes: [650000],
      setUv: true,
    });
    // chinaExtrude.mapGroup.position.x += 0.1
    // chinaTopLine.lineGroup.position.x += 0.1
    // chinaExtrude.mapGroup.position.y -= 0.1
    // chinaTopLine.lineGroup.position.y -= 0.1

    const folder = this.panel.addFolder('中国板块颜色');
    folder
      .addColor(topLineMaterial, 'color')
      .name('中国线颜色')
      .onChange((val) => {
        topLineMaterial.color = new Color(val.r, val.g, val.b);
      });
    folder
      .addColor(topMaterial, 'color')
      .name('中国平面颜色')
      .onChange((val) => {
        topMaterial.color = new Color(val.r, val.g, val.b);
      });
    folder.add(topMaterial, 'opacity', 0, 1).name('中国平面透明度');
    folder.open();

    return { china, chinaTopLine, chinaExtrude };
  }

  // 设置纹理放大和缩小过滤器
  setMapFilter(texture) {
    texture.colorSpace = SRGBColorSpace;
    // xinjiangTexture.needsUpdate = true;
    texture.generateMipmaps = true;
    texture.minFilter = NearestMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.anisotropy = this.renderer.instance.capabilities.getMaxAnisotropy();
  }

  // 创建新疆地图
  createProvince() {
    const xinjiangTexture1 = this.assets.instance.getResource('xinjiang1Texture');
    const xinjiangTexture2 = this.assets.instance.getResource('xinjiang2Texture');
    const xinjiangTexture3 = this.assets.instance.getResource('xinjiang3Texture');
    // 设置纹理放大和缩小过滤器
    this.setMapFilter(xinjiangTexture1)
    this.setMapFilter(xinjiangTexture2)
    this.setMapFilter(xinjiangTexture3)
    this.mapStyles.map1 = xinjiangTexture1
    this.mapStyles.map2 = xinjiangTexture2
    this.mapStyles.map3 = xinjiangTexture3
    this.currentMapStyles.texture1.value = this.mapStyles[this.currentMapStyle]
    this.currentMapStyles.texture2.value = this.mapStyles[this.currentMapStyle]

    let xinJiangData = this.assets.instance.getResource('xinjiang');
    let xinjiangLineData = this.assets.instance.getResource('xinjiang_line');
    let [topMaterial, sideMaterial] = this.createProvinceMaterial();
    this.focusMapTopMaterial = topMaterial;
    this.focusMapSideMaterial = sideMaterial;
    const topMaterialTemp = new MeshBasicMaterial({
      fog: false,
      side: DoubleSide,
      transparent: false,
      opacity: 1,
      // map: xinjiangTexture1,
    });
    mapTransitionShader(topMaterialTemp, {
      uTexture1: this.currentMapStyles.texture1,
      uTexture2: this.currentMapStyles.texture2,
      uRatio: this.mapStyleChangeRatio,
    })
    const sideMaterialTime = { value: 0 };
    this.time.on('tick', (delta, elapsedTime) => {
      sideMaterialTime.value = elapsedTime;
    });
    const shaderUniforms = {
      uTime: sideMaterialTime,
      uColor: { value: new Color(0x4a5f7c) },
    };
    modifyXinJiangSideShader(sideMaterial, shaderUniforms);
    this.panel
      .addColor(sideMaterial, 'color')
      .name('新疆侧边颜色1')
      .onChange((val) => {
        sideMaterial.color = new Color(val.r, val.g, val.b);
      });
    this.panel
      .addColor(shaderUniforms.uColor, 'value')
      .name('新疆侧边颜色2')
      .onChange((val) => {
        shaderUniforms.uColor.value = new Color(val.r, val.g, val.b);
      });
    let xinJiangMesh = new ExtrudeMapXinJiang(this, {
      center: this.pointCenter,
      position: new Vector3(0, 0, 0.11),
      data: xinJiangData,
      depth: 0.5,
      topFaceMaterial: topMaterialTemp,

      sideMaterial: sideMaterial,
      renderOrder: 9,
      setUv: true,
      min: this.min,
      max: this.max,
    });

    this.xinJiangExtrude = xinJiangMesh;

    let faceMaterial = new MeshStandardMaterial({
      depthTest: false,
      // color: 0x0077dd,
      color: 0x5ca1ff,
      transparent: true,
      opacity: 0,
      fog: false,
    });
    // new GradientShader(faceMaterial);
    // 设置默认材质
    this.defaultMaterial = faceMaterial;
    this.defaultLightMaterial = this.defaultMaterial.clone();
    this.defaultLightMaterial.opacity = 0.5;
    this.defaultLightMaterial.emissive.setHex(0x5ca1ff);
    this.defaultLightMaterial.emissiveIntensity = 3.5;
    let xinJiangTop = new BaseMap(this, {
      center: this.pointCenter,
      position: new Vector3(0, 0, 0.7),
      data: xinJiangData,
      material: faceMaterial,

      renderOrder: 10,
    });
    xinJiangTop.mapGroup.children.map((group) => {
      group.children.map((mesh) => {
        if (mesh.type === 'Mesh') {
          // const material = mesh.material.clone();
          // material.color = randomColor();
          // mesh.material = material;
          this.eventElement.push(mesh);
        }
      });
    });
    // 地图线
    this.xinJiangLineMaterial = new LineMaterial({
      // color: 0xffffff,
      color: this.xinJiangLineColors[this.currentMapStyle] || 0x7affff,
      opacity: 0,
      linewidth: 3,
      transparent: true,
      fog: false,
    });
    let xinJiangLine = new Line(this, {
      center: this.pointCenter,
      data: xinjiangLineData,
      type: 'Line2',
      material: this.xinJiangLineMaterial,
      renderOrder: 11,
    });

    xinJiangLine.lineGroup.position.z += 0.8;

    return {
      xinJiangMesh,
      xinJiangTop,
      xinJiangLine,
    };
  }
  createProvinceMaterial() {
    let topMaterial = new MeshLambertMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0,
      fog: false,
      side: DoubleSide,
    });
    topMaterial.onBeforeCompile = (shader) => {
      shader.uniforms = {
        ...shader.uniforms,
        uColor1: { value: new Color(0x217ac6) }, // 419daa
        uColor2: { value: new Color(0x217ac6) },
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
        uniform vec3 uColor1;
        uniform vec3 uColor2;
      
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
      vec3 gradient = mix(uColor1, uColor2, vPosition.x/15.78); // 15.78
      
      outgoingLight = outgoingLight*gradient;
      float topAlpha = 0.5;
      if(vPosition.z>0.3){
        diffuseColor.a *= topAlpha;
      }
      
      gl_FragColor = vec4( outgoingLight, diffuseColor.a  );
      `
      );
    };
    let sideMap = this.assets.instance.getResource('side2');
    sideMap.colorSpace = SRGBColorSpace;
    sideMap.wrapS = RepeatWrapping;
    sideMap.wrapT = RepeatWrapping;
    sideMap.repeat.set(1, 1.5);
    sideMap.offset.y += 0.065;
    let sideMaterial = new MeshStandardMaterial({
      // color: 0x1a293d,
      color: 0x203045,
      // map: sideMap,
      // transparent: true,
      // opacity: 0.1,
      fog: false,
      side: DoubleSide,
    });

    // this.time.on('tick', () => {
    //   sideMap.offset.y += 0.005;
    // });
    sideMaterial.onBeforeCompile = (shader) => {
      return;
      shader.uniforms = {
        ...shader.uniforms,
        // 0x2a6f72
        uColor1: { value: new Color(0x0066bc) },
        uColor2: { value: new Color(0x0066bc) },
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
        uniform vec3 uColor1;
        uniform vec3 uColor2;
      
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
      vec3 gradient = mix(uColor1, uColor2, vPosition.z/1.2);
      
      // outgoingLight = outgoingLight*gradient;
      // diffuseColor.a
      
      gl_FragColor = vec4( outgoingLight, 1.0  );
      `
      );
    };
    return [topMaterial, sideMaterial];
  }
  getMapAnimating() {
    return this.mapStore.animating;
  }
  updateMapAnimating(data) {
    this.mapStore.updateAnimating(data);
  }

  // 添加事件
  createEvent() {
    // hover的对象
    let objectsHover = [];
    // 重置
    const reset = (mesh) => {
      // 还原颜色
      mesh.traverse((obj) => {
        if (obj.isMesh) {
          obj.material = this.defaultMaterial;
        }
      });
    };
    const move = (mesh) => {
      // 设置发光颜色
      mesh.traverse((obj) => {
        if (obj.isMesh) {
          obj.material = this.defaultLightMaterial;
        }
      });
    };
    //
    // 循环添加事件
    this.eventElement.map((mesh) => {
      this.interactionManager.add(mesh);
      mesh.addEventListener('mousedown', async (ev) => {
        if (this.getMapAnimating() || this.clicked) {
          return;
        }
        const cityData = { ...ev.target.userData };
    
      });

      mesh.addEventListener('mouseover', (event) => {
        if (!objectsHover.includes(event.target.parent)) {
          objectsHover.push(event.target.parent);
        }
        const cityData = { ...event.target.userData }
        document.body.style.cursor = 'pointer';
        if (cityData && this.preSubStage === 'state1') {
          this.showCityInfoLabel(cityData)
          move(event.target.parent);
        }

      });
      mesh.addEventListener('mouseout', (event) => {
        objectsHover = objectsHover.filter((n) => n.userData.name !== event.target.parent.userData.name);
        if (objectsHover.length > 0) {
          const mesh = objectsHover[objectsHover.length - 1];
        }
        if (this.preSubStage === 'state1') {
          reset(event.target.parent);
        }

        this.cityInfoLabel.hide()
        document.body.style.cursor = 'default';
      });
    });
  }

  // 创建网格线
  createGrid() {
    new Grid(this, {
      gridSize: 100,
      gridDivision: 40,
      gridColor: 0x1d5b68,
      shapeSize: 0.5,
      shapeColor: 0x288686,
      pointSize: 0.1,
      pointColor: 0x13444e,

      diffuse: false,
      diffuseSpeed: 40.0,
      diffuseColor: 0x3aa8ac,
    });
  }

  createChinaBlurLine() {
    let geometry = new PlaneGeometry(147, 147);
    const texture = this.assets.instance.getResource('chinaBlurLine');
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;

    texture.generateMipmaps = false;
    texture.minFilter = NearestFilter;
    texture.repeat.set(1, 1);
    let material = new MeshBasicMaterial({
      // color: 0x3c92a4,
      color: 0x033d73,
      alphaMap: texture,
      transparent: true,
      opacity: 0.5,
    });
    let mesh = new Mesh(geometry, material);
    mesh.rotateX(-Math.PI / 2);
    mesh.position.set(-19.3, -0.5, -15.7);
    this.scene.add(mesh);
  }

  // 显示城市信息标签
  showCityInfoLabel(cityData) {
    const [x, y] = this.geoProjection(cityData.center);
    this.cityInfoLabel.position.copy(new Vector3(x, -y, 0));
    let scale = 0.015
    const distance = this.getCameraToTargetDistance()
    scale = scale * (distance / this.toTargetDistance)
    this.cityInfoLabel.element.innerHTML = ` <div class="info-point-wrap">
        <div class="info-point-wrap-inner">
          <div class="info-point-content">
            <div class="content-item"><div class="value">${cityData.name}</div></div>
          </div>
        </div>
      </div>
    `;
    this.cityInfoLabel.scale.set(scale, scale, scale)
    this.cityInfoLabel.show();
  }
  hideCityInfoLabel() {
    this.cityInfoLabel.hide();
  }
  createCityInfoLabel() {
    let label = this.label3d.create('', 'info-point city-info-label', true);
    const [x, y] = this.geoProjection(this.pointCenter);
    label.init(
      ` <div class="info-point-wrap">
        <div class="info-point-wrap-inner">
          <div class="info-point-line">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
          <div class="info-point-content">
            <div class="content-item"><span class="value">乌鲁木齐</span></div>
          </div>
        </div>
      </div>
    `,
      new Vector3(x, -y, 0)
    );
    
    this.label3d.setLabelStyle(label, 0.015, 'x');
    label.hide();
    this.scene.add(label);
    this.cityInfoLabel = label;
  }
  loadTexture(url) {
    return new Promise((resolve) => {
      this.textureLoader.load(url, (texture) => {
        resolve(texture);
      });
    });
  }
  // 创建设施
  createInfras() {
    const infrasCategroyList = {
      [INFRAS_TYPE.BRIDGE]: [
        { name: '果子沟大桥', baseIcon: 'base1', lnglat: [80.54, 44.07], image: '/public/assets/images/bigscreen_overview/bridge2.png' },
      ],
      [INFRAS_TYPE.TUNNEL]: [
        { name: '杏花村1号隧道', baseIcon: 'base2', lnglat: [88.37, 43.25], image: '/public/assets/images/bigscreen_overview/tunnel1.png' },
      ],
    };
    this.infrasGroup = new Group();
    this.infrasGroup.rotation.x = -Math.PI / 2;
    this.scene.add(this.infrasGroup);
    this.infrasLabels = [];

    const createLabel = (data, position) => {
      let label = this.label3d.create('', 'infras-name-box', true);
      label.init(
        `<div class="">
        ${data.name}
    </div>`,
        new Vector3(position[0], position[1], position[2] + 0.5)
      );
      const scale = 0.01;
      label.element.style.pointerEvents = 'none';
      label.scale.set(scale, scale, scale);
      label.rotation['x'] = Math.PI / 2;
      label.originZ = position[2];
      label.setParent(this.infrasGroup);
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

    let renderOrder = 20;
    for (const key of Object.keys(infrasCategroyList)) {
      const list = infrasCategroyList[key];

      const scale = 0.6;
      list.forEach(async (item) => {
        item.type = key;
        const stateTexture = await this.loadTexture(`/assets/images/infras/${item.baseIcon || 'normal'}.png`);
        const { width, height } = stateTexture.source.data;
        const mergedTexture = mergeTexture(stateTexture, this.assets.instance.getResource(item.type));
        mergedTexture.colorSpace = SRGBColorSpace;
        const stateMaterial = new SpriteMaterial({
          map: mergedTexture,
          fog: false,
          transparent: true,
          depthWrite: false,
        });
        let [x, y] = this.geoProjection([item.lnglat[0], item.lnglat[1]]);
        let position = [x, -y, this.depth + 0.7];
        const sprite = new Sprite(stateMaterial);
        sprite.scale.set((scale * width) / height, scale, 1);
        sprite.renderOrder = renderOrder;
        renderOrder++;

        sprite.position.set(...position);
        sprite.userData.position = [...position];
        sprite.userData = { ...item };
        this.infrasGroup.add(sprite);
        createLabel(item, position);

        // 事件
        this.interactionManager.add(sprite);
        sprite.addEventListener('mousedown', (ev) => {
          if (this.clicked) return false;
          this.clicked = true;
          const data = ev.target.userData;
          this.refs[data.type]?.value.open(data);
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
      });
    }
  }
  
  

  getRoadFileJSONs() {
    // 交投国道
    // JGBUMENBM
    // this.getRoadFileJSON(getJTGDGS, 'JGBUMENBM', 'JTGDGS.json')
    // 交投省道
    // this.getRoadFileJSON(getJTSDGS, 'JGBUMENBM', 'JTSDGS.json')
    // // 国道
    // this.getRoadFileJSON(getGDGS, 'LXBM', 'GDGS.json')
    // // 省道
    // this.getRoadFileJSON(getSDGS, 'LXBM', 'SDGS.json')
  }

  // 获取线路的静态json数据
  async getRoadFileJSON(api, groupKey, fileName) {
    const gdgs = await api();
    const groupedRoads = groupBy(gdgs, (item) => item.properties[groupKey]);
    for (const key of Object.keys(groupedRoads)) {
      const lines = groupedRoads[key];
      lines.forEach((line) => {
        // 用来标记线路名字的坐标
        line.roadCardLnglat = [...line.geometry.coordinates[Math.floor(line.geometry.coordinates.length / 2)]]
        // line.geometry.coordinates = line.geometry.coordinates.map((i) => {
        //   return this.geoProjection(i);
        // });
      });
    }
    console.log('groupedRoads', groupedRoads)
    this.saveJsonAsFile(groupedRoads, fileName)
  }

  // 保存JSON数据为文件
  saveJsonAsFile(jsonData, fileName = 'data.json') {
    try {
      // 将JSON对象转换为字符串，第三个参数用于格式化输出
      const jsonString = JSON.stringify(jsonData, null, 2);

      // 创建Blob对象，指定MIME类型为application/json
      const blob = new Blob([jsonString], { type: 'application/json' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName; // 设置文件名

      // 触发下载
      document.body.appendChild(a);
      a.click();

      // 清理资源
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('保存JSON文件失败:', error);
      return false;
    }
  }

  // 创建城市名称标签
  createCityNames() {
    const loader = new FontLoader();
    loader.load('/threejsFonts/tansong_Regular.json', (font) => {
      const inCity = 0.65
      const inCityOpacity = 0.6
      const outCityOpacity = 0.3
      const cities = [
        // { h: 1.7, name: '乌鲁木齐', lnglat: [87.617733, 43.792818], color: 0x000001 },
        { h: inCity, opacity: inCityOpacity, name: '青海', lnglat: [93.161404, 37.145819] },
        { h: inCity, opacity: inCityOpacity, name: '甘肃', lnglat: [96.281521, 40.164975] },
        { h: inCity, opacity: inCityOpacity, name: '内蒙古', lnglat: [101.511013, 40.330167] },
        { h: inCity, opacity: inCityOpacity, name: '西藏', lnglat: [85.163357, 32.545879] },
        { h: 0.4, opacity: outCityOpacity, name: '蒙古', lnglat: [96.868721,45.18245] },
        { h: 0.4, opacity: outCityOpacity, name: '哈萨克斯坦', lnglat: [73.454658,44.323915] },
        { h: 0.4, opacity: outCityOpacity, name: '吉尔吉斯斯坦', lnglat: [72.611075,41.571423] },
        { h: 0.4, opacity: outCityOpacity, name: '塔吉克斯坦', lnglat: [70.348379,38.269605] },
        { h: 0.4, opacity: outCityOpacity, name: '乌兹别克斯坦', lnglat: [63.697529,40.183406] },
        { h: 0.4, opacity: outCityOpacity, name: '阿富汗', lnglat: [68.149482,35.820881] },
      ];

      const createText = (item) => {
        const textGeo = new TextGeometry(item.name, {
          font: font,
          size: 0.2,
          depth: 0.01,
        });

        textGeo.computeBoundingBox();

        const materials = [
          new MeshBasicMaterial({
            color: item.color || 0xffffff,
            fog: false,
            opacity: item.opacity,
            transparent: true,
            // depthWrite: false,
          }), // front
          new MeshBasicMaterial({
            color: item.color || 0xffffff,
            fog: false,
            opacity: item.opacity,
            transparent: true,
            // depthWrite: false,
          }), // side
        ];
        const [x, z] = this.geoProjection(item.lnglat);
        const textMesh1 = new Mesh(textGeo, materials);
        textMesh1.rotateX(-Math.PI / 2);
        textMesh1.position.set(x, item.h, z);
        this.scene.add(textMesh1);
        return textMesh1;
      };

      cities.forEach((city) => {
        createText(city);
      });
    });
  }
  setRefs(refs) {
    this.refs = refs;
  }
  // 转换坐标
  geoProjection(args) {
    return geoMercator().center(this.pointCenter).scale(mapScale).translate([0, 0])(args);
  }
  // 更新
  update() {
    super.update();
    this.interactionManager && this.interactionManager.update();
  }
  // 销毁
  destroy() {
    this.clearCameraTl();
    this.label3d && this.label3d.destroy();
    for (const subStage of Object.values(this.subStages)) {
      subStage?.destroy()
    }
    super.destroy();
  }
}
