/**
 * 网格聚合算法 - 对POI点进行聚合
 * @param {Array} points POI点数组，每个点需要包含lng和lat坐标
 * @param {number} gridSize 网格大小（单位：经度/纬度度），默认 0.01 约 1公里
 * @returns {Array} 聚合后的点数组，每个点包含坐标、聚合数量和原始点列表
 */
export function clusterPointsByGrid(points, gridSize = 0.01) {
  if (!points || points.length === 0) {
    return []
  }

  const gridMap = new Map()

  points.forEach(point => {
    const lng = point.lng ?? point[0]
    const lat = point.lat ?? point[1]

    if (lng === undefined || lat === undefined) return

    const gridX = Math.floor(lng / gridSize)
    const gridY = Math.floor(lat / gridSize)
    const key = `${gridX},${gridY}`

    if (!gridMap.has(key)) {
      gridMap.set(key, {
        gridX,
        gridY,
        points: [],
        sumLng: 0,
        sumLat: 0
      })
    }

    const cluster = gridMap.get(key)
    cluster.points.push(point)
    cluster.sumLng += lng
    cluster.sumLat += lat
  })

  const result = []
  gridMap.forEach(cluster => {
    const count = cluster.points.length
    result.push({
      lng: cluster.sumLng / count,
      lat: cluster.sumLat / count,
      count: count,
      points: cluster.points
    })
  })

  return result
}

/**
 * 根据缩放级别自动调整网格大小进行POI聚合
 * @param {Array} points POI点数组
 * @param {number} zoom 地图缩放级别 1-18
 * @returns {Array} 聚合后的点数组
 */
export function clusterPointsByZoom(points, zoom) {
  let gridSize
  if (zoom <= 5) {
    gridSize = 0.1
  } else if (zoom <= 8) {
    gridSize = 0.05
  } else if (zoom <= 10) {
    gridSize = 0.01
  } else if (zoom <= 12) {
    gridSize = 0.005
  } else if (zoom <= 14) {
    gridSize = 0.002
  } else {
    gridSize = 0.001
  }
  return clusterPointsByGrid(points, gridSize)
}

export default {
  clusterPointsByGrid,
  clusterPointsByZoom
}
