<template>
  <div class="device-online-rate mt-[0.3rem]">
    <div class="basic-title2 title-box">
      <div class="title">工单完成及设备在线率</div>
      <!-- <div class="filter-box dark-select-box mr-[0.1rem]">
        <el-select v-model="currentYear" class="custom-bg w-[112px]" size="small" :teleported="false" placeholder="请选择" @change="onCurrentYearChange">
          <el-option v-for="item in yearOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </div> -->
    </div>
    <div class="device-rate-box flex items-center">
      <div class="rate-item">
        <div class="chart-container">
          <rateChart title="故障工单完成率" :value="(statData.faultOrderCompletionRate.percentage || 0) / 100" />
        </div>
        <div class="count-box">
          <div class="count-item">
            <div class="count-label">总数</div>
            <div class="count-value total">{{ statData.faultOrderCompletionRate.total || 0 }}</div>
          </div>
          <div class="count-item">
            <div class="count-label">已完成</div>
            <div class="count-value">{{ statData.faultOrderCompletionRate.completed || 0 }}</div>
          </div>
        </div>
      </div>
      <div class="rate-item">
        <div class="chart-container">
          <rateChart title="巡检工单完成率" :value="(statData.patrolOrderCompletionRate.percentage || 0) / 100" :colors="['#00B97F', '#A7FFC1']" />
        </div>
        <div class="count-box">
          <div class="count-item">
            <div class="count-label">总数</div>
            <div class="count-value total">{{ statData.patrolOrderCompletionRate.total || 0 }}</div>
          </div>
          <div class="count-item">
            <div class="count-label">已完成</div>
            <div class="count-value">{{ statData.patrolOrderCompletionRate.completed || 0 }}</div>
          </div>
        </div>
      </div>
      <div class="rate-item">
        <div class="chart-container">
          <rateChart title="设备完好率" :value="(statData.deviceIntegrityRate.percentage || 0) / 100" />
        </div>
        <div class="count-box">
          <div class="count-item">
            <div class="count-label">总数</div>
            <div class="count-value total">{{ statData.deviceIntegrityRate.total || 0 }}</div>
          </div>
          <div class="count-item">
            <div class="count-label">完好数</div>
            <div class="count-value">{{ statData.deviceIntegrityRate.completed || 0 }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import dayjs from 'dayjs';
  import overviewApi from '@/api/melon/overview/index';
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';
  import rateChart from './rateChart.vue';

  const subCenterStore = useSubCenterStore();
  const currentYear = ref(dayjs().format('YYYY'));
  const yearOptions = ref([]);
  const statData = reactive({
    faultOrderCompletionRate: {}, // 故障工单完成率数据
    patrolOrderCompletionRate: {}, // 巡检工单完成率数据
    deviceIntegrityRate: {}, // 合并设备完好率数据
  });

  watch(() => subCenterStore.checkedId, () => {
    nextTick(() => {
      getStatData();
    })
  }, { immediate: true })

  onBeforeMount(() => {
    setYearOptions();
  });

  const setYearOptions = () => {
    const startYear = 2025;
    const currentYearNum = parseInt(dayjs().format('YYYY'));
    const options = [];
    for (let year = startYear; year <= currentYearNum; year++) {
      options.push({
        value: year.toString(),
        label: `${year}年`
      });
    }
    yearOptions.value = options;
  };

  const getStatData = () => {
    overviewApi.monthlyStat({ opsDeptId: subCenterStore.checkedId, }).then(({ data }) => {
      if (data) {
        statData.faultOrderCompletionRate = data.faultOrderCompletionRate || {};
        statData.patrolOrderCompletionRate = data.patrolOrderCompletionRate || {};
        statData.deviceIntegrityRate = data.deviceIntegrityRate || {};
      }
    });
  }

  const onCurrentYearChange = (value) => {
    // console.log('onCurrentYearChange:', value);
  };

</script>

<style scoped lang="scss">
  .device-online-rate {
    .title-box {
      display: flex;
      justify-content: space-between;
      .filter-box {
        display: flex;
        align-items: center;
      }
    }
    .device-rate-box {
      gap: 0.16rem;
      .rate-item {
        flex: 1;
        .chart-container {
          height: 1.6rem;
        }
        .count-box {
          display: flex;
          align-items: center;
          position: relative;
          padding: 0.1rem 0;
          margin: -0.6rem 0 0;
          border-radius: 0.02rem;
          border: 0.01rem solid;
          backdrop-filter: blur(0.01rem);
          border-image: linear-gradient(180deg, rgba(0, 98, 189, 0.3), rgba(0, 98, 189, 1)) 1 1;
          &:before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 1;
            opacity: 0.3;
            background: linear-gradient(180deg, #00142d 0%, #0050ae 100%);
          }
          .count-item {
            position: relative;
            z-index: 2;
            flex: 1;
            width: 50%;
            text-align: center;
            .count-label {
              font-size: 0.12rem;
              font-weight: 500;
              color: #00b7ff;
            }
            .count-value {
              margin-top: 0.01rem;
              font-size: 0.14rem;
              font-weight: 600;
              color: #ffcc23;
              &.total {
                color: #23ff62;
              }
            }
          }
        }
      }
    }
  }
</style>
