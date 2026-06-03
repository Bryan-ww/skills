# Babylon App 类源码注释说明

本文档针对 `D:\XJT-Bryan\project\Bryan\skills\babylon\index.js` 生成，目标是帮助 Babylon.js 初学者理解这个文件在做什么、每个函数负责什么、关键参数怎么用，以及 Babylon.js 里常见属性的含义。

> 这份文件本质上封装了一个道路场景应用类：创建 Babylon 引擎和场景，生成道路/车道模型，加载设备点位、车辆、路况、HTML 弹窗，并提供相机切换、选中高亮、Gizmo 编辑等能力。

## 1. 整体结构

文件主要包含：

- Babylon.js 核心能力导入：`Engine`、`Scene`、`MeshBuilder`、`Vector3`、`StandardMaterial`、`Texture`、`Animation` 等。
- HTML Mesh 插件导入：用于把真实 DOM 元素放进 3D 场景。
- 项目图片资源导入：道路纹理、路沿纹理、箭头、路名背景等。
- 工具函数导入：道路排布、车道中心计算、坐标换算等。
- `App` 类：整个 3D 道路场景的应用封装。
- `genScale(maxLength)`：根据道路长度生成一个分档缩放值。

## 2. 你可以先记住的坐标系

这份代码默认把道路放在水平面上：

- `X` 轴：道路长度方向。车辆沿 `X` 轴运动。
- `Y` 轴：高度方向。点位、文字、HTML Mesh 的高度都放在 `Y` 上。
- `Z` 轴：道路横向方向。多条道路、多个车道沿 `Z` 轴排布。

Babylon 里 `CreatePlane` 创建出来的平面默认竖在 `XY` 平面上，所以代码里经常看到：

```js
mesh.rotation.x = Math.PI / 2;
```

这表示把平面绕 `X` 轴旋转 90 度，让它躺到地面上。躺平后：

- Plane 的 `width` 对应场景中的 `X` 方向。
- Plane 的 `height` 对应场景中的 `Z` 方向。

## 3. App 类字段注释

| 字段 | 作用 |
| --- | --- |
| `canvas` | 页面上的 `<canvas>` 元素，Babylon 会把 3D 画面画到这里。 |
| `engine` | `BABYLON.Engine` 实例，是 Babylon 的渲染引擎，负责 WebGL 初始化、帧循环、窗口尺寸更新等。 |
| `scene` | `BABYLON.Scene` 实例，所有相机、灯光、网格、材质、动画都挂在场景里。 |
| `meshs` | 道路分段的父节点数组。每段道路用 `TransformNode` 管理。 |
| `jtMeshs` | 箭头相关网格数组，当前文件里实际使用不多。 |
| `nameMeshs` | 路名相关网格数组，当前文件里实际使用不多。 |
| `carMeshs` | 当前生成在路上的车辆实例数组，用于统一清理。 |
| `gridMeshs` | 网格数字、桩号、路名等辅助文字平面数组。 |
| `materials` | 通用材质缓存。相同图片和缩放比例只创建一次材质，减少内存和 draw call 压力。 |
| `roadMaterials` | 道路专用材质缓存，按车道数、道路方向、分段长度缓存道路纹理材质。 |
| `option` | 场景配置项，控制道路宽度、是否编辑、相机模式、是否显示网格等。 |
| `length` | 当前道路总长度，当前文件里使用较少。 |
| `roads` | 每条道路中心线的 `Z` 坐标数组。点位和车辆定位会用到。 |
| `lanes` | 车道配置数组。每项通常包含道路长度、车道数、方向、名称等。 |
| `modalHtmls` | DOM 弹窗缓存。key 是设备编码，value 是挂在 canvas 父容器里的 HTML 元素数组。 |
| `modalMeshs` | 设备点位网格缓存。key 是设备编码，value 是对应 Mesh 或 TransformNode。 |
| `cars` | 车辆模型原型缓存。`carLoad()` 加载 glb 后放到这里，后续车辆通过 clone 生成。 |
| `gizmoManager` | Babylon 的 `GizmoManager`，用于编辑模式下移动或缩放点位。 |
| `highlightLayer` | Babylon 的 `HighlightLayer`，用于给选中的 Mesh 加绿色描边/发光。 |
| `selectedMesh` | 当前选中的点位 Mesh 数组。 |
| `outerMeshs` | 外部装饰网格数组，在 2D/3D 切换时可能被隐藏或显示。 |
| `roadConditionMeshs` | 路况覆盖层数组，用于显示某段车道的颜色状态。 |

## 4. option 配置项注释

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `editModel` | `false` | 是否编辑模式。非编辑模式下，一些点位会根据 `showIcon` 控制可见和可拾取。 |
| `viewPort` | `1` | 相机视口缩放系数，影响 `getRadius()` 计算出的相机距离。 |
| `length` | `50` | 逻辑长度到 Babylon 世界长度的基准。代码里常用 `逻辑 x * option.length` 转换为场景 `X` 坐标。 |
| `gap` | `1` | 多条道路之间的横向间隔，对应 `Z` 方向距离。 |
| `width` | `0.8` | 单车道宽度，对应 Babylon 世界单位。 |
| `edgeHeight` | `0.2` | 路沿宽度/高度的视觉尺寸，用于道路两侧路沿平面。 |
| `wallHeight` | `0.8` | 墙体高度，当前文件里基本未使用。 |
| `inoutLength` | `0` | 出入口长度，当前文件里基本未使用。 |
| `cameraType` | `"3d"` | 相机模式：`"2d"` 俯视，`"3d"` 斜视。 |
| `isLock` | `false` | 是否锁定相机旋转角度。 |
| `autoScale` | `true` | 是否根据道路长度自动调整相机距离。 |
| `showGrid` | `false` | 是否显示地面网格。 |
| `multiple` | `true` | 是否支持多选设备点位。 |
| `isMeshRenderer` | 无默认值 | 是否启用 HTML Mesh Renderer，把 DOM 作为 3D 对象渲染。 |
| `showStack` | 无默认值 | 是否显示桩号，和 `loadRoads()` 的 `roadOption.showStack` 相关。 |

注意：`setOption()` 里对数字项使用了 `if (option?.length)` 这种判断，因此传 `0` 不会生效；而布尔项使用 `typeof === 'boolean'`，可以正确传 `false`。

## 5. 构造函数 constructor(canvas, option)

主要作用：初始化 Babylon 引擎、场景、相机、灯光、交互事件和渲染循环。

参数：

- `canvas: HTMLCanvasElement`：渲染目标。Babylon 会使用这个 canvas 创建 WebGL 上下文。
- `option: Object`：初始化配置，会传给 `setOption()` 合并到默认配置中。

关键 Babylon 属性：

