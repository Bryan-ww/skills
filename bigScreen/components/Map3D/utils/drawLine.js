import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SRGBColorSpace, BufferGeometry, Color, Group, Points, PointsMaterial, BufferAttribute, RepeatWrapping, MeshBasicMaterial, BackSide, Vector3, TubeGeometry, Mesh, CatmullRomCurve3 } from 'three';
import { mapScale } from './config';
import { geoMercator } from 'd3-geo';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

const geoProjection = (args, center) => {
    return geoMercator().center(center).scale(mapScale).translate([0, 0])(args);
}

export const drawLineSegments2 = (lines, materialOptions = {}, config) => {
  const defaultOptions = {
    color: 0xffffff,
    linewidth: 5,
    vertexColors: false,
    dashed: false,
    fog: false,
    alphaToCoverage: false,
  };
  const transformed = config.transformed
  const matLine = config.material || new LineMaterial({ ...defaultOptions, ...materialOptions });
  const group = new Group()
  const points = []
  // console.log('lines', lines)
  const z = config.jsJT ? -0.01 : 0
  lines.forEach(line => {
    const transformedPoints = line.geometry.coordinates.map(i => {
      if (!transformed) {
        const [x, y] = geoProjection(i, config.center);
        return new Vector3(x, y, z);
      } else {
        return new Vector3(i[0], i[1], z);
      }
    })
    
    
    for (let i = 1; i < transformedPoints.length; i++) {
      const a = transformedPoints[i - 1]
      const b = transformedPoints[i]
      points.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }

  })
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(points);
  const mesh = new LineSegments2(geometry, matLine)
  mesh.renderOrder = config.jsJT ? 1 : 0
  group.add(mesh)

  // line.computeLineDistances();

  return group;
}

export const drawLine2 = (points, options = {}, config) => {
  const defaultOptions = {
    color: 0xffffff,
    linewidth: 5,
    vertexColors: false,
    dashed: false,
    fog: false,
    alphaToCoverage: false,
  };
  const transformedPoints = points.map(i => {
    const [x, y] = geoProjection(i, config.center);
    return new Vector3(x, y, 0);
  })
  const geometry = new LineGeometry();

  geometry.setFromPoints( transformedPoints);
  const matLine = new LineMaterial({ ...defaultOptions, ...options });

  const line = new Line2(geometry, matLine);
  line.computeLineDistances();

  return line;
};

export const drawMultipleLine2 = (lines, options = {}, config) => {
  const defaultOptions = {
    color: 0xffffff,
    linewidth: 5,
    vertexColors: false,
    dashed: false,
    fog: false,
    alphaToCoverage: false,
  };
  const matLine = new LineMaterial({ ...defaultOptions, ...options });
  const group = new Group()
  lines.forEach(line => {
    const transformedPoints = line.geometry.coordinates.map(i => {
      const [x, y] = geoProjection(i, config.center);
      return new Vector3(x, y, 0);
    })
    const geometry = new LineGeometry();

    geometry.setFromPoints( transformedPoints);
    group.add(new Line2(geometry, matLine))
  })

  // line.computeLineDistances();

  return group;
};

function changeLinePoints(newPoints, line2) {
  line2.geometry.dispose(); // 销毁原来的集合体
  // 创建新的几何体替换原来的，实现任意更新
  line2.geometry = new LineGeometry().setFromPoints(newPoints);
}

export const drawMeshLine = (lines, options = {}, config) => {
  const center = config.center
  const transformed = config.transformed
  const defaultOptions = {
    color: 0xffffff,
    lineWidth: 5,
    sizeAttenuation: 0,
    fog: false,
    useMap: false,
  };
  const geometryList = []
  lines.forEach((line, index) => {
    const geometry = new MeshLineGeometry()
    // if (line.geometry.coordinates.length < 100) {
    //   console.log('line.geometry.coordinates.length', line.geometry.coordinates.length)
    // }
    
    const points = line.geometry.coordinates.map(i => {
      if (!transformed) {
        const [x, y] = geoProjection(i, center);
        return new Vector3(x, y, 0);
      } else {
        return new Vector3(i[0], i[1], 0);
      }
      
    })
    geometry.setPoints(points);
    geometryList.push(geometry)
  })
  const mergedGeometry = mergeGeometries(geometryList);

  const matLine = config.material || new MeshLineMaterial({ ...defaultOptions, ...options});
  if (options.depthTest === false) {
    matLine.depthTest = false
  }

  const line = new Mesh(mergedGeometry, matLine)
  return line;
};

