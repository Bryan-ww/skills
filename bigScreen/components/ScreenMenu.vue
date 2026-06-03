<template>
  <div class="screen-menu" :class="{ 'is-open': isOpen }">
    <div class="logo">
      <div class="sys-tit screen-title">{{ systemTitle }}</div>
    </div>
    <template v-if="showNav">
      <div class="menu-box-wrap">
        <div class="date-box flex items-center">
          <div class="date-text mr-[0.24rem]">{{ currentDate }}</div>
          <div class="time-text">{{ currentTime }}</div>
        </div>
        <ul class="menu-list right">
          <li v-for="item in rightMenu" :key="item.name" class="menu-item" :class="{ 'is-active': item.value === tabName }" @click="onMenuClick(item.value)">
            <span class="menu-name screen-title" style="text-align: center;">
              {{ item.name }}<span v-if="item.plus" class="plus">{{ item.plus }}</span>
            </span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  const router = useRouter();

  const props = defineProps({
    tabName: {
      type: String,
      default: '',
    },
    showNav: {
      type: Boolean,
      default: true,
    },
  });
  const systemTitle = ref('机电一张图');
  const isOpen = ref(false);
  const rightMenu = ref([
    // {
    //   name: '服务区',
    //   plus: '＋',
    //   value: 'serviceArea',
    // },
    {
      name: '后台管理',
      value: '/selectSystem',
    },
  ]);
  const currentDate = ref('');
  const currentTime = ref('');
  let timer = null;

  const emit = defineEmits(['update:tabName', 'updateMenu']);
  const onMenuClick = (value) => {
    router.push(value);
  };

  const updateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    currentDate.value = `${year}.${month}.${day} ${weekday}`;
    currentTime.value = `${hours}:${minutes}:${seconds}`;
  };

  onMounted(() => {
    setTimeout(() => {
      isOpen.value = true;
    }, 1000);
    updateTime();
    timer = setInterval(updateTime, 1000);
  });

  onUnmounted(() => {
    clearInterval(timer);
  });
</script>
<style lang="scss">
  .screen-menu {
    position: absolute;
    width: 100%;
    height: 1rem;
    padding: 0 0.18rem;
    left: 0;
    // top: var(--big-screen-title-top);
    top: 0;
    z-index: 4;
    font-family: screenTitleFont;
    transform: translate(0%, -130%);
    transition: all 0.6s ease;
    background: linear-gradient(0deg, rgba(12, 19, 31, 0) 0%, rgba(12, 19, 31, 0.45) 36%, rgba(12, 19, 31, 0.7) 82%, #0b111c 100%);
    &.is-open {
      transform: translate(0, 0);
    }
    .logo {
      display: inline-block;
      width: 19.2rem;
      height: 1.2rem;
      position: absolute;
      padding: 0.18rem 0 0.2rem 0;
      left: 50%;
      transform: translate(-50%, 0%);
      background: url('/assets/images/screen/logo-bg.png') center no-repeat;
      background-size: 100%;
      z-index: 2;
      text-align: center;
      pointer-events: none;
      .sys-tit {
        display: inline-block;
        width: 7.2rem;
        height: 0.51rem;
        font-weight: normal;
        font-size: 0.42rem;
        color: #eff8fc;
        line-height: 0.5rem;
        letter-spacing: 0.03rem;
        text-shadow: 0rem 0rem 0.14rem rgba(130, 165, 255, 0.3), 0rem 0.03rem 0.01rem rgba(19, 80, 143, 0.4);
        text-align: center;
        font-style: normal;
        background: linear-gradient(90deg, #ffffff 0%, #ffffff 29%, #ffffff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        pointer-events: auto;
        cursor: pointer;
      }
    }
    .menu-box-wrap {
      display: flex;
      justify-content: space-between;
    }
    .date-box {
      position: relative;
      z-index: 3;
      font-size: 0.18rem;
      letter-spacing: 0.01rem;
      color: #56acff;
      .time-text {
        font-size: 0.2rem;
        font-weight: 500;
        color: #d8f0ff;
        text-shadow: 0 0 0.1rem #0091ff, 0 0 0.04rem #0091ff;
      }
    }
    .menu-list {
      display: flex;
      flex-wrap: nowrap;
      height: 0.72rem;
      padding-top: 0.12rem;
      position: relative;
      z-index: 3;
      .menu-item {
        display: inline-flex;
        width: 2.23rem;
        height: 0.57rem;
        padding-bottom: 0.08rem;
        align-items: center;
        justify-content: center;
        background: url('/assets/images/screen/left-menu-bg.png') center no-repeat;
        background-size: 100%;
        .menu-name {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.12rem;
          height: 0.24rem;
          font-weight: normal;
          font-size: 0.22rem;
          color: #a8d3fe;
          line-height: 0.24rem;
          letter-spacing: 0.01rem;
          text-align: left;
          font-style: normal;
          text-transform: none;
          cursor: pointer;
          transition: all 0.6s ease;
        }
        .plus {
          font-size: 0.32rem;
        }
        &.is-active {
          .menu-name {
            color: #ffffff;
          }
        }
        &:not(:first-child) {
          margin-left: -0.22rem;
        }
      }
      &.right {
        .menu-item {
          background: url('/assets/images/screen/right-menu-bg.png') center no-repeat;
          background-size: 100%;
        }
      }
    }
  }
</style>