- `new BABYLON.Engine(canvas, true, options, true)`：创建渲染引擎。
- 第二个参数 `true`：开启抗锯齿。
- `disableWebGL2Support: false`：允许使用 WebGL2。
- `preserveDrawingBuffer: false`：不保留上一帧画面，性能更好；如果要截图有时会设为 `true`。
- `useHighPrecisionMatrix: true`：使用高精度矩阵，减少大场景或连续变换的精度误差。
- `adaptToDeviceRatio: true`：根据设备像素比调整渲染分辨率，让高 DPI 屏幕更清晰。
- `samples: 4`：MSAA 多重采样，减少边缘锯齿。
- `stencil: true`：开启模板缓冲，某些特效如高亮、裁剪可能会用到。
- `powerPreference: "high-performance"`：浏览器尽量选择高性能 GPU。

场景初始化：

- `new BABYLON.Scene(this.engine)`：创建场景。
- `scene.autoClear = false`：不自动清除上一帧。这个设置比较少见，一般默认是 `true`；如果使用透明背景或多层渲染，要注意是否会产生残影。
- `scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)`：透明背景。
- `scene.createDefaultCameraOrLight(true, true, true)`：创建默认相机和默认灯光，并将相机控件绑定到 canvas。
- `scene.activeCamera.minZ = 0.1`：相机近裁剪面，越小越能看到近处物体，但过小可能带来深度精度问题。
- `new BABYLON.HemisphericLight(...)`：半球光，模拟从天空方向来的环境光。
- `carlight.intensity = 5`：光照强度，这里偏亮。

最后：

- `createEvents()`：注册鼠标点击拾取事件。
- `render()`：启动渲染循环。
- `ResizeObserver`：监听 canvas 尺寸变化，调用 `engine.resize()` 和 `resetRadius()`。

## 6. render()

启动渲染循环。

```js
this.engine.runRenderLoop(() => {
  this.scene.render();
  this.setModalHtmlsPosition();
});
```

解释：

- `runRenderLoop` 会在浏览器每一帧回调。
- `scene.render()` 真正绘制 3D 场景。
- `setModalHtmlsPosition()` 每帧同步 HTML 弹窗位置，让 DOM 浮层跟着 3D 点位移动。

## 7. stopRender()

停止 Babylon 渲染循环。

适合：

- 页面隐藏。
- 组件卸载前。
- 暂停大量 GPU/CPU 消耗。

对应 Babylon API：

- `engine.stopRenderLoop()`：停止之前 `runRenderLoop()` 注册的循环。

## 8. setOption(option, setCameraType = true)

合并配置并更新相关运行状态。

参数：

- `option`：新配置对象。
- `setCameraType`：是否立刻调用 `setCameraType()` 切换相机模式。

主要逻辑：

1. 合并配置到 `this.option`。
2. 根据 `isMeshRenderer` 开关初始化或销毁 HTML Mesh Renderer。
3. 调用 `resetRadius()` 重新计算相机距离。
4. 根据 `cameraType` 切换 2D/3D。
5. 根据 `isLock` 锁定或解锁相机旋转。

初学者重点：这个函数不是单纯赋值，它还会改变相机、HTML 渲染层和相机锁定状态。

## 9. _htmlMeshRenderer(isRender)

管理 HTML Mesh Renderer。

用途：允许把真实 HTML 元素作为 3D 场景中的对象显示。比如视频、复杂 DOM 卡片、iframe 等。

参数：

- `isRender: boolean`：是否启用。

关键点：

- 如果已有 `htmlMeshRenderer`，先 `dispose()`，避免重复创建叠加层。
- `new HtmlMeshRenderer(this.scene, { parentContainerId })` 会在 canvas 外层容器里创建 CSS3D 渲染层。
- `parentContainerId: this.canvas.parentElement.id` 要求 canvas 父元素有 `id`，否则 HTML Mesh 可能无法正确挂载。

## 10. highlightById(device_code)

根据设备编码高亮对应点位。

参数：

- `device_code`：设备唯一编码。

逻辑：

1. 通过 `scene.getMeshById("point-mesh-${device_code}")` 找 Mesh。
2. 清空旧高亮。
3. `highlightLayer.addMesh(mesh, BABYLON.Color3.Green())` 添加绿色高亮。
4. `gizmoManager.attachToMesh(mesh)` 把编辑控件绑定到该 Mesh。
5. `window.postMessage({ type: 'selectChange', data })` 通知外部页面选中变化。

Babylon 概念：

- `HighlightLayer`：后处理高亮层，能让 Mesh 出现描边/发光效果。
- `Color3.Green()`：Babylon 内置绿色。
- `attachToMesh`：把 Gizmo 绑定到某个 Mesh。

## 11. clearHighlight()

清空所有高亮。

对应 API：

- `highlightLayer.removeAllMeshes()`。

## 12. clearAttach()

取消 Gizmo 绑定。

对应 API：

- `gizmoManager.attachToMesh(null)`。

## 13. createEvents()

注册场景点击事件，实现点位选择、多选、取消选择和高亮。

关键 Babylon API：

- `scene.onPointerObservable.add(...)`：监听 Babylon 场景中的指针事件。
- `BABYLON.PointerEventTypes.POINTERDOWN`：鼠标按下或触摸按下事件。
- `scene.pick(scene.pointerX, scene.pointerY)`：从屏幕坐标发出射线，判断点中了哪个 Mesh。
- `pickResult.hit`：是否命中。
- `pickResult.pickedMesh`：命中的 Mesh。

核心逻辑：

- 如果点中的是 `point-mesh-sub...` 子平面，则选它的 `parent`，因为双面点位的父 Mesh 才是业务对象。
- 如果 Mesh 没有 `metadata`，说明不是业务点位，清空选中。
- 如果 Mesh 已经在 `selectedMesh` 中，再点一次会取消选中。
- 如果 `option.multiple === true`，允许追加选中。
- 如果 `option.multiple === false`，只保留当前一个。
- 只有选中一个对象时才绑定 Gizmo。
- 通过 `window.postMessage` 把选中的业务数据发出去。

`metadata` 是 Babylon Mesh 上常用的自定义字段。代码把业务对象直接放在 `mesh.metadata` 中，后续选中、编辑、回传都依赖它。

## 14. createHighLight(mesh)

创建高亮层。

```js
this.highlightLayer = new BABYLON.HighlightLayer("hl1", this.scene);
```

参数 `mesh` 当前没有被使用。实际调用时只需要先创建 `HighlightLayer`，之后通过 `addMesh()` 和 `removeMesh()` 控制具体对象。

## 15. attachableMeshes()

把所有设备点位 Mesh 设置为 Gizmo 可绑定对象。

```js
this.gizmoManager.attachableMeshes = Array.from(this.modalMeshs, ([k, v]) => v);
```

解释：

- `modalMeshs` 是设备编码到 Mesh 的 Map。
- `attachableMeshes` 限制 Gizmo 只能附着到这些 Mesh 上。

## 16. loading(show)

显示或隐藏 Babylon 默认 loading UI。

- `engine.displayLoadingUI()`：显示。
- `engine.hideLoadingUI()`：隐藏。

## 17. genMesh(mesh)

把场景中的 Mesh 反向转换成业务数据。

用途：点位被 Gizmo 移动或缩放后，需要把新的位置、宽高、车道归属回传给业务系统。

