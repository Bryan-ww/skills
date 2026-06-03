
export const INFRAS_TYPE = {
  // 分中心 运营中心
  'SUB_CENTER': 'subCenter',
  // 桥梁
  'BRIDGE': 'bridge',
  // 隧道
  'TUNNEL': 'tunnel',
  // 服务区
  'SERVICE_AREA': 'serviceArea',
  // 收费站
  'TOLL_STATION': 'tollStation',
  // 边坡
  'SLOPE': 'slope',
  // 摄像机
  'CAMERA': 'camera',
  // 情报板
  'NEWS_BOARD': 'newsBoard',
  // 龙门架
  'LONG_MENG_JIA': 'longMenJia',
  // 停车区
  'PARKING': 'parking',
  // 气象站
  'WEATHER_STATION': 'weatherStation',
  // 交通事件
  'TRAFFIC_EVENT': 'trafficEvent',
  // 专项工程
  'SPECIAL_PROJECT': 'specialProject',
  // 公路病害
  'HIGHWAY_DISEASES': 'highwayDiseases',
  // 道路等级
  'ROAD_LEVEL': 'roadLevel',
  // 项目
  'CONSTRUCT': 'construct',
  // 车辆
  'VEHICLE': 'vehicle',
}

export const INFRAS_CATEGORY = {
  // 全部图层
  'ALL': 'all',
  // 设施
  'FACILITY': 'facility',
  // 设备
  'DEVICE': 'device',
  // 道路养护
  'ROAD_MAINTENANCE': 'roadMaintenance',
  // 运营单位
  'DEPARTMENT': 'department',
  // 实时感知
  'REAL_TIME_PERCEPTION': 'realTimePerception'
}
export const infrasCategoryData = [
  {
    type: INFRAS_CATEGORY.ALL, name: '全部图层', list: [
      INFRAS_TYPE.BRIDGE,
      INFRAS_TYPE.TUNNEL,
      INFRAS_TYPE.SERVICE_AREA,
      INFRAS_TYPE.TOLL_STATION,
      INFRAS_TYPE.SLOPE,
      INFRAS_TYPE.CAMERA,
      INFRAS_TYPE.NEWS_BOARD,
      INFRAS_TYPE.LONG_MENG_JIA,
      INFRAS_TYPE.PARKING,
      INFRAS_TYPE.WEATHER_STATION,
      INFRAS_TYPE.TRAFFIC_EVENT,
      INFRAS_TYPE.SPECIAL_PROJECT,
      INFRAS_TYPE.HIGHWAY_DISEASES,
      INFRAS_TYPE.ROAD_LEVEL,
      INFRAS_TYPE.SUB_CENTER,
      INFRAS_TYPE.CONSTRUCT,
      INFRAS_TYPE.VEHICLE,
    ]
  },
  {
    type: INFRAS_CATEGORY.FACILITY, name: '基础设施', list: [
      INFRAS_TYPE.BRIDGE,
      INFRAS_TYPE.TUNNEL,
      INFRAS_TYPE.SERVICE_AREA,
      INFRAS_TYPE.TOLL_STATION,
      INFRAS_TYPE.SLOPE,
      INFRAS_TYPE.PARKING,
      INFRAS_TYPE.SUB_CENTER,
    ]
  },
  {
    type: INFRAS_CATEGORY.DEVICE, name: '设备', list: [
      INFRAS_TYPE.CAMERA,
      INFRAS_TYPE.NEWS_BOARD,
      INFRAS_TYPE.LONG_MENG_JIA,
      INFRAS_TYPE.WEATHER_STATION,
    ]
  },
  {
    type: INFRAS_CATEGORY.ROAD_MAINTENANCE, name: '道路养护', list: [
      INFRAS_TYPE.SPECIAL_PROJECT,
      INFRAS_TYPE.HIGHWAY_DISEASES,
    ]
  },
  {
    type: INFRAS_CATEGORY.DEPARTMENT, name: '运营单位', list: [
      INFRAS_TYPE.SUB_CENTER,
    ]
  },
  {
    type: INFRAS_CATEGORY.REAL_TIME_PERCEPTION, name: '实时感知', list: [
      INFRAS_TYPE.TRAFFIC_EVENT,
      INFRAS_TYPE.ROAD_LEVEL,
    ]
  },
]

