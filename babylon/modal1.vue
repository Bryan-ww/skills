<template>
  <el-dialog title="批量布设" :visible.sync="dialogVisible" width="60%">
    <div class="tunnel_form_box">
      <el-form label-width="80" :model="form" class="tunnel_form">
        <el-row>
          <el-col :span="6">
            <el-form-item label="设备编码" label-width="80">
              <el-input v-model="form.deviceCode"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="设备名称" label-width="80">
              <el-input v-model="form.deviceName"></el-input>
            </el-form-item>
          </el-col>
          <!-- <el-col :span="8">
          <div class="search_box_btn">
            <el-button type="primary" @click="querys">查询</el-button>
            <el-button @click="queryReset">重置</el-button>
          </div>
        </el-col> -->
        </el-row>
      </el-form>
      <div v-loading="loading" class="tunnel-list-table" element-loading-spinner="el-icon-loading">
        <el-table ref="tableRef" :data="finallyTableData" height="100%" style="width: 100%; height: 100%"
          @selection-change="handleSelectionChange">
          <el-table-column align="center" prop="station_name" type="selection" />
          <el-table-column align="center" prop="station_name" type="index" label="序号" />
          <el-table-column align="center" prop="device_code" label="设备编码" />
          <el-table-column align="center" prop="device_name" label="设备名称" />
          <el-table-column align="center" prop="direction" label="方向">
            <template v-slot="{ row }">{{
              row.direction == 1 ? "上行" : "下行"
            }}</template>
          </el-table-column>
          <el-table-column align="center" prop="lane_id" label="车道" />
          <el-table-column align="center" prop="stack_num" label="桩号" />
          <el-table-column align="center" prop="system_code__NAME" label="所属系统" />
          <el-table-column align="center" prop="type_code__NAME" label="设备类型" />
          <el-table-column align="center" prop="class_code__NAME" label="设备类别" />
        </el-table>
      </div>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="createPoints">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from "vue";
// import { tunnelDeviceSearch } from "@/api/tunnel";
import { ElMessage } from "element-plus";
// import comp, { createPoint } from "./comp";
const emits = defineEmits("change");

const app = getCurrentInstance().proxy;
const form = ref({
  deviceCode: "",
  deviceName: "",
});

const loading = ref(false);
const tableData = ref([]);
const selectTableData = ref([]);

const finallyTableData = computed(() => {
  return tableData.value.filter((item) => {
    return (
      item.device_code.indexOf(form.value.deviceCode) > -1 &&
      item.device_name.indexOf(form.value.deviceName) > -1
    );
  });
});

const params = ref({});
const dialogVisible = ref(false);

const handleSelectionChange = (e) => {
  console.log(e);
  selectTableData.value = e;
};

const getList = async () => {
  try {
    loading.value = true;
    let res = await tunnelDeviceSearch(params.value);
    tableData.value = res.data;
    console.log(res, "res");
  } catch (error) {
  } finally {
    loading.value = false;
  }
};

const createPoints = () => {
  if (selectTableData.value.length === 0) {
    app.$message.warning("请选择设备");
    return;
  }
  console.log(params.value, "params.value.step");
  const startKm = params.value.start_stack_num.replace(/k/gi, "").split("+");
  const startX = (parseInt(startKm[0]) ?? 0) + parseInt(startKm[1]) / 1000;
  let _point = selectTableData.value.map((item, index) => {
    const km = item.stack_num.replace(/k/gi, "").split("+");
    const currentX = (parseInt(km[0]) ?? 0) + parseInt(km[1]) / 1000;
    const x = (currentX - startX).toFixed(3);
    const point = {
      ...createPoint(
        item.class_code,
        item.device_code,
        item.class_code__NAME,
        params.value.showIcon,
        item.icon,
        item.icon2 || item.icon,
        "",
        "",
        "",
        params.value.width,
        params.value.height,
        x,
        params.value.y,
        params.value.z,
        params.value.billboardMode
      ),
      road: params.value.road,
      device_code: item.device_code,
      device_name: item.device_name,
      type_code: item.type_code,
      class_code: item.class_code,
      section_direction: item.direction,
      lanes: item.lanes,
    };
    // console.log(point, "point");
    return point;
  });
  emits("change", _point);
  dialogVisible.value = false;
  // console.log(_point, "point");
};
const show = (value) => {
  tableData.value=[]
  dialogVisible.value = true;
  params.value = value;
  console.log(value, "value");
  getList();
};

defineExpose({
  show,
});
</script>

<style lang="scss">
.search_box_btn {
  text-align: right;
}

.tunnel_form {
  .el-form-item__content {
    display: flex;
  }
}

.tunnel_form_box {
  width: 100%;
  height: 60vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .tunnel-list-table {
    flex: 1;
    overflow: hidden;
  }
}
</style>