主要返回字段：

- 原 `metadata`。
- `x`：场景 `position.x / option.length`，还原为逻辑长度比例。
- `y`：高度，小于 `0.1` 时强制为 `0.1`。
- `z`：如果是普通道路点位，会通过 `calculateD()` 转成相对车道/道路的 z；如果 `percentage === false`，则保留绝对 z。
- `width`：`mesh.scaling.x * metadata.width`。
- `height`：`mesh.scaling.y * metadata.height`。
- `road`：道路索引。

特殊点：

- `metadata.device_flag === 1` 被当作特殊设备，不走道路归属计算，`road` 固定为 `0`。

## 18. enableGizmo(type)

启用编辑控件。

参数：

- `type === 1`：启用位置 Gizmo，用于拖动点位。
- `type === 2`：启用缩放 Gizmo，用于改变点位大小。

关键 Babylon 属性：

- `new BABYLON.GizmoManager(this.scene)`：创建 Gizmo 管理器。
- `boundingBoxGizmoEnabled = false`：禁用包围盒编辑。
- `rotationGizmoEnabled = false`：禁用旋转编辑。
- `scaleGizmoEnabled = type === 2`：缩放控件。
- `positionGizmoEnabled = type === 1`：移动控件。
- `positionGizmo.updateGizmoRotationToMatchAttachedMesh = false`：移动轴不跟随 Mesh 自身旋转，保持世界坐标方向。
- `usePointerToAttachGizmos = false`：禁止点击任意 Mesh 自动绑定，改由代码控制绑定。
- `onDragEndObservable.add(emit)`：拖动结束后回传新业务数据。

拖动结束时：

1. 取 `attachedMesh`。
2. 调用 `genMesh()` 计算新的业务坐标。
3. 更新 `mesh.metadata`。
4. `window.postMessage({ type: 'pointChange', data })` 通知外部。

## 19. clearCars()

清理当前所有车辆实例。

逻辑：

- 遍历 `carMeshs`。
- 调用 `disposeByMesh()` 递归销毁车辆父节点和子节点。
- 清空数组。

## 20. setCarToRoads(pss)

批量把车辆放到道路上。

参数：

- `pss`：车辆配置数组。

逻辑：

1. 先 `clearCars()` 清空旧车辆。
2. 遍历调用 `setCarToRoad(ps)`。

## 21. setCarToRoad(ps)

创建车辆模型并按车道方向播放行驶动画。

常见参数字段：

- `device_code`：车辆唯一编码。
- `laneType`：车道方向，代码里 `1` 表示正向，其他表示反向。
- `laneNum`：该道路车道数。
- `currentLane`：当前车道索引。
- `length`：道路逻辑长度。
- `currentPosition`：当前逻辑位置。
- `roadNum`：道路索引。
- `speed`：速度。
- `move`：是否播放移动动画。

关键流程：

- 创建 `TransformNode` 作为车辆父节点。
- 从 `this.cars.get("car")` 里 clone 已加载的车辆模型。
- 使用 `getPosition(ps)` 计算初始位置。
- 根据车道方向设置 `mesh.rotation.y`。
- 如果 `ps.move` 为真，创建 `BABYLON.Animation.CreateAndStartAnimation()`，让车辆沿 `position.x` 移动。

动画关键参数：

- `"position.x"`：动画目标属性，只改变 X 轴位置。
- `24`：帧率。
- `frame`：总帧数，由剩余距离和速度计算。
- 起点：当前 `position.x`。
- 终点：正向为 `ps.length * option.length`，反向为 `0`。
- `ANIMATIONLOOPMODE_CONSTANT` 的数字值在代码里写成 `2`，表示播放到终点后保持。
- 完成回调里销毁车辆。

## 22. setMeshToRoads(pss) 与 setMeshToRoad(ps)

这组方法类似车辆上路，但生成的是普通平面 Mesh，例如热点图标。

`setMeshToRoad(ps)` 逻辑：

- 按 `cu-hot-point-${device_code}` 查找旧 Mesh，没有就创建 Plane。
- `mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL`：始终面向相机。
- 如果传入 `path`，用 `createMaterialsByPath(path)` 创建贴图材质。
- 使用 `getPosition(ps)` 定位。
- `mesh.renderingGroupId = 2`：放到较靠后的渲染组。
- 根据车道方向设置 `scaling.x` 为 `1` 或 `-1`，实现左右翻转。
- 如果 `move` 为真，也用 Babylon Animation 沿 X 轴移动。

## 23. setCurrentBox(current, width, height, alpha, radius, resetCamera)

显示当前定位框，常用于突出某个道路位置或区段。

参数：

- `current`：逻辑位置，最终会乘 `option.length` 得到 X 坐标。
- `width`：盒子宽度，默认 `option.length`。
- `height`：盒子高度，默认 `1`。
- `alpha`：透明度，默认 `0`。
- `radius`：当前参数没有实际使用。
- `resetCamera`：是否重置相机对准该位置。

关键 Babylon API：

- `BABYLON.MeshBuilder.CreateBox()`：创建长方体。
- `StandardMaterial.emissiveColor`：自发光颜色，不受灯光影响。
- `material.alpha`：透明度。
- `mesh.isPickable = false`：不参与鼠标拾取。

注意：函数内的 `let stop` 每次调用都会重新声明，因此它不能跨调用保存上一次定时器；如果需要防抖，应提升到类字段。

## 24. removeCurrentBox()

销毁当前定位框 `currentBox`。

## 25. getPosition(ps, ignoreDirection = false)

根据业务车辆/点位信息计算 Babylon 世界坐标。

参数：

- `ps`：包含道路、车道、当前位置等字段。
- `ignoreDirection`：是否忽略车道方向。为 `true` 时直接用 `currentPosition * option.length`。

计算方式：

- `x`：
  - 正向：`currentPosition * option.length`
  - 反向：`(length - currentPosition) * option.length`
- `z`：
  - 调用 `calculateLaneCenters(laneNum, option.width, this.roads[roadNum])`
  - 再取当前车道 `cs[currentLane]`
- `y`：固定 `0`

返回：

```js
new BABYLON.Vector3(x, 0, z)
```

## 26. showAxis(size)

在场景里显示 XYZ 坐标轴。

关键 API：

- `BABYLON.MeshBuilder.CreateLines()`：创建线段。
- `BABYLON.DynamicTexture()`：动态纹理，用 Canvas 绘制 X/Y/Z 文本。
- `BABYLON.MeshBuilder.CreatePlane()`：用平面承载文字纹理。

颜色：

- X：红色。
- Y：绿色。
- Z：蓝色。

## 27. setCameraType(type)

切换 2D/3D 相机视角。

参数：

- `"2d"`：俯视图。
- `"3d"`：斜视图。

核心 Babylon 相机属性：

