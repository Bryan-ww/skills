<template>
  <div class="progress-zebra">
    <div class="progress-container">
      <div class="progress-bar" :style="{ width: progressWidth }">
        <div class="zebra-stripes" :style="stripesStyle"></div>
      </div>
      <div class="progress-text" :style="{ color: valueColor }">
        <span class="progress-value">{{ progressValue }}</span>
        <span class="progress-unit">%</span>
      </div>
    </div>
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
      default: 1
    },
    valueColor: {
      type: String,
      default: '#ff0000'
    }
  });

  const progressWidth = computed(() => {
    const percentage = Number(parseFloat((props.value / props.maxValue) * 100).toFixed(2));
    return `calc(${percentage}% - ${0.005 * percentage}rem)`;
  });

  const progressValue = computed(() => {
    return Number(parseFloat((props.value / props.maxValue) * 100).toFixed(2));
  });

  const stripesStyle = computed(() => {
    return {
      backgroundImage: `linear-gradient(
      90deg,
      transparent 25%,
      ${props.valueColor} 25%,
      ${props.valueColor} 50%,
      transparent 50%,
      transparent 75%,
      ${props.valueColor} 75%,
      ${props.valueColor} 100%
    )`,
    };
  });
</script>

<style lang="scss" scoped>
  .progress-zebra {
    width: 100%;
    padding: 0.06rem 0;
    overflow: hidden;
    .progress-container {
      display: flex;
      align-items: center;
      width: 100%;
      height: 0.08rem;
      background: linear-gradient(180deg, #060c1c 0%, #06152e 100%);
      .progress-bar {
        height: 100%;
        overflow: hidden;
        .zebra-stripes {
          height: 100%;
          background-size: 0.16rem 0.16rem;
          animation: moveStripes 1s linear infinite;
          mask-image: linear-gradient(90deg, transparent 0%, black 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 100%);
        }
      }
      .progress-text {
        font-size: 0.12rem;
        &::before {
          content: '';
          display: inline-block;
          position: relative;
          top: 0.02rem;
          width: 0.03rem;
          height: 0.12rem;
          margin-right: 0.06rem;
          background: #fff;
        }
        .progress-unit {
          font-size: 0.1rem;
        }
      }
    }
  }

  @keyframes moveStripes {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0.16rem 0.16rem;
    }
  }
</style>
