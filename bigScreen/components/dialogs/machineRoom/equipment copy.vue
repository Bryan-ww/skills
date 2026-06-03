<template>
  <div class="equipment-panel">
    <!-- 传感器卡片 -->
    <div class="sensor-stack">
      <div class="sensor-card">
        <div class="sensor-card-head">
          <img src="/assets/images/screen/monitor-overview/sensor.png" class="card-icon" />
          <span>温湿度传感器</span>
        </div>
        <div class="sensor-card__body">
          <div v-for="(item, idx) in sensorTempHumidity" :key="`temp-${idx}`" class="sensor-row">
            <div class="sensor-line sensor-line--label">
              {{ item.title ?? '-' }}
            </div>
            <div class="sensor-pair">
              <div class="value-cell">
                <span class="value-cell__num">{{ item.temperature ? item.temperature + '°C' : '-' }}</span>
              </div>
              <div class="value-cell">
                <span class="value-cell__num">{{ item.humidity ? item.humidity + '%RH' : '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sensor-card">
        <div class="sensor-card-head">
          <img src="/assets/images/screen/monitor-overview/water-leak.png" class="card-icon" />
          <span>浸水监测器</span>
        </div>
        <div v-for="(item, idx) in waterLeak" :key="`water-${idx}`" class="sensor-line sensor-line--split">
          <span class="sensor-line__val">{{ item.value }}</span>
          <span class="sensor-line__divider" aria-hidden="true" />
          <span class="sensor-line__txt">{{ item.label }}</span>
        </div>
      </div>

      <div class="sensor-card">
        <div class="sensor-card-head">
          <img src="/assets/images/screen/monitor-overview/electricity.png" class="card-icon" />
          <span>市电检测仪</span>
        </div>
        <div v-for="(item, idx) in mainsDetect" :key="`mains-${idx}`" class="sensor-line sensor-line--split">
          <span class="sensor-line__val">{{ item.value }}</span>
          <span class="sensor-line__divider" aria-hidden="true" />
          <span class="sensor-line__txt">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <div class="tab-bar" role="tablist">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ 'is-active': activeTab === tab.key }"
        role="tab"
        :aria-selected="activeTab === tab.key"
        tabindex="0"
        @click="activeTab = tab.key"
        @keydown.enter.prevent="activeTab = tab.key"
        @keydown.space.prevent="activeTab = tab.key"
      >
        <img :src="tab.icon" class="tab-item__icon" />
        <span class="tab-item__label">{{ tab.label }}</span>
      </div>
    </div>

    <template v-if="activeTab === 'ups'">
      <div v-for="(ups, upsIndex) in upsList" :key="ups.id || upsIndex" class="ups-section">
        <div class="detail-title">
          <img src="/assets/images/screen/monitor-overview/to-right.png" class="detail-title-icon" />
          <span class="detail-title__text"> {{ ups.name }}</span>
        </div>

        <!-- 三相网格 -->
        <div class="ups-grid">
          <div class="ups-col">
            <div class="ups-col__caption">市电电压</div>
            <div v-for="(row, idx) in phaseRows" :key="`mains-${upsIndex}-${idx}`" class="phase-line">
              <span class="phase-line__label">{{ row }}</span>
              <div class="value-cell value-cell--phase">
                <span class="value-cell__num">{{ ups.mains && ups.mains[rowKey(idx)] ? ups.mains[rowKey(idx)] + 'V' : '-' }}</span>
              </div>
            </div>
          </div>
          <div class="ups-col">
            <div class="ups-col__caption">输出电压</div>
            <div v-for="(row, idx) in phaseRows" :key="`out-${upsIndex}-${idx}`" class="phase-line">
              <span class="phase-line__label">{{ row }}</span>
              <div class="value-cell value-cell--phase">
                <span class="value-cell__num">{{ ups.output && ups.output[rowKey(idx)] ? ups.output[rowKey(idx)] + 'V' : '-' }}</span>
              </div>
            </div>
          </div>
          <div class="ups-col">
            <div class="ups-col__caption">负载率</div>
            <div v-for="(row, idx) in phaseRows" :key="`load-${upsIndex}-${idx}`" class="phase-line">
              <span class="phase-line__label">{{ row }}</span>
              <div class="value-cell value-cell--phase">
                <span class="value-cell__num">{{ ups.load && ups.load[rowKey(idx)] ? ups.load[rowKey(idx)] + '%' : '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="battery-block">
          <div class="battery-block__title">电池信息</div>
          <div class="battery-line">
            <span class="battery-line__label">电池电压</span>
            <div class="value-cell value-cell--battery">
              <span class="value-cell__num">{{ ups.batteryVoltage ? ups.batteryVoltage + 'V' : '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="general-placeholder">
      <span>通用设备监测数据接入中</span>
    </div>
  </div>
</template>

<script setup>
  import { Box, Cpu, Lightning, Monitor, Warning } from '@element-plus/icons-vue';
  import { ref, toRefs } from 'vue';

  const props = defineProps({
    // 温湿度监测
    sensorTempHumidity: {
      type: Array,
      default: () => [
        {
          title: '1楼通UPS室温湿度',
          temperature: '-',
          humidity: '-',
        },
      ],
    },
    // 浸水监测
    waterLeak: {
      type: Array,
      default: () => [
        {
          value: '-',
          label: '2楼通讯机房漏水',
        },
      ],
    },
    // 市电监测
    mainsDetect: {
      type: Array,
      default: () => [
        {
          value: '-',
          label: '2楼通讯机房断电检测',
        },
      ],
    },
    // UPS
    upsList: {
      type: Array,
      default: () => [
        {
          id: 1,
          name: '科华UPS2',
          mains: { a: '-', b: '-', c: '-' },
          output: { a: '-', b: '-', c: '-' },
          load: { a: '-', b: '-', c: '-' },
          batteryVoltage: '-',
        },
      ],
    },
  });

  const { upsList } = toRefs(props);

  const tabs = [
    { key: 'ups', label: 'UPS机头', icon: '/assets/images/screen/monitor-overview/ups.png' },
    { key: 'general', label: '通用设备', icon: '/assets/images/screen/monitor-overview/common-device.png' },
  ];

  const activeTab = ref(tabs[0].key);
  const phaseRows = ['A相', 'B相', 'C相'];
  const rowKey = (idx) => ['a', 'b', 'c'][idx];
</script>

<style scoped lang="scss">
  $bg-deep: rgba(0, 20, 45, 0.4);
  $border: #004080;
  $border-bright: #0062bd;
  $text: #46b1ff;
  $text-white: #ffffff;

  .equipment-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    max-height: 100%;
    min-height: 0;
    padding: 6px 12px 10px;
    box-sizing: border-box;
    overflow: auto;
    background: rgba(0, 72, 174, 0.2);
    background-image: repeating-linear-gradient(-18deg, transparent, transparent 8px, rgba(0, 64, 128, 0.08) 8px, rgba(0, 64, 128, 0.08) 9px);
    border-radius: 4px;
    font-family: PingFangSC, PingFang SC;
    font-size: 12px;
    color: $text-white;
  }

  .sensor-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sensor-card {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 10px 10px 12px;
    border-radius: 4px;
    border: 1px solid $border-bright;
    background: rgba(0, 20, 45, 0.4);
    box-sizing: border-box;

    &-head {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
      font-size: 13px;
      font-weight: 500;
      color: $text;
      .card-icon {
        width: 18px;
        height: 18px;
      }
    }

    &__icon {
      font-size: 17px;
      color: $text;
    }

    &__body {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }

  .sensor-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sensor-line {
    box-sizing: border-box;
    width: 100%;
    min-height: 34px;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid $border;
    background: #013476;
    opacity: 0.5;

    &--label {
      display: flex;
      align-items: center;
      font-size: 12px;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.92);
    }

    &--split {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 6px 8px;
    }

    &__val {
      flex: 0 0 52px;
      text-align: center;
      font-size: 12px;
      font-weight: 400;
      color: $text-white;
    }

    &__divider {
      align-self: stretch;
      width: 1px;
      margin: 2px 10px;
      background: rgba(0, 98, 189, 0.65);
      flex-shrink: 0;
    }

    &__txt {
      flex: 1;
      min-width: 0;
      font-size: 11px;
      --height: 1.45;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .sensor-pair {
    display: flex;
    gap: 8px;
    width: 100%;

    .value-cell {
      flex: 1;
      min-width: 0;
    }
  }

  .value-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 4px 8px;
    border-radius: 4px;
    background: #013476;
    box-sizing: border-box;

    &--phase {
      flex: 1;
      min-width: 0;
      min-height: 28px;
      padding: 2px 6px;
    }

    &--battery {
      flex: 1;
      min-width: 0;
      min-height: 32px;
    }

    &__num {
      font-size: 12px;
      font-weight: 500;
      color: $text;
    }
  }

  .tab-bar {
    display: flex;
    align-items: stretch;
    gap: 10px;
  }

  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 10px 14px;
    box-sizing: border-box;
    background: linear-gradient(0deg, #007eff 0%, #002a54 100%);
    box-shadow: inset 0px 0px 11px 0px #00274c;
    border-radius: 4px;
    border: 2px solid;
    border-image: linear-gradient(360deg, rgba(91, 172, 255, 1), rgba(111, 182, 255, 1), rgba(9, 98, 160, 1)) 1 1;
    cursor: pointer;
    user-select: none;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

    &__icon {
      width: 18px;
      height: 18px;
    }

    &__label {
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      color: #ffffff;
    }

    &:hover:not(.is-active) {
      border-color: rgba(0, 240, 255, 0.55);
    }

    &.is-active {
      border-color: rgba(120, 230, 255, 0.85);
      background: linear-gradient(180deg, rgba(0, 88, 165, 0.98) 0%, rgba(0, 42, 95, 0.98) 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 0 28px rgba(0, 180, 255, 0.22), 0 0 14px rgba(0, 200, 255, 0.35);
    }

    &:focus-visible {
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 2px rgba(0, 200, 255, 0.45);
    }
  }

  .detail-title {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 4px;
    background: linear-gradient(270deg, rgba(0, 20, 45, 0) 0%, #0050ae 100%);
    border: 1px solid;
    border-image: linear-gradient(270deg, rgba(0, 98, 189, 0), rgba(0, 98, 189, 1)) 1 1;
    backdrop-filter: blur(1px);
    &-icon {
      width: 24px;
      height: 14px;
      font-size: 14px;
      font-weight: 600;
      color: $text;
      letter-spacing: -2px;
    }

    &__text {
      font-size: 13px;
      color: $text;
    }
  }

  .ups-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    align-items: start;
  }

  .ups-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 8px 6px 10px;
    border-radius: 4px;
    border: 1px solid rgba(0, 98, 189, 0.55);
    background: rgba(0, 20, 45, 0.4);

    &__caption {
      margin-bottom: 2px;
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      color: $text;
    }
  }

  .phase-line {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;

    &__label {
      flex: 0 0 24px;
      font-size: 12px;
      color: $text;
    }
  }

  .ups-section + .ups-section {
    margin-top: 12px;
  }

  .battery-block {
    padding: 10px;
    border-radius: 4px;
    border: 1px solid rgba(0, 98, 189, 0.55);
    background: rgba(0, 20, 45, 0.4);

    &__title {
      margin-bottom: 10px;
      font-size: 12px;
      font-weight: 500;
      color: $text;
    }
  }

  .battery-line {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;

    &__label {
      flex: 0 0 auto;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.92);
    }
  }

  .general-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    border-radius: 4px;
    border: 1px dashed rgba(0, 98, 189, 0.5);
    color: rgba(0, 254, 255, 0.55);
    font-size: 12px;
  }
</style>
