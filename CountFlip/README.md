# CountFlip 数字翻牌组件

大屏场景下的数字翻牌展示组件。将数值拆成固定数量的「牌子」，每位独立垂直滚动，支持万级单位换算、进场动画与样式配置。

## 文件结构

```
CountFlip/
├── index.vue    # 组件入口（展示 + 动画）
├── format.ts    # 数值格式化逻辑（可单独引用）
└── README.md
```

## 快速开始

```vue
<template>
  <CountFlip :value="1398024000" />
</template>

<script setup>
import CountFlip from '@/components/CountFlip/index.vue';
</script>
```

上述示例展示为：`1 3 9 8 0 2 . 4 万`（共 9 个牌子）。

### 常用配置

```vue
<CountFlip
  :value="totalCount"
  :count="9"
  unit="万"
  :unit-threshold="1000000"
  :duration="2000"
  :stagger="0"
  :roll-laps="1"
  tile-width="0.22rem"
  tile-height="0.3rem"
  font-size="0.22rem"
  color="#a1ffd6"
/>
```

### 仅使用格式化函数

```ts
import { formatCountFlipValue } from '@/components/CountFlip/format';

formatCountFlipValue(1398024000);
// ['1','3','9','8','0','2','.','4','万']

formatCountFlipValue(12345, { count: 9 });
// ['0','0','0','0','1','2','3','4','5']
```

### 手动触发动画

```vue
<CountFlip ref="flipRef" :value="count" />

<script setup>
const flipRef = ref();
// 数据更新后重新播放滚动
flipRef.value?.refresh();
</script>
```

---

## Props 参数

### 数值与格式化

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `number` | `0` | 要展示的数值 |
| `count` | `number` | `9` | 牌子（位）数量 |
| `unit` | `string` | `'万'` | 达到阈值后使用的单位字符 |
| `unitThreshold` | `number` | `1000000` | 启用单位换算的阈值（默认百万） |
| `showDecimal` | `boolean` | `true` | 达到阈值时是否展示小数 |
| `decimalPlaces` | `number` | `1` | 小数位数 |
| `divideRatio` | `number` | `10000` | 换算为单位的除数（默认 ÷10000） |

### 动画

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `duration` | `number` | `1200` | 每个牌子滚动动画时长（毫秒） |
| `stagger` | `number` | `0` | 每个牌子启动延迟间隔（毫秒）；`0` 表示同时开始 |
| `rollLaps` | `number` | `1` | 进场时额外滚动的整圈数（0→9 循环次数，实际至少 1 圈） |
| `animate` | `boolean` | `true` | 是否启用滚动动画 |
| `immediate` | `boolean` | `false` | 为 `true` 时跳过动画，直接显示结果 |

### 样式

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tileBg` | `string` | `''` | 牌子背景图 URL，为空时使用内置渐变 |
| `tileWidth` | `string` | `'0.36rem'` | 牌子宽度 |
| `tileHeight` | `string` | `'0.48rem'` | 牌子高度（同时作为每位数字行高） |
| `gap` | `string` | `'0.04rem'` | 牌子间距 |
| `fontSize` | `string` | `'0.32rem'` | 数字字号 |
| `color` | `string` | `'#ffffff'` | 数字颜色 |
| `fontFamily` | `string` | `screenTitleFont, ...` | 字体 |

---

## 暴露的方法与属性

通过 `defineExpose` 暴露：

| 名称 | 说明 |
|------|------|
| `refresh()` | 重新执行进场滚动动画 |
| `displayChars` | 当前格式化后的字符数组（ComputedRef） |
| `formatCountFlipValue` | 格式化函数引用 |

---

## 数值计算逻辑

格式化由 `format.ts` 中的 `formatCountFlipValue` 完成，流程如下。

### 1. 非法值

`value` 非有限数字时，返回 `count` 个 `'0'`。

### 2. 达到单位阈值（默认 ≥ 100 万）

记 `abs = |value|`，当 `abs >= unitThreshold` 时进入单位模式。

#### 2a. `showDecimal === true`（默认）

```
wan = abs / divideRatio          // 默认 abs / 10000
fixed = wan.toFixed(decimalPlaces)
[intPart, decPart] = fixed.split('.')
```

牌子布局（以 `count=9`、`decimalPlaces=1`、`unit='万'` 为例）：

| 整数部分 | 小数点 | 小数部分 | 单位 |
|----------|--------|----------|------|
| `count - 2 - decimalPlaces` 位 | 1 位 | `decimalPlaces` 位 | 1 位 |

- 整数部分：左侧补 `0`，超出位数时保留右侧（截断左侧）
- 小数部分：不足位补 `0`，超出截断

**示例**

```
value = 1_398_024_000
wan = 139802.4
→ ['1','3','9','8','0','2','.','4','万']
```

```
value = 1_000_000
wan = 100.0
→ ['0','0','0','1','0','0','.','0','万']
```

#### 2b. `showDecimal === false`

```
wanInt = round(abs / divideRatio)
整数部分占 count - 1 位，末位为单位
```

**示例**：`1_000_000` → `['0','0','0','0','1','0','0','0','万']`（整数万，无小数点）

### 3. 未达到单位阈值

按整数处理，**不使用单位**：

```
intStr = floor(abs)
```

- 位数 ≤ `count`：左侧补 `0` 至 `count` 位
- 位数 > `count`：保留右侧 `count` 位（截断左侧）

**示例**

```
12345  → ['0','0','0','0','1','2','3','4','5']
999999 → ['0','0','0','9','9','9','9','9','9']
```

### 牌子数量与槽位关系

| 模式 | 占用槽位 |
|------|----------|
| 纯整数 | `count` 个数字 |
| 单位 + 小数 | 整数 + `.` + 小数 + 单位 = `count` |
| 单位无小数 | 整数 + 单位 = `count` |

---

## 动画逻辑

### 结构说明

每个牌子由三层组成：

```
.count-flip__tile          # 外框（背景、中线）
  └── .count-flip__viewport   # 裁剪区域（overflow: hidden）
        └── .count-flip__strip    # 垂直字符条（transform 滚动）
              └── .count-flip__digit × N
