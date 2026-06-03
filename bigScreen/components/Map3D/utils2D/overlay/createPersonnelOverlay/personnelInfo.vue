<template>
<div class="personnel-overlay">
  <div class="info">
    <div>姓名：李红</div>
    <div>电话：18384996542</div>
  </div>
  <div class="icon"></div>
</div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style lang="scss" scoped>
.personnel-overlay {
  display: inline-block;

  .info {
    width: 130px;
    height: auto;
    padding: 5px;
    color: #fff;
    font-size: 12px;

    background: linear-gradient( 0deg, #00224B 0%, #00142D 100%);
    box-shadow: inset 0px 0px 9px 0px #00274C;
    border-radius: 4px;
    border: 1px solid;
    border-image: linear-gradient(360deg, rgba(91, 172, 255, 1), rgba(111, 182, 255, 1), rgba(9, 98, 160, 1)) 1 1;
    backdrop-filter: blur(2px);
    margin-bottom: 5px;
  }

  .icon {
    margin: 0 auto;
    width: 28px;
    height: 28px;

    background: url('/assets/images/personnel/icon.png') no-repeat center center;
    background-size: 100% 100%;
  }
}
</style>