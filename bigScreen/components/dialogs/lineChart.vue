<template>
  <div class="chart-box" ref="contrastRef"></div>
</template>

<script setup>
  import moment from 'moment';
  import * as echarts from 'echarts';
  import { chartFontSize } from '@/utils';

  // 通行费与出口流量对比
  const contrastRef = ref();
  const contrastChart = shallowRef();
  const contrastArr = ref([
    { name: '告警数', valueField: 'count', color: '#0066C4', bgColorStart: '#0066C480', bgColorEnd: '#00315F00' },
  ]);

  const initContrastChart = (data) => {
    if (!contrastChart.value) {
      contrastChart.value = echarts.init(contrastRef.value);
    } else {
      contrastChart.value?.clear()
    }
    const xAxisData = [...new Set(data.map(item => item.dataTime))];
    const legendData = contrastArr.value.map((item) => ({
      name: item.name,
      value: item.valueField,
    }));
    const seriesData = [];
    legendData.forEach((ele, index) => {
      seriesData.push({
        name: ele.name,
        showSymbol: false,
        symbolSize: 8,
        barWidth: 8,
        barGap: '60%',
        smooth: true,
        type: 'line',
        itemStyle: {
          color: contrastArr.value[index].color,
        },
        lineStyle: {
          width: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: contrastArr.value[index].bgColorStart,
            },
            {
              offset: 1,
              color: contrastArr.value[index].bgColorEnd,
            },
          ]),
        },
        data: data.map(i => i[ele.value]),
        yAxisIndex: 0,
        animationDuration: 1800,
        animationEasing: 'cubicInOut',
      });
    });
    const legendArr = contrastArr.value.map((item) => item.name);
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // 设置黑色半透明背景
        borderColor: 'rgba(255, 255, 255, 0.3)', // 白色边框
        borderWidth: 1,
        padding: 6,
        textStyle: {
          color: '#96FFBE',
          fontSize: 14,
        },
      },
      legend: {
        itemWidth: 8,
        itemHeight: 4,
        textStyle: {
          color: 'rgba(255,255,255,0.8)',
          fontSize: 14,
        },
        data: legendArr,
        show: false,
      },
      grid: {
        left: 5,
        right: 0,
        top: 10,
        bottom: 5,
        containLabel: true,
      },
      xAxis: {
        data: xAxisData.map((item) => moment(item).format('YYYY-MM')),
        axisLine: {
          show: false, // 是否显示轴线
        },
        axisLabel: {
          fontSize: 14,
          color: 'rgba(255,255,255,0.8)',
          margin: 10,
          rotate: 20,
        },
      },
      yAxis: [
        {
          // name: '告警数',
          name: '',
          type: 'value',
          position: 'left',
          min: 0, // 最小值
          scale: true, // 自动计算刻度范围
          // minInterval: 1, // 最小刻度间隔
          // maxInterval: 50, // 最大刻度间隔
          nameGap: 15,
          nameTextStyle: {
            padding: [0, 30, 0, 0],
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
          },
          splitLine: {
            lineStyle: {
              opacity: 0.15,
              color: 'rgba(255,255,255,1)',
              type: 'dashed',
            },
          },
          axisLabel: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
          },
        },
      ],
      series: seriesData,
    };
    contrastChart.value.setOption(option);
  };

  const getChartData = () => {
    const data = [
      {
        count: 321,
        dataTime: '2025-10-01 00:00:00',
      },
      {
        count: 192,
        dataTime: '2025-11-01 00:00:00',
      },
      {
        count: 68,
        dataTime: '2025-12-01 00:00:00',
      },
      {
        flowIn: 267,
        count: 268,
        dataTime: '2026-01-01 00:00:00',
      },
      {
        count: 576,
        dataTime: '2026-02-01 00:00:00',
      },
      {
        count: 386,
        dataTime: '2026-03-01 00:00:00',
      },
    ];
    initContrastChart(data);
  };

  const handleResize = () => {
    contrastChart.value?.resize();
  };

  onMounted(() => {
    setTimeout(() => {
      getChartData();
      window.addEventListener('resize', handleResize);
    }, 200);
  });

  onUnmounted(() => {
    contrastChart.value?.dispose();
    window.removeEventListener('resize', handleResize);
  });
</script>

<style lang="scss" scoped>
  .chart-box {
    width: 100%;
    height: 100%;
  }
</style>
