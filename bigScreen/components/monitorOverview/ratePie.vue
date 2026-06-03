<template>
  <div class="satisfaction-symbol">
    <div class="statistics-item-box">
      <div class="item-tit">{{ title }}</div>
      <div class="item-num">
        <count-to class="num" :start-val="0" :end-val="rate" :decimals="2" />
        <span>%</span>
      </div>
    </div>
    <div class="water-container">
      <div class="water" :style="{ bottom: `${rate}%` }"></div>
      <div class="water" :style="{ bottom: `${rate - 5}%` }"></div>
    </div>
  </div>
</template>

<script setup>
  const props = defineProps({
    title: {
      type: String,
      default: '',
    },
    rate: {
      type: Number,
      default: 0,
    },
  });
</script>

<style scoped lang="scss">
  .satisfaction-symbol {
    width: 1.4rem;
    height: 1.4rem;
    position: relative;
    overflow: hidden;
    background: url('/assets/images/screen/manger/maintain/water-bg.png') left bottom no-repeat;
    background-size: 100%;
    @keyframes toRotate {
      50% {
        transform: rotate(180deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    .water-container {
      position: absolute;
      top: 0.12rem;
      right: 0.12rem;
      bottom: 0.12rem;
      left: 0.12rem;
      border-radius: 50%; /* 使背景成为圆形 */
      overflow: hidden; /* 隐藏超出圆形的泡泡 */
      .water {
        position: absolute;
        bottom: 10%;
        left: -25%;
        width: 150%;
        height: 150%;
        background-color: #00a4ff77;
        border-radius: 40% 35% 40% 45%;
        animation: toRotate 6s linear -2s infinite;
        &:last-child {
          background-color: #00a4ff66;
          animation: toRotate 4s linear -2s infinite;
        }
      }
    }
    .statistics-item-box {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
      .item-tit {
        font-weight: 500;
        font-size: 0.15rem;
        color: rgba(255, 255, 255, 0.9);
        line-height: 0.2rem;
      }
      .item-num {
        height: 0.29rem;
        font-size: 0.14rem;
        line-height: 0.29rem;
        letter-spacing: 0.01rem;
        align-items: baseline;
        background: -webkit-linear-gradient(180deg, #a1ffd6 0%, #8cfea7 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        color: #00da7a;
        transform: translate(0%, 0%);
        overflow: hidden;
        .num {
          font-size: 0.24rem;
          font-weight: 600;
        }
      }
    }
  }
</style>
