export const toRem = (px) => {
  return parseFloat(px) / 16 + 'rem'
}
export const generateRoads = (widths, b) => {
  const n = widths.length
  if (n === 0) return []
  const positions = new Array(n)
  const totalSpace = widths.reduce((sum, w) => sum + w, 0) + b * (n - 1)
  let currentOffset = -totalSpace / 2 // 起始偏移量
  for (let i = 0; i < n; i++) {
    const laneWidth = widths[i]
    positions[i] = -(currentOffset + laneWidth / 2) // 当前车道中心坐标
    currentOffset += laneWidth
    if (i < n - 1) {
      currentOffset += b // 仅在非最后一条道路时添加间距
    }
  }
  return positions
}
export const calculateShortSide = (lenght, angle) => {
  const shortSide = lenght * Math.sin(angle)
  return Number(shortSide.toFixed(4)) // 保留4位小数
}
/**
 * 计算对称分布的车道中心坐标
 * @param {number} numLanes - 车道数量（≥1）
 * @param {number} laneWidth - 单条车道宽度
 * @param {Object} center - 道路中心坐标 y
 * @returns {Array<number>} 车道中心坐标数组
 */
export const calculateLaneCenters = (numLanes, laneWidth, center) => {
  const centers = []
  const isEven = numLanes % 2 === 0
  // 计算每个车道的横向偏移（从最左侧车道开始）
  for (let i = 0; i < numLanes; i++) {
    let offset = 0
    if (isEven) {
      // 偶数车道：对称偏移（无中间车道）
      offset = (i - numLanes / 2 + 0.5) * laneWidth
    } else {
      // 奇数车道：中间车道偏移为0，两侧递增
      const middleIndex = Math.floor(numLanes / 2)
      offset = (i - middleIndex) * laneWidth
    }
    centers.push(center + offset)
  }
  return centers
}
export const calculateD = (c, l, b, laneWidth) => {
  const a = b.map(item => item.num)
  const types = b.map(item => item.type)
  const roads = [];
  // 计算每条路的上下边界
  for (let i = 0; i < a.length; i++) {
    const width = a[i] * laneWidth;
    const upper = l[i] + width / 2;
    const lower = l[i] - width / 2;
    roads.push({ upper, lower });
  }
  for (let i = 0; i < roads.length; i++) {
    const { upper, lower } = roads[i];
    if (c >= lower && c <= upper) {
      // 新增逻辑：计算距离道路上沿的百分比
      const roadHeight = upper - lower;
      const zValue = (upper - c) / roadHeight; // 0=上沿, 1=下沿
      return {
        isRoad: true,
        road: i,
        z: types[i] === 1 ? zValue : 1 - zValue
      };
    }
  }
  // 检查是否在相邻道路间的花坛
  for (let i = 0; i < roads.length - 1; i++) {
    const currentLower = roads[i].lower;
    const nextUpper = roads[i + 1].upper;
    if (c > nextUpper && c < currentLower) {
      const gapWidth = currentLower - nextUpper;
      const z = (currentLower - c) / gapWidth;
      return {
        isRoad: false,
        road: i + 0.5,
        z: z
      };
    }
  }
  // 不处于任何道路或花坛
  return {
    isRoad: false,
    road: null,
    gap: null,
    z: null
  };
}



export const computeAdjacentAverages = (arr) => {
  // 处理边界情况：数组长度小于2时返回空数组
  if (arr.length < 2) {
    return [];
  }
  const result = [];
  // 遍历所有相邻元素对
  for (let i = 0; i < arr.length - 1; i++) {
    // 计算相邻两个元素的平均值
    const avg = (arr[i] + arr[i + 1]) / 2;
    result.push(avg);
  }

  return result;
}