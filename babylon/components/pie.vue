<template>
  <div class="chartPie" ref="chargeChartPie"></div>
</template>

<script setup>
import * as echarts from "echarts";
import { ref, onMounted, nextTick } from "vue";
import im from "@/assets/imgs/svgs/svgs/p1.svg?url";
// import { useDevicePixelRatio } from '@vueuse/core'
// const { pixelRatio } = useDevicePixelRatio()
const pixelRatio = 1;
const props = defineProps({
  name: {
    type: String,
    default: "",
  },
});
let mychargeChartPie;
const chargeChartPie = ref(null);
let total = 0;
const option1 = {
  color: [
    "rgba(22, 200, 67, 1)",
    "rgba(0, 162, 255, 1)",
    "rgba(0, 234, 255, 1)",
    "rgba(252, 210, 8, 1)",
    "rgba(253, 151, 32, 1)",
  ],
  // tooltip: {
  //   trigger: 'item',
  //   label: {
  //     show: false
  //   },
  //   position: function (point, params, dom, rect, size) {
  //     // console.log(point,"point")
  //     // 固定在顶部
  //     return [
  //       point[0] > size.viewSize[0] / 2 ? point[0] - size.contentSize[0] : point[0],
  //       point[1] > size.viewSize[1] / 2 ? point[1] - 50 : point[1] + 50
  //     ]
  //   },
  //   formatter: (params) => {
  //     try {
  //       console.log(params)
  //       return [
  //         `${params.marker} ${params.name} <span style="font-weight:600">${params.value ?? '--'}</span>`
  //       ].join('<br />')
  //     } catch (error) {
  //       return ''
  //     }
  //   }
  // },
  legend: {
    width: "20%",
    height:"100%",
    bottom: "center",
    right: "0",
    itemWidth: 10,
    itemHeight: 10,
    icon: "path://M0,0 10,0 10,10 0,10 0,2 2,2 2,8, 8,8, 8,2, 0,2 0,0 Z M4,4 6,4 6,6 4,6 4,4 Z",
    orient: "vertical",
    type: "scroll",
    textStyle: {
      color: "#ffffff",
    },
    formatter: (name) => {
      const item = option1.series[0].data.find((item) => item.name == name);
      return `${item.name} ${item.value}   ${item.percent}%`;
    },
  },
  series: [
    {
      name: "",
      type: "pie",
      radius: ["56%", "80%"],
      // avoidLabelOverlap: false,
      center: ["30%", "50%"],
      // labelLayout: function (params) {
      //   const isLeft = params.labelRect.x < mychargeChartPie.getWidth() / 2;
      //   const points = params.labelLinePoints;
      //   // Update the end point.
      //   points[2][0] = isLeft
      //     ? params.labelRect.x
      //     : params.labelRect.x + params.labelRect.width;
      //   return {
      //     dy: -5,
      //     labelLinePoints: points,
      //   };
      // },
      label: {
        //   overflow: "none",
        //   minMargin: 5,
        //   edgeDistance: 5,
        //   formatter: (params) => {
        //     return [
        //       `{a|${params.name}}`,
        //       "\n",
        //       `{a| ${params.percent}%}`,

        //       // `{a| ${params.value}}`
        //     ].join("");
        //   },
        //   rich: {
        //     a: {
        //       color: "white",
        //       fontSize: 10,
        //       fontWeight: 400,
        //       align: "center",
        //       fontFamily: "hmb",
        //       // textBorderColor: 'rgb(22,255,255)',
        //       textBorderWidth: 1,
        //     },
        //   },
        //   // position: 'center',
        show: false,
      },
      labelLine: {
        show: false,
        //   length: 18,
        //   length2: 0,
        //   // maxSurfaceAngle: 80
      },

      data: [],
    },
  ],
};

onMounted(() => {
  mychargeChartPie = echarts.init(chargeChartPie.value);
});

const setOption = (data, _total, style) => {
  total = _total;
  const size = chargeChartPie.value.offsetHeight;
  option1.graphic = [
    {
      type: "group",
      bounding: "raw",
      left: "30%",
      top: "50%",
      z: 100,
      children: [
        {
          type: "image",
          left: "center",
          top: "center",
          z: 3,
          style: {
            width: size * 0.6,
            height: size * 0.6,
            image: im,
          },
        },
        {
          type: "circle",
          left: "center",
          top: "center",
          z: 4,
          shape: { r: size * 0.37 },
          style: { fill: "rgba(0, 0, 0, 0.5)" },
        },
      ],
    },
  ];
  option1.series[0].data = data;
  option1 && mychargeChartPie.setOption(option1);
  // high(data.length - 1);
};

let stopId;
const high = (num) => {
  let index = 0;

  if (stopId) {
    clearInterval(stopId);
  }
  stopId = setInterval(() => {
    if (index > num) {
      index = 0;
    }
    option1.series[0].data.forEach((item, index2) => {
      item.label = {
        // padding: [0, -60, 20, -40],
        formatter: (params) => {
          return [
            `{a|${params.name}}`,
            "\n",

            `{a| ${params.percent}%}`,
            // '\n',
            // `{a| ${params.value}}`
          ].join("");
        },
        rich: {
          a: {
            color: "white",
            // fontWeight: index == index2 ? 700 : 200,
            fontSize: index == index2 ? 11 : 10,
            align: "center",
          },
        },
        show: true,
      };
    });
    option1 && mychargeChartPie.setOption(option1);

    mychargeChartPie.dispatchAction({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: index,
    });
    mychargeChartPie.dispatchAction({
      type: "downplay",
      seriesIndex: 0,
      dataIndex: index - 1 < 0 ? num : index - 1,
    });

    index++;
  }, 1500);
};
defineExpose({
  setOption,
});
</script>

<style scoped>
.chartPie {
  width: 100%;
  height: 100%;
}
</style>
