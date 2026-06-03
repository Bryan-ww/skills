<template>
  <div class="analysis-box">
    <div class="basic-title2">
      <div class="title">近一个月高频故障设备TOP</div>
    </div>
    <div class="main-box">
      <div class="list-header flex justify-between">
        <div class="flex gap-[0.16rem]">
          <div>排序</div>
          <div>设备类型</div>
        </div>
        <div class="flex gap-[0.16rem]">
          <div>故障率</div>
          <div class="">故障次数</div>
        </div>
      </div>
      <div v-for="(item, index) in rankList.slice(0, 3)" :key="index" class="top3">
        <div class="stat-item">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="items-level" :class="['items-level' + (index + 1)]">
                <div class="level">NO.{{ index + 1 }}</div>
              </div>
              <div class="items-name">{{ item.name }}</div>
            </div>
            <div class="item-value-box">
              <span class="item-value">{{ item.faultCount }}</span>
              <span class="item-unit">次</span>
            </div>
          </div>
          <progressZebra :value="item.faultRate" :value-color="progressColors[index] || '#01a8e9'" />
        </div>
      </div>
      <div class="scroll-container" @mouseover="pauseAutoplay" @mouseleave="resumeAutoplay">
        <Swiper :key="swiperKey" ref="swiperRef" :slides-per-view="2" :autoplay="{ delay: 1999, disableOnInteraction: false }" :speed="666" :direction="'vertical'" loop :modules="modules" class="swiper-content" @swiper="onSwiper">
          <SwiperSlide v-for="(item, index) in rankList.slice(3)" :key="index">
            <div class="stat-item">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="items-level" :class="['items-level' + (index + 4)]">
                    <div class="level">NO.{{ index + 4 }}</div>
                  </div>
                  <div class="items-name">{{ item.name }}</div>
                </div>
                <div class="item-value-box">
                  <span class="item-value">{{ item.faultCount }}</span>
                  <span class="item-unit">次</span>
                </div>
              </div>
              <progressZebra :value="item.faultRate" value-color="#01a8e9" />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { Swiper, SwiperSlide } from 'swiper/vue';
  import { Autoplay } from 'swiper/modules';
  import progressZebra from './progressZebra.vue';

  const progressColors = ['#f82d2d', '#f36407', '#e3c504'];
  const modules = [Autoplay];
  const swiperRef = shallowRef();
  const swiperKey = ref(0);

  const rankList = ref([]);
  const onSwiper = (swiper) => {
    swiperRef.value = swiper;
  };
  const pauseAutoplay = () => {
    swiperRef.value?.autoplay?.pause();
  };

  const resumeAutoplay = () => {
    swiperRef.value?.autoplay.start();
  };

  const gerRankData = () => {
    const data = [
      {
        id: '58491657',
        name: '车检器',
        faultCount: 4892,
        faultRate: 0.7618,
      },
      {
        id: '58491651',
        name: '配供电设备',
        faultCount: 4342,
        faultRate: 0.7486,
      },
      {
        id: '58491656',
        name: '门架',
        faultCount: 4197,
        faultRate: 0.7208,
      },
      {
        id: '58491655',
        name: '气象监测站',
        faultCount: 3895,
        faultRate: 0.705,
      },
      {
        id: '58491652',
        name: '隧道机电设备',
        faultCount: 3763,
        faultRate: 0.6308,
      },
      {
        id: '58491650',
        name: '通信设备',
        faultCount: 3258,
        faultRate: 0.6071,
      },
      {
        id: '58491654',
        name: '摄像头',
        faultCount: 2894,
        faultRate: 0.4829,
      },
      {
        id: '58491648',
        name: '收费设备',
        faultCount: 2611,
        faultRate: 0.4435,
      },
      {
        id: '58491649',
        name: '监控设备',
        faultCount: 2437,
        faultRate: 0.4232,
      },
      {
        id: '58491653',
        name: '情报板',
        faultCount: 2075,
        faultRate: 0.3838,
      },
      {
        id: '58491658',
        name: '应急设备',
        faultCount: 919,
        faultRate: 0.2679,
      },
    ];
    rankList.value = data.slice(0, 10)
    swiperKey.value = Date.now() + 100 * Math.random();
  };

  onMounted(() => {
    gerRankData();
  });
</script>

<style lang="scss" scoped>
  .analysis-box {
    width: 100%;
    .main-box {
      margin-top: 0.05rem;
      padding-left: 0.1;
      width: 100%;
      .list-header {
        padding: 0.1rem 0.16rem;
        font-size: 0.14rem;
        color: #3f9fe5;
        background: #101827;
      }
      .scroll-container {
        height: 100%;
        width: 100%;
        height: 1.04rem;
        .swiper-content {
          width: 100%;
          height: 100%;
          .swiper-scrollbar {
            background: transparent;
          }
        }
        .swiper-slide {
          height: 0.4rem !important;
          margin-top: 0.12rem;
        }
      }
      .top3 {
        margin-top: 0.12rem;
        &:first-child {
          margin-top: 0;
        }
      }
      .stat-item {
        height: 0.4rem;
        font-size: 0.12rem;
        color: #fff;
        .items-level {
          width: 0.54rem;
          height: 0.18rem;
          margin-right: 0.05rem;
          text-align: center;
          background: url('@/assets/imgs/screen/no4.png') left bottom no-repeat;
          background-size: 100% 100%;
          &.items-level1 {
            background-image: url('@/assets/imgs/screen/no1.png');
          }
          &.items-level2 {
            background-image: url('@/assets/imgs/screen/no2.png');
          }
          &.items-level3 {
            background-image: url('@/assets/imgs/screen/no3.png');
          }
          .level {
            font-size: 0.11rem;
            line-height: 0.18rem;
          }
        }
        .items-name {
          color: rgba(255, 255, 255, 0.9);
        }
        .item-value {
          font-size: 0.14rem;
        }
        .item-unit {
          font-size: 0.1rem;
          color: #7195c0;
        }
      }
    }
  }
</style>
