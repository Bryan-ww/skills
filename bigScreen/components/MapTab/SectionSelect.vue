<template>
  <div v-show="show" class="section-select">
    <div class="flex" style="margin-top: 0.1rem;">
      <div class="device-category bigscreen-card-common-bg" style="padding-top: 0.1rem; padding-right: 0.2rem;">
        <div class="tab-list" v-for="(item, index) of layers" :class="{ 'active': item.checked }"
          :key="item.type">
          <div class="tab-left" :class="item.baseIcon">
            <span :class="item.type"></span>
            <span class="tab-name">{{ item.sectionName }}</span>
          </div>
          <div class="layer-check__not-checked" :class="{ 'checked': item.checked }"
            @click.stop="toggleCheckLayer(item)"></div>
        </div>
      </div>
      <div class="close-icon result-close-icon" @click="hide"></div>
    </div>
  </div>
</template>

<script setup>
import { useEventbus } from '../Map3D/hooks/useEventBus'
import {SectionStage} from '../Map3D/utils/subStages/SectionStage'

const eventBus = useEventbus()

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})
const emits = defineEmits(['hide'])

const layers = ref([
  {
    type: 'roadLevel',
    baseIcon: 'base4',
    checked: false,
    sectionName: 'G30哈土段',
    roadName: 'G30',
    start: 3017,
    end: 3362,
    "camera": {x: 2.9732726317203007, y: 5.436433151390193, z: 3.726615317586644},
    "target": {x: 3.161683431802282, y: 0.8900368679173776, z: -0.7186910517515744}, 
  },
  {
    type: 'roadLevel',
    baseIcon: 'base4',
    checked: false,
    sectionName: 'G30乌奎段',
    roadName: 'G30',
    start: 3717,
    end: 3843,
    "camera": {x: -1.6555405442312026, y: 5.514608892450523, z: 2.0763211643753063},
    "target": {x: -1.6082162942312026, y: 1.4976298424505237, z: -1.2496269356246923}, 
  },
])

const toggleCheckLayer = (item) => {
  if (item.checked) {
    return
  }
  layers.value.forEach((layer) => {
    layer.checked = false
  })
  item.checked = true
  eventBus.customEmitObject('changeRoadSection', item)
}

const hide = () => {
  emits('hide')
}
</script>