export const pageInfrasTypeMap = {
  // 路网运行
  'road': [
    INFRAS_TYPE.BRIDGE,
    INFRAS_TYPE.TUNNEL,
    INFRAS_TYPE.SERVICE_AREA,
    INFRAS_TYPE.TOLL_STATION,
    INFRAS_TYPE.CAMERA,
    INFRAS_TYPE.NEWS_BOARD,
  ],
  // 出行服务
  // 'travel': [
  //   INFRAS_TYPE.SERVICE_AREA,
  //   INFRAS_TYPE.TOLL_STATION,
  //   INFRAS_TYPE.CAMERA,
  //   INFRAS_TYPE.NEWS_BOARD,
  //   INFRAS_TYPE.PARKING,
  //   INFRAS_TYPE.WEATHER_STATION,
  //   INFRAS_TYPE.TRAFFIC_EVENT,
  // ],
  'travel': [
    INFRAS_TYPE.SERVICE_AREA,
    INFRAS_TYPE.TRAFFIC_EVENT,
  ],
  // 收费运营
  // 'charge': [
  //   INFRAS_TYPE.CAMERA,
  //   INFRAS_TYPE.LONG_MENG_JIA,
  //   INFRAS_TYPE.SERVICE_AREA,
  //   INFRAS_TYPE.TOLL_STATION,
  //   INFRAS_TYPE.PARKING,
  //   INFRAS_TYPE.WEATHER_STATION,
  //   INFRAS_TYPE.SUB_CENTER,
  // ],
  'charge': [
    INFRAS_TYPE.TOLL_STATION,
    INFRAS_TYPE.LONG_MENG_JIA
  ],
  // 养护管理
  // 'maintain': [
  //   INFRAS_TYPE.BRIDGE,
  //   INFRAS_TYPE.TUNNEL,
  //   INFRAS_TYPE.SERVICE_AREA,
  //   INFRAS_TYPE.SLOPE,
  //   INFRAS_TYPE.CAMERA,
  //   INFRAS_TYPE.PARKING,
  //   INFRAS_TYPE.TRAFFIC_EVENT,
  //   INFRAS_TYPE.SPECIAL_PROJECT,
  //   INFRAS_TYPE.HIGHWAY_DISEASES,
  //   INFRAS_TYPE.ROAD_LEVEL,
  //   INFRAS_TYPE.SUB_CENTER,
  // ],
  'maintain': [
    INFRAS_TYPE.HIGHWAY_DISEASES,
    INFRAS_TYPE.SPECIAL_PROJECT
  ],
  'construct': [
    INFRAS_TYPE.CONSTRUCT
  ],
  // 数智监控
  // 'smartMonitor': [
  //   INFRAS_TYPE.CAMERA,
  //   INFRAS_TYPE.NEWS_BOARD,
  //   INFRAS_TYPE.WEATHER_STATION,
  //   INFRAS_TYPE.LONG_MENG_JIA,
  //   INFRAS_TYPE.TOLL_STATION,
  //   INFRAS_TYPE.SUB_CENTER,
  // ],
  'smartMonitor': [
    INFRAS_TYPE.NEWS_BOARD,
    INFRAS_TYPE.LONG_MENG_JIA,
    INFRAS_TYPE.WEATHER_STATION
  ],
  // 黄金干线
  'groundLine': [
    INFRAS_TYPE.CAMERA,
    INFRAS_TYPE.NEWS_BOARD,
    INFRAS_TYPE.SERVICE_AREA,
    INFRAS_TYPE.PARKING,
    INFRAS_TYPE.TRAFFIC_EVENT,
    INFRAS_TYPE.SUB_CENTER,
  ],
  'default': [
    INFRAS_TYPE.BRIDGE,
    INFRAS_TYPE.TUNNEL,
    INFRAS_TYPE.SERVICE_AREA,
    INFRAS_TYPE.TOLL_STATION,
    INFRAS_TYPE.CAMERA,
    INFRAS_TYPE.NEWS_BOARD,
    INFRAS_TYPE.LONG_MENG_JIA,
  ],
  'infras': [
    INFRAS_TYPE.BRIDGE,
    INFRAS_TYPE.TUNNEL,
    INFRAS_TYPE.SERVICE_AREA,
    INFRAS_TYPE.TOLL_STATION,
  ],
  'devices': [
    INFRAS_TYPE.CAMERA,
    INFRAS_TYPE.NEWS_BOARD,
    INFRAS_TYPE.LONG_MENG_JIA,
  ],
  'vehicle': [
    INFRAS_TYPE.VEHICLE
  ],
}

