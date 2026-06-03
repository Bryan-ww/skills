import { markRaw } from 'vue';
import { defineStore } from 'pinia';
import { deptTree } from '@/api/admin/dept';
import { getVehiclePages } from '@/api/melon/vehicle/index';

export const useVehicleStore = defineStore('vehicleStore', {
  state: () => ({
    isLoading: false,
    isSearchTreeDataLoading: false,
    currentNode: {},
    treeData: [],
    list: [],
  }),

  getters: {
    listHasLocation: (state) => {
      return state.list.filter((item) => item.lng && item.lat);
    },
  },

  actions: {
    setCurrentNode(data) {
      this.currentNode = data;
    },

    updateTreeData() {
      this.isSearchTreeDataLoading = true;
      deptTree({}).then(({ data }) => {
        this.treeData = markRaw(data || []);
      }).finally(() => {
        this.isSearchTreeDataLoading = false;
      });
    },

    async updateList(params = {}) {
      this.isLoading = true;
      const apiParams = {
        ...params,
        cmpName: this.currentNode.name || '',
        size: 1000000,
        current: 1,
      };
      return getVehiclePages(apiParams).then(({ code, data }) => {
        if (code === 0) {
          const list = (data?.records || []).map((item) => {
            item.name = `${item.carName || item.carPlate}${item.carType ? '(' + item.carType + ')' : ''}`;
            item.lng = item.location?.lng || '';
            item.lat = item.location?.lat || '';
            item.lnglat = [item.lng, item.lat];
            item.type = 'vehicle';
            return item;
          });
          this.list = list;
        }
      }).finally(() => {
        this.isLoading = false;
      })
    },
  },
});
