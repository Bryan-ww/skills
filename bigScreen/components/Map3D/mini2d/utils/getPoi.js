import { INFRAS_TYPE, infrasData } from '../../utils/infrasData.js';
import Polygon from 'ol/geom/Polygon.js';
import { getInfoBoardAllStatus } from '@/api/bigscreen/infoBoard';
import { FeatureService, GetFeaturesBySQLParameters, GetFeaturesByBoundsParameters } from '@supermapgis/iclient-ol';

export const getPoiBySql = ({ sql, datasetNames, url }) => {
  const aParams = new GetFeaturesBySQLParameters({
    queryParameter: {
      attributeFilter: sql
    },
    toIndex: 100000,
    maxFeatures: 100000,
    datasetNames: datasetNames
  })
  const newUrl = import.meta.env.VITE_ISERVER_URL + url
  return new Promise(resolve => {
    new FeatureService(newUrl)
      .getFeaturesBySQL(aParams,function(result){
        resolve(result)
    })
  })
}

export const getPoiByBounds = ({ polygon, datasetNames, url }) => {
  const a = 100
  const newPolygon = polygon || new Polygon([[[-a, a], [-a, -a], [a, -a], [a, a], [-a, a]]]);
  const boundsParam = new GetFeaturesByBoundsParameters({
      datasetNames: datasetNames,
      toIndex: 100000,
      maxFeatures: 100000,
      bounds: newPolygon.getExtent()
  });
  const newUrl = import.meta.env.VITE_ISERVER_URL + url
  return new Promise(resolve => {
    new FeatureService(newUrl).getFeaturesByBounds(boundsParam).then(function (result) {
      resolve(result)
    });
  })
}

// 范围查询-摄像机
export const getCameraByBounds = async (polygon) => {
  const res = await getPoiByBounds({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:监控摄像机"],
    polygon
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.CAMERA, list)
  result.list.forEach(i => {
    i.properties.onlineStatus = i.properties.ONLINE_STATUS === '1' ? 'ONLINE' : 'OFFLINE';
    i.properties.name = i.properties.NAME
    if (i.properties.R_S_ID && i.properties.R_S_ID !== 'null') {
      i.properties.road = i.properties.R_S_ID.split('-')[0]
    } else {
      i.properties.road = ''
    }
  })
  return result;
}

// 范围查询-情报板
export const getNewsBoardByBounds = async (polygon) => {
  const res = await getPoiByBounds({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:情报板"],
    polygon
  });
  const allStatus = await getInfoBoardAllStatus()
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.NEWS_BOARD, list)
  result.list.forEach(i => {
    const id = i.properties.ID
    i.properties.onlineStatus = allStatus.data[id] || 'OFFLINE'
    i.properties.name = i.properties.NAME
    i.properties.road = i.properties.PID
    i.properties.pile = i.properties.ZH
  })
  return result;
}

// 范围查询-收费站
export const getTollStationByBounds = async (polygon) => {
  const res = await getPoiByBounds({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:收费站"],
    polygon
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.TOLL_STATION, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.NAME
    if (i.properties.EX_ROADCO) {
      i.properties.road = i.properties.EX_ROADCO
    } else {
      i.properties.road = ''
    }
  })
  return result;
}

// 范围查询-桥梁
export const getBridgeByBounds = async (polygon) => {
  const res = await getPoiByBounds({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:特大桥"],
    polygon
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.BRIDGE, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.NAME
    if (i.properties.LCLXBH && i.properties.LCLXBH !== 'null') {
      i.properties.road = i.properties.LCLXBH
    } else {
      i.properties.road = ''
    }
  })
  return result;
}

// 范围查询-隧道
export const getTunnelByBounds = async (polygon) => {
  const res = await getPoiByBounds({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:隧道"],
    polygon
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.TUNNEL, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.NAME
    i.properties.road = i.properties.EXT_ORGC
  })
  return result;
}

// 范围查询-服务区
export const getServiceAreaByBounds = async (polygon) => {
  const res = await getPoiByBounds({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:服务区"],
    polygon
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.SERVICE_AREA, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.NAME
    i.properties.road = i.properties.EXT_ORGC
  })
  
  return result;
}

// 范围查询-etc门架
export const getLongMenJiaByBounds = async (polygon) => {
  const res = await getPoiByBounds({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:ETC门架"],
    polygon
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.LONG_MENG_JIA, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.NAME
    if (i.properties.ROADCODE && i.properties.ROADCODE !== 'null') {
      i.properties.road = i.properties.ROADCODE.split('-')[0]
    } else {
      i.properties.road = ''
    }
  })
  return result;
}

