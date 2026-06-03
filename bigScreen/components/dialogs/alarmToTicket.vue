<template>
  <el-dialog v-model="isVisible" class="screen-dark-dialog" :show-close="false" width="10rem" append-to-body>
    <template #header>
      <div class="header-title">
        <div class="left-box">
          <span class="title-label">告警转工单</span>
        </div>
        <div class="right-box">
          <span class="close" @click="handleClose"></span>
        </div>
      </div>
    </template>
    <div class="dark-form-box">
      <el-form ref="formRef" v-loading="isLoading" :model="formData" :rules="formRule" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="工单标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入工单标题" maxlength="40"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="故障类型" prop="faultType">
              <el-select v-model="formData.faultType" placeholder="请选择故障类型" filterable clearable popper-class="dark-select-popper">
                <el-option v-for="item in device_fault_type" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属机构" prop="creatorDeptId">
              <el-tree-select
                v-model="formData.creatorDeptId"
                :data="deptData"
                :props="{ value: 'id', label: 'name', children: 'children' }"
                disabled
                check-strictly
                clearable
                filterable
                placeholder="请选择所属机构"
                popper-class="dark-select-popper"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="路段" prop="sectionId">
              <el-select v-model="formData.sectionId" placeholder="请选择路段" filterable @change="onSectionChange" popper-class="dark-select-popper">
                <el-option v-for="item in sectionData" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工单等级" prop="level">
              <el-select v-model="formData.level" placeholder="请选择工单等级" @change="onLevelChange" popper-class="dark-select-popper">
                <el-option v-for="item in levelList" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止时间" prop="dueAt">
              <el-date-picker
                v-model="formData.dueAt"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="datetime"
                placeholder="请选择截止时间"
                popper-class="dark-time-popper"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="所属系统" prop="systemType">
              <el-select v-model="formData.systemType" placeholder="请选择所属系统" filterable clearable popper-class="dark-select-popper">
                <el-option v-for="item in of_system" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24" class="mb20">
            <el-form-item label="故障描述" prop="description">
              <el-input v-model="formData.description" type="textarea" :rows="5" placeholder="请输入故障描述" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24" class="mb20">
            <el-form-item label="问题图片" prop="images">
              <ImgYh v-model="formData.images" :limit="3" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="关联设备" prop="devices">
              <div class="w-full">
                <el-radio-group
                  v-model="formData.isManual"
                  :disabled="[OrderSourceEventEnum.ISSUE, OrderSourceEventEnum.ALARM].includes(formData.source)"
                  @change="onIsManualChange"
                >
                  <el-radio :value="false">从设备库选择</el-radio>
                  <el-radio :value="true">手动添加</el-radio>
                </el-radio-group>
              </div>
              <div v-if="formData.isManual" class="w-full mt-[10px]">
                <el-table
                  class="w-full device-table"
                  :data="formData.devices"
                  row-key="id"
                  border
                  :cell-style="tableStyle.cellStyle"
                  :header-cell-style="tableStyle.headerCellStyle"
                >
                  <el-table-column prop="name" label="设备名称" width="">
                    <template #default="{ row, $index }">
                      <el-form-item label="" :prop="`devices[${$index}].name`" :rules="[{ required: true, message: '请输入', trigger: ['blur'] }]">
                        <el-input v-model="row.name" maxlength="50" placeholder="请输入" clearable></el-input>
                      </el-form-item>
                    </template>
                  </el-table-column>
                  <el-table-column prop="location" label="设备地址" width="">
                    <template #default="{ row, $index }">
                      <el-form-item
                        label=""
                        :prop="`devices[${$index}].location`"
                        :rules="[{ required: true, message: '请输入', trigger: ['blur'] }]"
                      >
                        <el-input v-model="row.location" maxlength="200" placeholder="请输入" clearable></el-input>
                      </el-form-item>
                    </template>
                  </el-table-column>
                  <el-table-column prop="handle" label="操作" width="80">
                    <template #default="{ row, $index }">
                      <el-button type="danger" text size="small" @click="handleDeleteDevice($index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="flex justify-center mt-[10px]">
                  <el-button type="primary" size="small" icon="Plus" plain @click="handleAddDevice(row)">添加</el-button>
                </div>
              </div>
              <div v-else class="w-full mt-[10px]">
                <el-table
                  class="w-full"
                  :data="formData.devices"
                  row-key="id"
                  border
                  :cell-style="tableStyle.cellStyle"
                  :header-cell-style="tableStyle.headerCellStyle"
                >
                  <el-table-column prop="name" label="设备名称" min-width="160"></el-table-column>
                  <el-table-column prop="pileNum" label="桩号" width="100">
                    <template #default="{ row }">{{ row.fields?.pileNum?.display || '-' }}</template>
                  </el-table-column>
                  <el-table-column prop="direction" label="方向" width="70">
                    <template #default="{ row }">{{ row.fields?.direction?.display || '-' }}</template>
                  </el-table-column>
                  <el-table-column prop="manufacturer" label="厂家品牌" min-width="80" show-overflow-tooltip>
                    <template #default="{ row }">{{ row.fields?.manufacturer?.display || '-' }}</template>
                  </el-table-column>
                  <el-table-column prop="deviceModel" label="型号" min-width="100">
                    <template #default="{ row }">{{ row.fields?.deviceModel?.display || '-' }}</template>
                  </el-table-column>
                  <el-table-column prop="belongLoc" label="设施名称" min-width="80" show-overflow-tooltip>
                    <template #default="{ row }">{{ row.fields?.belongLoc?.display || '-' }}</template>
                  </el-table-column>
                  <el-table-column prop="scene" label="场景" min-width="70">
                    <template #default="{ row }">{{ row.fields?.scene?.display || '-' }}</template>
                  </el-table-column>
                  <el-table-column prop="handle" label="操作" width="80">
                    <template #default="{ row, $index }">
                      <el-button
                        type="danger"
                        text
                        size="small"
                        :disabled="[OrderSourceEventEnum.ISSUE, OrderSourceEventEnum.ALARM].includes(formData.source)"
                        @click="handleDeleteDevice($index)"
                        >删除</el-button
                      >
                    </template>
                  </el-table-column>
                </el-table>
                <div class="flex justify-center mt-[10px]">
                  <el-button type="primary" :disabled="!formData.sectionId" @click="handleOpenDeviceDialog">关联设备</el-button>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <!-- 关联设备弹窗 -->
      <el-dialog
        v-if="isDeviceDialogVisible"
        v-model="isDeviceDialogVisible"
        title="关联设备"
        width="1200px"
        append-to-body
        @close="handleCloseDeviceDialog"
        class="screen-dark-dialog"
      >
        <div class="dark-table-box dark-device">
          <AssociationDevice
            v-if="isDeviceDialogVisible"
            ref="associationDeviceRef"
            :selectedData="formData.devices"
            :sectionId="formData.sectionId"
            :sectionData="sectionData"
            :deptId="formData.creatorDeptId"
            :deptData="deptData"
            type="ROAD_WAY"
            skin="dark"
            @close="handleCloseDeviceDialog"
            @submit="handleConfirmSelectDevice"
          />
        </div>
        <template #footer>
          <div class="flex justify-end">
            <el-button @click="handleCloseDeviceDialog()">取消</el-button>
            <el-button type="primary" @click="associationDeviceRef?.handleSubmit()">保存</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
    <template #footer>
      <div class="justify-end text-right flx-row">
        <el-button :disabled="isSubmitting" @click="handleClose(false)">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">提交</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup>
  import { ref, reactive, onBeforeMount } from 'vue';
  import dayjs from 'dayjs';
  import { cloneDeep } from 'lodash';
  import levelApi from '@/api/melon/workOrder/level';
  import { addTicket, resubmitTicket } from '@/api/melon/ticket/index';
  import infrasRoadApi from '@/api/ledger/infrasRoad';
  import { deptTree } from '@/api/admin/dept';
  import { OrderSourceEventEnum, WorkOrderType } from '@/const';
  import { useDict } from '@/hooks/dict';
  import { useMessage } from '@/hooks/message';
  import { useTable } from '@/hooks/table';
  import { useUserInfo } from '@/stores/userInfo';
  import AssociationDevice from '@/views/melon/ticket/myHandled/components/associationDevice.vue';

  const emits = defineEmits(['close']);

  const props = defineProps({});

  // 故障类型字典, 系统字典
  const { device_fault_type, of_system } = useDict('device_fault_type', 'of_system');

  const userStore = useUserInfo();
  const message = useMessage();

  const formRef = ref();
  const isVisible = ref(false);
  const formData = ref({
    type: WorkOrderType[0].value, // 工单类型
    title: '', // 工单标题
    faultType: '', // 故障类型
    creatorDeptId: userStore.userInfos.user.deptId, // 工单创建人所属机构（系统默认带入）
    systemType: '', // 所属系统
    sectionId: '', // 路段ID
    level: '', // 工单等级
    dueAt: '', // 处理截止时间 字段待确定
    description: '', // 工单描述
    isManual: false, // 是否手动添加关联设备
    devices: [], // 关联设备列表
    images: [], // 故障照片 接口需要的格式
    source: OrderSourceEventEnum.MANUAL, // 工单来源 手动创建
    sourceBizId: '', // 工单来源业务单ID(非手动创建时填写)
  });
  const formRule = reactive({
    title: [
      { required: true, message: '请输入', trigger: 'blur' },
      { min: 5, max: 40, message: '长度为 5-40 个字符', trigger: 'blur' },
    ],
    faultType: [{ required: true, message: '请选择', trigger: 'blur' }],
    systemType: [{ required: true, message: '请选择', trigger: 'blur' }],
    sectionId: [{ required: true, message: '请选择', trigger: 'blur' }],
    level: [{ required: true, message: '请选择', trigger: 'blur' }],
    dueAt: [{ required: true, message: '请选择', trigger: 'blur' }],
    devices: [{ required: true, message: '请选择/添加设备', trigger: 'blur' }],
    description: [
      { required: true, message: '请输入', trigger: 'blur' },
      { max: 500, message: '最多 500 个字符', trigger: 'blur' },
    ],
  });

  const deptData = ref([]);
  const sectionData = ref([]);
  const levelList = ref([]);
  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const isDeviceDialogVisible = ref(false);
  const associationDeviceRef = ref();
  const { tableStyle } = useTable({});
  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        resetFormData();
      }
    }
  );

  onBeforeMount(() => {
    getDeptData();
    getSectionData();
    getLevelList();
  });

  const resetFormData = () => {
    formRef.value?.resetFields();
    formData.value.id = '';
    formData.value.devices = [];
    formData.value.images = [];
    formData.value.source = OrderSourceEventEnum.MANUAL; // 默认手动创建
    formData.value.sourceBizId = '';
  };

  const getDeptData = () => {
    deptTree().then((res) => {
      deptData.value = res.data || [];
    });
  };

  const getSectionData = () => {
    infrasRoadApi.treeByDept().then(({ data }) => {
      sectionData.value = (data || []).flatMap((item) => item.sections || []);
    });
  };

  const getLevelList = () => {
    levelApi.list({}).then(({ data }) => {
      levelList.value = data || [];
    });
  };

  // 选择告警后 自动填充部分表单信息
  const onSelectAlarm = (alarm = {}) => {
    if (!alarm) {
      return;
    }
    resetFormData();
    const { name = '', content = '', device = {}, sectionId = '' } = alarm;
    const devices =
      device && device.id
        ? [
            {
              deviceId: device.id,
              name: device?.fields?.name?.display,
              fields: device?.fields || {},
            },
          ]
        : [];
    formData.value = {
      ...formData.value,
      title: name,
      devices,
      images: [],
      systemType: device?.fields?.belongSystem?.value || '',
      sectionId,
      description: content,
      isManual: devices.length === 0,
      source: OrderSourceEventEnum.ALARM, // 工单来源 告警转工单
      sourceBizId: alarm.id,
    };
  };

  const onSectionChange = () => {
    if (!formData.value.isManual) {
      formData.value.devices = [];
    }
  };

  const onLevelChange = () => {
    const levelItem = levelList.value.find((item) => item.code == formData.value.level);
    const hours = Number(levelItem.timeLimit);
    formData.value.dueAt = new Date(Date.now() + 1000 * 60 * 60 * hours);
    formData.value.dueAt = dayjs().add(hours, 'hour').format('YYYY-MM-DD HH:mm:ss');
  };

  const handleOpenDeviceDialog = () => {
    if (!formData.value.sectionId) {
      message.warning('请先选择路段');
      return;
    }
    isDeviceDialogVisible.value = true;
  };

  const onIsManualChange = () => {
    formData.value.devices = [];
  };

  const handleAddDevice = () => {
    formData.value.devices.push({
      deviceId: null,
      name: '',
      location: '',
      isManual: true,
    });
  };

  const handleDeleteDevice = (index) => {
    formData.value.devices.splice(index, 1);
  };

  const handleCloseDeviceDialog = () => {
    isDeviceDialogVisible.value = false;
  };

  const handleConfirmSelectDevice = (value) => {
    const deviceIds = formData.value.devices.map((item) => item.deviceId);
    (value || []).forEach((item) => {
      if (!deviceIds.includes(item.deviceId)) {
        formData.value.devices.push({
          ...item,
          deviceId: item.id,
          name: item.fields?.name?.display,
          location: item.fields?.deviceLocation?.display,
          isManual: false,
        });
      }
    });
    handleCloseDeviceDialog();
  };

  const handleSubmit = async () => {
    formRef.value.validate((isValid) => {
      if (isValid) {
        isSubmitting.value = true;
        const params = cloneDeep(formData.value);
        params.images = params.images.map((item) => ({
          fileId: item.id,
          originalName: item.fileName,
          mediaUrl: item.url,
        }));
        addTicket(params)
          .then((res) => {
            if (res.code === 0) {
              message.success('提交成功');
              handleClose(true);
            }
          })
          .catch((err) => {
            message.warning(err.msg || '提交失败，请稍后再试');
          })
          .finally(() => {
            isSubmitting.value = false;
          });
      }
    });
  };

  const handleClose = () => {
    isVisible.value = false;
    emits('close');
    resetFormData();
  };

  const open = (data) => {
    onSelectAlarm(data);
    isVisible.value = true;
  };

  defineExpose({
    onSelectAlarm,
    open,
  });
</script>

<style lang="scss" scoped>
  .img-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.08rem;
    .img-item {
      width: 1.2rem;
      height: 1.2rem;
      border: 1px solid var(--el-border-color-darker);
      border-radius: 0.08rem;
    }
  }
</style>
