<template>
  <div class="bigscreen-tab" :style="tabStyle">
    <div class="filter-box">
      <div
        class="filter-item"
        :class="{ 'is-active': tab === item.value, 'large': size === 'large', 'large-x': size === 'large-x' }"
        v-for="item in list"
        @click="handleTab(item)"
      >
        <span>{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
  tab: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: ''
  },
  tabStyle: {
    type: Object,
    default: () => {}
  }
})
const emits = defineEmits(['update:tab'])

const handleTab = (item) => {
  emits('update:tab', item.value);
}
</script>
<style scoped lang="scss">
.bigscreen-tab {
  position: absolute;
  z-index: 2;
  .filter-box {
    display: flex;
    height: 0.32rem;
    padding-top: 0.13rem;
    .filter-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 0.72rem;
      height: 0.2rem;
      font-size: 0.12rem;
      color: #d8f0ff50;
      text-align: center;
      background: url('/assets/images/screen/filter-btn-bg.png') left bottom no-repeat;
      background-size: 100%;

      &.large {
        width: 1.08rem;
        height: 0.24rem;
        font-size: 0.11rem;
      }
      &.large-x {
        width: 1.38rem;
        height: 0.24rem;
        font-size: 0.11rem;
        padding-left: 0.1rem;
      }
      cursor: pointer;
      &:not(:first-child) {
        margin-left: -0.13rem;
      }
      &.is-active {
        color: #d8f0ff;
        background: url('/assets/images/screen/filter-btn-bg-on.png') left bottom no-repeat;
        background-size: 100%;
        pointer-events: none;
        text-shadow: 0 0 0.05rem #0091ff, 0 0 0.1rem #0091ff, 0 0 0.15rem #0091ff, 0 0 0.2rem #0091ff, 0 0 0.3rem #0091ff, 0 0 0.4rem #0091ff;
      }
    }
  }
}
</style>