// 范围查询-停车区
export const getParkingByBounds = async (polygon) => {
  const res = await getPoiByBounds({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:停车区"],
    polygon
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.PARKING, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.FACNAME
    i.properties.road = i.properties.ROADCODE
  })
  return result;
}

// 获取在建工程的路段信息
export const getBuildProjectRoad = async (dataSetName, sql = '') => {
  try {
    const res = await getPoiBySql({
      url: '/services/data-ZaiJianXiangMu/rest/data',
      datasetNames: [`data:${dataSetName}`],
      sql: sql
    });
    let list = res.result.features.features;
  
    return list;
  } catch(err) {
    return []
  }
};

// 获取路段信息
export const getRoadSectionBySql = async (sql) => {
  const res = await getPoiBySql({
    url: '/services/data-luxian/rest/data',
    datasetNames: ["交投管养:gpsgd"],
    sql: sql
  });
  console.log('res', res)
  let list = res.result.features.features;
 
  return list;
};

// 收费站
export const getTollStationBySql = async (name, sql) => {
  const res = await getPoiBySql({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:收费站"],
    sql: sql || `NAME LIKE '%${name}%'`
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.TOLL_STATION, list)
  const regex = /^(.*?)(?=65)/;
  result.list.forEach(i => {
    i.properties.name = i.properties.NAME
    if (i.properties.EX_ROADCO) {
      i.properties.road = i.properties.EX_ROADCO
    } else {
      i.properties.road = ''
    }
  })
  return result;
};

// 桥梁
export const getBridgeBySql = async (name) => {
  const res = await getPoiBySql({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:特大桥"],
    sql: `NAME LIKE '%${name}%'`
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.BRIDGE, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.NAME
    if (i.properties.LCLXBH && i.properties.LCLXBH !== 'null') {
      i.properties.road = i.properties.LCLXBH.split('-')[0]
    } else {
      i.properties.road = ''
    }
  })
  return result;
};

// 隧道
export const getTunnelBySql = async (name) => {
  const res = await getPoiBySql({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:隧道"],
    sql: `NAME LIKE '%${name}%'`
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.TUNNEL, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.NAME
    i.properties.road = i.properties.EXT_ORGC
  })
  return result;
};

// 服务区
export const getServiceAreaBySql = async (name, sql) => {
  const res = await getPoiBySql({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:服务区"],
    sql: sql || `NAME LIKE '%${name}%'`
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.SERVICE_AREA, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.NAME
    i.properties.road = i.properties.EXT_ORGC
  })
  return result;
};

// 情报板
export const getNewsBoardBySql = async (name) => {
  const res = await getPoiBySql({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:情报板"],
    sql: `NAME LIKE '%${name}%'`
  });
  let list = res.result.features.features;
  const allStatus = await getInfoBoardAllStatus()
  const result = formatData(INFRAS_TYPE.NEWS_BOARD, list)
  result.list.forEach(i => {
    const id = i.properties.ID
    i.properties.onlineStatus = allStatus.data[id] || 'OFFLINE'
    i.properties.name = i.properties.NAME
    i.properties.road = i.properties.PID
    i.properties.pile = i.properties.ZH
  })
  return result;
};

// ETC门架
export const getLongMenJiaBySql = async (name) => {
  const res = await getPoiBySql({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:ETC门架"],
    sql: `NAME LIKE '%${name}%'`
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.LONG_MENG_JIA, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.NAME
    if (i.properties.ROADCODE && i.properties.ROADCODE !== 'null') {
      i.properties.road = i.properties.ROADCODE.split('-')[0]
    } else {
      i.properties.road = ''
    }
  })
  return result;
};

// 摄像机
export const getCameraBySql = async (name, sql) => {
  const res = await getPoiBySql({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:监控摄像机"],
    sql: sql || `NAME LIKE '%${name}%'`
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.CAMERA, list)
  result.list.forEach(i => {
    i.properties.onlineStatus = i.properties.ONLINE_STATUS === '1' ? 'ONLINE' : 'OFFLINE';
    i.properties.name = i.properties.NAME
    if (i.properties.R_S_ID && i.properties.R_S_ID !== 'null') {
      i.properties.road = i.properties.R_S_ID.split('-')[0]
    } else {
      i.properties.road = ''
    }
  })
  console.log('Line: 316: result', result)
  return result;
};

// 交通事件
// export const getTrafficEventBySql = async (params) => {
//   const result = await getAmapEventData(params);
//   const res = formatEventData(INFRAS_TYPE.TRAFFIC_EVENT, result.data || []);
//   res.list.forEach(i => {
//     i.properties = {
//       name: i.name || '-',
//       road: i.road
//     }
//   })
//   res.list = res.list.filter(i => {
//     if (params.desc) {
//       if (i.name) {
//         return i.name.includes(params.desc)
//       }
//     }
//     return true
//   })
//   // trafficEffect越大，堵车越严重
//   res.list.sort((a, b) => b.trafficEffect - a.trafficEffect)
//   return res
// };

// 停车区
export const getParkingBySql = async (name) => {
  const res = await getPoiBySql({
    url: '/services/data-poi-2/rest/data',
    datasetNames: ["poi:停车区"],
    sql: `FACNAME LIKE '%${name}%'`
  });
  let list = res.result.features.features;
  const result = formatData(INFRAS_TYPE.PARKING, list)
  result.list.forEach(i => {
    i.properties.name = i.properties.FACNAME
    i.properties.road = i.properties.ROADCODE
  })
  return result;
};

const baseGet = ({ url, params, config = {} }) => {
  const baseUrl = import.meta.env.VITE_ISERVER_URL;
  const queryString = new URLSearchParams(params).toString();
  return fetch(`${baseUrl + url}?${queryString}`, {
    method: 'GET',
    ...config,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // console.log('请求成功:', data);
      return data || [];
    })
    .catch((error) => {
      // 处理错误
      console.error('请求失败:', error);
      return [];
    });
};

const formatList = (list, type) => {
  list.forEach((item) => {
    item.name = item.properties.NAME;
    item.lnglat = item.geometry.coordinates;
    item.type = type;
  });
};

const formatData = (type, list) => {
  const data = infrasData.find((i) => i.type === type);
  formatList(list, type);
  if (!data) {
    return {
      name: '',
      type: type,
      list: list,
    };
  }
  return {
    ...data,
    list,
  };
};

export const formatSubCenterData = (type, list) => {
  const data = infrasData.find((i) => i.type === type);
  const items = list.map((item) => {
    return {
      lnglat: [item.lng, item.lat],
      type: type,
      name: item.name,
      ...item,
    };
  });
  return {
    ...data,
    list: items,
  };
};
export const formatDiseaseData = (type, list) => {
  const data = infrasData.find((i) => i.type === type);
  const items = list.map((item) => {
    return {
      ...item,
      lnglat: [item.lng, item.lat],
      type: type,
      dataType: item.type,
      name: item.name,
    };
  });
  return {
    ...data,
    list: items,
  };
};
export const formatEventData = (type, list) => {
  const data = infrasData.find((i) => i.type === type);
  const items = list.map((item) => {
    return {
      lnglat: [item.x, item.y],
      type: type,
      name: item.eventDesc,
      road: item.roadName,
      ...item,
    };
  });
  return {
    ...data,
    list: items,
  };
};

const removeRepeatLnglat = (list) => {
  const obj = {}
  const result = []
  list.forEach(i => {
    const lnglat = i.geometry.coordinates
    const key = lnglat[0] + '' + lnglat[1]
    if (!obj[key]) {
      result.push(i)
      obj[key] = true
    }
  })
  return result
}

// 服务区
export const getServiceArea = async (noSlice) => {
  const result = await baseGet({
    url: '/services/data-poi-2/rest/data/datasources/poi/datasets/服务区/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 2000,
    },
  });
  let list = result.features;
  list.sort((a, b) => {
    return Number(b.properties.AREA_TOT) - Number(a.properties.AREA_TOT);
  });
  // 取面积最大的5个服务区
  if (!noSlice) {
    list = list.slice(0, 5);
  }

  return formatData(INFRAS_TYPE.SERVICE_AREA, list);
};

// 情报板
export const getNewsBoard = async (noSlice) => {
  const result = await baseGet({
    url: '/services/shujudata/rest/data/datasources/shuju/datasets/%E6%83%85%E6%8A%A5%E6%9D%BF/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 2000,
    },
  });
  let list = result.features;
  if (!noSlice) {
    list = list.slice(0, 5);
  }

  return formatData(INFRAS_TYPE.NEWS_BOARD, list);
};