export const drawStreamLight = (points, assets, time) => {
  const lineNumber = Math.ceil(Math.random() * 11);
  const lineName = `line${lineNumber}`;
  const texture = assets.instance.getResource(lineName);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 2);

  // 材质
  let material = new MeshBasicMaterial({
    map: texture,
    side: BackSide,
    transparent: true,
    // opacity: 0.5
  });
  // 曲线
  let curve = new CatmullRomCurve3(points);
  // 创建管道
  let tubeGeometry = new TubeGeometry(curve, 100, 0.02, 20);
  // console.log(tubeGeometry.binormals.push(new Vector3(0, 0, 0)));
  let mesh = new Mesh(tubeGeometry, material);
  time.on('tick', () => {
    texture.offset.x -= 0.008;
    // texture.offset.x -= Math.random() / 200;
  });

  return mesh;
};

const output_fragment = `
export default
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= transmissionAlpha + 0.1;
#endif
// 设置透明度变化
float r = distance(gl_PointCoord, vec2(0.5, 0.5));
diffuseColor.a = diffuseColor.a*(1.0 - r/0.5);//透明度线性变化
// diffuseColor.a = diffuseColor.a*pow( 1.0 - r/0.5, 6.0 );//透明度非线性变化  参数2越大，gl_PointSize要更大，可以直接设置着色器代码，可以设置材质size属性
gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`

export const drawFlyLight = (points, model, time) => {
  var index = 0; //取点索引位置
  var num = 30; //从曲线上获取点数量
  var points2 = points.slice(index, index + num); //从曲线上获取一段
  var curve = new CatmullRomCurve3(points2);
  var newPoints2 = curve.getSpacedPoints(100); //获取更多的点数
  var geometry2 = new BufferGeometry();
  geometry2.setFromPoints(newPoints2);
  // 每个顶点对应一个百分比数据attributes.percent 用于控制点的渲染大小
  var percentArr = []; //attributes.percent的数据
  for (var i = 0; i < newPoints2.length; i++) {
    percentArr.push(i / newPoints2.length);
    // percentArr.push(1)
  }
  var percentAttribue = new BufferAttribute(new Float32Array(percentArr), 1);
  geometry2.attributes.percent = percentAttribue;
  // 批量计算所有顶点颜色数据
  var colorArr = [];
  for (var i = 0; i < newPoints2.length; i++) {
    // var color1 = new Color(0x006666); //轨迹线颜色 青色
    // var color2 = new Color(0xffff00); //黄色
    // var color = color1.lerp(color2, i / newPoints2.length);

    const color = new Color(0xffffff)
    colorArr.push(color.r, color.g, color.b);
  }
  // 设置几何体顶点颜色数据
  geometry2.attributes.color = new BufferAttribute(new Float32Array(colorArr), 3);

  // 点模型渲染几何体每个顶点
  var pointsMaterial = new PointsMaterial({
    // color: 0xffff00,
    size: 0.2, //点大小
    fog: false,
    vertexColors: true, //使用顶点颜色渲染
    transparent: true, //开启透明计算
    depthTest: false,
  });
  var flyPoints = new Points(geometry2, pointsMaterial);
  model.add(flyPoints);
  // 修改点材质的着色器源码(注意：不同版本细节可能会稍微会有区别，不过整体思路是一样的)
  pointsMaterial.onBeforeCompile = function (shader) {
    // 顶点着色器中声明一个attribute变量:百分比
    shader.vertexShader = shader.vertexShader.replace(
      'void main() {',
      [
        'attribute float percent;', //顶点大小百分比变量，控制点渲染大小
        'void main() {',
      ].join('\n') // .join()把数组元素合成字符串
    );
    // 调整点渲染大小计算方式
    shader.vertexShader = shader.vertexShader.replace(
      'gl_PointSize = size;',
      ['gl_PointSize = percent * size;'].join('\n') // .join()把数组元素合成字符串
    );

    shader.fragmentShader = shader.fragmentShader.replace('#include <output_fragment>', output_fragment);
  };
  // 飞线动画
  var indexMax = points.length - num; //飞线取点索引范围
  time.on('tick', () => {
    if (index > indexMax) index = 0;
    index += 2;
    points2 = points.slice(index, index + num); //从曲线上获取一段
    var curve = new CatmullRomCurve3(points2);
    var newPoints2 = curve.getSpacedPoints(100); //获取更多的点数
    geometry2.setFromPoints(newPoints2);
  })
};
