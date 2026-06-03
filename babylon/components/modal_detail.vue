<template>
  <div class="tunel_device_detail" v-show="dialogVisible">
    <Card4 @close="close" title="设备信息">
      <template #header>
        <div class="tunel_video_edit_title">
          <div>K3168+030</div>
          <div class="flex items-center gap-2 ">
            <el-button size="small" type="primary">蓝色预警</el-button>
            <div @click="close" class="tunel_video_edit_close font-thin">X</div>
          </div>

        </div>
      </template>
      <div class="main">
        <div class="flex-1 flex flex-col gap-2 items">
          <div>
            <div>风速：13:34</div>
            <div>持续时长：3h45min</div>
          </div>
          <div>
            <div>能见度：7km</div>
            <div>雨量：8mm</div>
          </div>
          <div>
            <div>温度：25℃</div>
            <div>湿度：60%</div>
          </div>
          <div class="flex-col">
            <div class="w-full flex justify-start">管控措施建议：</div>
            <div class="text-[red]">1.应迅速驶入最近避风港（如G30线3452km+500m避风港、吐峪沟主线收费站停车场）或服务区（吐鲁番服务区、梯子泉服务区）；</div>
            <div class="text-[red]">2.若无法驶入避风区，需立即开启双闪灯，将车辆停至应急车道，人员撤离至护栏外安全区域，避免被飞石或侧翻车辆伤害</div>
          </div>
        </div>
      </div>
    </Card4>


  </div>
</template>

<script setup>
import { getCurrentInstance, ref } from "vue";
import Card4 from "@/components/card4/card4.vue";
import { ElButton } from "element-plus";
const detailVideoRef = ref()
const publishRef = ref();
const publishAudioRef = ref();
const _instance = getCurrentInstance().proxy;
const emits = defineEmits(["close"]);
// const params = ref([{ label: "", value: "" }]);
const loading = ref(false);
const detail = ref({ background: "", background_back: "" });
const form = ref({
  classCode: "",
  classCodeName: "",
  deviceCode: "",
  deviceCtrls: [],
  deviceName: "",
  deviceProp: [],
  deviceRunStatus: { name: null, value: null, color: null },
  deviceStatus: { name: "在线", value: "1", color: null },
  userCode: "",
  tunnelId: "",
});
// const params = ref({});
const dialogVisible = ref(true);
const show = (value) => {
  console.log(value, "value");
  detail.value = value;
  loading.value = true;
  // form.value = value;
  dialogVisible.value = true;
};
const setParams = (value, status) => {
  // console.log(value, "res");

  if (status) {
    form.value = value;
  }
  loading.value = false;
};
const close = () => {
  console.log("关闭");
  dialogVisible.value = false;
  emits("close");
};
const publishFn = () => {
  publishRef.value.show(form.value);
};
const publishAduioFn = () => {
  publishAudioRef.value.show(form.value, JSON.parse(_instance.$store.getters.sysParams.C_TUNNEL_BROADCAST ?? '{}'));
};
const videoDetail = () => {
  detailVideoRef.value.getInitData(form.value.deviceCode);
};
const stopAduioFn = async () => {
  try {
    let res = await stopPlay({
      deviceCode: form.value.deviceCode,
      tunnelId: form.value.tunnelId,
    });
    if (res.code === 0) {
      _instance.$message.success("指令下发成功");
    } else {
      _instance.$message.error("指令下发失败");
    }
  } catch (error) { }
};


const run = async (item) => {
  try {
    let res = await deviceCmd({
      deviceClass: form.value.classCode,
      deviceCode: form.value.deviceCode,
      cmd: item.value,
      userCode: form.value.userCode,
      tunnelId: form.value.tunnelId,
    });
    if (res.code === 0) {
      _instance.$message.success("指令下发成功");
    } else {
      _instance.$message.error("指令下发失败");
    }
    console.log(res, "res");
  } catch (error) {
    console.log(error, "error");
  }

}

const handleClick = (item) => {
  _instance.$confirm("是否执行该指令？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    run(item)
  }).catch(() => {
  });
};


const setStatus = (e) => {
  if (
    e.data.type === "statusChange" &&
    e.data.data?.class_code &&
    e.data.data?.device_code &&
    e.data.data?.class_code === form.value?.classCode &&
    e.data.data?.device_code === form.value?.deviceCode
  ) {
    detail.value.background = e.data.data.background;
    detail.value.background_back = e.data.data.background_back;
  }
  if (e.data.type === 'cardClose') {
    close()
  }
};
window.addEventListener("message", setStatus);













defineExpose({
  show,
  setParams,
  _instance
});
</script>


<style lang="scss" scoped>
.pagination {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.search_box_btn {
  text-align: right;
}

.tunnel_form {
  padding: 0 20px;
  box-sizing: border-box;

  .el-form-item__content {
    display: flex;
  }
}

.tunnel_form_box {
  flex: 1;
  width: 100%;
  // height: 60vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .tunnel-list-table {
    flex: 1;
    overflow: hidden;
  }
}

.tunel_device_detail {
  position: absolute;
  width: auto;
  height: auto;
  width: 290px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 0 6px 6px;
  user-select: none;

}

.tunel_video_edit_title {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding-right: 5px;
  align-items: center;
  user-select: none;
}

.tunel_video_edit_close {
  height: 18px;
  width: 18px;
  aspect-ratio: 1/1;
  user-select: none;
  opacity: 0.8;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }

  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<style lang="scss" scoped>
.main {
  pointer-events: auto;
  width: 100%;
  height: 100%;
  // padding: 0.5rem;
  color: white;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  background: #041027;

  // flex-direction: column;


  .items {
    flex: 1;
    background: #0E1F40;
    height: 100%;

    >div {
      padding: 0.5rem 0 0.5rem 1rem;
      width: 100%;
      display: flex;
      align-items: center;
      flex: 1;
      background: linear-gradient(90deg, rgba(0, 133, 255, 0) 0%, rgba(0, 162, 255, 0.2) 15.63%, rgba(0, 117, 255, 0.04) 100%);

      >div {
        flex: 1;
      }
    }
  }
}
</style>