// 收费站
export const getTollStation = async (noSlice) => {
  const result = await baseGet({
    url: '/services/data-poi-2/rest/data/datasources/poi/datasets/%E6%94%B6%E8%B4%B9%E7%AB%99/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 2000,
    },
  });
  let list = result.features;
  // if (!noSlice) {
  //   list = list.slice(0, 5);
  // }

  return formatData(INFRAS_TYPE.TOLL_STATION, list);
};

// 隧道
export const getTunnel = async (noSlice) => {
  const result = await baseGet({
    url: '/services/data-poi-2/rest/data/datasources/poi/datasets/%E9%9A%A7%E9%81%93/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 2000,
    },
  });
  let list = result.features;
  list.sort((a, b) => {
    return Number(b.properties.LENGTH) - Number(a.properties.LENGTH);
  });
  // 选长度最长的几个隧道
  if (!noSlice) {
    list = list.slice(0, 5);
  }

  return formatData(INFRAS_TYPE.TUNNEL, list);
};

// 摄像机
export const getCamera = async (noSlice) => {
  const result = await baseGet({
    url: '/services/data-poi-2/rest/data/datasources/poi/datasets/%E7%9B%91%E6%8E%A7%E6%91%84%E5%83%8F%E6%9C%BA/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 100000,
    },
  });
  let list = result.features;
  if (!noSlice) {
    list = list.slice(0, 5);
  }

  return formatData(INFRAS_TYPE.CAMERA, list);
};

