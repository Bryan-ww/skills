import { defineStore } from 'pinia';
export const useMapConfigStore = defineStore('mapConfigStore', {
  state: () => ({
    stage: '',
  }),
  actions: {
    updateStage(stage) {
      this.stage = stage
    }
  },
});