- `activeCamera.alpha`：ArcRotateCamera 的水平旋转角。这里固定为 `-Math.PI / 2`。
- `activeCamera.beta`：垂直旋转角。`0` 接近正俯视，`Math.PI * 0.32` 是斜视。
- `BABYLON.Animation.CreateAndStartAnimation()`：平滑改变 `beta`，实现镜头过渡。

2D 模式：

- 动画把 `beta` 从 `Math.PI * 0.32` 变为 `0`。
- 隐藏 `outerMeshs` 中名字以 `arc-` 开头的外部装饰。

3D 模式：

- 动画把 `beta` 从 `0` 变为 `Math.PI * 0.32`。
- 显示 `arc-` 外部装饰。

## 28. createTexture(path, type = null)

根据资源路径创建纹理。

逻辑：

- 如果是 gif，创建项目自定义的 `AnimatedGifTexture`。
- 否则创建 `new BABYLON.Texture(path, this.scene)`。

Babylon 概念：

- `Texture` 是图片资源在 GPU 中的表示。
- 材质负责怎么把纹理显示到 Mesh 表面。

## 29. createMaterialsByPath(path, uScale = 1, vScale = 1)

创建常规图片贴图材质，并缓存。

参数：

- `path`：图片路径或 base64。
- `uScale`：纹理在 U 方向，也就是图片横向的重复次数。
- `vScale`：纹理在 V 方向，也就是图片纵向的重复次数。

关键属性：

- `new BABYLON.StandardMaterial()`：标准材质。
- `material.disableLighting = true`：不受光照影响，贴图保持原色。
- `material.specularColor = new BABYLON.Color3(0, 0, 0)`：关闭高光。
- `material.emissiveTexture = texture`：自发光贴图，适合图标、道路标线等。
- `material.diffuseTexture = texture`：漫反射贴图。
- `texture.generateMipMaps = true`：生成 mipmap，远处显示更稳定。
- `diffuseTexture.hasAlpha = true`：告诉 Babylon 图片有透明通道。
- `material.useAlphaFromDiffuseTexture = true`：使用图片 alpha 控制透明。
- `material.backFaceCulling = false`：关闭背面剔除，正反面都能看见。
- `material.disableDepthWrite = true`：透明对象不写入深度缓冲，减少透明排序闪烁，但也可能导致遮挡关系不严谨。
- `texture.wrapU / wrapV = WRAP_ADDRESSMODE`：允许纹理重复平铺。
- `material.freeze()`：冻结材质，提升性能；冻结后不要再修改这个材质属性。

缓存 key：

```js
material-${path}-${uScale}-${vScale}
```

## 30. createFUMaterialsByPath(path, path2, uScale = 1, vScale = 1)

创建普通贴图材质，当前逻辑和 `createMaterialsByPath()` 很像。

注意：

- 函数要求 `path` 和 `path2` 都存在，但实际只使用了 `path`。
- 缓存 key 也没有包含 `path2`。
- 如果未来想做双图材质，需要补充 `path2` 的实际用途。

## 31. createFBMaterialsByPath(path, path1, uScale = 1, vScale = 1)

创建正反面不同图片的自定义 Shader 材质。

参数：

- `path`：正面图片。
- `path1`：背面图片。
- `uScale`、`vScale`：当前代码里主要保留参数，Shader 内不一定使用。

关键逻辑：

- `fb_shaderMaterial(name, this.scene)`：项目自定义 shader 工厂。
- `material.setTexture("textureFront", this.createTexture(path))`：传入正面贴图。
- `material.setTexture("textureBack", this.createTexture(path1))`：传入背面贴图。
- `material.backFaceCulling = false`：必须关闭背面剔除，否则背面不会被渲染。

注意：缓存 key 没有包含 `path1`，如果同一个正面图搭配不同背面图，可能返回错误的旧材质。

## 32. lock(isLock, type = "3d")

锁定或解锁 ArcRotateCamera 的旋转。

参数：

- `isLock`：是否锁定。
- `type`：`"3d"` 或 `"2d"`。

关键相机属性：

- `lowerAlphaLimit` / `upperAlphaLimit`：限制水平旋转角范围。
- `lowerBetaLimit` / `upperBetaLimit`：限制垂直旋转角范围。

锁定 3D：

- `alpha` 固定为 `-Math.PI / 2`。
- `beta` 固定为 `Math.PI * 0.32`。

锁定 2D：

- `alpha` 固定为 `-Math.PI / 2`。
- `beta` 固定为 `0`。

解锁：

- 四个 limit 都设为 `null`，允许自由旋转。

## 33. HTML 弹窗相关函数

### addHtmlModalByCode(device_code, el, cb, removeCb)

给某个设备点位添加 DOM 弹窗。

参数：

- `device_code`：设备编码。
- `el`：DOM 元素。
- `cb`：每帧位置同步后执行的回调。
- `removeCb`：移除时回调。

逻辑：

- 存入 `modalHtmls`。
- 设置 canvas 父元素 `position: relative`。
- 把 DOM 元素 append 到 canvas 父元素上。

### setModalHtmlsPosition()

每帧把 3D 点位坐标转换为屏幕坐标，并更新 DOM 弹窗位置。

关键 API：

- `getDisplayPosition(mesh)`：把 3D 世界坐标投影到屏幕坐标。
- `engine.getRenderWidth()` / `getRenderHeight()`：获取渲染画布尺寸。
- `window.devicePixelRatio`：高 DPI 屏幕下将渲染像素换算为 CSS 像素。

### modalClear()

清除所有 DOM 弹窗。如果元素上有 `player`，会先调用 `player.destroy()`。

### modalClearByCode(code)

清除指定设备编码下的 DOM 弹窗。

### getModalHtmlsByCodeAndId(code, id)

按设备编码和 DOM id 获取弹窗对象。

### modalRemoveByCodeAndId(code, id)

移除指定弹窗。

注意：当前函数里回调使用了 `mesh`、`el` 变量，但函数内部没有定义这两个变量，可能会报错；建议后续检查。

## 34. loadHtmlMesh(point)

把 DOM 元素作为 3D 对象加载。

参数：

- `point`：设备点位配置，其中 `point.el` 是 HTMLElement。

关键 API：

- `new BABYLON.TransformNode(...)`：创建父节点，只负责位置、旋转、缩放，不直接渲染。
- `new ADDONS.HtmlMesh(...)`：创建 HTML Mesh。
- `htmlMeshDiv.setContent(point.el, point.width, point.height)`：设置 DOM 内容和尺寸。
- `material.backFaceCulling = false`：正反面可见。
- `material.alpha = 0`：HTML Mesh 自身材质透明，DOM 内容由 CSS3D 层显示。

不同相机模式：

- 3D 模式：`transformNode.rotation.y = Math.PI / 2`，并可能创建圆柱和小方块作为支撑装饰。
- 2D 模式：`transformNode.rotation.x = Math.PI / 2`，让 DOM 平放到地面方向。

## 35. loadVideoHtmlMesh(video) 与 loadVideoHtmlMeshs(videos)

加载视频 DOM 为 HTML Mesh。

特点：

- 父节点名固定为 `video-parent`。
- HtmlMesh 名固定为 `point-video`。
- `htmlMeshDiv.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL`：始终面向相机。

