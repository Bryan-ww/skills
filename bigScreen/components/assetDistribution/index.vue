<template>
  <div class="asset-statistics-box">
    <div class="asset-value-box">
      <div class="asset-item-name">资产总数</div>
      <div class="flex items-baseline">
        <div class="asset-item-num">{{ totalCount }}</div>
        <span class="asset-item-unit">台</span>
      </div>
    </div>
    <div ref="chartRef" class="chart-box"></div>
  </div>
</template>

<script setup>
  import * as echarts from 'echarts';
  import { getDeviceSystemCount } from '@/api/bigscreen/index';
  import { chartFontSize } from '@/utils';
  import { startPieRotationAndUpdateLabel } from '@/hooks/manger/usePie';
  import { useSubCenterStore } from '@/views/bigScreen/components/MapTab/stores/useSubCenter.js';

  const subCenterStore = useSubCenterStore();
  const chartRef = ref();
  const myChart = shallowRef();
  const cleanupRotation = ref(null);
  const totalCount = ref(0);

  watch(() => subCenterStore.checkedId, () => {
    setTimeout(() => {
      getChartData();
    }, 1100);
  }, { immediate: true })

  onUnmounted(() => {
    cleanup()
  })

  // 清理旋转资源
  const cleanup = () => {
    if (cleanupRotation.value) {
      cleanupRotation.value();
      cleanupRotation.value = null;
    }
  };

  const initChart = (data) => {
    if (!myChart.value) {
      myChart.value = echarts.init(chartRef.value);
    }
    const color1 = ['#217DE600', '#76CD7500', '#E5B86500', '#BFCED200', '#04CDF600'];
    const color2 = ['#217DE6', '#76CD75', '#E5B865', '#BFCED2', '#04CDF6'];
    const option = {
      title: {
        // text: `设备总数\n${totalCount.value}`,
        right: '16.5%',
        top: 'center',
        textStyle: {
          color: '#ffffffe6',
          fontSize: chartFontSize(22, 1920),
          fontWeight: 500,
          lineHeight: chartFontSize(28, 1920),
          fontFamily: 'screenTitleFont',
        },
      },
      tooltip: {
        trigger: 'item',
        textStyle: {
          fontSize: chartFontSize(16, 1920),
        },
      },
      legend: {
        orient: 'vertial',
        itemWidth: chartFontSize(10, 1920),
        itemHeight: chartFontSize(10, 1920),
        itemGap: chartFontSize(9, 1920),
        icon: 'circle',
        left: chartFontSize(5, 1920),
        right: 'auto',
        bottom: '5%',
        data: data,
        formatter: (name) => {
          const value = data.find((item) => item.name === name).value;
          // const percent = data.find((item) => item.name === name).percent;
          // return `{name|${name}}{value|${value}}   {percent|${percent}%}`;
          return `{name|${name}}{value|${value}}台`;
        },
        textStyle: {
          color: '#fff',
          rich: {
            name: {
              verticalAlign: 'right',
              padding: [0, 0, 0, chartFontSize(8, 1920)],
              align: 'left',
              width: chartFontSize(80, 1920), // 调整宽度
              fontSize: chartFontSize(12, 1920),
              color: '#86C8FF',
            },
            value: {
              padding: [0, 0, 0, chartFontSize(8, 1920)],
              color: '#D8DDE3',
              fontSize: chartFontSize(12, 1920),
              width: chartFontSize(40, 1920), // 为百分比预留空间
            },
            percent: {
              padding: [0, 0, 0, chartFontSize(8, 1920)],
              color: '#D8DDE3',
              fontSize: chartFontSize(12, 1920),
            },
          },
        },
      },
      series: [
        {
          type: 'pie',
          center: ['73%', '50%'], // 圆心坐标
          radius: ['73%', '90%'], // 设置内外环半径
          label: {
            show: true,
            position: 'center',
            formatter: `{b}\n{d}`,
            color: '#fff',
            fontSize: chartFontSize(20, 1920),
            lineHeight: chartFontSize(28, 1920),
          },
          minAngle: 10, // 设置每一项的最小角度，确保最小宽度
          padAngle: 2,
          itemStyle: {
            color: (a) =>
              new echarts.graphic.LinearGradient(1, 0, 0, 1, [
                {
                  offset: 0,
                  color: color2[a.dataIndex % color2.length],
                },
                {
                  offset: 0.5,
                  color: color2[a.dataIndex % color2.length],
                },
                {
                  offset: 1,
                  color: color1[a.dataIndex % color1.length],
                },
              ]),
          },
          data: data,
        },
        // 外圈圆环
        {
          type: 'pie',
          center: ['73%', '50%'], // 圆心坐标
          radius: ['0%', '63%'], //设置内外环半径
          silent: true,
          label: {
            show: false, //不显示指引线
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: '#00D5FF00',
              },
              {
                offset: 0.5,
                color: '#A6CEFF30',
              },
              {
                offset: 1,
                color: '#00D5FF00',
              },
            ]),
          },
          data: [
            {
              value: 8,
            },
          ],
        },
      ],
    };
    myChart.value.setOption(option);
    cleanupRotation.value = startPieRotationAndUpdateLabel(myChart.value);
  };

  const getChartData = () => {
    cleanup();
    getDeviceSystemCount({ opsDeptId: subCenterStore.checkedId, }).then(({ data }) => {
      totalCount.value = (data.systems || []).reduce((acc, cur) => acc + cur.itemCount, 0);
      const chartData = (data.systems || []).map(item => {
        return {
          name: item.itemName,
          value: item.itemCount,
          percent: (item.itemCount / totalCount.value * 100).toFixed(2),
        }
      });
      initChart(chartData);
    })
  };
</script>

<style scoped lang="scss">
  .asset-statistics-box {
    .asset-value-box {
      display: flex;
      align-items: center;
      width: 50%;
      padding: 0.08rem 0.12rem;
      margin: 0.1rem 0 0 0.1rem;
      color: #fff;
      background: linear-gradient(90deg, rgba(0, 132, 255, 0.2) 0%, rgba(0, 157, 255, 0) 100%);
      .asset-item-name {
        margin-right: 0.12rem;
        font-size: 0.13rem;
        font-weight: 500;
        &::before {
          content: '';
          display: inline-block;
          width: 0.06rem;
          height: 0.06rem;
          margin: -0.02rem 0.08rem 0 0;
          border-radius: 50%;
          vertical-align: middle;
          background: #2ee6ff;
          box-shadow: 0 0 0.06rem 0.02rem rgba(31, 240, 240, 0.8);
        }
      }
      .asset-item-num {
        font-size: 0.26rem;
        line-height: 1;
        letter-spacing: 0.01rem;
        color: #00da7a;
        background: -webkit-linear-gradient(180deg, #00da7a 0%, #a1ffd6 100%);
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .asset-item-unit {
        font-size: 0.1rem;
        color: #00da7a;
      }
    }
    .chart-box {
      height: 2.2rem;
      margin-top: -0.36rem;
    }
  }
</style>
