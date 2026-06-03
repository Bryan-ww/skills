import { defineStore } from 'pinia';
import { getTollStationBylocType,getTollStations } from '/@/api/admin/iot';screen';

export const useTollStationStore = defineStore('tollStationStore', {
  state: () => ({
    loading: false,
    // IOT分中心列表
    iotSubcenters: [],
    iotTollStations:[], // IOT收费站列表 来源动环接口,以保证动环机房有定位
    // 收费站列表
    tollStations: [], //当前运维中心收费站来源机电
    // 收费站Id映射
    tollStationsMap: {},
  }),
  getters: {
    listHasLocation: (state) => {
      return state.list.filter((item) => item.lng && item.lat);
    },
  },
  actions: {
    async updateList(opsDep) {
      this.loading = true;
      const params = {
        fieldPredicates: [
          {
            identifier: 'type', //设施类型
            operator: 'EQ',
            values: ['TOLL_STATION'],
          },
          {
            identifier: 'opsDep', //运维单位
            operator: 'EQ',
            values: [opsDep],
          },
        ],
      };
      return getTollStationBylocType(params).then(({ code, data }) => {
        if (code === 0) {
          let tollStations = [...data.records];
          this.tollStations = tollStations.map((item) => {
            let loc;
            if (item.fields?.coordinate?.value) {
              loc = JSON.parse(item.fields?.coordinate?.value);
            } else {
              loc = { lon: undefined, lat: undefined };
            }

            return {
              name: item.fields?.name?.display || '',
              deptId: item.fields?.opsDep?.value || '',
              lng: loc.lon || undefined,
              lat: loc.lat || undefined,
              ...item,
            };
          });
          // 先注释，暂时用动环收费站的定位
          // const tollStationsMap = {};
          // this.tollStations.forEach((item) => {
          //   tollStationsMap[item.deptId] = item;
          // });
          // this.tollStationsMap = tollStationsMap;
          // return this.tollStations;
        }
        this.loading = false;
      });
    },
     async updateListByIOT() {
      this.loading = true
      return getTollStations().then(({ code, data }) => {
        if (code === 0) {
          const tollStations = []
          this.iotSubcenters = (data || []).map(item => {
            if (item.children?.length > 0) {
              tollStations.push(...item.children)
            }
            item.name = item.deptName
            // children属性与vue的children属性冲突，所以用kchildren代替
            item.kchildren = item.children || []
            delete item.children

            return item
          })
          const tollStationsMap = {}
          
          this.iotTollStations = tollStations.map(item => {
            item.name = item.deptName
            tollStationsMap[item.deptId] = item
            return item
          })
          this.tollStationsMap = tollStationsMap
        }
        this.loading = false
      })
    },
  },
});
