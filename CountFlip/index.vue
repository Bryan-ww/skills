<template>
  <div class="count-flip" :class="{ 'count-flip--static': !animate }" :style="rootStyle" role="group" :aria-label="ariaLabel">
    <div v-for="(char, index) in displayChars" :key="getTileKey(index, char)" class="count-flip__tile" :style="tileStyle">
      <div class="count-flip__viewport">
        <div class="count-flip__strip" :style="getStripStyle(index)">
          <span v-for="(item, stripIndex) in getStripItems(index)" :key="stripIndex" class="count-flip__digit" :style="digitStyle">
            {{ item }}
          </span>
        </div>
      </div>
    </div>
    <slot name="suffix"></slot>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch, onMounted, nextTick, type CSSProperties } from 'vue';
  import { formatCountFlipValue, type CountFlipFormatOptions } from './format';

  const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

  const props = withDefaults(
    defineProps<{
      value?: number;
      count?: number;
      unit?: string;
      unitThreshold?: number;
      showDecimal?: boolean;
      decimalPlaces?: number;
      divideRatio?: number;
      tileBg?: string;
      tileWidth?: string;
      tileHeight?: string;
      gap?: string;
      fontSize?: string;
      color?: string;
      fontFamily?: string;
      /** 每个牌子滚动动画持续时长（毫秒） */
      duration?: number;
      /** 每个牌子启动延迟间隔（毫秒），0 表示同时开始 */
      stagger?: number;
      animate?: boolean;
      /** 是否直接展示 */
      immediate?: boolean;
      /** 进场时额外滚动的整圈数（0-9 循环次数） */
      rollLaps?: number;
    }>(),
    {
      value: 0,
      count: 9,
      unit: '万',
      unitThreshold: 1_000_000,
      showDecimal: true,
      decimalPlaces: 1,
      divideRatio: 10_000,
      tileBg: '',
      tileWidth: '0.36rem',
      tileHeight: '0.48rem',
      gap: '0.04rem',
      fontSize: '0.32rem',
      color: '#ffffff',
      fontFamily: 'screenTitleFont, DIN Alternate, Arial, sans-serif',
      duration: 1200,
      stagger: 0,
      animate: true,
      immediate: false,
      rollLaps: 1,
    }
  );

  /** 每个牌子的目标滚动偏移（行数） */
  const stripOffsets = ref<number[]>([]);
  /** 每个牌子是否已开启 CSS 过渡 */
  const stripReadyList = ref<boolean[]>([]);

  function isDigit(char: string) {
    return DIGITS.includes(char as (typeof DIGITS)[number]);
  }

  /**
   * 构建滚动序列：先滚 rollLaps 整圈，再滚到目标字符（目标固定在序列末尾）
   */
  function buildStrip(char: string): string[] {
    if (isDigit(char)) {
      const target = Number(char);
      const laps = props.immediate ? 0 : Math.max(props.rollLaps, 1);
      const list: string[] = [];
      for (let lap = 0; lap < laps; lap++) {
        list.push(...DIGITS);
      }
      list.push(...DIGITS.slice(0, target + 1));
      return list;
    }
    if (char === '.') {
      return props.immediate ? ['.'] : [...DIGITS, '.'];
    }
    return props.immediate ? [char] : [...DIGITS, char];
  }

  /** 目标字符始终在 strip 最后一项 */
  function calcStripOffset(strip: string[]): number {
    return Math.max(0, strip.length - 1);
  }

  const formatOptions = computed<CountFlipFormatOptions>(() => ({
    count: props.count,
    unit: props.unit,
    unitThreshold: props.unitThreshold,
    showDecimal: props.showDecimal,
    decimalPlaces: props.decimalPlaces,
    divideRatio: props.divideRatio,
  }));

  const displayChars = computed(() => formatCountFlipValue(props.value, formatOptions.value));

  const stripCache = computed(() => displayChars.value.map((char) => buildStrip(char)));

  const ariaLabel = computed(() => {
    const chars = displayChars.value;
    const unitIdx = chars.lastIndexOf(props.unit);
    if (unitIdx > -1) {
      return `${chars.slice(0, unitIdx).join('')}${props.unit}`;
    }
    return String(Math.floor(Math.abs(props.value)));
  });

  const rootStyle = computed(() => ({
    gap: props.gap,
  }));

  const tileStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
      width: props.tileWidth,
      height: props.tileHeight,
      '--flip-tile-height': props.tileHeight,
    };
    if (props.tileBg) {
      style.backgroundImage = `url(${props.tileBg})`;
      style.backgroundSize = '100% 100%';
      style.backgroundRepeat = 'no-repeat';
    }
    return style;
  });

  const digitStyle = computed<CSSProperties>(() => ({
    fontSize: props.fontSize,
    color: props.color,
    fontFamily: props.fontFamily,
  }));

  function getTileKey(index: number, char: string) {
    return `${index}-${char}`;
  }

  function getStripItems(index: number) {
    return stripCache.value[index] ?? ['0'];
  }

  function getStripStyle(index: number): CSSProperties {
    const offset = stripOffsets.value[index] ?? 0;
    const delay = props.immediate ? 0 : index * props.stagger;
    return {
      transform: `translate3d(0, calc(-1 * ${offset} * var(--flip-tile-height, ${props.tileHeight})), 0)`,
      transitionProperty: 'transform',
      transitionDuration: stripReadyList.value[index] ? `${props.duration}ms` : '0ms',
      transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      transitionDelay: stripReadyList.value[index] ? `${delay}ms` : '0ms',
    };
  }

  async function runAnimation() {
    const chars = displayChars.value;
    const len = chars.length;
    const targets = chars.map((char) => calcStripOffset(buildStrip(char)));

    if (!props.animate || props.immediate) {
      stripOffsets.value = targets;
      stripReadyList.value = Array.from({ length: len }, () => false);
      return;
    }

    stripReadyList.value = Array.from({ length: len }, () => false);
    stripOffsets.value = Array.from({ length: len }, () => 0);

    await nextTick();
    // 先挂载起点，再开启过渡，最后在下一帧滚到终点（保证每位都有完整动画）
    stripReadyList.value = Array.from({ length: len }, () => true);
    await nextTick();
    requestAnimationFrame(() => {
      stripOffsets.value = targets;
    });
  }

  watch(
    () => [
      props.value,
      props.count,
      props.unit,
      props.unitThreshold,
      props.showDecimal,
      props.decimalPlaces,
      props.immediate,
      props.rollLaps,
      props.duration,
      props.stagger,
    ],
    () => runAnimation(),
    { flush: 'post' }
  );

  onMounted(() => {
    runAnimation();
  });

  defineExpose({
    formatCountFlipValue,
    displayChars,
    refresh: runAnimation,
  });
</script>

<style scoped lang="scss">
  .count-flip {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;

    &__tile {
      position: relative;
      flex-shrink: 0;
      border-radius: 0.04rem;
      overflow: hidden;
      background: linear-gradient(180deg, #061a38 0%, #1a4f8c 48%, #061a38 100%);
      box-shadow: inset 0 0 0 1px rgba(46, 230, 255, 0.12);

      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        z-index: 2;
        height: 1px;
        margin-top: -0.5px;
        background: rgba(0, 0, 0, 0.55);
        pointer-events: none;
      }
    }

    &__viewport {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    &__strip {
      display: flex;
      flex-direction: column;
      width: 100%;
      will-change: transform;
      transform: translate3d(0, 0, 0);
    }

    &__digit {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 100%;
      height: var(--flip-tile-height, 0.48rem);
      font-weight: 700;
      line-height: 1;
      user-select: none;
    }
  }
</style>