export const baseIconColors = {
  'base0': '#D08D2D',
  'base1': '#2385AE',
  'base2': '#77A744',
  'base3': '#D86C34',
  'base4': '#0ea1f7',
  'base5': '#B8A54A',
  'base6': '#2D8584',
  'base7': '#5C47B0',
  'base8': '#359797',
  'base9': '#61954C',
  'base10': '#934F8D',
  'base11': '#923939',
  'base12': '#457A2B',
  'base13': '#A2623F',
  'base14': '#8456B1',
  'base15': '#5B83C4',
  'base16': '#2F8049',
  'base17': '#C27E5A',
  'base18': '#5561B0',
  'base19': '#8D527A',
  'error': '#9E2626',
  'offline': '#777777',
  'normal': '#61954C',
}

export const infrasData = [
  { name: '运营中心', baseIcon: 'base0', type: INFRAS_TYPE.SUB_CENTER, list: [] },
  { name: '桥梁', baseIcon: 'base1', canSearch: true, type: INFRAS_TYPE.BRIDGE, list: [], anchor: [0.5, 3.4], },
  { name: '隧道', baseIcon: 'base2', canSearch: true, type: INFRAS_TYPE.TUNNEL, list: [], anchor: [0.5, 2.7], },
  { name: '服务区', baseIcon: 'base3', canSearch: true, type: INFRAS_TYPE.SERVICE_AREA, list: [] },
  { name: '收费站', baseIcon: 'base4', canSearch: true, type: INFRAS_TYPE.TOLL_STATION, list: [] },
  { name: '边坡', baseIcon: 'base5', type: INFRAS_TYPE.SLOPE, list: [] },
  { name: '摄像机', baseIcon: 'base6', showOnline: true, canSearch: true, type: INFRAS_TYPE.CAMERA, list: [] },
  { name: '情报板', baseIcon: 'base7', showOnline: true, canSearch: true, type: INFRAS_TYPE.NEWS_BOARD, list: [] },
  { name: 'ETC门架', baseIcon: 'base8', canSearch: true, type: INFRAS_TYPE.LONG_MENG_JIA, list: [] },
  { name: '停车区', baseIcon: 'base9', canSearch: true, type: INFRAS_TYPE.PARKING, list: [] },
  { name: '气象站', baseIcon: 'base10', type: INFRAS_TYPE.WEATHER_STATION, list: [] },
  { name: '交通事件', baseIcon: 'base11', canSearch: false, type: INFRAS_TYPE.TRAFFIC_EVENT, list: [] },
  { name: '专项工程', baseIcon: 'base12', type: INFRAS_TYPE.SPECIAL_PROJECT, list: [] },
  { name: '公路病害', baseIcon: 'base13', type: INFRAS_TYPE.HIGHWAY_DISEASES, list: [] },
  { name: '道路等级', baseIcon: 'base14', type: INFRAS_TYPE.ROAD_LEVEL, list: [] },
  { name: '项目', baseIcon: 'base15', type: INFRAS_TYPE.CONSTRUCT, list: [], anchor: [0.5, 2.4] },
  { name: '车辆', baseIcon: 'base16', type: INFRAS_TYPE.VEHICLE, list: [], anchor: [0.5, 2.4] }
]