<template>
  <div class="progress-order">
    <div class="progress-container">
      <div class="progress-bar" :style="{ width: progressWidth, backgroundColor: valueColor }"></div>
      <div class="progress-text" :style="{ color: valueColor }">
        <span class="progress-value">{{ value }}</span>
        <span class="progress-unit">{{ unit }}</span>
      </div>
    </div>
    <div class="progress-line" :style="{ borderColor: valueColor }"></div>
  </div>
</template>

<script setup>
  import { computed } from 'vue';

  const props = defineProps({
    value: {
      type: Number,
      default: 0
    },
    maxValue: {
      type: Number,
      default: 100
    },
    valueColor: {
      type: String,
      default: '#00d5ff'
    },
    unit: {
      type: String,
      default: '%'
    }
  });

  const progressWidth = computed(() => {
    const percentage = Number(parseFloat((props.value / props.maxValue) * 100).toFixed(2));
    return `calc(${percentage}% - ${0.0053 * percentage}rem)`;
  });
</script>

<style lang="scss" scoped>
  .progress-order {
    position: relative;
    width: 100%;
    padding: 0.06rem 0;
    overflow: hidden;
    .progress-container {
      display: flex;
      align-items: center;
      width: 100%;
      height: 0.02rem;
      .progress-bar {
        max-width: calc(100% - 0.53rem);
        height: 100%;
        border-radius: 0.1rem;
        overflow: hidden;
      }
      .progress-text {
        font-size: 0.12rem;
        &::before {
          content: '';
          position: relative;
          display: inline-block;
          width: 0.06rem;
          height: 0.06rem;
          bottom: 0.01rem;
          z-index: 9;
          margin-right: 0.06rem;
          border-radius: 50%;
          background: #fff;
        }
        .progress-unit {
          display: inline-block;
          font-size: 0.1rem;
          transform: scale(0.8);
        }
      }
    }
    .progress-line {
      position: relative;
      bottom: 0.02rem;
      opacity: 0.35;
      border-bottom: 0.02rem dotted #46b2ff;
    }
  }
</style>
