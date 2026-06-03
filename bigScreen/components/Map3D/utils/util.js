import { cloneDeep } from "lodash"
import { createApp, ref, h } from 'vue'

// 将多条相邻的线段合并成一个线段
export const mergeLineCoordinates = (lines, key, maxMergeCount) => {
  if (lines.length === 0) {
    return []
  }
  const result = []
  let index = 1
  if (key === 'G3012') {
    // lines = lines.slice(30)
  }
  let currentLine = lines[0]
  let count = 1
  const epsilon = 1e-9
  while (index < lines.length) {
    const line = lines[index]
    const last = currentLine.geometry.coordinates[currentLine.geometry.coordinates.length - 1]
    const first = line.geometry.coordinates[0]
    if (line.id - lines[index - 1].id === 1 && count < maxMergeCount && Math.abs(first[0] - last[0]) < epsilon) {
      currentLine.geometry.coordinates.push(...line.geometry.coordinates)
      count++
    } else {
      currentLine.geometry.coordinates = dilutePoints(currentLine.geometry.coordinates)
      result.push(currentLine)
      currentLine = line
      count = 1
    }
    index++
  }
  if (result[result.length - 1] !== currentLine) {
    currentLine.geometry.coordinates = dilutePoints(currentLine.geometry.coordinates)
    result.push(currentLine)
  }
  return result
}

/**
 * 合并多条相邻的线段，减少线段数量，提高渲染效率
 * @param {*} multipleLines 多条线段数据
 * @param {*} maxMergeCount 最大合并次数
 * @returns 合并后的线段数据
 */
export const mergeMultipleLineCoordinates = (multipleLines, maxMergeCount = 10000) => {
  // 对数据进行拷贝,防止影响到原来的数据
  const copyData = cloneDeep(multipleLines)
  const result = {}
  for(let key in copyData) {
    if (key === 'G3012') {
      result[key] = copyData[key]
    } else {
      result[key] = mergeLineCoordinates(copyData[key], key, maxMergeCount)
    }
    
  }
  return result
}

const dilutePoints = (points) => {
  if (points.length <= 10) {
    return points
  }
  const len = points.length <= 100 ? 2 : 10
  const result = []
  for(let i = 0; i < points.length; i += len) {
    result.push(points[i])
  }
  return result
}

export function preloadImages(imageArray) {
  const loadedImages = [];
  let loadedCount = 0;
  const totalCount = imageArray.length;

  return new Promise((resolve) => {
    if (totalCount === 0) {
      resolve(loadedImages);
      return;
    }

    imageArray.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        loadedImages.push(img);
        if (loadedCount === totalCount) {
          resolve(loadedImages);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalCount) {
          resolve(loadedImages);
        }
      };
      img.src = url;
    });
  });
}

/**
 * 挂载组件到容器
 * @param {HTMLElement} container 容器元素
 * @param {VueComponent} component 组件
 * @param {Object} params 组件参数
 * @returns 容器元素
 */
export function mountComponentToContainer(container, component, params = {}) {
  const reactiveParams = ref({ ...params })
  const wrapper = {
    setup() {
      return { params: reactiveParams }
    },
    render() {
      return h(component, this.params)
    }
  }
  const app = createApp(wrapper)
  app.mount(container)
  
  container.updateProps = (newParams) => {
    reactiveParams.value = { ...reactiveParams.value, ...newParams }
  }
  
  container.unmount = () => {
    app.unmount()
  }

  return container
}

export const transformEventType = (type) => {
  const newType = type + ''
  if (newType === '201302') {
    return 301
  }
  if (newType.startsWith('10')) {
    return 101
  }
  if (newType.startsWith('20')) {
    return 201
  }
  if (newType.startsWith('30')) {
    return 301
  }
  if (newType.startsWith('40')) {
    return 401
  }
  if (newType.startsWith('90')) {
    return 901
  }
  return type
}

export const getEventColors = (type) => {
  const newType = transformEventType(type)
  const colors = {
    '101': '#FF2525',
    '201': '#FF8E23',
    '301': '#FFC200',
    '401': '#08D62F',
    '901': '#0BA5FF',
  }
  return colors[newType] || colors['901']
}