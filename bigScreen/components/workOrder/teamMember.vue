<template>
  <div class="team-member-box">
    <div class="basic-title3 mt-[0.2rem]">
      <div class="title">机电团队人员情况</div>
    </div>
    <div class="team-member-content mt-[0.16rem]">
      <vue3ScrollSeamless v-if="memberData.length > 0" ref="scrollRef" class="scroll-wrap" :classOptions="classOptions" :dataList="memberData">
        <div class="member-list">
          <div v-for="(item, index) in memberData" :key="item.userId" class="member-item flex items-center" :class="index < 3 ? 'top3' : ''">
            <div class="member-avatar"></div>
            <div class="member-content">
              <div class="member-name">{{ item.name }}</div>
              <div class="member-count">{{ item.phone }}</div>
              <div class="member-score">评分：-</div>
              <div class="member-rate">故障修复率：-</div>
              <div class="member-rate">响应及时率：-</div>
            </div>
          </div>
        </div>
      </vue3ScrollSeamless>
    </div>
  </div>
</template>

<script setup>
  import { vue3ScrollSeamless } from 'vue3-scroll-seamless';
  import { getStaffInfoPage } from '@/api/bigscreen/index';
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';

  const subCenterStore = useSubCenterStore();
  const memberData = ref([]);
  const classOptions = {
    singleWidth: 0,
    waitTime: 2000,
    limitMoveNum: 3,
    direction: 3,
    hoverStop: true,
  };

  watch(() => subCenterStore.checkedId, (newVal) => {
    nextTick(() => {
      getData();
    })
  }, { immediate: true })

  const getData = () => {
    memberData.value = [];
    getStaffInfoPage({ deptId: subCenterStore.checkedId, current: 1, size: 100 }).then(({ data }) => {
      memberData.value = (data.records || []).map(item => ({ ...item, ...(item.user || {}) }));
    })
  }

  onMounted(() => {

  });
</script>

<style lang="scss" scoped>
  .team-member-box {
    .team-member-content {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.12rem;
      height: 1.3rem;
      color: rgba(255, 255, 255, 0.9);
      .member-list {
        display: flex;
      }
      .scroll-wrap {
        overflow: hidden;
      }
      .member-item {
        width: calc((5.4rem - 0.48rem - 0.12rem) / 2);
        gap: 0.1rem;
        padding: 0.12rem;
        margin-left: 0.12rem;
        border-radius: 0.02rem;
        border: 0.01rem solid #0062bd;
        background: linear-gradient(180deg, #00142d 0%, rgba(0, 81, 174, 0.8) 100%);
        .member-avatar {
          width: 0.77rem;
          height: 1.08rem;
          background: url('/assets/images/screen/avatar-bg.png') left center no-repeat;
          background-size: 100% 100%;
        }
        .member-name {
          font-size: 0.16rem;
          font-weight: 500;
          color: #f6f9fe;
          text-shadow: 0 0.02rem 0.08rem rgba(5, 28, 55, 0.42);
          background: linear-gradient(180deg, #31beff 0%, rgba(255, 255, 255, 1) 60%);
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .member-score {
          display: inline-block;
          min-width: 0.6rem;
          padding: 0.03rem 0.06rem;
          margin: 0.02rem 0 0.03rem;
          border-radius: 0.02rem;
          background: linear-gradient(180deg, #013476 0%, #0071f6 100%);
        }
        .member-rate {
          font-weight: 500;
          color: rgba(0, 183, 255, 0.9);
        }
      }
    }
  }
</style>
