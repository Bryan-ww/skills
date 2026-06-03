import { defineStore } from 'pinia';
import { staffInfo } from '@/api/admin/dept'
import { useSubCenterStore } from './useSubCenter'
import { markRaw } from 'vue'

export const usePersonnelStore = defineStore('personnelStore', {
  state: () => ({
    loading: false,
    list: []
  }),
  getters: {
    listHasLocation: (state) => {
      return state.list.filter(item => item.lng && item.lat)
    },
  },
  actions: {
    updateList(params = {}) {
      this.loading = true
      const subCenterStore = useSubCenterStore()
      // 过滤分公司下的人员
      if (subCenterStore.checkedId) {
        params.deptId = subCenterStore.checkedId
      }

      return staffInfo({size: 10000, ...params}).then(({ code, data }) => {
        if (code === 0) {
          const list = (data?.records || []).map(item => {
            item.name = item.user?.name
            item.deptName = item.user?.deptName
            item.deptId = item.user?.deptId
            item.phone = item.user?.phone
            item.lng = item.lon

            return item
          }).filter(item => {
            if (params.name)  {
              return item.name.includes(params.name)
            }
            return true
          })
          this.list = markRaw(list)
        }
        this.loading = false
      })
    },
  },
});
