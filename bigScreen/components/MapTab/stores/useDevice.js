import { defineStore } from 'pinia';
import { fetchPropertyTree } from '/@/api/admin/deviceProperty';
import deviceApi from '/@/api/melon/model/device';
import { useSubCenterStore } from './useSubCenter';

import { markRaw } from 'vue';

export const useDeviceStore = defineStore('deviceStore', {
  state: () => ({
    loading: false,
    modelId: '',
    treeData: [],
    searchTreeDataLoading: false,
    list: [],
    collapseActiveId: '',
  }),
  getters: {
    listHasLocation: (state) => {
      return state.list.filter((item) => item.lng && item.lat);
    },
    listTree: (state) => {
      const deptMap = {};
      state.list.forEach((item) => {
        const deptName = item.deptName || '未分组';
        if (!deptMap[deptName]) {
          deptMap[deptName] = {
            id: item.deptId || deptName,
            label: deptName,
            children: [],
          };
        }
        deptMap[deptName].children.push({
          id: item.id,
          label: item.name,
          ...item,
        });
      });
      return Object.values(deptMap);
    },
    collapseActiveList: (state) => {
      return state.listHasLocation.filter((item) => item.deptId === state.collapseActiveId);
    },
  },
  actions: {
    setModelId(id) {
      this.modelId = id;
    },
    updateTreeData() {
      this.searchTreeDataLoading = true;
      fetchPropertyTree({}).then(({ code, data }) => {
        if (code === 0) {
          this.treeData = markRaw(data || []);
        }
      }).finally(() => {
        this.searchTreeDataLoading = false;
      });
    },
    async updateList(params = {}) {
      this.loading = true;
      this.collapseActiveId = '';
      const subCenterStore = useSubCenterStore();
      const apiParams = {
        // modelId: this.modelId,
        fieldPredicates: [],
        fieldIdentifiers: ['name', 'coordinate', 'opsDep', 'ownDep', 'type', 'state', 'runningState', 'serialNum'],
        size: 1000000,
        current: 0,
      };
      // 过滤分公司下的机房
      if (subCenterStore.checkedId) {
        apiParams.fieldPredicates.push({ identifier: 'opsDep', operator: 'EQ', value: subCenterStore.checkedId, values: [subCenterStore.checkedId] });
      }
      // 设备
      if (this.modelId) {
        apiParams.fieldPredicates.push({ identifier: 'deviceProperty', operator: 'EQ', value: this.modelId, values: [this.modelId] });
      }
      if (params.name) {
        apiParams.fieldPredicates.push({ identifier: 'name', operator: 'LIKE', value: params.name, values: [params.name] });
      }
      return deviceApi.findDevicePage(apiParams).then(({ code, data }) => {
        if (code === 0) {
          const list = (data?.records || []).map((item) => {
            item.name = item.fields?.name?.display;
            const coordinate = JSON.parse(item.fields?.coordinate?.value || '{}');
            item.deptName = item.fields?.opsDep.display;
            item.deptId = item.fields?.opsDep.value;
            item.runningState = item.fields?.runningState;

            if (coordinate.lon === 0) {
              coordinate.lon = '';
            }
            if (coordinate.lat === 0) {
              coordinate.lat = '';
            }
            item.lng = coordinate.lon;
            item.lat = coordinate.lat;

            return item;
          });
          this.list = markRaw(list);
        }
        this.loading = false;
      });
    },
  },
});
