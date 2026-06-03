<template>
  <div class="analysis-box">
    <div class="basic-title3 mt-[0.2rem]">
      <div class="title">本月设备完好率统计分析</div>
    </div>
    <div class="top-list mt-[0.06rem]">
      <div v-for="(item, index) in chartData" :key="index" class="top-item flex items-center justify-between" :class="index < 3 ? 'top3' : ''">
        <div class="top-name" ref="nameRefs">
          <el-tooltip popper-class="screen-tooltip" :content="item.systemName" effect="dark" placement="top" :disabled="!isOverflow(item.systemName)">
            {{ item.systemName }}
          </el-tooltip>
        </div>
        <div class="top-num flex-1">
          <div class="flex items-center">
            <div class="count-item">设备数: {{ item.totalDeviceCount }}</div>
            <div class="count-item ml-[0.2rem]">故障数: {{ item.faultDeviceCount }}</div>
            <div class="count-item">完好数: {{ item.intactDeviceCount }}</div>
          </div>
          <progressOrder :value="item.integrityRate" :max-value="100" unit="%" :value-color="progressColors[index] || '#00d5ff'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, nextTick } from 'vue';
  import dayjs from 'dayjs';
  import { getEquipmentIntactData } from '@/api/melon/statistics';
  import progressOrder from './progressOrder.vue';

  const chartData = ref([]);
  const progressColors = ['#ff0000', '#fb6707', '#fbd901'];
  const nameRefs = ref([]);

  onMounted(() => {
    getData();
  });

  const getData = () => {
    const params = {
      startTime: dayjs().startOf('month').format('YYYY-MM-DD 00:00:00'),
      endTime: dayjs().endOf('month').format('YYYY-MM-DD 23:59:59'),
      granularity: 'DAY'
    }
    getEquipmentIntactData(params).then(({ code, data }) => {
      if (code === 0 && data && Array.isArray(data.systemIntegrityRates)) {
        chartData.value = data.systemIntegrityRates.sort((a, b) => b.integrityRate - a.integrityRate).slice(0, 4);
      }
    })
  };

  // 检查文字是否溢出
  const isOverflow = (text) => {
    // 创建临时元素来测量文字宽度
    const tempElement = document.createElement('span');
    tempElement.style.fontSize = '0.14rem';
    tempElement.style.whiteSpace = 'nowrap';
    tempElement.style.visibility = 'hidden';
    tempElement.style.position = 'absolute';
    tempElement.textContent = text;
    document.body.appendChild(tempElement);
    const textWidth = tempElement.offsetWidth;
    document.body.removeChild(tempElement);
    // 与容器(top-name)宽度比较
    const containerWidth = 120;
    return textWidth > containerWidth;
  };
</script>

<style lang="scss" scoped>
  .analysis-box {
    .top-list {
      font-size: 0.12rem;
      color: rgba(255, 255, 255, 0.7);
      .top-item {
        padding: 0.04rem 0;
        &.top3 {
          color: #fff;
        }
        .top-name {
          width: 120px;
          font-size: 0.14rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .top-num {
          flex: 1;
          margin-left: 10px;
          .count-item {
            width: 1rem;
          }
        }
      }
      :deep(.el-progress) {
        .el-progress-bar__outer {
          overflow: visible;
        }
      }
    }
  }
</style>