如果需要多个视频同时存在，固定名称可能导致冲突，建议后续改成带 id 的名称。

## 36. updatePlaneSize(mesh, newWidth, newHeight)

直接修改 Plane 顶点坐标，改变平面尺寸。

为什么不只改 `scaling`？

- `scaling` 是缩放系数，业务宽高可能想变成真实几何尺寸。
- 修改顶点后再把 `scaling` 重置为 `(1, 1, 1)`，可以避免缩放累积影响后续计算。

关键 API：

- `mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)`：获取顶点位置数组。
- `mesh.updateVerticesData(...)`：更新顶点位置。
- `mesh.refreshBoundingInfo()`：刷新包围盒，否则拾取/碰撞/视锥判断可能还是旧尺寸。

## 37. createPointEvent(mesh)

给点位添加鼠标悬停事件，改变鼠标指针。

关键 API：

- `mesh.actionManager = new BABYLON.ActionManager(this.scene)`。
- `ExecuteCodeAction(OnPointerOverTrigger, callback)`：鼠标移入。
- `ExecuteCodeAction(OnPointerOutTrigger, callback)`：鼠标移出。

注意：判断条件写成 `if (!mesh || !mesh instanceof BABYLON.Mesh)`，由于运算符优先级，最好改成 `if (!mesh || !(mesh instanceof BABYLON.Mesh))`。

## 38. loadPoint(point, clear = true)

加载或更新单个设备点位，是文件里非常核心的函数。

参数：

- `point`：点位配置。
- `clear`：是否先销毁旧 Mesh 再重建。

常见 point 字段：

- `device_code` / `temp_device_code`：设备编码。
- `el`：如果是 HTMLElement，就使用 HTML Mesh。
- `width` / `height`：点位平面尺寸。
- `background`：正面图片。
- `background_back`：背面图片。
- `billboardMode`：广告牌模式，控制是否始终面向相机。
- `device_flag`：特殊设备标记。`1` 会走特殊定位/旋转逻辑。
- `x` / `y` / `z`：业务坐标。
- `road`：道路索引。整数表示某条道路，`.5` 表示道路间隔区域。
- `percentage`：不是 `false` 时，`x` 和 `z` 按比例/逻辑单位转换；为 `false` 时按绝对 Babylon 坐标处理。
- `class_code`：设备类型，用于从 `config` 中合并额外位置配置。
- `showIcon`：非编辑模式下控制显示和可拾取。

创建逻辑：

1. 根据设备编码找已有 Mesh 或 TransformNode。
2. 如果已有且 `clear === true`，销毁旧 Mesh。
3. 如果 `point.el` 是 HTMLElement，调用 `loadHtmlMesh(point)`。
4. 否则创建 `BABYLON.MeshBuilder.CreatePlane()`。
5. 根据 `billboardMode` 和是否有背面图设置材质和旋转。
6. 计算 `position.x/y/z`。
7. 合并 `config[class_code][cameraType].position` 的位置修正。
8. 设置材质兜底、可见性、拾取、渲染组。
9. 存入 `modalMeshs`。
10. 注册悬停事件。

点位材质逻辑：

- `billboardMode === 0` 或 `device_flag === 1`：
  - 如果有 `background` 和 `background_back`，用 `createFBMaterialsByPath()` 创建正反面不同贴图。
  - 否则用 `createMaterialsByPath()` 创建普通贴图，并 `rotation.x = Math.PI / 2` 平放。
- `billboardMode === 7`：
  - 如果有正反面图，会创建两个子 Plane，父 Mesh 隐藏，子 Plane 分别显示前后图。
  - 如果没有背面图，直接给父 Mesh 设置普通材质。

定位逻辑：

- `position.x = point.x * option.length`，除非 `percentage === false`。
- `position.y = point.y`。
- `position.z` 按道路宽度、车道数、道路方向、道路间隔计算。

Babylon 相关属性：

- `mesh.billboardMode`：控制 Mesh 是否自动朝向相机。
- `mesh.isVisible = false`：父节点隐藏，子节点仍可显示。
- `mesh.visibility`：可见程度，`0` 到 `1`。
- `mesh.isPickable`：是否参与鼠标拾取。
- `mesh.renderingGroupId = 3`：渲染组靠后，尽量显示在路面上方。
- `mesh.metadata = point`：绑定业务数据。

## 39. loadPoints(points, clear = true)

批量加载点位。

逻辑：

- 如果 `clear` 为真，先找出旧点位中不在新数组里的设备，销毁 Mesh 和关联 DOM。
- 遍历新数组调用 `loadPoint(item, clear)`。

注意：`this.modalMeshs.keys()` 返回的是迭代器，原生迭代器没有 `filter()` 方法。当前代码写法 `this.modalMeshs.keys().filter(...)` 在标准 JS 中会报错。建议改成 `Array.from(this.modalMeshs.keys()).filter(...)`。

## 40. screenToGround(screenX, screenY, isTransform = false)

把屏幕点击坐标转换成地面业务坐标。

参数：

- `screenX` / `screenY`：屏幕坐标。
- `isTransform`：是否转换成道路相对坐标。

关键 API：

- `scene.pick(screenX, screenY)`：从屏幕坐标向场景发射射线。
- `pickResult.pickedPoint`：射线击中的世界坐标。

返回：

- 普通模式：`x = pickedPoint.x / option.length`，`z = pickedPoint.z`。
- 转换模式：通过 `calculateD()` 把世界 `z` 转成道路索引和相对 `z`。

## 41. getDisplayPosition(mesh)

把 Mesh 的 3D 世界坐标投影成屏幕坐标。

关键 API：

- `mesh.getWorldMatrix()`：获取 Mesh 世界矩阵。
- `BABYLON.Vector3.TransformCoordinates(Vector3.Zero(), worldMatrix)`：把局部原点转换到世界坐标。
- `BABYLON.Vector3.Project(...)`：把世界坐标投影到屏幕视口。
- `activeCamera.viewport.toGlobal(renderWidth, renderHeight)`：把相机视口转换成真实像素范围。

用途：DOM 弹窗定位。

## 42. carLoad()

加载车辆 glb 模型，并作为原型缓存。

关键 API：

- `BABYLON.ImportMeshAsync('/model/car.glb', this.scene, { pluginExtension: ".glb" })`：异步加载 glb 模型。
- `TransformNode("carBox")`：作为车辆模型容器。
- `box.setEnabled(false)`：原型默认隐藏，clone 后显示使用。
- `box.addChild(node)`：把 glb 加载出的 Mesh 节点挂到容器下。
- `box.scaling = new BABYLON.Vector3(0.005, 0.005, 0.005)`：整体缩小模型。
- `box.rotationQuaternion = null`：禁用四元数旋转，改用欧拉角 `rotation`。
- `box.rotation.y = Math.PI * 0.5`：调整车头方向。

## 43. segmentNumber(number, segmentLength)

把一个长度切成多个固定长度段。

示例：

