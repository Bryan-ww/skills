<template>
  <div class="modal_status_card" :style="{ zIndex: zIndex }">
    <div class="disp-card-control">
      <div>
        <div v-for="(value, key) in status" :label="`${key}：`">
          <div v-for="item in key">{{ item }}</div>
          <div style="margin-left: 0.2rem;">：</div>
        </div>
      </div>
      <div>
        <div v-for="(value, key) in status" :label="`${key}：`">
          {{ value }}
        </div>
      </div>
    </div>
    <!-- </Card2> -->
  </div>
</template>

<script setup>
import { getCurrentInstance, ref } from "vue";
// const app = getCurrentInstance().proxy;
const loading = ref(false);
const status = ref({});
const zIndex = ref(9000)
const setParams = (value, _zIndex = 9000) => {
  status.value = value;
  zIndex.value = _zIndex
  loading.value = false;
};
const close = () => {
  console.log("关闭");
  dialogVisible.value = false;
  emits("close");
};

defineExpose({
  setParams,
});
</script>

<style lang="scss" scoped>
.modal_status_card {
  pointer-events: none;
  background: rgba(23, 26, 44, 0.8);
  border: 1px solid rgba(136, 142, 182, 1);
  color: rgba(2, 243, 244, 1);
  left: -1000px;
  // right: 0;
  top: -1000px;
  // bottom: 0;
  // margin: auto;
  position: absolute;
  width: auto;
  height: auto;
  min-width: 80px;
  // flex: 1;
  // min-height: 240px;
  // height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
   border-radius: 4px;
  user-select: none;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__content) {
    font-size: 12px;
  }

  :deep(*) {
    color: rgba(2, 243, 244, 1);
  }
}
</style>

<style lang="scss" scoped>
.disp-card-control {
  flex: 1;
  display: flex;
  padding: 0.15rem 0.5rem;
  height: 100%;
  gap: 0.3rem;

  >div {
    display: flex;
    flex-direction: column;

    div {
      flex: 1;
      display: flex;
      line-height: 0.75rem;
      font-size: 0.625rem;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
