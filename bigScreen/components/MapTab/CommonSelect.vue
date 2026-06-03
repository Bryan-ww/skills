<template>
  <div v-if="show" class="layer-search-new" :style="{'width': width}">
    <div class="top">
      <div class="top__search bigscreen-card-common-bg">
        <input class="top__input" v-model="searchText" :placeholder="props.placeholder"
          @keyup.enter="inputSearch()"></input>
        <div v-if="searchText" class="close-icon ml-[0.1rem]" @click="inputSearchClear"></div>
        <div class="top__search-btn" @click="inputSearch()"></div>
      </div>
    </div>
    

    <div class="flex mt-[0.1rem] gap-[0.1rem] h-[5.3rem]">
      <slot name="left"></slot>

      <div class="result-box bigscreen-card-common-bg" >
        <div class="close-icon result-close-icon" @click="hide"></div>
       
        <div v-if="list?.length === 0 && !loading" class="pt-[0.4rem]">
          <screen-empty  class="bigscreen-empty" :image-size="120"></screen-empty>
        </div>
        
        <ScreenLoading v-if="loading" />
        <div v-show="!loading" class="result-scroll">
          <div v-for="(item, index) of list" :key="index" class="result-item" @click="toTarget(item)">
            <div class="result-item__left">
              {{ item.name }}
            </div>
            <!-- <div v-if="item.properties.onlineStatus" class="result-item__right" :class="{
              'online-color': item.properties.onlineStatus === 'ONLINE',
              'offline-color': item.properties.onlineStatus === 'OFFLINE',
            }">
              {{ item.properties.onlineStatus === 'ONLINE' ? '在线' : '离线' }}
            </div> -->
            <div class="result-item__right">
              {{ item.rightText }}
            </div>
          </div>
        </div>
      </div>

      <slot name="right"></slot>
    </div>
  </div>
</template>
<script setup>

const props = defineProps({
  placeholder: {
    type: String,
    default: '请输入'
  },
  list: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  width: {
    type: String,
    default: '4rem'
  }
})

const emit = defineEmits(['search', 'select'])
const show = ref(false)

const searchText = ref('')
const inputSearch = () => {
  emit('search', searchText.value)
}

const inputSearchClear = () => {
  searchText.value = ''
}

const toTarget = (item) => {
  emit('select', item)
}

const open = () => {
  show.value = true
}

const hide = () => {
  show.value = false
}

const getSearchText = () => {
  return searchText.value
}
 defineExpose({
  open,
  hide,
  getSearchText
})
</script>
<style lang="scss" scoped>
.layer-search-new {
  position: absolute;
  left: 1.1rem;
  width: 4rem;
  z-index: 1000;
  top: 0;
  transform: scale(0.7);
  transform-origin: top left;

  .online-color {
    color: #37ec37 !important;
  }

  .offline-color {
    color: red !important;
  }


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
    right: 0.1rem;
    top: 0.12rem;
  }

  .top {
    display: flex;
    height: 0.4rem;
    gap: 0.1rem;

    .top__location-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 0.5rem;
      height: 0.4rem;
      color: #30D8EE;
      font-size: 0.16rem;
      cursor: pointer;
    }

    .top__icon-img {
      width: 60%;
    }

    .top__search {
      display: flex;
      width: 0;
      flex: 1;
      align-items: center;
      padding: 0 0.1rem;
    }

    .top__input {
      width: 0;
      flex: 1;
      font-size: 0.16rem;
      color: #fff;
      height: 100%;
      background: transparent;
    }

    .top__search-btn {
      width: 0.24rem;
      height: 0.24rem;
      border-radius: 0.02rem;
      background: #1963D0 url("/assets/images/layer_search/search.png") no-repeat center center;
      background-size: 80% 80%;
      cursor: pointer;
    }
    .top__range {
      display: inline-flex;
      font-size: 0.16rem;
    }
    .top__range-item {
      display: flex;
      align-items: center;
      margin: 0 0.1rem;
      cursor: pointer;
      height: 100%;
      color: #fff;
      opacity: 0.5;

      &.active {
        opacity: 1;
      }
    }
  }

  .result-box {
    width: 0;
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: auto;
    padding: 0.4rem 0.1rem 0;

  }

  .result-tip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: rgba(216, 240, 255, 0.5);
    font-size: 0.16rem;
    margin: 0.1rem 0;
  }

  .result-scroll {
    flex: 1;
    height: 0;
    overflow: auto;

    &::-webkit-scrollbar-track-piece {
      background: transparent !important;
    }

    &::-webkit-scrollbar-thumb {
      background: #114BA0;
      border-radius: 0.05rem;
    }
  }

  .result-item {
    display: flex;
    align-items: center;
    height: 0.4rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 0 0.1rem;
    margin-bottom: 0.1rem;
    cursor: pointer;

    .result-item__left {
      width: 0;
      flex: 1;
      margin-right: 0.1rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.16rem;
      color: #32bcd7;
    }

    .result-item__right {
      font-size: 0.14rem;
      color: #fff;
    }
  }
}
</style>
