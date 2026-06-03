<template>
  <div class="big-screen">
    <!-- 2D地图 -->
    <Map2D />
    <!-- 顶部菜单 -->
    <ScreenMenu />
    <!-- 顶部盒子 -->
    <TopCenterBox />
    <!-- 左侧盒子 -->
    <LeftBox />
    <!-- 右侧盒子 -->
    <RightBox />
    <!-- AI启动按钮 -->
    <!-- <AiBox /> -->
    <!-- AI聊天框 -->
    <AiChat />
    <MapTab />
  </div>
</template>

<script setup>
  import { NextLoading } from '/@/utils/loading';
  import { refreshRem, removeRem } from '/@/utils/flexible.js';
  import { useEventbus } from '@/hooks/useEventbus';

  // 组件
  // import AiBox from './components/AiBox.vue';
  import AiChat from './components/AiChat.vue';
  import Map2D from './components/Map3D/index2D.vue';
  import ScreenMenu from './components/ScreenMenu.vue';
  import TopCenterBox from './components/TopCenterBox.vue';
  import LeftBox from './components/LeftBox.vue';
  import RightBox from './components/RightBox.vue';
  import MapTab from './components/MapTab/index.vue';

  // store
  import { useTollStationStore } from '@/views/bigScreen/components/MapTab/stores/useTollStation.js';
  import { useMachineRoomStore } from '@/views/bigScreen/components/MapTab/stores/useMachineRoom.js';
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter';

  // 事件总线
  const eventbus = useEventbus();

  const subCenterStore = useSubCenterStore();
  const tollStationStore = useTollStationStore();
  const machineRoomStore = useMachineRoomStore();

  // 获取所有的分中心
  subCenterStore.updateList().then(() => {
    // 获取所有的收费站以待使用
    tollStationStore.updateListByIOT().then(() => {
      // 获取所有的机房以待使用
      machineRoomStore.updateList();
    });
  });

  NextLoading.done();

  onMounted(() => {
    refreshRem();
    window.addEventListener('resize', refreshRem);
  });
  onUnmounted(() => {
    removeRem();
    window.removeEventListener('resize', refreshRem);
  });
</script>

<style lang="scss" scoped>
  .big-screen {
    position: relative;
    width: 100vw;
    height: 100vh;
  }
</style>