// 停车区
export const getParking = async (noSlice) => {
  const result = await baseGet({
    url: '/services/data-poi-2/rest/data/datasources/poi/datasets/停车区/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 100,
    },
  });
  let list = result.features;
  if (!noSlice) {
    list = list.slice(0, 5);
  }

  return formatData(INFRAS_TYPE.PARKING, list);
};

// 特大桥
export const getBridge = async (noSlice) => {
  const result = await baseGet({
    url: '/services/data-poi-2/rest/data/datasources/poi/datasets/特大桥/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 100,
    },
  });
  let list = result.features;
  list.sort((a, b) => {
    return Number(b.properties.QLQC) - Number(a.properties.QLQC);
  });
  // 选最长的几个桥梁
  if (!noSlice) {
    list = list.slice(0, 5);
  }

  return formatData(INFRAS_TYPE.BRIDGE, list);
};

// 龙门架
export const getLongMenJia = async (noSlice) => {
  const result = await baseGet({
    url: '/services/data-poi-2/rest/data/datasources/poi/datasets/ETC门架/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 10000,
    },
  });
  let list = result.features;
  // list = removeRepeatLnglat(list)
  // if (!noSlice) {
  //   list = list.slice(0, 5);
  // }

  return formatData(INFRAS_TYPE.LONG_MENG_JIA, list);
};


// 高速
export const getRoads = async () => {
  const result = await baseGet({
    url: '/services/shujudata/rest/data/datasources/shuju/datasets/管养范围/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 200,
    },
  });
  let list = result.features;

  return list;
};

// 集团公司
export const getCompanies = async () => {
  const result = await baseGet({
    url: '/services/shujudata/rest/data/datasources/shuju/datasets/部门/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 200,
    },
  });
  let list = result.features;

  return list;
};

// 获取国道高速
export const getGDGS = async () => {
  const result = await baseGet({
    url: '/services/data-luxian/rest/data/datasources/年报数据国省道/datasets/LX_G/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 10000,
    },
    config: { cache: 'force-cache' },
  });
  let list = result.features;
  list = list.filter((i) => {
    return i.properties.LDLX === '1';
  });

  return list;
};

// 获取交投管理的国道高速
export const getJTGDGS = async () => {
  const result = await baseGet({
    url: '/services/data-luxian/rest/data/datasources/年报数据国省道/datasets/GD/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 10000,
    },
    config: { cache: 'force-cache' },
  });
  let list = result.features;
  list = list.filter((i) => {
    return i.properties.LDLX === '1';
  });

  return list;
};

export const getJTGDGSTemp = async () => {
  const result = await baseGet({
    url: '/services/data-luxian/rest/data/datasources/交投管养/datasets/JT_GSGD/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 10000,
    },
    // config: { cache: 'force-cache' },
  });
  let list = result.features;
  list = list.filter((i) => {
    return i.properties.LDLX === '1';
  });

  return list;
};

// 获取省道高速
export const getSDGS = async () => {
  const result = await baseGet({
    url: '/services/data-luxian/rest/data/datasources/年报数据国省道/datasets/LX_S/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 10000,
    },
    config: { cache: 'force-cache' },
  });
  let list = result.features;

  list = list.filter((i) => {
    return i.properties.LDLX === '1';
  });

  return list;
};

