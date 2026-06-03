import { defineStore } from 'pinia';
export const useMapStore = defineStore('mapStore', {
  state: () => ({
    animating: false,
  }),
  actions: {
    updateAnimating(data: boolean) {
      this.animating = data
    },
  },
});
