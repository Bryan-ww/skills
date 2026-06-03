import * as BABYLON from "@babylonjs/core";
import * as ADDONS from "@babylonjs/addons/htmlMesh/index";
import { GridMaterial } from "@babylonjs/materials"
// import * as GUI from "@babylonjs/gui"
import nameImg1 from "./assets/name1.png";
import nameImg2 from "./assets/name2.png";
import { HtmlMeshRenderer, FitStrategy } from "@babylonjs/addons/htmlMesh/index"

import lyImg from "./assets/ly.png?url";
import lyImg_se from "./assets/ly_se.png?url";

import qImg from "./assets/q.jpg";
import road2 from "./assets/road2.png";
import road3 from "./assets/road3.png";
import road2_se from "./assets/road2_se.png";
import road3_se from "./assets/road3_se.png";
import road4 from "./assets/road4.png";
import road4_se from "./assets/road4_se.png";

import road2_dash from "./assets/road2_dash.png";
import road3_dash from "./assets/road3_dash.png";
import road4_dash from "./assets/road4_dash.png";

import road5 from "./assets/road5.png";
import road5_se from "./assets/road5_se.png";
import road5_dash from "./assets/road5_dash.png";

import road5_r from "./assets/road5_r.png";
import road5_se_r from "./assets/road5_se_r.png";
import road5_dash_r from "./assets/road5_dash_r.png";


import jtImg from "./assets/jt.png";
import jtImg2 from "./assets/jt2.png";
import jtImg3 from "./assets/jt3.png";


import { AnimatedGifTexture } from "./lib/gif";
import { fb_shaderMaterial } from "./lib/fb"

import {
  generateRoads,
  calculateShortSide,
  calculateLaneCenters,
  computeAdjacentAverages,
  calculateD
} from "./lib/lib";
import "@babylonjs/loaders";
import { getNum, getStack } from "./utils";
import { config } from "./config";

const rs = { road2, road3, road4, road2_dash, road3_dash, road4_dash, road2_se, road3_se, road4_se, road5, road5_se, road5_dash, road5_r, road5_se_r, road5_dash_r };
// const nameImg = { nameImg1, nameImg2 };
export default class App {
  canvas; // 渲染画布 DOM 元素
  engine; // Babylon.js 引擎实例
  scene;  // Babylon.js 场景实例
  meshs = []; // 存储生成的道路路段网格（TransformNode）
  jtMeshs = []; // 存储交通指示箭头网格
  nameMeshs = []; // 存储路名文字网格
  carMeshs = [] // 存储车辆网格
  gridMeshs = [] // 存储网格辅助线网格
  materials = new Map() // 材质缓存 Map，避免重复创建相同材质
  roadMaterials = new Map() // 道路专用材质缓存 Map
  // dragBehavior: BABYLON.PointerDragBehavior // (注释掉的) 拖拽行为控制器
  
  // 默认配置项
  option = {
    editModel: false, // 是否开启编辑模式
    viewPort: 1,      // 视口缩放比例
    length: 50,       // 道路标准长度单元（对应纹理贴图的缩放基准）
    gap: 1,           // 道路之间的间隔
    width: 0.8,       // 每条车道的宽度（Babylon 单位）
    edgeHeight: 0.2,  // 路沿高度
    wallHeight: 0.8,  // 墙体高度（未使用）
    inoutLength: 0,   // 出入口长度（未使用）
    cameraType: "3d", // 摄像机模式："2d" 或 "3d"
    isLock: false,    // 是否锁定摄像机旋转
    autoScale: true,  // 是否自动缩放以适应屏幕
    showGrid: false,  // 是否显示网格地面
    multiple: true    // 是否支持多选
  };
  
  length = 0; // 当前道路总长度
  roads = []; // 存储每条道路的 Z 轴坐标（中心线位置）
  lanes = []; // 存储车道配置数据
  modalHtmls = new Map(); // 存储 HTML 弹窗元素（DOM 覆盖层）
  modalMeshs = new Map(); // 存储设备点位的 3D 网格
  cars = new Map(); // 存储车辆模型原型（用于克隆）
  gizmoManager; // 变换控制器（用于编辑模式下的移动/缩放）
  highlightLayer // 高亮层（用于选中物体发光效果）
  selectedMesh = [] // 当前选中的网格列表
  outerMeshs = [] // 外部网格列表
  roadConditionMeshs = [] // 路况网格列表