// 获取交投管理的省道高速
export const getJTSDGS = async () => {
  const result = await baseGet({
    url: '/services/data-luxian/rest/data/datasources/%E5%B9%B4%E6%8A%A5%E6%95%B0%E6%8D%AE%E5%9B%BD%E7%9C%81%E9%81%93(1)/datasets/SD/features.geojson',
    params: {
      fromIndex: 0,
      toIndex: 5000,
    },
    config: { cache: 'force-cache' },
  });

  let list = result.features;

  list = list.filter((i) => {
    return i.properties.LDLX === '1';
  });

  return list;
};

/**
 * 获取高速范围的坐标
 * @param {string} roadName 高速名称
 * @param {number} startPile 开始公里桩 100
 * @param {number} endPile 结束公里桩 200
 * @returns 高速范围的坐标
 * @example
 * getSectionCoordinates('S201', 100, 200)
 */
export const getSectionCoordinates = async (roadName, startPile, endPile) => {
  try {
    const res = await getPoiBySql({
      url: '/services/data-poi-2/rest/data',
      datasetNames: [`poi:公里桩`],
      sql: `LXBM='${roadName}' AND LCZH>=${startPile} AND LCZH<=${endPile}`
    });
    let list = res.result.features.features;
    
    const result = {
      properties: list[0].properties,
      geometry: {
        type: 'LineString',
        coordinates: []
      },
      type: 'Feature',
    }
    list.forEach((i) => {
      result.geometry.coordinates.push(i.geometry.coordinates);
    })
  
    return result;
  } catch(err) {
    return {}
  }
};


// 搜索所有设备设施
export const getInfrasDataFns = {
  // 服务区
  [INFRAS_TYPE.SERVICE_AREA]: getServiceArea,
  // 情报板
  [INFRAS_TYPE.NEWS_BOARD]: getNewsBoard,
  // 收费站
  [INFRAS_TYPE.TOLL_STATION]: getTollStation,
  // 隧道
  [INFRAS_TYPE.TUNNEL]: getTunnel,
  // 摄像机
  [INFRAS_TYPE.CAMERA]: getCamera,
  // 停车区
  [INFRAS_TYPE.PARKING]: getParking,
  // 特大桥
  [INFRAS_TYPE.BRIDGE]: getBridge,
  // 龙门架
  [INFRAS_TYPE.LONG_MENG_JIA]: getLongMenJia,
};

// 按sql搜索设备设施
export const getInfrasDataFnsBySql = {
  // 收费站
  [INFRAS_TYPE.TOLL_STATION]: getTollStationBySql,
  // 桥梁
  [INFRAS_TYPE.BRIDGE]: getBridgeBySql,
  // 隧道
  [INFRAS_TYPE.TUNNEL]: getTunnelBySql,
  // 服务区
  [INFRAS_TYPE.SERVICE_AREA]: getServiceAreaBySql,
  // 情报板
  [INFRAS_TYPE.NEWS_BOARD]: getNewsBoardBySql,
  // ETC门架
  [INFRAS_TYPE.LONG_MENG_JIA]: getLongMenJiaBySql,
  // 监控摄像机
  [INFRAS_TYPE.CAMERA]: getCameraBySql,
  // 交通事件
  // [INFRAS_TYPE.TRAFFIC_EVENT]: getTrafficEventBySql,
  // 停车区
  [INFRAS_TYPE.PARKING]: getParkingBySql,
};

// 按范围搜索设备设施
export const getInfrasDataFnsByBounds = {
  // 情报板
  [INFRAS_TYPE.NEWS_BOARD]: getNewsBoardByBounds,
  // 监控摄像机
  [INFRAS_TYPE.CAMERA]: getCameraByBounds,
  // 收费站
  [INFRAS_TYPE.TOLL_STATION]: getTollStationByBounds,
  // 桥梁
  [INFRAS_TYPE.BRIDGE]: getBridgeByBounds,
  // 隧道
  [INFRAS_TYPE.TUNNEL]: getTunnelByBounds,
  // 服务区
  [INFRAS_TYPE.SERVICE_AREA]: getServiceAreaByBounds,
  // etc门架
  [INFRAS_TYPE.LONG_MENG_JIA]: getLongMenJiaByBounds,
  // 停车区
  [INFRAS_TYPE.PARKING]: getParkingByBounds,
};