```js
segmentNumber(2.4, 1) // [1, 1, 0.4]
```

用途：道路很长时切成多个 segment，避免纹理被过度拉伸，也方便按段平铺道路贴图。

## 44. createRoadNameAndJt(lane, x, z)

为某条道路的每个车道创建路名和方向箭头。

参数：

- `lane`：道路配置，包含 `num`、`name`、`type`。
- `x`：放置位置的 X 坐标。
- `z`：道路中心线 Z 坐标。

逻辑：

- 按车道数量循环。
- 每个车道调用 `createRoadName()`。
- 根据 `lane.type` 决定箭头方向。

## 45. createRoadName(...)

用 `DynamicTexture` 绘制路名和箭头，再贴到 Plane 上。

参数：

- `name`：Mesh/Texture 名称。
- `laneName`：显示的路名。
- `position`：放置位置。
- `billboardMode`：是否面向相机，默认不传时可由参数控制。
- `step`：方向，正数和负数选择不同箭头图。
- `font`：字体配置。

关键流程：

1. 根据文字长度计算纹理尺寸。
2. 创建 `StandardMaterial`。
3. 创建 `DynamicTexture`。
4. 加载箭头图片。
5. 在 `texture.getContext()` 上用 Canvas API 绘制图片和文字。
6. 调用 `texture.update()` 上传到 GPU。
7. 创建 Plane 承载纹理。
8. 平面 `rotation.x = Math.PI * 0.5` 放到地面。
9. 材质使用 `emissiveTexture` 和 `disableLighting` 保持清晰。

## 46. disposeByMesh(mesh)

递归销毁 Mesh/Node 及其子节点。

逻辑：

- `mesh.getChildren()` 获取子节点。
- 递归销毁子节点。
- 调用 `mesh.dispose()` 销毁自身。

销毁很重要，因为 Babylon 的 Mesh、材质、纹理通常会占 GPU 资源。

## 47. removePoints(device_codes)

按设备编码批量移除点位。

逻辑：

- 找 `point-mesh-${device_code}`。
- 从 `modalMeshs` 删除。
- 递归销毁 Mesh。
- 清空高亮和 Gizmo。
- 清空 `selectedMesh`。
- 通过 `window.postMessage` 通知外部选中为空。

## 48. createGridNum(...)

创建网格数字或桩号文字。

参数：

- `name`：显示文本。
- `position`：放置位置。
- `billboardMode`：广告牌模式。
- `fontSize`：字体大小。
- `color`：颜色。
- `textAlign`：对齐方式。

实现方式：

- 用 `DynamicTexture` 创建一张透明纹理。
- 在纹理 Canvas 上绘制文字。
- 创建 Plane 承载文字。
- `rotation.x = Math.PI * 0.5` 平放到地面。
- 存入 `gridMeshs` 方便后续清理。

## 49. loadConditions(conditions)

批量加载路况。

逻辑：

- 先销毁旧的 `roadConditionMeshs`。
- 如果参数不是数组，直接返回。
- 遍历调用 `loadCondition(item)`。

## 50. loadCondition(condition)

在某段车道上创建半透明颜色覆盖层，表示路况。

常见 condition 字段：

- `roadNum`：道路索引。
- `laneNum`：车道数。
- `laneType`：车道方向。
- `currentLane`：当前车道。
- `start` / `end`：覆盖区间。
- `color`：颜色，如 `#ff0000`。

关键属性：

- `CreatePlane({ width, height })`：宽度是区间长度，height 是单车道宽度。
- `plane.rotation.x = Math.PI * 0.5`：平放。
- `plane.position.y = 0.1`：比路面高一点，避免和路面重叠闪烁。
- `materials.emissiveColor = Color3.FromHexString(condition.color)`：自发光颜色。
- `materials.alpha = 0.5`：半透明。
- `renderingGroupId = 1`：渲染在默认组之后。

## 51. loadRoads(_lanes, roadOption)

核心方法：根据车道配置生成整套路网。

`_lanes` 常见字段：

- `length`：道路长度，代码里会 `/ 1000` 转成内部逻辑长度。
- `num`：车道数量，例如 2、3、4、5。
- `type`：道路方向，`1` 和其他值会选择不同方向的道路纹理。
- `name`：路名。

`roadOption`：

- `isResetCamera`：生成后是否重置相机。
- `setCameraType`：生成后是否应用当前 2D/3D 相机模式。
- `showStack`：是否显示桩号。
- `startStack`：起始桩号。
- `endStack`：结束桩号。

主要流程：

1. 把 `_lanes.length` 从米转换成内部长度：`item.length / 1000`。
2. 创建一个大地面 `ground`，用于拾取和网格背景。
3. 清理旧道路、旧文字、旧路况、旧外部 Mesh。
4. 计算最长道路 `maxLength`。
5. 根据 `showGrid` 决定地面材质：
   - 显示网格：使用 `GridMaterial`。
   - 不显示网格：使用透明 `StandardMaterial`。
6. 把最长道路按 `step = 1` 切段。
7. 预创建道路纹理材质，按车道数和分段长度缓存。
8. 使用 `generateRoads()` 计算每条道路中心线的 Z 坐标。
9. 定义内部函数 `createRoad()` 创建单个道路分段和两侧路沿。
10. 循环每个分段和每条道路，创建道路 Plane、路沿 Plane、路名箭头。
11. 根据 `roadOption` 重置相机、切换视角、显示桩号。

### loadRoads 中的 ground

```js
BABYLON.MeshBuilder.CreateGround('ground', {
  width: 1000,
  height: 1000,
  updatable: true
})
```

`CreateGround` 创建的是水平地面，不需要再旋转。它常用于：

- 鼠标拾取空白地面。
- 显示网格背景。
- 给 `screenToGround()` 提供点击目标。

`ground.position = new Vector3(0, -0.01, 0)` 让地面稍微下沉，避免和路面共面导致 Z-fighting。

### loadRoads 中的 GridMaterial

`GridMaterial` 来自 `@babylonjs/materials`，专门显示网格。

关键属性：

- `mainColor`：主色。
- `lineColor`：网格线颜色。
- `gridRatio`：网格间隔密度。

### loadRoads 中的材质预缓存

道路段很多，如果每个 Plane 都创建新材质，性能会差。代码用：

```js
this.roadMaterials.set(`road-${item}-${num}`, material)
```

按车道数和分段长度复用材质。

道路纹理的 `uScale` 使用：

```js
this.option.length / 50 * 4 * (num / step)
```

意思是根据道路长度比例调整横向重复次数，让道路标线不会被拉得太长。

### loadRoads 中的 createRoad()

内部函数 `createRoad(name, lane, index, x, width, parent, materials)` 负责创建：

- 路面 Plane。
- 右侧路沿 Plane。
- 左侧路沿 Plane。

路面：

- `width`：当前道路段长度。
- `height = lane.num * option.width`：道路总宽度。
- `rotation.x = Math.PI / 2`：平放。
- `position.z = ys[index]`：放到对应道路中心线。
- `material = materials[0]`：道路贴图。