  /**
   * 构造函数：初始化 3D 场景的核心组件
   * @param {HTMLCanvasElement} canvas - 渲染目标的 Canvas 元素
   * @param {Object} option - 初始化配置项
   */
  constructor(canvas, option) {
    this.canvas = canvas;
    
    // 1. 初始化引擎
    // preserveDrawingBuffer: false - 性能优化，不保留缓冲区
    // stencil: true - 启用模版缓冲区（用于高亮等特效）
    // antialias: true - 启用抗锯齿
    this.engine = new BABYLON.Engine(canvas, true, {
      disableWebGL2Support: false,
      preserveDrawingBuffer: false,
      useHighPrecisionMatrix: true,
      adaptToDeviceRatio: true,
      samples: 4, // MSAA 采样数
      stencil: true,
      antialias: true,
      powerPreference: "high-performance" // 优先使用高性能显卡
    }, true);
    
    // this.engine.setHardwareScalingLevel(0.5) // (可选) 降低渲染分辨率以提升性能
    
    // 2. 创建场景
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.autoClear = false; // 关闭自动清除，手动控制渲染循环
    this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // 背景透明
    
    // 3. 创建默认相机和光源
    // createDefaultCameraOrLight(createArcRotateCamera, replaceExisting, attachCameraControls)
    this.scene.createDefaultCameraOrLight(true, true, true);
    
    // 初始化配置
    this.setOption(option)
    
    // 设置相机最近裁剪面，避免近处物体被裁剪
    this.scene.activeCamera.minZ = 0.1
    
    // 4. 添加半球光 (HemisphericLight) 用于模拟环境光
    this.carlight = new BABYLON.HemisphericLight(
      "envLight",
      new BABYLON.Vector3(0, 1, 0), // 光照方向：从上向下
      this.scene
    );
    this.carlight.intensity = 5; // 光照强度
    
    // 5. 初始化交互事件监听
    this.createEvents()
    
    // 6. 开始渲染循环
    this.render()
    
    // 7. 监听窗口大小变化，自动调整引擎尺寸
    let stop;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          if (stop) {
            clearTimeout(stop);
          }
          // 防抖处理，避免频繁 resize
          stop = setTimeout(() => {
            this.engine.resize();
            this.resetRadius(); // 重置相机半径限制
          }, 100);
        }
      }
    });
    resizeObserver.observe(this.canvas);
  }
  /**
   * 启动渲染循环
   * 引擎会在每一帧调用该方法，渲染 3D 场景并同步 HTML 弹窗等元素的位置
   */
  render() {
    this.engine.runRenderLoop(() => {
      this.scene.render();
      this.setModalHtmlsPosition();
    });
  }

  /**
   * 停止渲染循环
   * 用于组件销毁或页面隐藏时暂停渲染，以节省 CPU/GPU 资源
   */
  stopRender() {
    console.log("stopRender")
    this.engine.stopRenderLoop()
  }

  /**
   * 设置/更新场景的基础配置选项
   * @param {Object} option - 配置对象，覆盖当前配置
   * @param {boolean} setCameraType - 是否立即根据配置更新相机视角类型，默认为 true
   */
  setOption(option, setCameraType = true) {
    if (option?.viewPort) this.option.viewPort = option.viewPort;
    if (option?.length) this.option.length = option.length;
    if (option?.gap) this.option.gap = option.gap;
    if (option?.width) this.option.width = option.width;
    if (option?.edgeHeight) this.option.edgeHeight = option.edgeHeight;
    if (option?.wallHeight) this.option.wallHeight = option.wallHeight;
    if (option?.cameraType) this.option.cameraType = option.cameraType;
    if (typeof option?.editModel === 'boolean') this.option.editModel = option.editModel;
    if (typeof option?.isLock === 'boolean') this.option.isLock = option.isLock;
    if (typeof option?.autoScale === 'boolean') this.option.autoScale = option.autoScale;
    if (typeof option?.showGrid === 'boolean') this.option.showGrid = option.showGrid;
    if (typeof option?.multiple === 'boolean') this.option.multiple = option.multiple;
    if (typeof option?.isMeshRenderer === 'boolean') this.option.isMeshRenderer = option.isMeshRenderer
    if (typeof option?.showStack === 'boolean') this.option.showStack = option.showStack
    if (typeof option?.inoutLength === 'number') this.option.inoutLength = option.inoutLength
    
    // 初始化或更新 HTML 渲染器状态
    this._htmlMeshRenderer(this.option.isMeshRenderer)
    // 根据新配置重置相机距离
    this.resetRadius();
    if (setCameraType) {
      this.setCameraType(this.option.cameraType);
    }
    // 根据新配置更新视角锁定状态
    this.lock(this.option?.isLock, this.option.cameraType);
  }
  /**
   * 内部方法：管理 HTML 混合渲染器
   * 用于开启或关闭 HTML Mesh 功能（将 DOM 元素作为 3D 物体渲染）
   * 
   * 原理：
   * HtmlMeshRenderer 会在 Canvas 上方创建一个 CSS3D 容器。
   * 它将 HTML 元素通过 CSS transform 属性进行 3D 变换，使其跟随 3D 场景中的物体移动、缩放和旋转。
   * 这允许在 3D 场景中显示复杂的 HTML 内容（如视频、iframes、复杂 UI），而不仅仅是纹理。
   * 
   * @param {boolean} isRender - 是否启用 HTML 渲染器
   */
  _htmlMeshRenderer(isRender) {
    // 1. 如果已存在渲染器实例，先销毁
    // 避免重复创建导致内存泄漏或多个渲染层重叠
    if (this?.htmlMeshRenderer) {
      this?.htmlMeshRenderer?.dispose()
    }
    
    // 2. 根据开关状态创建新实例
    if (isRender) {
      // 创建 HtmlMeshRenderer
      // 参数1: 当前 Babylon 场景
      // 参数2: 配置对象
      this.htmlMeshRenderer = new HtmlMeshRenderer(this.scene, {
        // parentContainerId: 指定承载 CSS3D 变换元素的父容器 ID
        // 通常设为 Canvas 的父元素，确保 HTML 层与 Canvas 重合
        parentContainerId: this.canvas.parentElement.id,
      });
    }
  }
  /**
   * 根据设备编码高亮指定的网格，并将其设为选中状态
   * 触发于外部业务逻辑（如在列表中点击了某设备）
   * @param {string} device_code - 设备唯一编码
   */
  highlightById(device_code) {
    const mesh = this.scene.getMeshById(`point-mesh-${device_code}`)
    if (!mesh) return
    this.selectedMesh = [mesh] // 更新选中状态
    this.highlightLayer?.removeAllMeshes() // 先清除之前的高亮
    this.highlightLayer?.addMesh(mesh, BABYLON.Color3.Green()); // 添加绿色高亮发光效果
    this.gizmoManager?.attachToMesh(mesh); // 如果开启了控制器，绑定到该网格上
    // 通知外部界面当前选中对象已改变
    window.postMessage({
      type: 'selectChange',
      data: [this.genMesh(mesh)]
    })
  }

  /**
   * 清除场景中所有的网格高亮效果
   */
  clearHighlight() {
    this.highlightLayer?.removeAllMeshes()
  }

  /**
   * 清除场景中网格的 Gizmo 控制器（取消绑定）
   */
  clearAttach() {
    this.gizmoManager.attachToMesh(null)
  }
  /**
   * 初始化交互事件
   * 监听鼠标/触摸点击，实现网格的选中、高亮和 Gizmo 控制器绑定
   */
  createEvents() {
    this.scene.onPointerObservable.add((pointerInfo) => {
      // 监听鼠标按下事件
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        // 获取鼠标射线拾取结果
        const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        if (pickResult.hit && pickResult.pickedMesh) {

          // console.log(pickResult,"pickResult")
          // 处理拾取逻辑：如果点击的是子网格（如双面牌的子面），则选中其父节点
          const mesh = pickResult.pickedMesh.name.startsWith('point-mesh-sub') ? pickResult.pickedMesh.parent : pickResult.pickedMesh
          const metadata = mesh?.metadata
          
          if (!metadata) {
            // 情况1：点击了非业务物体（如背景或未绑定数据的物体）
            // 清空所有选中状态
            this.selectedMesh = []
            this.gizmoManager?.attachToMesh(); // 移除变换控制器
            this.highlightLayer?.removeAllMeshes() // 移除高亮
            // 通知外部应用选中为空
            window.postMessage({
              type: 'selectChange',
              data: this.selectedMesh.map(item => this.genMesh(this.scene.getMeshById(item.id)))
            })
          } else {
            // 情况2：点击了有效的业务物体
            if (this.selectedMesh.find(item => item.id === mesh.id)) {
              // 如果已经选中，则取消选中（反选）
              this.highlightLayer?.removeMesh(mesh);
              this.selectedMesh = this.selectedMesh.filter(item => item.id !== mesh.id)
            } else {
              // 如果未选中
              if (this.option.multiple) {
                // 多选模式：追加到选中列表
                this.highlightLayer?.addMesh(mesh, BABYLON.Color3.Green());
                this.selectedMesh.push(mesh)
              } else {
                // 单选模式：清空其他，只选中当前
                this.highlightLayer?.removeAllMeshes()
                this.highlightLayer?.addMesh(mesh, BABYLON.Color3.Green());
                this.selectedMesh = [mesh]
              }
            }
            // 如果只选中了一个物体，显示 Gizmo 控制器方便编辑
            if (this.selectedMesh.length === 1) {
              this.gizmoManager?.attachToMesh(mesh);
            }
            // 发送选中变更消息
            window.postMessage({
              type: 'selectChange',
              data: this.selectedMesh.map(item => this.genMesh(this.scene.getMeshById(item.id)))
            })
          }
        }
      }
      // else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOUBLETAP) {
      //   this.highlightLayer?.removeAllMeshes()
      //   window.postMessage({
      //     type: 'selectChange',
      //     data: []
      //   })
      // }
    });
  }
  createHighLight(mesh) {
    this.highlightLayer = new BABYLON.HighlightLayer("hl1", this.scene);
    // 点击事件监听
  }
  /* The above code is a comment in JavaScript. It appears to be a comment describing a function or
  method called `addHtmlModalByCode`. The comment uses the ` */
  attachableMeshes() {
    if (this.gizmoManager) {
      this.gizmoManager.attachableMeshes = Array.from(this.modalMeshs, ([k, v]) => v);
    }
  }
  loading(show) {
    if (show) {
      this.engine.displayLoadingUI()
    } else {
      this.engine.hideLoadingUI()
    }
  }
  genMesh(mesh) {
    const metadata = mesh?.metadata
    if (!metadata) return
    if (metadata.device_flag === 1) {
      const z = mesh.position.z
      console.log(z, 'mmmmmmmmm')

      const x = mesh.position.x / this.option.length
      const y = mesh.position.y < 0.1 ? 0.1 : mesh.position.y
      const width = mesh.scaling.x * metadata.width
      const height = mesh.scaling.y * metadata.height
      return { ...metadata, x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), z: Number(z.toFixed(3)), width: Number(width.toFixed(3)), height: Number(height.toFixed(3)), road: 0 }

    }
    const _position = calculateD(mesh.position.z, this.roads, this.lanes, this.option.width)
    const z = metadata.percentage !== false ? _position.z ?? mesh.position.z : mesh.position.z
    const x = mesh.position.x / this.option.length
    const y = mesh.position.y < 0.1 ? 0.1 : mesh.position.y
    const width = mesh.scaling.x * metadata.width
    const height = mesh.scaling.y * metadata.height
    return { ...metadata, x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), z: Number(z.toFixed(3)), width: Number(width.toFixed(3)), height: Number(height.toFixed(3)), road: _position.road }
  }
  enableGizmo(type) {
    if (this.gizmoManager) {
      this.gizmoManager?.dispose()
    }
    const gizmoManager = new BABYLON.GizmoManager(this.scene);
    gizmoManager.boundingBoxGizmoEnabled = false;
    gizmoManager.rotationGizmoEnabled = false;
    this.gizmoManager = gizmoManager;
    this.gizmoManager.scaleGizmoEnabled = type === 2;
    this.gizmoManager.positionGizmoEnabled = type === 1;
    type === 1 ? this.gizmoManager.gizmos.positionGizmo.updateGizmoRotationToMatchAttachedMesh =
      false : this.gizmoManager.usePointerToAttachGizmos = false
    const emit = () => {
      const mesh = this.gizmoManager.attachedMesh
      const metadata = mesh?.metadata
      if (!metadata) return
      const newMesh = this.genMesh(mesh)
      console.log(newMesh, 'newMesh')
      for (const key in newMesh) {
        mesh.metadata[key] = newMesh[key]
      }
      window.postMessage({ type: 'pointChange', data: newMesh })
    }
    if (type === 2) {
      this.gizmoManager.gizmos.scaleGizmo.onDragEndObservable.add(emit)
    } else {
      this.gizmoManager.gizmos.positionGizmo.onDragEndObservable.add(emit)
    }
    this.attachableMeshes()
  }
  clearCars() {
    this.carMeshs.forEach((item) => {
      this.disposeByMesh(item)
    })
    this.carMeshs = []
  }
  setCarToRoads(pss) {
    // console.log(pss, "pss")
    this.clearCars()
    pss.forEach((ps) => {
      this.setCarToRoad(ps);
    });
  }
  /**
   * 车辆上路动画
   * 创建车辆模型并使其沿车道行驶
   * @param {Object} ps - 车辆配置信息（速度、位置、车道等）
   */
  async setCarToRoad(ps) {
    const name = `cu-hot-car-${ps.device_code}`;
    // 创建车辆的父变换节点
    const parent = new BABYLON.TransformNode(name, this.scene);
    // 从缓存中克隆车辆模型（需先调用 carLoad 加载基础模型）
    const mesh = this.cars.get("car")?.clone(name, parent);
    this.carMeshs.push(parent)
    mesh.metadata = { ...ps, }
    
    // 计算车辆初始位置
    const position = this.getPosition(ps);
    mesh.position = position;
    // 根据车道类型设置朝向（1为正向，其他为反向）
    mesh.rotation.y = ps.laneType === 1 ? Math.PI / 2 : -Math.PI / 2;
    
    // 如果配置了移动属性，开始动画
    if (ps.move) {
      // 计算动画总帧数：(距离 / 速度) * 帧率
      // 这里速度单位转换：km/h -> m/s
      const frame =
        (((ps.length - ps.currentPosition) * 1000) / (ps.speed ?? 60 / 3.6)) * 24;
      
      // 创建并启动动画
      // 这是一个简单的线性位移动画，只改变 X 轴位置
      BABYLON.Animation.CreateAndStartAnimation(
        `anim${ps.device_code}`,
        mesh,
        "position.x",
        24, // fps
        frame, // 总帧数
        position.x, // 起始 X
        ps.laneType === 1 ? ps.length * this.option.length : 0, // 目标 X（终点）
        2, // 循环模式：2 = CONSTANT（播放一次停止）
        undefined,
        () => {
          // 动画结束回调：销毁车辆
          this.disposeByMesh(parent);
        }
      );
    }
  }

  setMeshToRoads(pss) {
    pss.forEach((ps) => {
      this.setMeshToRoad(ps);
    });
  }
  setMeshToRoad(ps) {
    const scene = this.scene;
    const name = `cu-hot-point-${ps.device_code}`;
    let mesh = scene.getMeshById(name);
    if (!mesh) {
      mesh = BABYLON.MeshBuilder.CreatePlane(
        name,
        { width: ps.width, height: ps.height },
        this.scene
      );
      mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      if (ps.path) {
        mesh.material = this.createMaterialsByPath(ps.path);
      }
    }
    const position = this.getPosition(ps);
    mesh.position = position;
    mesh.renderingGroupId = 2;
    mesh.scaling = new BABYLON.Vector3(ps.laneType === 1 ? 1 : -1, 1, 1);
    if (ps.move) {
      const frame =
        (((ps.length - ps.currentPosition) * 1000) / (ps.speed ?? 60 / 3.6)) * 30;
      BABYLON.Animation.CreateAndStartAnimation(
        `anim${ps.device_code}`,
        mesh,
        "position.x",
        30,
        frame,
        position.x,
        ps.laneType === 1 ? ps.length * this.option.length : 0,
        2,
        undefined,
        () => {
          mesh.dispose();
        }
      );
    }
  }
  setCurrentBox = (current, width = this.option.length, height = 1, alpha = 0, radius, resetCamera = true) => {

    console.log(current, 'current')

    let mesh = this.scene.getMeshById("currentBox");
    let stop
    if (!mesh) {
      const material = new BABYLON.StandardMaterial("material", this.scene);
      material.disableLighting = true;
      material.emissiveColor = BABYLON.Color3.FromHexString("#0984e3");
      material.alpha = alpha;
      const depth =
        this.lanes.reduce((acc, cur) => {
          return acc + cur.num * this.option.width;
        }, 0) +
        (this.lanes.length - 1) * this.option.gap +
        this.option.edgeHeight * 2;
      mesh = BABYLON.MeshBuilder.CreateBox(
        "currentBox",
        {
          width: width,
          height: height,
          depth: depth,
        },
        this.scene
      );
      // mesh.renderingGroupId = 2;
      mesh.material = material;
    }
    const x = current * this.option.length;
    mesh.position = new BABYLON.Vector3(x, height / 2, 0);
    this.resetCamera(mesh.position.clone(), resetCamera);
    mesh.isPickable = false;
    if (stop) {
      clearTimeout(stop)
    }
    mesh.material.alpha = alpha;
    stop = setTimeout(() => {
      mesh.material.alpha = 0;
    }, 2000);
  };
  removeCurrentBox() {
    const mesh = this.scene.getMeshById("currentBox");
    if (mesh) {
      mesh.dispose();
    }
  }
  getPosition(ps, ignoreDirection = false) {
    const { laneType, laneNum, currentLane, length, currentPosition, roadNum } =
      ps;
    console.log(currentPosition, "currentPosition")
    let x = 0
    if (ignoreDirection) {
      x = currentPosition * this.option.length
    } else {
      x = laneType === 1 ? currentPosition * this.option.length : (length - currentPosition) * this.option.length;
    }
    console.log(x, "currentPosition")

    const cs = calculateLaneCenters(
      laneNum,
      this.option.width,
      this.roads[roadNum]
    );
    return new BABYLON.Vector3(x, 0, cs[currentLane]);
  }
  // show axis
  showAxis(size) {
    const scene = this.scene;
    let makeTextPlane = function (text, color, size) {
      let dynamicTexture = new BABYLON.DynamicTexture(
        "DynamicTexture",
        50,
        scene,
        true
      );
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(
        text,
        5,
        40,
        "bold 36px Arial",
        color,
        "transparent",
        true
      );
      let plane = BABYLON.MeshBuilder.CreatePlane("TextPlane", { size }, scene);
      plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
      plane.material.backFaceCulling = false;
      plane.material.specularColor =
        new BABYLON.Color3(0, 0, 0);
      plane.material.diffuseTexture =
        dynamicTexture;
      return plane;
    };

    let axisX = BABYLON.MeshBuilder.CreateLines(
      "axisX",
      {
        points: [
          BABYLON.Vector3.Zero(),
          new BABYLON.Vector3(size, 0, 0),
          new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
          new BABYLON.Vector3(size, 0, 0),
          new BABYLON.Vector3(size * 0.95, -0.05 * size, 0),
        ],
      },
      scene
    );
    axisX.color = new BABYLON.Color3(1, 0, 0);
    let xChar = makeTextPlane("X", "red", size / 10);
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
    let axisY = BABYLON.MeshBuilder.CreateLines(
      "axisY",
      {
        points: [
          BABYLON.Vector3.Zero(),
          new BABYLON.Vector3(0, size, 0),
          new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
          new BABYLON.Vector3(0, size, 0),
          new BABYLON.Vector3(0.05 * size, size * 0.95, 0),
        ],
      },
      this.scene
    );
    axisY.color = new BABYLON.Color3(0, 1, 0);
    let yChar = makeTextPlane("Y", "green", size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
    let axisZ = BABYLON.MeshBuilder.CreateLines(
      "axisZ",
      {
        points: [
          BABYLON.Vector3.Zero(),
          new BABYLON.Vector3(0, 0, size),
          new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
          new BABYLON.Vector3(0, 0, size),
          new BABYLON.Vector3(0, 0.05 * size, size * 0.95),
        ],
      },
      this.scene
    );
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    let zChar = makeTextPlane("Z", "blue", size / 10);
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
  }
  /**
   * 设置相机视图类型（2D 或 3D 模式）
   * 通过动画平滑过渡相机的 beta 角度（垂直旋转角），实现 2D 俯视和 3D 斜视的切换
   * @param {string} type - 视图类型: "2d" (纯俯视) 或 "3d" (带透视角度)
   */
  setCameraType(type) {
    this.option.cameraType = type;
    const activeCamera = this.scene.activeCamera
    
    if (type === "2d") {
      // 切换到 2D 模式：视角将平滑移动到正上方俯视
      activeCamera.alpha = -Math.PI / 2; // 固定水平视角
      
      // 创建并开始过渡动画，改变 beta（垂直角度）
      BABYLON.Animation.CreateAndStartAnimation(
        "upperBetaAnim",
        activeCamera,
        "beta",
        60, // 帧率 (fps)
        10, // 动画总帧数 (较快，约 1/6 秒)
        Math.PI * 0.32, // 起始角度：3D 斜角 (约 57.6度)
        Math.PI * 0,    // 结束角度：0 (完全俯视)
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        undefined,
        () => {
          // 动画结束后的回调
          this.lock(this.option.isLock, this.option.cameraType); // 重新应用视角锁定状态
          // 在 2D 模式下，隐藏不需要显示的外部 3D 装饰网格 (如背景弧线)
          this.outerMeshs.forEach(mesh => {
            if (mesh.name.startsWith('arc-')) {
              mesh.setEnabled(false)
            }
          });
        }
      );
    } else {
      // 切换到 3D 模式：视角将平滑移动到斜视角度
      activeCamera.alpha = -Math.PI / 2;
      
      BABYLON.Animation.CreateAndStartAnimation(
        "upperBetaAnim",
        activeCamera,
        "beta",
        60,
        10,
        Math.PI * 0,    // 起始角度：0 (俯视)
        Math.PI * 0.32, // 结束角度：3D 斜角
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        undefined,
        () => {
          this.lock(this.option.isLock, this.option.cameraType);
          // 在 3D 模式下，重新显示外部 3D 装饰网格
          this.outerMeshs.forEach(mesh => {
            if (mesh.name.startsWith('arc-')) {
              mesh.setEnabled(true)
            }
          });
        }
      );
    }
  }
  createTexture(path, type = null) {
    if (path.startsWith('data:image/gif') || path.endsWith('.gif') || type === 'gif') {
      const gifTexture = new AnimatedGifTexture(path, this.engine, () => {
      });
      return gifTexture
    } else {
      const texture = new BABYLON.Texture(path, this.scene);
      return texture
    }
  }
  /**
   * 基础材质创建方法 (基于图片路径)
   * 用于创建通用的、无光照影响的 (Unlit) 2D 贴图材质。
   * 特点：开启 Mipmap 优化远距离显示，支持材质缓存，材质创建后被冻结 (freeze) 以极致提升渲染性能。
   * 
   * @param {string} path - 纹理图片的路径或 base64
   * @param {number} uScale - 纹理在水平方向 (U轴) 的重复平铺次数，默认 1
   * @param {number} vScale - 纹理在垂直方向 (V轴) 的重复平铺次数，默认 1
   * @returns {BABYLON.StandardMaterial | undefined} 返回创建好或缓存中的材质实例
   */
  createMaterialsByPath(path, uScale = 1, vScale = 1) {
    if (!path) return
    // 1. 生成材质缓存 Key
    const key = `material-${path}-${uScale}-${vScale}`
    // console.log(this.materials.get(key), "this.materials.get(key)")
    // 2. 检查缓存，避免重复创建
    if (this.materials.get(key)) {
      return this.materials.get(key)
    }
    
    // 3. 创建新的标准材质
    const material = new BABYLON.StandardMaterial(
      `material-${path}`,
      this.scene
    );
    
    // 4. 设置不受光照影响 (Unlit)
    material.disableLighting = true;
    material.specularColor = new BABYLON.Color3(0, 0, 0); // 关闭高光
    
    // 5. 创建纹理
    const texture = this.createTexture(path);

    // 6. 启用 MipMap (多级渐远纹理)
    // 作用：当物体离相机很远变小的时候，使用缩小版的模糊纹理，减少摩尔纹闪烁，提升渲染性能
    texture.generateMipMaps = true; // 启用 Mipmap
    // texture.samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; // 三线性过滤
    
    // 7. 应用纹理和颜色
    material.emissiveTexture = texture; // 自发光贴图
    material.diffuseTexture = texture; // 漫反射贴图
    material.emissiveColor = new BABYLON.Color3(1, 1, 1); // 设为白色，确保贴图原色输出
    
    // 8. 处理透明度
    material.diffuseTexture.hasAlpha = true;
    material.useAlphaFromDiffuseTexture = true; // 或使用 diffuseTexture 的 Alpha
    material.backFaceCulling = false; // 关闭背面剔除 (双面可见)
    material.emissiveTexture.hasAlpha = true;
    material.alpha = 1;
    material.disableDepthWrite = true; // 解决透明物体叠加闪烁问题
    
    // 9. 处理纹理平铺
    texture.uScale = uScale; // 水平重复次数
    texture.vScale = vScale; // 垂直重复次数
    // 设置环绕模式 (重要：必须设置才能生效)
    texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE; // 水平重复
    texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; // 垂直重复
    
    // 10. 缓存并冻结材质
    this.materials.set(key, material)
    // 冻结材质 (Freeze)：告诉引擎这个材质的属性不会再变了，引擎可以做大量底层优化，极大提升帧率
    material.freeze();
    return material;
  }
  /**
   * 根据路径创建或获取无光照材质 (可能原意为 Front/Up 等特定朝向材质)
   * 该方法用于创建带纹理贴图的材质，特点是：无光照影响、支持透明、双面显示、支持纹理平铺重复。
   * 采用缓存机制 (this.materials) 避免重复创建相同的材质，提升渲染性能。
   * 
   * @param {string} path - 纹理图片的路径或 base64
   * @param {string} path2 - (注意: 当前代码逻辑中虽然检查了 path2，但实际并未应用到材质中。可能是一个遗留参数或未完成的双面材质设计)
   * @param {number} uScale - 纹理在水平方向 (U轴) 的重复平铺次数，默认 1
   * @param {number} vScale - 纹理在垂直方向 (V轴) 的重复平铺次数，默认 1
   * @returns {BABYLON.StandardMaterial | undefined} 返回创建好或缓存中的材质实例
   */
  createFUMaterialsByPath(path, path2, uScale = 1, vScale = 1) {
    if (!(path && path2)) return
    
    // 1. 生成材质的唯一缓存 Key
    // 注意: Key 中没有包含 path2，如果 path 相同但 path2 不同，会直接返回缓存的旧材质
    const key = `material-${path}-${uScale}-${vScale}`
    
    // 2. 检查缓存，如果已存在则直接返回复用 (大幅节省内存和 Draw Calls)
    if (this.materials.get(key)) {
      return this.materials.get(key)
    }
    
    // 3. 创建新的标准材质
    const material = new BABYLON.StandardMaterial(
      `material-${path}`,
      this.scene
    );
    
    // 4. 设置材质不受光照影响 (Unlit 效果)
    material.disableLighting = true; // 关闭光照计算，使得贴图在暗处也能保持原色
    material.specularColor = new BABYLON.Color3(0, 0, 0); // 关闭高光反射
    
    // 5. 创建纹理并应用
    const texture = this.createTexture(path);
    material.emissiveTexture = texture; // 设置为自发光纹理，使颜色直接由贴图决定
    material.diffuseTexture = texture;  // 设置漫反射纹理
    material.emissiveColor = new BABYLON.Color3(1, 1, 1); // 自发光底色设为纯白
    
    // 6. 处理透明通道 (Alpha)
    material.diffuseTexture.hasAlpha = true; // 告知引擎漫反射贴图包含透明通道
    material.useAlphaFromDiffuseTexture = true; // 使用漫反射纹理的 Alpha 作为材质透明度
    material.emissiveTexture.hasAlpha = true; 
    material.alpha = 1; // 材质整体透明度 (1为不透明，但贴图本身的透明部分会生效)
    
    // 7. 渲染配置
    material.backFaceCulling = false; // 关闭背面剔除 (Double-sided)，使得从背面也能看到贴图
    material.disableDepthWrite = true; // 关闭深度写入。对于透明材质非常关键，能避免透明物体相互遮挡时的 Z-fighting (闪烁) 现象
    
    // 8. 纹理平铺 (Tiling/Repeating) 配置
    texture.uScale = uScale; // 设置水平平铺次数 (例如设为10，贴图会在水平方向重复10次)
    texture.vScale = vScale; // 设置垂直平铺次数
    // 必须将寻址模式设为 WRAP_ADDRESSMODE (重复)，uScale/vScale 的大于1的值才会生效
    texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE; // 水平重复
    texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; // 垂直重复
    
    // 9. 存入缓存并返回
    this.materials.set(key, material)
    return material;
  }
  /**
   * 创建正反面不同的自定义 Shader 材质 (Front & Back Materials)
   * 该方法使用了自定义的 fb_shaderMaterial (通常通过引入外部自定义的着色器代码)，
   * 允许在一个单面网格 (如 Plane) 的正面和背面分别渲染不同的图片。
   * 
   * 应用场景：当需要在 3D 场景中放置一个指示牌，正面看是 A 图案，绕到背后看是 B 图案时使用。
   * 
   * @param {string} path - 正面纹理图片的路径或 base64
   * @param {string} path1 - 背面纹理图片的路径或 base64
   * @param {number} uScale - (预留参数) 水平平铺次数，当前 Shader 内部可能未实际使用
   * @param {number} vScale - (预留参数) 垂直平铺次数，当前 Shader 内部可能未实际使用
   * @returns {BABYLON.ShaderMaterial | undefined} 返回自定义着色器材质实例
   */
  createFBMaterialsByPath(path, path1, uScale = 1, vScale = 1) {
    if (!path) return
    
    // 注意：缓存 key 并没有将 path1 加入进去。这可能导致：
    // 如果存在多对 (path, path1) 组合，只要 path 相同，都会返回第一次创建的旧材质，背面贴图会显示错误。
    // 建议后期将 path1 加入 key: `material-${path}-${path1}-${uScale}-${vScale}`
    const key = `material-${path}-${uScale}-${vScale}`
    // console.log(this.materials.get(key), "this.materials.get(key)")
    if (this.materials.get(key)) {
      return this.materials.get(key)
    }
    
    // 使用自定义着色器 fb_shaderMaterial 创建材质
    const material = fb_shaderMaterial(`material-${path}-${path1}`, this.scene)
    
    // 往自定义 Shader 中传入两张不同的纹理 (Front 和 Back)
    material.setTexture("textureFront", this.createTexture(path));
    material.setTexture("textureBack", this.createTexture(path1));

    // material.disableLighting = true;
    // material.specularColor = new BABYLON.Color3(0, 0, 0); // 关闭高光
    // const texture = this.createTexture(path);
    // material.emissiveTexture = texture;
    // material.diffuseTexture = texture;
    // material.emissiveColor = new BABYLON.Color3(1, 1, 1); // 设为白色
    // material.diffuseTexture.hasAlpha = true;
    // material.useAlphaFromDiffuseTexture = true; // 或使用 diffuseTexture 的 Alpha
    
    // 必须关闭背面剔除，否则背面根本就不会被渲染，也就不可能看到 path1 的纹理了
    material.backFaceCulling = false;
    
    // material.emissiveTexture.hasAlpha = true;
    // material.alpha = 1;
    // material.disableDepthWrite = true;
    // (material.diffuseTexture).uScale = uScale; // 水平重复次数
    // (material.diffuseTexture).vScale = vScale; // 垂直重复次数
    // (material.emissiveTexture).uScale = uScale; // 水平重复次数
    // (material.emissiveTexture).vScale = vScale; // 垂直重复次数
    // // 设置环绕模式 (重要：必须设置才能生效)
    // material.diffuseTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE; // 水平重复
    // material.diffuseTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; // 垂直重复
    // material.emissiveTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE; // 水平重复
    // material.emissiveTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; // 垂直重复
    
    this.materials.set(key, material)
    return material;
  }
  /**
   * 锁定或解锁相机的旋转操作
   * 通过设置相机的 alpha 和 beta 角度限制来阻止用户通过鼠标/触摸旋转视角
   * @param {boolean} isLock - 是否锁定相机
   * @param {string} type - 视图类型: "3d" 或 "2d"
   */
  lock(isLock, type = "3d") {
    this.option.isLock = isLock
    // console.log(isLock, type, "lock")
    if (isLock) {
      if (type === "3d") {
        // 3D 模式锁定：将上下左右旋转范围限制在特定角度，使得视角固定
        const activeCamera = this.scene.activeCamera;
        activeCamera.lowerAlphaLimit = -Math.PI / 2; // 锁定水平最小角
        activeCamera.upperAlphaLimit = -Math.PI / 2; // 锁定水平最大角
        activeCamera.lowerBetaLimit = Math.PI * 0.32; // 锁定垂直最小角 (斜视)
        activeCamera.upperBetaLimit = Math.PI * 0.32; // 锁定垂直最大角
      } else {
        // 2D 模式锁定：锁定为正上方俯视
        const activeCamera = this.scene.activeCamera;
        activeCamera.lowerAlphaLimit = -Math.PI / 2; 
        activeCamera.upperAlphaLimit = -Math.PI / 2; 
        activeCamera.lowerBetaLimit = 0; // 0度代表完全垂直俯视
        activeCamera.upperBetaLimit = 0;
      }
    } else {
      // 解锁：解除所有的角度限制，允许自由旋转
      const activeCamera = this.scene.activeCamera;
      activeCamera.lowerAlphaLimit = null; 
      activeCamera.upperAlphaLimit = null; 
      activeCamera.lowerBetaLimit = null;
      activeCamera.upperBetaLimit = null;
    }
  }
  addHtmlModalByCode(device_code, el, cb, removeCb) {
    if (!el || !device_code) return
    const els = this.modalHtmls.get(device_code) ?? [];
    this.modalHtmls.set(device_code, [...els, { el: el, cb, removeCb }]);
    this.canvas.parentElement.style.position = "relative";
    this.canvas.parentElement.appendChild(el);
  }
  setModalHtmlsPosition() {
    const width = this.engine.getRenderWidth()
    for (let [key, els] of this.modalHtmls) {
      const mesh = this.modalMeshs.get(key);
      if (!mesh) continue
      const position = this.getDisplayPosition(mesh);
      for (const el of els) {
        el.el.style.top = `${position.y / window.devicePixelRatio}px`;
        // el.el.style.left = `${position.x <= width / 2 ? position.x : position.x - el.el.offsetWidth}px`;
        el.el.style.left = `${(width - position.x > el.el.offsetWidth ? position.x : position.x - el.el.offsetWidth) / window.devicePixelRatio}px`;

        // el.el.style.translate = `${position.x}px ${position.y}px`
        if (typeof el.cb === 'function') {
          el?.cb(mesh?.metadata, el.el, { viewWidth: width, viewHeight: this.engine.getRenderHeight() }, position)
        }
      }
    }
  }
  modalClear() {
    for (let [key, els] of this.modalHtmls) {
      for (const el of els) {
        if (el.el?.player) {
          el.el?.player?.destroy()
          el.el.player = null
        }
        el.el.remove();
      }
    }
    this.modalHtmls.clear();
  }
  modalClearByCode(code) {
    const els = this.modalHtmls.get(code)
    for (const el of els) {
      el.el.remove();
    }
    this.modalHtmls.delete(code);
  }
  getModalHtmlsByCodeAndId(code, id) {
    // console.log(code,id, "code,id","")
    const els = this.modalHtmls.get(code)
    // console.log(els, "els")
    const elobj = els?.find(elobj => elobj?.el?.id === id)
    return elobj
  }
  modalRemoveByCodeAndId(code, id) {
    const els = this.modalHtmls.get(code) ?? []
    const newels = els?.filter(elobj => elobj?.el?.id !== id)
    const elobj = els?.find(elobj => elobj?.el?.id === id)
    elobj?.el?.remove();
    if (typeof elobj?.el.removeCb === 'function') {
      elobj?.el?.removeCb?.({ ...mesh?.metadata }, el)
    }
    this.modalHtmls.set(code, newels);
  }
  // 预留
  loadHtmlMesh(point) {
    const transformNode = new BABYLON.TransformNode(`point-mesh-${point.device_code}`, this.scene);
    const htmlMeshDiv = new ADDONS.HtmlMesh(this.scene, `point-mesh-html-${point.device_code}`, {
      isCanvasOverlay: true
    });

    htmlMeshDiv.setContent(point.el, point.width, point.height);
    htmlMeshDiv.position.x = point.offsetX ?? 0;
    htmlMeshDiv.position.y = point.offsetY ?? 0;
    htmlMeshDiv.position.z = point.offsetZ ?? 0;
    const material = htmlMeshDiv.material;
    material.backFaceCulling = false;
    material.alpha = 0
    htmlMeshDiv.parent = transformNode;
    transformNode.metadata = point
    if (this.option.cameraType === '3d') {
      transformNode.rotation.y = Math.PI / 2;
      if (point.class_code !== "103004") {
        console.log('point', 'pppppppppppp')
        const cylinder = BABYLON.MeshBuilder.CreateCylinder(`cylinder-${point.device_code}`, { diameter: 0.1, enclose: true, height: point.height / 2 + point.y, subdivisions: 40 });
        cylinder.position.x = point.width / 2 + 0.1
        cylinder.position.y = -point.y / 2 + 0.2
        const box = BABYLON.MeshBuilder.CreateBox(`box-${point.device_code}`, { width: 0.1, height: 0.1, depth: 0.1 });
        box.position.x = point.width / 2
        box.position.y = point.height * 0.25
        box.position.z = 0.05
        const box2 = box.clone(`box2-${point.device_code}`)
        box2.position.y = - point.height * 0.25
        box.parent = transformNode
        box2.parent = transformNode
        cylinder.parent = transformNode
      }
    } else {
      transformNode.rotation.x = Math.PI / 2;
      // transformNode.rotation.y = -Math.PI / 2;
      // if (point.class_code !== "103004") {
      transformNode.rotation.y = 0;
      // } else {
      //   transformNode.rotation.y = Math.PI / 2
      // }
    }
    return transformNode
  }
  loadVideoHtmlMesh(video) {
    const transformNode = new BABYLON.TransformNode(`video-parent`, this.scene);
    const htmlMeshDiv = new ADDONS.HtmlMesh(this.scene, `point-video`, {
      isCanvasOverlay: true,
    });
    htmlMeshDiv.setContent(video.el, 3, 2);
    const material = htmlMeshDiv.material;
    material.backFaceCulling = false;
    htmlMeshDiv.parent = transformNode;
    htmlMeshDiv.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  }
  loadVideoHtmlMeshs(videos) {
    for (let video of videos) {
      this.loadVideoHtmlMesh(video);
    }
  }
  updatePlaneSize(mesh, newWidth, newHeight) {
    if (mesh instanceof BABYLON.TransformNode) return
    // 获取顶点位置数据
    let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if (!positions) return
    let newPositions = [];
    for (let i = 0; i < positions.length; i += 3) {
      // 提取原始坐标
      const originalX = positions[i];
      const originalY = positions[i + 1];
      const z = positions[i + 2];
      // 计算新坐标（保持顶点相对位置）
      const newX = (originalX > 0 ? 1 : -1) * newWidth / 2;   // 根据原始符号计算新X
      const newY = (originalY > 0 ? 1 : -1) * newHeight / 2;  // 根据原始符号计算新Y
      newPositions.push(newX, newY, z);
    }
    // 更新顶点数据
    mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, newPositions);
    // 更新包围盒（推荐）
    mesh.refreshBoundingInfo();
    mesh.scaling = new BABYLON.Vector3(1, 1, 1);
  }
  createPointEvent(mesh) {
    if (!mesh || !mesh instanceof BABYLON.Mesh) return
    const canvas = this.scene.getEngine().getRenderingCanvas();
    mesh.actionManager = new BABYLON.ActionManager(this.scene);
    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        () => canvas.style.cursor = "pointer"
      )
    );
    mesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOutTrigger,
        () => canvas.style.cursor = ""
      )
    );
  }
  /**
   * 加载单个设备点位
   * 根据配置创建 3D 平面或 HTML 覆盖层
   * @param {Object} point - 点位配置
   * @param {boolean} clear - 是否清除旧实例
   */
  loadPoint(point, clear = true) {
    const device_code = point.device_code || point.temp_device_code
    if (!device_code) return
    
    // 尝试获取已存在的网格
    // let mesh = this.scene.getMeshByName(`point-mesh-${device_code}`);
    let mesh = this.scene.getMeshByName(`point-mesh-${device_code}`) ?? this.scene.getTransformNodeByName(`point-mesh-${device_code}`)
    
    // 如果已存在且需要更新
    if (mesh) {
      if (point.el) {
        point.el?.remove() // 移除旧 DOM
      }
      if (clear) {
        this.disposeByMesh(mesh) // 销毁旧网格
      }
      // 如果只是尺寸变化，更新顶点数据而不需要重建
      if (typeof (point.width * point.height) === 'number' && !isNaN(point.width * point.height)) {
        this.updatePlaneSize(mesh, point.width, point.height);
      }
    }
    
    // 创建新网格
    if ((!mesh) || (mesh && clear)) {
      if (point.el instanceof HTMLElement) {
        // 如果包含 DOM 元素，使用 HTML Mesh
        mesh = this.loadHtmlMesh(point)
        mesh.billboardMode = point.billboardMode;
      } else {
        // 否则创建标准平面
        mesh = BABYLON.MeshBuilder.CreatePlane(
          `point-mesh-${device_code}`,
          {
            // 如果是双面广告牌模式(7)且有背景图，宽度翻倍以容纳两面
            width: (point.billboardMode === 7 && point.background && point.background_back) ? 2 * point.width : point.width,
            height: point.height,
            updatable: true,
          },
          this.scene
        );

      }
    }
    
    // 设置材质和旋转
    if (!(point.el instanceof HTMLElement)) {
      mesh.billboardMode = point.billboardMode;
      
      // 模式0 或 特殊设备：平躺或贴墙
      if (point.billboardMode === 0 || point.device_flag === 1) {
        mesh.billboardMode = 0
        if (point.background && point.background_back) {
          // 双面材质
          mesh.material = this.createFBMaterialsByPath(point.background, point.background_back)
          mesh.rotation.y = Math.PI / 2;
        } else {
          // 单面材质
          mesh.material = this.createMaterialsByPath(point.background);
          mesh.rotation.x = Math.PI / 2;
        }
      } else if (point.billboardMode === 7) {
        // 模式7：复杂的双面展示结构
        if (point.background && point.background_back) {

          // 创建正面子平面
          const subPlane = BABYLON.MeshBuilder.CreatePlane(`point-mesh-sub_${device_code}`, {
            width: point.width,
            height: point.height,
            updatable: true,
          },)
          subPlane.parent = mesh
          subPlane.position.x = -point.width / 2
          subPlane.material = this.createMaterialsByPath(point.background)
          subPlane.renderingGroupId = 3

          // subPlane.rotation.x = Math.PI / 2;

          // 创建背面子平面
          const subPlaneBack = BABYLON.MeshBuilder.CreatePlane(`point-mesh-sub_back_${device_code}`,
            {
              width: point.width,
              height: point.height,
              updatable: true,
            }
          )
          subPlaneBack.parent = mesh
          subPlaneBack.position.x = point.width / 2
          subPlaneBack.material = this.createMaterialsByPath(point.background_back)
          subPlaneBack.renderingGroupId = 3
          mesh.isVisible = false // 父节点不可见，只显示子节点
          // subPlaneBack.rotation.x = Math.PI / 2;

        } else {
          mesh.material = this.createMaterialsByPath(point.background);
          mesh.rotation.x = 0;
        }
      }

    }
    
    // (注释掉的代码) 缩放调整
    if (mesh.metadata && 'width' in mesh?.metadata) {
      // console.log(mesh, "metadata")
      // mesh.scaling = new BABYLON.Vector3(point.width / mesh.rawMetadata.width, point.height / mesh.rawMetadata.height, 1)
    }
    
    // 计算位置坐标
    const roadWidths = this.roads.map((item, index) => {
      return [
        item + (this.option.width * this.lanes[index].num) / 2,
        item - (this.option.width * this.lanes[index].num) / 2,
      ];
    });
    const position = new BABYLON.Vector3(point.percentage !== false ? point.x * this.option.length : point.x, point.y, 0)

    try {
      // 复杂的坐标计算逻辑，根据车道、间隙、偏移量计算最终 Z 轴坐标
      if (point.device_flag !== 1 && point.road % 1 === 0) {
        const roadLeft = this.lanes[point.road]?.type === 1 ? roadWidths[point.road][0] : roadWidths[point.road][1]
        position.z = this.lanes[point.road]?.type === 1 ? (point.percentage !== false ? roadLeft - point.z * this.option.width * this.lanes[point.road].num : point.z) : (point.percentage !== false ? roadLeft + point.z * this.option.width * this.lanes[point.road].num : point.z)
      }
      else if (point.device_flag !== 1 && point.road % 1 === 0.5 && point.road > 0) {
        const roadLeft = roadWidths[point.road - 0.5][1];
        position.z = point.percentage !== false ? roadLeft - point.z * this.option.gap : point.z
      } else {
        position.z = point.z
      }
    } catch (error) {
      // console.log(point,'point')
    }
    mesh.position = position;
    mesh.metadata = point;  
    
    // 合并配置属性（从 config.js 中读取偏移量等）
    const mergeProp = (prop) => {
      try {
        const current = config[point.class_code]
        const _config = current[this.option.cameraType][prop]
        if (_config) {
          for (const key in _config) {
            mesh.position[key] = typeof _config[key] === 'string' && _config[key].startsWith('$refs.') ? point[_config[key].replace('$refs.', '')] : _config[key]
          }
        }
      } catch (error) {
        // console.log(error, 'error')

      }
    }
    mergeProp('position')
    
    if (!mesh.material) {
      mesh.material = new BABYLON.StandardMaterial('empty')
    }

    // 设置可见性和可拾取性
    if (!this.option.editModel && mesh.material && point.device_flag !== 1) {
      mesh.visibility = point.showIcon
      mesh.isPickable = point.showIcon !== 0
    }
    mesh.renderingGroupId = 3; // 渲染组 ID，确保显示在路面上方
    this.modalMeshs.set(device_code, mesh);
    this.createPointEvent(mesh)

  }
  /**
   * 批量加载设备点位
   * @param {Array} points - 点位数据数组
   * @param {boolean} clear - 是否先清除已有点位
   */
  loadPoints(points, clear = true) {
    if (clear) {
      // 找出当前存在但不在新列表中的点位，进行删除
      const keys = this.modalMeshs.keys().filter((key) => {
        return !points.find(item => item.device_code === key)
      })
      for (const key of keys) {
        // 销毁 3D 网格
        this.disposeByMesh(this.modalMeshs.get(key))
        
        // 销毁关联的 HTML 元素
        const els = this.modalHtmls.get(key)
        const mesh = this.modalMeshs.get(key);
        if (Array.isArray(els)) {
          for (const el of els) {
            el?.el?.remove()
            // 执行移除回调（如果有）
            if (typeof el.removeCb === 'function') {
              el?.removeCb?.({ ...mesh?.metadata }, el)
            }
          }
        }
        this.modalMeshs.delete(key)
        this.modalHtmls.delete(key)
      }
    }
    // 循环加载每个点位
    for (const item of points) {
      this.loadPoint(item, clear);
    }
  }
  screenToGround(screenX, screenY, isTransform = false) {
    const scene = this.scene
    const pickResult = scene.pick(screenX, screenY);
    if (pickResult.hit) {
      const pickPoint = pickResult.pickedPoint;
      if (isTransform) {
        const _position = calculateD(pickPoint.z, this.roads, this.lanes, this.option.width)
        if (pickPoint.z > this.roads[0] + this.option.width * this.lanes[0].num / 2) {
          _position.z = 0
          _position.road = 0
        }
        if (pickPoint.z < this.roads.at(-1) - this.option.width * this.lanes.at(-1).num / 2) {
          _position.z = 1
          _position.road = this.roads.length - 1
        }
        return {
          x: pickPoint.x / this.option.length,
          y: 0,
          z: _position.z,
          road: _position.road,
        }
      }
      return {
        x: pickPoint.x / this.option.length,
        y: 0,
        z: pickPoint.z,
        road: 0,
      }
    }
  }
  getDisplayPosition(mesh) {
    const viewport = this.scene.activeCamera.viewport.toGlobal(
      this.engine.getRenderWidth(),
      this.engine.getRenderHeight()
    );
    // 获取 Mesh 的世界坐标
    const worldMatrix = mesh.getWorldMatrix();
    const worldPosition = BABYLON.Vector3.TransformCoordinates(
      BABYLON.Vector3.Zero(),
      worldMatrix
    );
    const screenPos = BABYLON.Vector3.Project(
      worldPosition,
      BABYLON.Matrix.Identity(),
      this.scene.getTransformMatrix(),
      viewport
    );
    return screenPos;
  }
  async carLoad() {
    const box = new BABYLON.TransformNode("carBox");
    const glb = await BABYLON.ImportMeshAsync('/model/car.glb', this.scene, {
      pluginExtension: ".glb",
    });
    glb.meshes.forEach((node) => {
      node.renderingGroupId = 2
      box.setEnabled(false);
      box.addChild(node);
    });
    box.scaling = new BABYLON.Vector3(0.005, 0.005, 0.005);
    box.rotationQuaternion = null;
    box.rotation.y = Math.PI * 0.5;
    this.cars.set("car", box);
  }
  segmentNumber(number, segmentLength) {
    if (typeof number !== "number" || number < 0) {
      throw new Error("number must be a non-negative number");
    }
    if (typeof segmentLength !== "number" || segmentLength <= 0) {
      throw new Error("segmentLength must be a positive number");
    }
    const count = Math.floor(number / segmentLength);
    const remainder = number - count * segmentLength;
    const segments = Array(count).fill(segmentLength);
    // 处理浮点数精度问题（epsilon 设为 1e-10）
    const epsilon = 1e-10;
    if (remainder > epsilon) {
      segments.push(remainder);
    }
    return segments;
  }
  createRoadNameAndJt(lane, x, z) {
    for (let j = 0; j < lane.num; j++) {
      this.createRoadName(`road-name-jt-${j}`, lane.name, new BABYLON.Vector3(x, 0, z +
        j * this.option.width -
        (this.option.width * (lane.num - 1)) / 2),
        BABYLON.Mesh.BILLBOARDMODE_NONE,
        lane.type === 2 ? -1 : 1)
    }
  }
  async createRoadName(
    name,
    laneName,
    position,
    billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL,
    step = 1,
    font = {
      size: 48,
      family: 'Arial',
      weight: 'bold',
      color: '#c2c4ce',
      textAlign: 'center',
      textBaseline: 'middle'
    },
  ) {

    const fontw = laneName.length * font.size
    const jtw = 100
    const jth = 40
    const space = 40
    const allw = (fontw + jtw + space)
    const h = 80
    const material = new BABYLON.StandardMaterial(
      `material-grid-${name}`,
      this.scene
    );
    const texture = new BABYLON.DynamicTexture(
      name,
      {
        width: fontw + jtw + space,
        height: h, // 高分辨率避免模糊
      },
      this.scene
    );

    const img = new Image(400, 20);
    img.src = step > 0 ? jtImg2 : jtImg3;
    img.onload = () => {
      const ctx = texture.getContext()
      ctx.clearRect(0, 0, allw, h); // 清空残留内容
      ctx.fillStyle = "rgba(0, 0, 0, 0)"; // 全透明填充色
      ctx.fillRect(0, 0, allw, h);
      texture.update(); // 更新纹理ctx
      ctx.drawImage(img, step > 0 ? fontw + space : 0, h / 2 - (jth / 2), jtw, jth);
      texture.update(); // 更新纹理ctx
      ctx.fillStyle = font.color;
      ctx.font = `${font.weight} ${font.size}px ${font.family}`;
      ctx.textAlign = font.textAlign;
      ctx.textBaseline = font.textBaseline;
      ctx.fillText(laneName, step > 0 ? fontw / 2 : jtw + space + fontw / 2, h / 2); // 居中文字
      texture.update(); // 更新纹理ctx
      const backgroundPlane = BABYLON.MeshBuilder.CreatePlane(
        `mesh-grid-${name}`,
        {
          width: allw / 100,
          height: h / 100, // 根据屏幕宽高比例调整（如 16:9）
          //sideOrientation: BABYLON.Mesh.DOUBLESIDE
        },
        this.scene
      );
      backgroundPlane.position = position;
      backgroundPlane.renderingGroupId = 1;
      backgroundPlane.billboardMode = billboardMode;
      backgroundPlane.rotation.x = Math.PI * 0.5;
      material.diffuseTexture = texture;
      material.diffuseTexture.hasAlpha = true;
      material.emissiveTexture = texture;
      material.disableLighting = true;
      material.useAlphaFromDiffuseTexture = true;
      backgroundPlane.material = material;
      this.gridMeshs.push(backgroundPlane);
    }
  }
  disposeByMesh(mesh) {
    const children = mesh.getChildren();
    if (children && children.length) {
      for (let child of children) {
        this.disposeByMesh(child);
      }
    }
    mesh.dispose();
  }
  removePoints(device_codes) {
    for (let device_code of device_codes) {
      const mesh = this.scene.getMeshByName(`point-mesh-${device_code}`);
      if (mesh) {
        this.modalMeshs.delete(device_code);
        this.disposeByMesh(mesh);
      }
    }
    this.highlightLayer?.removeAllMeshes()
    this.gizmoManager.attachToMesh(null)
    this.selectedMesh = []
    window.postMessage({
      type: 'selectChange',
      data: []
    })
  }
  /**
   * 创建网格文字 / 3D 文本标签
   * 使用动态纹理 (DynamicTexture) 在平面 (Plane) 上绘制文字，实现 3D 场景中的文本显示。
   * 常用于显示坐标轴数值、桩号等。
   * 
   * @param {string} name - 要显示的文本内容
   * @param {BABYLON.Vector3} position - 文本在 3D 空间中的位置
   * @param {number} billboardMode - 广告牌模式，默认 BILLBOARDMODE_ALL (始终面向相机)。
   *                                 如果设为 0，则平躺在地面上。
   * @param {string} fontSize - 字体大小，例如 '48px'
   * @param {string} color - 文本颜色，例如 'red', 'white'
   * @param {string} textAlign - 文本对齐方式，例如 'center'
   */
  async createGridNum(
    name,
    position,
    billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL,
    fontSize = '48px',
    color = 'red',
    textAlign = 'center'
  ) {
    // 1. 计算纹理尺寸
    // 根据字符长度动态计算宽度，高度固定为 80px
    const w = name.length * 48
    const h = 80
    
    // 2. 创建材质
    // 使用 StandardMaterial，后续将 DynamicTexture 贴在上面
    const material = new BABYLON.StandardMaterial(
      `material-grid-${name}`,
      this.scene
    );
    
    // 3. 创建动态纹理 (DynamicTexture)
    // 这是一个基于 HTML Canvas 的纹理，可以使用 2D Canvas API 绘制内容
    const texture = new BABYLON.DynamicTexture(
      name,
      {
        width: w,
        height: 80, // 高度固定，保证清晰度
      },
      this.scene
    );
    
    // 4. 获取 Canvas 上下文并绘制文字
    const ctx = texture.getContext()
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize} Arial`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "middle";
    // 在 Canvas 中心绘制文字
    ctx.fillText(name, w / 2, h / 2); 
    // 重要：更新纹理，将 Canvas 内容上传到 GPU
    texture.update(); 

    // 5. 创建承载纹理的平面 (Plane)
    // 注意：Plane 的物理尺寸 (width/height) 与纹理像素尺寸 (w/h) 是分离的
    // 这里除以 100 是为了将像素尺寸转换为场景单位 (例如 80px -> 0.8米)
    const backgroundPlane = BABYLON.MeshBuilder.CreatePlane(
      `mesh-grid-${name}`,
      {
        width: w / 100,
        height: h / 100, 
        //sideOrientation: BABYLON.Mesh.DOUBLESIDE // 可选：双面渲染
      },
      this.scene
    );
    
    // 6. 设置平面属性
    backgroundPlane.position = position;
    backgroundPlane.renderingGroupId = 1; // 渲染组 ID，1 通常表示在默认组(0)之上渲染
    backgroundPlane.billboardMode = billboardMode; // 设置朝向模式
    backgroundPlane.rotation.x = Math.PI * 0.5; // 默认旋转，使其在非 Billboard 模式下平躺
    
    // 7. 将纹理应用到材质
    material.diffuseTexture = texture;
    material.diffuseTexture.hasAlpha = true; // 启用透明通道（文字背景透明）
    material.emissiveTexture = texture; // 自发光，确保在暗处也能看清
    material.disableLighting = true; // 关闭光照计算，保持文字颜色恒定
    material.useAlphaFromDiffuseTexture = true; // 使用漫反射纹理的 Alpha 通道
    
    backgroundPlane.material = material;
    
    // 8. 存入管理器，便于后续清理
    this.gridMeshs.push(backgroundPlane);
  }
  // {road:0,lane:0,status:0,color:'rgba(0,255,0,1)',start:0,end:0.5},
  // {road:0,lane:0,status:0,color:'rgba(255,0,0,1)',start:0.5,end:0.8},
  // 加载路况
  loadConditions(conditions) {
    this.roadConditionMeshs.forEach((mesh) => {
      this.disposeByMesh(mesh);
    });
    if (!Array.isArray(conditions)) return
    for (let item of conditions) {
      this.loadCondition(item)
    }
  }
  loadCondition(condition) {
    const name = `condition-${condition.roadNum}-${condition.laneNum}-${condition.start}-${condition.end}`;
    const plane = BABYLON.MeshBuilder.CreatePlane(
      name,
      {
        width: (condition.end - condition.start) * this.option.length,
        height: this.option.width, // 根据屏幕宽高比例调整（如 16:9）
        //sideOrientation: BABYLON.Mesh.DOUBLESIDE
      },
    )
    plane.rotation.x = Math.PI * 0.5
    const position = this.getPosition({ roadNum: condition.roadNum, laneType: condition.laneType, laneNum: condition.laneNum, currentLane: condition.currentLane, currentPosition: condition.start }, true)
    plane.position.x = position.x + (condition.end - condition.start) * this.option.length / 2
    plane.position.y = 0.1
    plane.position.z = position.z
    const materials = new BABYLON.StandardMaterial(
      `material-${name}`,
      this.scene
    )
    materials.emissiveColor = BABYLON.Color3.FromHexString(condition.color)
    materials.alpha = 0.5
    plane.material = materials
    materials.disableLighting = true
    plane.renderingGroupId = 1
    this.roadConditionMeshs.push(plane)
  }
  /**
   * 加载道路
   * @param length 道路总长度
   * @param step 每段道路的长度,默认为1
   * @param lanes 车道数量数组(未使用)
   */

  /**
   * 核心方法：加载并生成道路模型
   * 根据配置的车道信息，动态生成路面、标线、路沿等 3D 网格。
   * 
   * @param {Array} _lanes - 车道配置数组，包含每条道路的长度、车道数等信息
   * @param {Object} roadOption - 道路生成的可选项（如是否重置相机、显示桩号等）
   */
  async loadRoads(_lanes, roadOption = {
    isResetCamera: false, // 生成后是否重置相机位置
    setCameraType: true,  // 是否应用相机的 2D/3D 模式
    showStack: true,      // 是否显示桩号（公里数标记）
    startStack: 0,        // 起始桩号
    endStack: 0           // 结束桩号
  }) {
    // 1. 数据预处理：将长度单位从米转换为 Babylon 内部单位（假设除以 1000）
    const lanes = _lanes.map(item => {
      return {
        ...item,
        length: item.length / 1000 ?? 0
      }
    })
    this.lanes = lanes;

    // 2. 创建基础地面（Ground）
    // 这是一个非常大的平面，用于承载整个场景，或者是网格背景
    // 【关于单位】：
    // Babylon.js 本身是无单位的（抽象单位 Babylon Units）。
    // 但业界标准和 Babylon 的默认物理引擎、WebXR 等，均约定俗成：1个单位 = 1米 (Meter)。
    // 这里的 width: 1000, height: 1000，通常可以理解为 1000米 x 1000米 的面积。
    // （注：项目代码中可能会有整体的缩放比例，例如车辆的宽度为 4.8/4，意味着对真实尺寸做了缩小调整）
    const ground = BABYLON.MeshBuilder.CreateGround('ground', {
      width: 1000,
      height: 1000,
      updatable: true
    })

    // 3. 清理旧资源
    // 在重新生成道路前，必须销毁之前创建的所有网格，防止内存泄漏和重影
    for (let item of [...this.meshs, ...this.jtMeshs, ...this.nameMeshs, ...this.gridMeshs, ...this.outerMeshs, ...this.roadConditionMeshs]) {
      this.disposeByMesh(item);
    }
    // 重置存储数组
    this.meshs = [];
    this.jtMeshs = [];
    this.nameMeshs = [];
    this.gridMeshs = [];

    // 4. 计算场景最大长度，用于设置网格和相机范围
    this.maxLength = Math.max(...lanes.map(item => item.length ?? 0))
    const _maxLength = Math.max(..._lanes.map(item => item.length ?? 0))

    // 5. 设置地面材质（网格模式 vs 透明模式）
    if (this.option.showGrid) {
      // 如果开启网格显示，使用 GridMaterial
      const grid = new GridMaterial("grid", this.scene);
      grid.mainColor = new BABYLON.Color4(0.8, 0.8, 0.8, 0) // 主网格线颜色
      grid.lineColor = new BABYLON.Color4(0.03, 0.03, 0.03, 0) // 次网格线颜色
      grid.gridRatio = 0.5 // 网格密度
      ground.material = grid
      
      // 根据道路总长度动态生成网格上的数字标记（标尺）
      if (_maxLength <= 100) {
        for (let i = -50; i < 50; i++) {
          this.createGridNum(`${i * 10}`, new BABYLON.Vector3(i * this.option.length / 100 + 0.5, 0, -10 + 0.5), 0)
        }
      }
      else if (_maxLength <= 200) {
        for (let i = -50; i < 50; i++) {
          this.createGridNum(`${i * 20}`, new BABYLON.Vector3(i * this.option.length / 50 + 0.5, 0, -10 + 0.5), 0)
        }
      }
      else {
        for (let i = -50; i < 50; i++) {
          this.createGridNum(`${i * 100}`, new BABYLON.Vector3(i * this.option.length / 10 + 0.5, 0, -10 + 0.5), 0)
        }
      }
    } else {
      // 如果不显示网格，使用全透明材质隐藏地面
      const groundMaterial = new BABYLON.StandardMaterial("groundMat", this.scene);
      groundMaterial.alpha = 0
      ground.material = groundMaterial
    }
    ground.isPickable = true // 地面可被拾取（用于点击空白处取消选中）
    ground.position = new BABYLON.Vector3(0, -0.01, 0); //稍微下沉，避免与路面 Z-fighting

    const step = 1
    // 从配置中获取路段的标准宽度和间隙
    const width = this.option.length;
    const gap = this.option.gap;

    // 6. 道路分段计算
    // 将长条道路切分为多个小段，以便贴图不拉伸，并实现弯曲效果（如果有）
    const MaxNums = this.segmentNumber(this.maxLength, step);

    // 7. 预创建和缓存材质
    // 这是一个关键的性能优化：避免为每个路段创建新材质，而是复用已有的
    this.roadMaterials.clear()
    let __lanes = [...new Set(lanes.map((item) => item.num))]; // 获取所有独特的车道数
    const ns = this.lanes.map((item) => this.segmentNumber(item.length, step)).flat();
    const _nums = [...new Set(ns)]; // 获取所有分段数情况
    
    for (let item of __lanes) {
      for (let num of _nums) {
        // 创建正常方向的路面材质
        this.roadMaterials.set(
          `road-${item}-${num}`,
          this.createMaterialsByPath(rs[`road${item}`], this.option.length / 50 * 4 * (num / step), 1)
        );
        // 创建旋转方向的路面材质（用于特殊接口或弯道）
        this.roadMaterials.set(
          `road-${item}-${num}-r`,
          this.createMaterialsByPath(rs[`road${item}_r`], this.option.length / 50 * 4 * (num / step), 1)
        );
      }
    }

    // 8. 计算每条道路的 Z 轴位置
    // generateRoads 算法会根据车道宽度和间隙，计算出多条平行道路的中心线坐标
    const ws = lanes.map((item) => item.num * this.option.width);
    const ys = generateRoads(ws, gap);
    this.roads = ys; // 保存 Z 轴坐标供后续使用

    // 路沿材质
    const lymaterial = this.createMaterialsByPath(lyImg, 1, 1);

    /**
     * 内部辅助函数：创建单个路段网格及其路沿
     * 该函数负责创建道路的几何体（平面），包括路面本身和两侧的路沿。
     * 
     * @param {string} name - 网格的唯一名称
     * @param {Object} lane - 车道配置信息对象，包含车道数量等属性
     * @param {number} index - 道路在 Z 轴方向的索引（第几条路）
     * @param {number} x - 局部 X 轴位置偏移量（相对于父节点或世界坐标）
     * @param {number} width - 路段的长度（对应 3D 空间中的 X 轴长度，Plane 的 width）
     * @param {BABYLON.Node} parent - 父节点（通常是 segment 对应的虚拟节点），用于统一管理位置
     * @param {Array} materials - 材质数组 [路面材质, 路沿材质1(右), 路沿材质2(左)]
     * @returns {Array} - 返回包含 [路面网格, 路沿1, 路沿2] 的数组
     */
    const createRoad = (name, lane, index, x, width, parent, materials) => {
      // console.log(materials, 'materials')
      // 检查是否存在同名网格，如果存在则销毁（防止重复创建堆叠）
      let mesh = this.scene.getMeshByName(name)
      if (mesh) {
        mesh.dispose()
      }
      
      // 1. 创建路面平面
      // 注意：BabylonJS 中 CreatePlane 的 width 对应 X 轴，height 对应 Y 轴（创建时默认竖立）
      // 后续旋转后，width 对应场景 X 轴（道路长度），height 对应场景 Z 轴（道路总宽）
      mesh = BABYLON.MeshBuilder.CreatePlane(
        name,
        {
          width: width, // 路段长度
          height: lane.num * this.option.width, // 路段总宽度 = 车道数 * 单车道宽
        },
        this.scene
      );
      
      // 旋转平面使其水平放置 (绕 X 轴旋转 90 度)
      mesh.rotation.x = Math.PI / 2;
      // 设置 Z 轴位置 (由 generateRoads 计算出的中心线位置)
      mesh.position.z = ys[index];
      // 应用路面材质
      mesh.material = materials[0]
      // mesh.showBoundingBox = true
      
      // 2. 创建右侧路沿 (Curb)
      const ly = BABYLON.MeshBuilder.CreatePlane(
        `ly-r-${index}-${name}`,
        {
          width: width, // 路沿长度与路段长度一致
          height: this.option.edgeHeight, // 路沿高度（视觉上的宽度/高度）
        },
        this.scene
      );
      ly.rotation.x = Math.PI * 0.5;
      // 计算右侧路沿位置：中心线位置 - 半路宽 - 半路沿宽
      ly.position.z = ys[index] - ws[index] / 2 - this.option.edgeHeight / 2;
      ly.material = materials[1]; // 应用路沿材质

      // 3. 创建左侧路沿
      const ly2 = BABYLON.MeshBuilder.CreatePlane(
        `ly-l-${index}-${name}`,
        {
          width: width,
          height: this.option.edgeHeight,
        },
        this.scene
      );
      ly2.rotation.x = Math.PI * 0.5;
      // 计算左侧路沿位置：中心线位置 + 半路宽 + 半路沿宽
      ly2.position.z = ys[index] + ws[index] / 2 + this.option.edgeHeight / 2;
      ly2.position.y = 0; // 确保贴地
      ly2.material = materials[2]; // 应用路沿材质
      
      // 4. 应用位置偏移
      if (x) {
        mesh.position.x = x
        ly2.position.x = x
        ly.position.x = x
      }
      
      // 5. 设置父节点关联 (用于层级管理和整体移动)
      if (parent) {
        mesh.parent = parent
        ly.parent = parent
        ly2.parent = parent
      }
      return [mesh, ly, ly2]
    }
    
    this.carlight.excludedMeshes = []
    
    // 9. 循环创建道路段 (Road Segments)
    // 为了避免纹理拉伸过长，道路被切分为多个较短的段 (segment)
    for (let i = 0; i < MaxNums.length; i++) {
      // 为每一段创建一个虚拟节点 (TransformNode) 作为容器
      // 这样移动 virtualNode 就可以移动该段内的所有车道和路沿
      const virtualNode = new BABYLON.TransformNode(`road-${i}`, this.scene);
      // virtualNode.showBoundingBox = true;
      
      // 遍历每一条道路 (比如双向车道就是 2 条路)
      for (let num in lanes) {
        // 计算当前段的纹理重复次数/长度比例
        const nums = this.segmentNumber(lanes[num].length, step);
        
        // 创建路名和箭头标识
        this.createRoadNameAndJt(lanes[num], width * nums[i] * 0.5 + width * (i), ys[num])
        // this.createRoadNameAndJt(lanes[num], width * nums[i] * 0.75 + width * (i), ys[num])
        
        // 调用 createRoad 创建实体网格
        createRoad(
          `road-lane-${i}-${num}`, // 网格名称
          lanes[num], // 车道配置
          num, // 道路索引
          // 如果是最后一段且长度不足 step，需要进行位置修正，使其左对齐或正确拼接
          nums[i] < step ? -  ((width * (MaxNums[i] - nums[i])) / 2) : null, 
          width * nums[i], // 当前段的实际长度
          virtualNode, // 父节点
          [
            // 动态选择材质：根据车道类型选择对应的预缓存材质
            lanes[num].type === 1 
              ? this.roadMaterials.get(`road-${lanes[num].num}-${nums[i]}`) 
              : this.roadMaterials.get(`road-${lanes[num].num}-${nums[i]}-r`),
            // 路沿材质：如果是完整段(step)使用通用材质，否则使用按比例生成的材质
            nums[i] === step
              ? lymaterial
              : this.createMaterialsByPath(lyImg, (nums[i] / step), 1),
            nums[i] === step
              ? lymaterial
              : this.createMaterialsByPath(lyImg, (nums[i] / step), 1)
          ]
        )
      }
      
      // 设置虚拟节点在世界坐标系中的 X 轴位置
      if (MaxNums[i] < step) {
        // 最后一段（可能较短）的位置计算
        virtualNode.position.x = width * i + (width * MaxNums[i]) / 2;
      } else {
        // 标准段的位置计算
        virtualNode.position.x = width * (i + 1) - 0.5 * width;
      }
      
      // 将虚拟节点添加到全局网格数组管理
      this.meshs.push(virtualNode);
    }
    if (roadOption.isResetCamera) {
      this.resetCamera();
    }
    if (roadOption.setCameraType) {
      this.setCameraType(this.option.cameraType);
    }
    if (roadOption.showStack) {
      if (_maxLength <= 100) {
        for (let i = 0; i < 50; i++) {
          const num = roadOption.startStack + i * 10;
          if (num >= 0) {
            this.createGridNum('Z' + (num), new BABYLON.Vector3(i * this.option.length / 100, 0, ys.at(0) + ws.at(0) / 2 + this.option.edgeHeight / 2 + 0.5), 0, '32px', 'white', 'center')
            this.createGridNum(getStack(num), new BABYLON.Vector3(i * this.option.length / 100, 0, ys.at(-1) - ws.at(-1) / 2 - this.option.edgeHeight / 2 - 0.5), 0, '32px', 'white', 'center')
            if (typeof roadOption.endStack === 'number' && roadOption.endStack > roadOption.startStack && num > roadOption.endStack) {
              break
            }
          }
        }
      }
      else if (_maxLength <= 200) {
        for (let i = 0; i < 50; i++) {
          const num = roadOption.startStack + i * 20;
          if (num >= 0) {
            this.createGridNum('Z' + getStack(num), new BABYLON.Vector3(i * this.option.length / 50, 0, ys.at(0) + ws.at(0) / 2 + this.option.edgeHeight / 2 - 0.5), 0, '32px', 'white', 'center')
            this.createGridNum(getStack(num), new BABYLON.Vector3(i * this.option.length / 50, 0, ys.at(-1) - ws.at(-1) / 2 - this.option.edgeHeight / 2 - 0.5), 0, '32px', 'white', 'center')
            if (typeof roadOption.endStack === 'number' && roadOption.endStack > roadOption.startStack && num > roadOption.endStack) {
              break
            }
          }
        }
      } else {
        for (let i = 0; i < 50; i++) {
          const num = roadOption.startStack + i * 100;
          if (num >= 0) {
            this.createGridNum('Z' + getStack(num), new BABYLON.Vector3(i * this.option.length / 10, 0, ys.at(0) + ws.at(0) / 2 + this.option.edgeHeight / 2 + 0.5), 0, '32px', 'white', 'center')
            this.createGridNum(getStack(num), new BABYLON.Vector3(i * this.option.length / 10, 0, ys.at(-1) - ws.at(-1) / 2 - this.option.edgeHeight / 2 - 0.5), 0, '32px', 'white', 'center')
            if (typeof roadOption.endStack === 'number' && roadOption.endStack > roadOption.startStack && num > roadOption.endStack) {
              break
            }
          }
        }
      }
    }
  }
  /**
   * 重置相机的位置和角度
   * @param {BABYLON.Vector3} position - 相机观察的目标中心点（默认取第一个网格的位置）
   * @param {boolean} resetABR - 是否同时重置相机的 Alpha, Beta, Radius（旋转角和缩放距离）
   */
  resetCamera(position = this.meshs[0].position.clone(), resetABR = true) {
    const activeCamera = this.scene.activeCamera
    activeCamera.setTarget(position); // 重新聚焦目标点
    
    if (resetABR) {
      activeCamera.alpha = -Math.PI / 2; // 重置水平角度
      activeCamera.beta = Math.PI * 0.32; // 重置垂直角度 (3D斜视)
      // console.log(1 / this.maxLength, activeCamera.radius, "activeCamera.radius")
      this.resetRadius(); // 重新计算并应用相机距离
    }
  }

  /**
   * 计算相机到目标点的理想距离（半径 Radius）
   * 基于屏幕宽度、基础配置长度和场景总长度进行自适应计算，确保内容恰好完整显示在屏幕内
   * @param {number} v - 视口缩放系数 (默认为 1)
   * @returns {number} 计算得出的最佳相机距离
   */
  getRadius(v = 1) {
    const width = this.engine.getRenderWidth(); // 获取当前渲染画布的真实宽度
    // 计算公式解析：
    // 1. (1920 / width): 基准宽度 1920 像素与当前宽度的比例，用于屏幕自适应
    // 2. ((this.option.length / 50) * 35): 基于道路标准单元长度的基准半径调整
    // 3. 乘数选项：根据是否开启自动缩放 (autoScale) 及场景最大长度调整
    return ((1920 / width) * ((this.option.length / 50) * 35) * 1) * (((this.option.autoScale && this.maxLength < 1) ? this.maxLength / 1 : 1)) / v
  }

  /**
   * 重置相机的缩放距离（Radius）
   * 当窗口大小改变 (resize) 或初始化时调用，确保 3D 场景在不同屏幕尺寸下都能居中完整显示
   */
  resetRadius() {
    const activeCamera = this.scene.activeCamera
    if (!activeCamera) return
    // 将计算出的自适应距离应用到当前相机的 radius 属性上
    activeCamera.radius = this.getRadius(this.option.viewPort);
  }
  clearAll() {
    this.scene?.meshes?.forEach(mesh => {
      this.disposeByMesh(mesh)
    })
  }
  showFullScreen(show) {
    if (show) {
      if (this.maxLength < 1) {
        this.resetCamera(this.meshs[0].position.clone(), true);
      } else {
        const activeCamera = this.scene.activeCamera
        this.setCurrentBox(this.maxLength / 2, undefined, undefined, undefined, true)
        activeCamera.radius = this.getRadius((1 / (this.maxLength)) * this.option.viewPort);
      }
    } else {
      this.resetCamera(this.meshs[0].position.clone(), true);

    }
  }
  transformLenght(type, length) {
    // 1: 逻辑长度转物理长度m  2 m转逻辑
    if (type === 2) {
      return length / this.option.length * 1000
    }
    return length / 1000 * this.option.length
  }
  dispose() {
    this.scene.dispose();
    this.engine.dispose();
  }
}
export const genScale = (maxLength) => {
  let scale = (maxLength / 1000) * 20;
  if (scale <= 2) {
    scale = 2;
  } else if (scale <= 4) {
    scale = 4;
  } else if (scale <= 5) {
    scale = 5;
  } else if (scale <= 10) {
    scale = 10;
  } else {
    scale = 20;
  }
  return scale
  // console.log(form.scale, "scale");
};