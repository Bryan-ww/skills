import { defineStore } from 'pinia';
import { getSubCenters } from '/@/api/admin/screen';

export const useSubCenterStore = defineStore('subCenterStore', {
  state: () => ({
    checkedId: '',
    // 分中心列表
    subCenters: [],
  }),
  actions: {
    updateCheckedId(id) {
      this.checkedId = id;
    },
    async updateList() {
      this.loading = true;
      return getSubCenters().then(({ code, data }) => {
        if (code === 0) {
          this.subCenters = (data || []).map((item) => {
            item.lng = item.longitude;
            item.lat = item.latitude;
            item.buMenCode = item.ext?.buMenCode || '';
            delete item.longitude;
            delete item.latitude;
            return item;
          });
        }
        this.loading = false;
      });
    },
  },
});