路沿：

- 宽度同道路段。
- 高度为 `option.edgeHeight`。
- Z 位置分别是道路总宽度的两侧再加半个路沿宽度。
- 使用 `lyImg` 路沿贴图。

父节点：

- 每个分段有一个 `TransformNode("road-${i}")`。
- 道路和路沿都挂到这个父节点下。
- 移动父节点即可移动整个分段。

### 桩号显示

根据原始最大长度 `_maxLength` 分三档：

- `<= 100`：每 10 一个。
- `<= 200`：每 20 一个。
- 其他：每 100 一个。

文字通过 `createGridNum()` 生成。

## 52. resetCamera(position, resetABR = true)

重置相机目标点和角度。

参数：

- `position`：相机观察目标，默认取第一段道路的位置。
- `resetABR`：是否重置 `alpha`、`beta`、`radius`。

关键 API：

- `activeCamera.setTarget(position)`：设置相机看向的目标点。
- `activeCamera.alpha = -Math.PI / 2`：水平角。
- `activeCamera.beta = Math.PI * 0.32`：斜视角。
- `resetRadius()`：重新计算相机距离。

## 53. getRadius(v = 1)

计算相机距离。

ArcRotateCamera 的 `radius` 表示相机到目标点的距离。距离越大，看得越远；距离越小，画面越近。

公式大意：

- 当前画布越窄，半径越大，避免内容被裁掉。
- `option.length` 越大，半径越大。
- `autoScale` 开启且 `maxLength < 1` 时，会按道路长度缩小半径。
- 最后除以 `viewPort` 系数。

## 54. resetRadius()

把 `getRadius(option.viewPort)` 计算结果应用到当前相机：

```js
activeCamera.radius = this.getRadius(this.option.viewPort);
```

通常在：

- 初始化配置后。
- resize 后。
- 重置相机时。

## 55. clearAll()

销毁场景中的所有 Mesh。

注意：遍历 `scene.meshes` 同时销毁 Mesh 可能会改变数组内容。复杂场景里更稳妥的写法是先复制数组：

```js
[...this.scene.meshes].forEach(mesh => this.disposeByMesh(mesh));
```

## 56. showFullScreen(show)

切换“全景/完整道路”视图。

逻辑：

- `show === true`：
  - 如果 `maxLength < 1`，直接重置相机。
  - 否则用 `setCurrentBox(maxLength / 2, ...)` 标记中间位置，并把相机半径调大，让完整道路进入视野。
- `show === false`：恢复默认相机。

## 57. transformLenght(type, length)

逻辑长度和物理长度互转。函数名里 `Lenght` 应该是拼写错误，建议改成 `transformLength`。

参数：

- `type === 2`：Babylon 世界长度转米。
- 其他：米转 Babylon 世界长度。

公式：

- 米转世界长度：`length / 1000 * option.length`
- 世界长度转米：`length / option.length * 1000`

## 58. dispose()

销毁整个应用。

```js
this.scene.dispose();
this.engine.dispose();
```

场景销毁会释放场景中的 Mesh、材质、纹理、相机、灯光等；引擎销毁会释放 WebGL 上下文相关资源。

## 59. genScale(maxLength)

根据最大长度生成一个分档 scale。

逻辑：

- 先算 `(maxLength / 1000) * 20`。
- 再按范围吸附到 `2、4、5、10、20`。

用途可能是给 UI 或坐标比例尺用。

## 60. Babylon.js 关键概念速查

### Engine

`BABYLON.Engine` 是渲染引擎，负责：

- 创建 WebGL 上下文。
- 管理渲染循环。
- 响应 canvas 尺寸变化。
- 调用场景渲染。

本文件常用：

- `runRenderLoop()`
- `stopRenderLoop()`
- `resize()`
- `getRenderWidth()`
- `getRenderHeight()`
- `displayLoadingUI()`
- `hideLoadingUI()`
- `dispose()`

### Scene

`BABYLON.Scene` 是容器，所有 3D 对象都属于某个 Scene。

本文件常用：

- `scene.render()`
- `scene.pick(x, y)`
- `scene.getMeshById(id)`
- `scene.getMeshByName(name)`
- `scene.getTransformNodeByName(name)`
- `scene.onPointerObservable`
- `scene.activeCamera`
- `scene.dispose()`

### ArcRotateCamera

`createDefaultCameraOrLight(true, true, true)` 通常会创建 ArcRotateCamera。它围绕一个目标点旋转。

核心属性：

- `alpha`：水平旋转角。
- `beta`：垂直旋转角。
- `radius`：离目标点的距离。
- `target`：观察目标点。
- `lowerAlphaLimit` / `upperAlphaLimit`：水平旋转限制。
- `lowerBetaLimit` / `upperBetaLimit`：垂直旋转限制。
- `minZ`：近裁剪面。

本文件里：

- 2D 俯视：`beta = 0`。
- 3D 斜视：`beta = Math.PI * 0.32`。
- 水平视角固定：`alpha = -Math.PI / 2`。

### Mesh

`Mesh` 是真实可渲染几何体，比如平面、盒子、圆柱、模型。

常用属性：

- `position: Vector3`：位置。
- `rotation: Vector3`：欧拉角旋转。
- `rotationQuaternion`：四元数旋转；如果想用 `rotation`，有时要设为 `null`。
- `scaling: Vector3`：缩放。
- `material`：材质。
- `parent`：父节点。
- `metadata`：自定义业务数据。
- `isPickable`：是否能被鼠标射线拾取。
- `isVisible`：是否渲染。
- `visibility`：可见透明程度。
- `renderingGroupId`：渲染组。
- `billboardMode`：广告牌模式。

### TransformNode

`TransformNode` 只有位置、旋转、缩放和父子关系，不直接渲染。

本文件用它做：

- 道路分段父节点。
- 车辆模型父节点。
- HTML Mesh 父节点。
- 多个子平面的容器。

好处是可以统一移动、旋转、缩放一组对象。

### MeshBuilder

`BABYLON.MeshBuilder` 用来快速创建基础几何体。

本文件常用：

- `CreatePlane()`：创建路面、路沿、图标、文字平面。
- `CreateGround()`：创建地面。
- `CreateBox()`：创建当前定位框和小装饰块。
- `CreateCylinder()`：创建 HTML Mesh 支撑柱。
- `CreateLines()`：创建坐标轴线。

### Vector3

`BABYLON.Vector3(x, y, z)` 表示三维坐标或方向。

本文件中：

- `new Vector3(x, 0, z)`：道路平面坐标。
- `new Vector3(0, 1, 0)`：半球光从上方向下。
- `Vector3.Zero()`：局部原点。

### StandardMaterial

标准材质，适合大多数图片、颜色、透明效果。

本文件常用属性：

