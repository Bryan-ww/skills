<template>
  <div class="w-full h-full controller-wrap">
    <div class="room-title" v-if="data.name">
      <el-icon class="room-title__icon" @click="stepAction('prev')"><ArrowLeftBold /></el-icon>
      <span class="room-title__text">{{ data.name }}</span>
      <el-icon class="room-title__icon" @click="stepAction('next')"><ArrowRightBold /></el-icon>
    </div>
    <div class="controller" v-if="currentDevice">
      <transition :name="transitionName" mode="out-in">
        <div :key="currentIndex" class="controller-item">
          <div class="item-icon">
            <img :src="currentDevice?.icon" class="w-[30px] h-[22px]" />
          </div>
          <div class="desc">
            <div class="desc-title">{{ currentDevice?.name }}</div>
            <div :class="['desc-state', currentDevice?.state === 0 ? 'offline' : 'online']">
              <img
                :src="
                  currentDevice?.state === 1
                    ? '/assets/images/screen/monitor-overview/online.png'
                    : '/assets/images/screen/monitor-overview/offline.png'
                "
                class="w-[13px] h-[13px]"
              />
              <span>{{ currentDevice?.state === 1 ? '在线' : '已离线' }}</span>
            </div>
            <div class="extra">
              <span>{{ currentDevice?.extra }}</span>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
  import { ArrowLeftBold, ArrowRightBold } from '@element-plus/icons-vue';

  const props = defineProps({
    data: {
      type: Object,
      default: () => ({ name: '', deviceList: [] }),
    },
  });

  const currentIndex = ref(0);
  const transitionName = ref('slide-left');
  const currentDevice = computed(() => {
    return props.data?.deviceList?.[currentIndex.value] || null;
  });
  const stepAction = (type) => {
    if (type === 'prev') {
      transitionName.value = 'slide-left';
      if (currentIndex === 0) return;
      currentIndex.value = currentIndex.value - 1 < 0 ? props.data.deviceList.length - 1 : currentIndex.value - 1;
    } else {
      transitionName.value = 'slide-right';
      if (currentIndex === props.data.deviceList.length - 1) return;
      currentIndex.value = currentIndex.value + 1 > props.data.deviceList.length - 1 ? 0 : currentIndex.value + 1;
    }
  };
</script>
<style scoped lang="scss">
  .controller-wrap {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .room-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 40px;
    margin-bottom: 20px;
    box-sizing: border-box;
    line-height: 40px;
    border-radius: 20px;
    background: #013476;
    font-family: PingFangSC, PingFang SC;

    &__text {
      flex: 1;
      min-width: 0;
      text-align: center;
    }

    &__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      font-size: 14px;
      color: #1f9dff;
      border-radius: 50%;
      border: 2px solid #0062bd;
      background: #013476;
      cursor: pointer;
    }
  }
  .controller {
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    gap: 16px;
    font-family: PingFangSC, PingFang SC;
    &-item {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 20px;
      height: 110px;
      padding: 20px;
      border-radius: 2px;
      border: 1px solid #0062bd;
      background: rgba(0, 20, 45, 0.4);
      backdrop-filter: blur(1.10363912582398px);
      width: 100%;
      .item-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 70px;
        height: 70px;
        background: linear-gradient(180deg, #000f2d 0%, #0051cb 100%);
        border-radius: 2px;
        border: 1px solid #0062bd;
        // backdrop-filter: blur(1.10363912582398px);
      }
      .desc {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        color: #fff;
        &-title {
          margin-left: 30px;
          width: 100%;
          font-size: 14px;
          line-height: 20px;
          margin-bottom: 10px;
          text-align: left;
        }
        &-state {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 136px;
          height: 32px;
          padding: 0 12px;
          box-sizing: border-box;
          line-height: 32px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 12px;
          text-align: left;
          gap: 4px;
          &.offline {
            background: #002c6e;
            color: #46b1ff;
          }
          &.online {
            background: #0047b0;
            color: #fff;
          }
        }
        .extra {
          position: absolute;
          top: 16px;
          right: 16px;
          font-size: 12px;
          color: #46b1ff;
          line-height: 17px;
          text-align: center;
        }
      }
    }
  }

  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition: all 0.3s ease;
  }

  .slide-left-enter-from {
    transform: translateX(100%);
    opacity: 0;
  }

  .slide-left-leave-to {
    transform: translateX(0%);
    opacity: 0;
  }

  .slide-right-enter-from {
    transform: translateX(100%);
    opacity: 0;
  }

  .slide-right-leave-to {
    transform: translateX(-100%);
    opacity: 0;
  }
</style>
