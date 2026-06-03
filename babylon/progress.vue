<template>
  <div class="w-full h-full overflow-hidden flex justify-center items-center">
    <div class="w-90% h-70% bg-red relative" ref="progressRef">
      <div
        class="h-full absolute bg-cyan cursor-pointer"
        :style="{ width: w, left: left + 'px' }"
        @mousedown.stop="mousedown"
        @mousemove.stop="mousemove"
        @mouseout.stop="reset"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, onBeforeUnmount, watch } from 'vue'
const emits = defineEmits(['change'])
const progressRef = ref()
const props = defineProps({
  length: {
    type: Number,
    default: 2
  }
})
const model = defineModel<number>({ default: 0.5 })
let isDown = false
let iniPositionX = 0
const offset = ref(0)
const left = ref(0)
const getLeft = () => {
  const l =
    model.value * (progressRef.value?.offsetWidth / props.length) -
    progressRef.value?.offsetWidth / props.length / 2
  left.value = isNaN(l) ? 0 : l
}
getLeft()
// watch(
//   () => model.value,
//   () => {
//     // if (model.value < 0.5) {
//     //   left.value = progressRef.value?.offsetWidth / props.length / 2
//     // }
//     // if (model.value > props.length - 0.5) {
//     //   left.value = progressRef.value?.offsetWidth - progressRef.value?.offsetWidth / props.length
//     // }
//   },
//   {
//     immediate: true
//   }
// )

const w = computed(() => {
  console.log(`${(1 / props.length) * 100}%`,'wwwwwwwwwwwwww')
  return `${(1 / props.length) * 100}%`
})
const mousedown = (e) => {
  offset.value = 0
  iniPositionX = e.pageX
  isDown = true
}
const mousemove = (e) => {
  if (isDown) {
    const offset = e.pageX - iniPositionX
    iniPositionX = e.pageX
    model.value += offset / (progressRef.value?.offsetWidth / props.length)
    if (model.value < 0.5) {
      model.value = 0.5
    }
    if (model.value > props.length - 0.5) {
      model.value = props.length - 0.5
    }
    getLeft()
    emits('change', model.value)
  }
}

const reset = () => {
  isDown = false
}
window.addEventListener('mouseup', reset)

onBeforeUnmount(() => {
  window.removeEventListener('mouseup', reset)
})
</script>