<style lang="scss" scoped>
.section-select {
  position: absolute;
  left: 0;
  top: 0.5rem;
  transform: scale(0.7);
  transform-origin: top left;

  .close-icon {
    position: absolute;
    right: 0.4rem;
    top: 0.11rem;
    width: 0.14rem;
    height: 0.14rem;
    background: url("/assets/images/layer_search/close.png") no-repeat center center;
    background-size: 100% 100%;
    cursor: pointer;
  }

  .result-close-icon {
    right: 0.16rem;
    top: 0.2rem;
  }


  .layer-check__not-checked {
    width: 0.2rem;
    height: 0.2rem;
    background: url("/assets/images/layer_search/not_check.png") no-repeat center center;
    background-size: 100% 100%;

    &.checked {
      background: url("/assets/images/layer_search/check.png") no-repeat center center;
      background-size: 100% 100%;
    }
  }


  .device-category {
    width: 2.4rem;
    margin-right: 0.1rem;
    padding: 0 0.1rem;
  }


  .tab-list {
    position: relative;
    width: 100%;
    height: 0.65rem;
    display: inline-flex;
    gap: 0.1rem;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
    margin-top: 0.05rem;
    margin-bottom: 0.05rem;
    padding: 0 0.1rem;
    position: relative;
    cursor: pointer;

    .tab-left {
      display: inline-flex;
      align-items: center;
      height: 100%;
      padding-left: 0.52rem;
      font-size: 0.16rem;
      color: #fff;
      font-style: normal;

      .tab-name {
        display: inline-block;
        width: max-content;
      }

      &.base0 {
        background: url('/assets/images/infras/base0.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base1 {
        background: url('/assets/images/infras/base1.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base2 {
        background: url('/assets/images/infras/base2.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base3 {
        background: url('/assets/images/infras/base3.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base4 {
        background: url('/assets/images/infras/base4.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base5 {
        background: url('/assets/images/infras/base5.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base6 {
        background: url('/assets/images/infras/base6.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base7 {
        background: url('/assets/images/infras/base7.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base8 {
        background: url('/assets/images/infras/base8.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base9 {
        background: url('/assets/images/infras/base9.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base10 {
        background: url('/assets/images/infras/base10.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base11 {
        background: url('/assets/images/infras/base11.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base12 {
        background: url('/assets/images/infras/base12.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base13 {
        background: url('/assets/images/infras/base13.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base14 {
        background: url('/assets/images/infras/base14.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base15 {
        background: url('/assets/images/infras/base15.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base16 {
        background: url('/assets/images/infras/base16.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base17 {
        background: url('/assets/images/infras/base17.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base18 {
        background: url('/assets/images/infras/base18.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      &.base19 {
        background: url('/assets/images/infras/base19.png') left center no-repeat;
        background-size: 0.5rem 100%;
      }

      .bridge {
        position: absolute;
        left: 0.24rem;
        top: 0.15rem;
        width: 0.23rem;
        height: 0.15rem;
        background: url('/assets/images/infras/bridge_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .camera {
        position: absolute;
        left: 0.26rem;
        top: 0.14rem;
        width: 0.19rem;
        height: 0.18rem;
        background: url('/assets/images/infras/camera_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .construct {
        position: absolute;
        left: 0.22rem;
        top: 0.12rem;
        width: 0.24rem;
        height: 0.24rem;
        background: url('/assets/images/infras/construct_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .highwayDiseases {
        position: absolute;
        left: 0.26rem;
        top: 0.13rem;
        width: 0.2rem;
        height: 0.19rem;
        background: url('/assets/images/infras/highwayDiseases_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .longMenJia {
        position: absolute;
        left: 0.23rem;
        top: 0.12rem;
        width: 0.23rem;
        height: 0.18rem;
        background: url('/assets/images/infras/longMenJia_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .newsBoard {
        position: absolute;
        left: 0.26rem;
        top: 0.15rem;
        width: 0.18rem;
        height: 0.18rem;
        background: url('/assets/images/infras/newsBoard_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .parking {
        position: absolute;
        left: 0.26rem;
        top: 0.15rem;
        width: 0.2rem;
        height: 0.2rem;
        background: url('/assets/images/infras/parking_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .roadLevel {
        position: absolute;
        left: 0.25rem;
        top: 0.16rem;
        width: 0.23rem;
        height: 0.15rem;
        background: url('/assets/images/infras/roadLevel_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .serviceArea {
        position: absolute;
        left: 0.25rem;
        top: 0.15rem;
        width: 0.22rem;
        height: 0.18rem;
        background: url('/assets/images/infras/serviceArea_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .slope {
        position: absolute;
        left: 0.22rem;
        top: 0.15rem;
        width: 0.23rem;
        height: 0.15rem;
        background: url('/assets/images/infras/slope_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .specialProject {
        position: absolute;
        left: 0.24rem;
        top: 0.15rem;
        width: 0.21rem;
        height: 0.19rem;
        background: url('/assets/images/infras/specialProject_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .subCenter {
        position: absolute;
        left: 0.26rem;
        top: 0.15rem;
        width: 0.23rem;
        height: 0.15rem;
        background: url('/assets/images/infras/subCenter_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .tollStation {
        position: absolute;
        left: 0.25rem;
        top: 0.15rem;
        width: 0.19rem;
        height: 0.18rem;
        background: url('/assets/images/infras/tollStation_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .trafficEvent {
        position: absolute;
        left: 0.26rem;
        top: 0.16rem;
        width: 0.19rem;
        height: 0.18rem;
        background: url('/assets/images/infras/trafficEvent_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .tunnel {
        position: absolute;
        left: 0.25rem;
        top: 0.13rem;
        width: 0.2rem;
        height: 0.2rem;
        background: url('/assets/images/infras/tunnel_f.png') left center no-repeat;
        background-size: auto 100%;
      }

      .weatherStation {
        position: absolute;
        left: 0.27rem;
        top: 0.14rem;
        width: 0.17rem;
        height: 0.2rem;
        background: url('/assets/images/infras/weatherStation_f.png') left center no-repeat;
        background-size: auto 100%;
      }
    }

    &.active {
      &::before {
        content: '';
        width: 0.02rem;
        height: 100%;
        position: absolute;
        left: -0.01rem;
        top: 0;
        background: #59d5f0;
      }
    }
  }
}
</style>