- `diffuseTexture`：漫反射贴图。
- `emissiveTexture`：自发光贴图。
- `emissiveColor`：自发光颜色。
- `disableLighting`：不受灯光影响。
- `specularColor`：高光颜色。
- `alpha`：整体透明度。
- `useAlphaFromDiffuseTexture`：使用贴图 alpha。
- `backFaceCulling`：是否剔除背面。
- `disableDepthWrite`：是否关闭深度写入。
- `freeze()`：冻结材质以优化性能。

### Texture

纹理是图片资源。

常用属性：

- `hasAlpha`：图片是否有透明通道。
- `uScale`：横向重复次数。
- `vScale`：纵向重复次数。
- `wrapU` / `wrapV`：纹理寻址模式。
- `generateMipMaps`：是否生成多级纹理。

### DynamicTexture

动态纹理基于 HTML Canvas，可以运行时绘制文字和图片。

本文件用它创建：

- 坐标轴文字。
- 网格数字。
- 桩号。
- 路名和箭头组合。

关键：

- `texture.getContext()` 获取 Canvas 2D 上下文。
- 绘制完必须 `texture.update()`，否则 GPU 纹理不会刷新。

### billboardMode

广告牌模式控制 Mesh 是否自动面向相机。

常见值：

- `BABYLON.Mesh.BILLBOARDMODE_NONE` 或 `0`：不自动朝向相机。
- `BABYLON.Mesh.BILLBOARDMODE_ALL`：始终朝向相机。

本文件里还有 `billboardMode === 7` 的业务分支。这个值不是常见标准用法，可能是项目自定义约定，用于双面展示结构。

### renderingGroupId

渲染组决定对象的渲染顺序分组。

本文件大致用法：

- `0`：默认。
- `1`：路况、文字等在路面上层。
- `2`：车辆、热点点位。
- `3`：设备图标，尽量显示在更靠上层。

透明物体较多时，`renderingGroupId` 可以帮助减少遮挡和闪烁问题，但不能完全替代正确的透明排序。

### HighlightLayer

高亮层，用于选中发光。

常用：

- `new BABYLON.HighlightLayer(name, scene)`
- `addMesh(mesh, color)`
- `removeMesh(mesh)`
- `removeAllMeshes()`

### GizmoManager

Gizmo 是 3D 编辑控件。

常用：

- `positionGizmoEnabled`：移动。
- `scaleGizmoEnabled`：缩放。
- `rotationGizmoEnabled`：旋转。
- `boundingBoxGizmoEnabled`：包围盒编辑。
- `attachToMesh(mesh)`：绑定到 Mesh。
- `attachedMesh`：当前绑定 Mesh。
- `onDragEndObservable`：拖动结束事件。

### ActionManager

给 Mesh 注册交互行为。

本文件用它做鼠标悬停指针变化：

- `OnPointerOverTrigger`
- `OnPointerOutTrigger`
- `ExecuteCodeAction`

### Animation

Babylon 动画可以直接让对象属性随时间变化。

本文件用：

```js
BABYLON.Animation.CreateAndStartAnimation(
  name,
  target,
  property,
  framePerSecond,
  totalFrame,
  from,
  to,
  loopMode,
  easingFunction,
  onAnimationEnd
)
```

典型目标属性：

- `"position.x"`：车辆沿道路移动。
- `"beta"`：相机 2D/3D 切换。

### scene.pick()

`scene.pick(x, y)` 用屏幕坐标做射线检测。

返回：

- `hit`：是否命中。
- `pickedMesh`：命中的 Mesh。
- `pickedPoint`：命中的世界坐标。

本文件用于：

- 点选设备。
- 点击地面后转换坐标。

### Vector3.Project()

把 3D 世界坐标投影到 2D 屏幕坐标。

本文件用于：

- DOM 弹窗跟随 3D 点位。

### ImportMeshAsync()

异步加载模型文件。

本文件加载：

- `/model/car.glb`

GLB 是 3D 模型常见格式，适合车辆、人物、设备等复杂模型。

## 61. 数据结构建议

### lane 示例

```js
{
  length: 120000, // 米，loadRoads 内部会 /1000
  num: 3,         // 车道数
  type: 1,        // 方向，1 正向，其他反向
  name: "主线"
}
```

### point 示例

```js
{
  device_code: "CAMERA_001",
  class_code: "103004",
  device_flag: 0,
  road: 0,
  x: 0.2,
  y: 0.1,
  z: 0.5,
  width: 0.6,
  height: 0.4,
  background: "/img/camera.png",
  background_back: "/img/camera_back.png",
  billboardMode: 0,
  percentage: true,
  showIcon: 1
}
```

### vehicle ps 示例

```js
{
  device_code: "CAR_001",
  roadNum: 0,
  laneType: 1,
  laneNum: 3,
  currentLane: 1,
  length: 1.2,
  currentPosition: 0.2,
  speed: 60 / 3.6,
  move: true
}
```

### condition 示例

```js
{
  roadNum: 0,
  laneType: 1,
  laneNum: 3,
  currentLane: 1,
  start: 0.2,
  end: 0.5,
  color: "#ff0000"
}
```

## 62. 阅读这份代码的推荐顺序

如果你是 Babylon.js 小白，建议按这个顺序看：

1. `constructor()`：理解 Engine、Scene、Camera、Light 怎么初始化。
2. `loadRoads()`：理解道路是如何用 Plane 和材质拼出来的。
3. `createMaterialsByPath()`：理解贴图材质。
4. `loadPoint()`：理解设备图标、HTML Mesh、双面图标。
5. `createEvents()`：理解鼠标拾取和选中。
6. `enableGizmo()` 和 `genMesh()`：理解编辑后如何回传业务坐标。
7. `setCameraType()`、`lock()`、`resetCamera()`：理解相机控制。
8. `setCarToRoad()`、`loadCondition()`：理解动画和路况覆盖层。

## 63. 代码中值得留意的点

这些不是必须马上改的问题，但看代码时建议记住：

- `setOption()` 的数字配置用 truthy 判断，传 `0` 不会生效。
- `loadPoints()` 中 `this.modalMeshs.keys().filter(...)` 在标准 JS 中不可用，应先 `Array.from(...)`。
- `modalRemoveByCodeAndId()` 中使用了未定义的 `mesh`、`el`。
- `createPointEvent()` 的 `instanceof` 判断建议加括号。
- `createFBMaterialsByPath()` 的缓存 key 没有包含背面图 `path1`。
- `createFUMaterialsByPath()` 要求 `path2`，但实际没有使用它。
- `loadVideoHtmlMesh()` 使用固定节点名，多视频时可能冲突。
- `scene.autoClear = false` 比较特殊，如果出现画面残影，可以检查这里。
- 透明材质大量使用 `disableDepthWrite = true`，有助于减少透明闪烁，但也可能带来遮挡顺序不准确。

## 64. 一句话总结

这个 `App` 类把 Babylon.js 的底层对象包装成了一个业务化道路场景：道路由平面和纹理拼接，点位由平面/HTML Mesh 表示，车辆用 glb clone 后沿 X 轴动画移动，交互通过 `scene.pick()` 选中 Mesh，再用 `HighlightLayer` 和 `GizmoManager` 实现高亮与编辑。
