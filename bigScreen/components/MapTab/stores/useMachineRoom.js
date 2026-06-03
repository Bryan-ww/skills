import { defineStore } from 'pinia';
import { getMachineRooms } from '/@/api/iot/index';
import { useTollStationStore } from '@/views/bigScreen/components/MapTab/stores/useTollStation.js';

export const useMachineRoomStore = defineStore('machineRoomStore', {
  state: () => ({
    loading: false,
    list: [],
    listMap: {},
    filteredList: [],
  }),
  getters: {
   
  },
  actions: {
    filterList(name) {
      this.filteredList = this.list.filter(item => !name ? true : item.name.includes(name))
    },
    async updateList() {
      this.loading = true
      return getMachineRooms({pageSize: 10000, pageNum: 1}).then(({ code, data }) => {
        if (code === 200) {
          const tollStationsMap = useTollStationStore().tollStationsMap;
          const list = data?.list || []

          const listMap = {}
          this.list = list.map(item => {
            listMap[item.deptId] = item
            const tollStation = tollStationsMap[item.deptId]

            item.name = item.roomName
            if (tollStation) {
              item.lng = tollStation.lng
              item.lat = tollStation.lat
            }
            return item
          })
          this.listMap = listMap
        }
        this.filterList()
        this.loading = false
      })
      
    },
  },
});