```

滚动通过 `transform: translate3d(0, -offset × 行高, 0)` 实现，行高等于 `tileHeight`（CSS 变量 `--flip-tile-height`）。

### 滚动序列 `buildStrip`

每位根据**最终要显示的字符**生成一条垂直序列，**目标字符固定在序列最后一项**。

#### 数字位（0–9）

```
序列 = [rollLaps 次完整 0→9] + [0, 1, …, target]
```

- `rollLaps`：额外整圈数，实际至少滚 1 圈（`max(rollLaps, 1)`）
- `immediate === true` 时不加整圈，仅保留 `[0..target]`

**示例**：目标数字 `4`，`rollLaps = 1`

```
0,1,2,3,4,5,6,7,8,9, 0,1,2,3,4
                      ↑ 第二圈    ↑ 目标在末尾
```

#### 小数点 `.`

```
immediate: ['.']
动画: [0,1,2,3,4,5,6,7,8,9,'.']
```

#### 单位（如 `万`）

```
immediate: ['万']
动画: [0,1,2,3,4,5,6,7,8,9,'万']
```

### 偏移量计算

```ts
offset = strip.length - 1   // 始终指向序列最后一项（目标字符）
```

不使用 `lastIndexOf`，避免 `0`、`1` 等在序列中多次出现时定位错误。

### 进场动画时序 `runAnimation`

当 `animate === true` 且 `immediate === false` 时：

```
1. stripReadyList = false，stripOffsets = [0, 0, …, 0]   // 关闭过渡，停在序列起点
2. await nextTick()
3. stripReadyList = true                                  // 开启 CSS transition
4. await nextTick()
5. requestAnimationFrame → stripOffsets = [target₀, …]   // 滚到终点
```

分步是为了让浏览器先绘制起点再过渡，保证**每一位**都有完整滚动，而不是与终点同一帧合并。

当 `animate === false` 或 `immediate === true` 时：直接设置 `stripOffsets` 为终点，不播放动画。

### 单牌样式 `getStripStyle`

| 属性 | 说明 |
|------|------|
| `transform` | `translate3d(0, calc(-offset × var(--flip-tile-height)), 0)` |
| `transitionDuration` | `duration` ms（仅 `stripReadyList[i] === true` 时生效） |
| `transitionDelay` | `index × stagger` ms |
| `transitionTimingFunction` | `cubic-bezier(0.22, 0.61, 0.36, 1)` |

### 动画触发时机

- 组件 `onMounted`
- `value`、`count`、`unit`、`unitThreshold`、`showDecimal`、`decimalPlaces`、`immediate`、`rollLaps`、`duration`、`stagger` 变化时（`watch`）

### 参数搭配建议

| 需求 | 建议 |
|------|------|
| 所有牌子同时滚动 | `stagger={0}` |
| 波浪式依次进场 | `stagger={60~100}`，且 `duration > stagger × 牌子数` |
| 滚动更久、更明显 | 增大 `duration`、`rollLaps` |
| 数据刷新不重播 | 避免修改 `:key`；需要重播时调用 `refresh()` |
| 仅更新数字、不要动画 | `immediate` 或 `animate={false}` |

---

## 无障碍

根节点设置 `role="group"` 与 `aria-label`，读屏会读取完整语义（如 `139802.4万`），而非逐位数字。

---

## 注意事项

1. **外层容器宽度**：9 个牌子默认约 `9 × tileWidth + 8 × gap`，窄容器需配合 `overflow` 或缩小 `tileWidth`。
2. **单位与业务单位**：组件内置「万」用于大数；业务侧单位（如「台」）请在组件外单独渲染，并根据是否进入万级模式决定是否显示。
3. **性能**：牌子数量建议 ≤ 12；使用 `transform` + `will-change` 做 GPU 加速；`stripCache` 会缓存每位滚动序列，避免重复计算。
