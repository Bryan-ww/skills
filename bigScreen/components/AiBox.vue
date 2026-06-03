<template>
  <div ref="aiLogo" v-show="show" :style="draggableStyle"  class="draggable ai-drag-logo pointer-events-auto">
    <div class="ai-help-wrapper" @click="handleChange">
      <div class="loader"></div>
    </div>
  </div>
</template>
<script setup>
  import { useEventbus } from '@/hooks/useEventbus';
  import { useDraggable, useWindowSize } from '@vueuse/core';
  const eventBus = useEventbus();
  const show = ref(true);
  const el = ref();
  const tabName = ref('road');
  const aiLogo = ref();
  // 获取窗口尺寸
  const { height: windowHeight } = useWindowSize();
  const isMove = ref(false);
  const initialY = computed(() => Math.max(0, Math.floor(windowHeight.value) - 200));
  watch(
    tabName,
    (newValue) => {
      if (!aiLogo.value) {
        return;
      }
      const x = window.innerWidth * 0.66 - 100;
      const y = initialY;
      aiLogo.value.style.left = `${x + 200}px`;
      aiLogo.value.style.top = `${y + 100}px`;
    },
    { immediate: true }
  );

  const {
    x,
    y,
    style: draggableStyle,
  } = useDraggable(el, {
    initialValue: { x: window.innerWidth * 0.66 - 100, y: initialY },
    preventDefault: true,
    stopPropagation: true,
    onMove: (pos, z) => {
      isMove.value = true;
    },
    onEnd: () => {
      setTimeout(() => {
        isMove.value = false;
      }, 300);
    },
  });

  const handleChange = () => {
    if (isMove.value) {
      return;
    }
    eventBus.customEmitObject('showAiChat', {});
  };
  onMounted(() => {
    tabName.value = '12312';
  });
</script>
<style lang="scss" scoped>
  .ai-drag-logo {
    position: fixed;
    width: 0.9rem;
    height: 0.9rem;
    position: fixed;
    z-index: 49;
    cursor: pointer;
  }
  .pointer-events {
    pointer-events: none;
  }
  .pointer-events-auto {
    pointer-events: auto;
  }
  .ai-help-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 50%;
    user-select: none;
    background: url('/assets/images/ai.png') center center no-repeat;
    background-size: 45% 0.36rem;

    .loader {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background-color: transparent;
      animation: ai-loader-rotate 2s linear infinite;
      z-index: 0;
    }

    .loader-letter {
      display: inline-block;
      opacity: 0.4;
      transform: translateY(0);
      animation: ai-loader-letter-anim 2s infinite;
      z-index: 1;
      border-radius: 50ch;
      border: none;
    }

    .loader-letter:nth-child(1) {
      animation-delay: 0s;
    }
    .loader-letter:nth-child(2) {
      animation-delay: 0.1s;
    }
    .loader-letter:nth-child(3) {
      animation-delay: 0.2s;
    }
    .loader-letter:nth-child(4) {
      animation-delay: 0.3s;
    }
    .loader-letter:nth-child(5) {
      animation-delay: 0.4s;
    }
    .loader-letter:nth-child(6) {
      animation-delay: 0.5s;
    }
    .loader-letter:nth-child(7) {
      animation-delay: 0.6s;
    }
    .loader-letter:nth-child(8) {
      animation-delay: 0.7s;
    }
    .loader-letter:nth-child(9) {
      animation-delay: 0.8s;
    }
    .loader-letter:nth-child(10) {
      animation-delay: 0.9s;
    }
  }

  @keyframes ai-loader-rotate {
    0% {
      transform: rotate(90deg);
      box-shadow: 0 0.05rem 0.1rem 0 #fff inset, 0 0.1rem 0.2rem 0 #ad5fff inset, 0 0.2rem 0.3rem 0 #471eec inset;
    }
    50% {
      transform: rotate(270deg);
      box-shadow: 0 0.05rem 0.1rem 0 #fff inset, 0 0.1rem 0.2rem 0 #d60a47 inset, 0 0.2rem 0.3rem 0 #311e80 inset;
    }
    100% {
      transform: rotate(450deg);
      box-shadow: 0 0.05rem 0.1rem 0 #fff inset, 0 0.1rem 0.2rem 0 #ad5fff inset, 0 0.2rem 0.3rem 0 #471eec inset;
    }
  }

  @keyframes ai-loader-letter-anim {
    0%,
    100% {
      opacity: 0.4;
      transform: translateY(0);
    }
    20% {
      opacity: 1;
      transform: scale(1.15);
    }
    40% {
      opacity: 0.7;
      transform: translateY(0);
    }
  }
</style>
