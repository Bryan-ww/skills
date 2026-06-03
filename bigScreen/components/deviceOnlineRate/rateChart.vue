<template>
  <div ref="chartRef" class="chart-box"></div>
</template>

<script setup>
  import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
  import * as echarts from 'echarts';
  import { chartFontSize } from '@/utils';

  const props = defineProps({
    title: {
      type: String,
      default: '完成率',
    },
    value: {
      type: Number,
      default: 0,
    },
    colors: {
      type: Array,
      default: () => ['#246BFD', '#8FEBFF'],
    },
  });

  const chartRef = ref();
  const myChart = shallowRef();

  watch(
    () => props.value,
    () => {
      setTimeout(() => {
        initChart();
      }, 1100);
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (myChart.value) {
      myChart.value.dispose();
    }
  });

  const initChart = () => {
    if (!myChart.value) {
      myChart.value = echarts.init(chartRef.value);
    }
    const percentage = (props.value * 100).toFixed(2);
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}%',
        textStyle: {
          fontSize: chartFontSize(16, 1920),
        },
      },
      animation: true, 
      animationDuration: 3000, 
      animationDelay: 300,
      animationEasing: 'cubicOut',
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 10,
          radius: '95%',
          center: ['50%', '50%'],
          axisLine: {
            lineStyle: {
              width: 10,
              color: [[1, 'rgba(30, 91, 141, 0.8)']],
            },
          },
          progress: {
            show: true,
            width: 10,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: props.colors[0] || '#246BFD',
                },
                {
                  offset: 1,
                  color: props.colors[1] || '#8FEBFF',
                },
              ]),
            },
          },
          pointer: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
          title: {
            show: true,
            offsetCenter: [0, '5%'],
            fontSize: chartFontSize(13, 1920),
            color: 'rgba(255, 255, 255, 0.8)',
          },
          detail: {
            show: true,
            valueAnimation: true,
            formatter: '{value}%',
            color: '#9AFFC7',
            fontSize: chartFontSize(24, 1920),
            fontWeight: 500,
            offsetCenter: [0, '-30%'],
          },
          data: [
            {
              value: percentage,
              name: props.title,
            },
          ],
        },
      ],
    };

    myChart.value.setOption(option);
  };
</script>

<style scoped lang="scss">
  .chart-box {
    width: 100%;
    height: 100%;
  }
</style>
