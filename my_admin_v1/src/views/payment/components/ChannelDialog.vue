<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="620px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="渠道类型">
        <el-input :model-value="channelTypeText" disabled />
      </el-form-item>
      <el-form-item label="渠道名称" prop="name">
        <el-input v-model.trim="form.name" placeholder="请输入渠道名称" />
      </el-form-item>
      <el-form-item label="上架状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio-button :label="1">上架</el-radio-button>
          <el-radio-button :label="0">下架</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="配置 JSON" prop="json_value">
        <el-input
          v-model="form.json_value"
          type="textarea"
          :rows="10"
          placeholder='请输入 JSON，例如：{"merchant":"demo","key":"demo"}'
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { PayChannel } from "@/api/interface";
import { addPayChannel, updatePayChannel } from "@/api/modules/payment";

interface DialogParams {
  row?: PayChannel.ResListItem;
  channelType: number;
  getTableList?: () => void;
}

const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const refreshTable = ref<(() => void) | undefined>();

const form = reactive<PayChannel.UpdateParams>({
  id: 0,
  type: 1,
  name: "",
  json_value: "",
  status: 1
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入渠道名称", trigger: "blur" }],
  json_value: [{ required: true, message: "请输入渠道配置", trigger: "blur" }]
};

const dialogTitle = computed(() => (isEdit.value ? "编辑渠道" : "新增渠道"));
const channelTypeText = computed(() => (Number(form.type) === 1 ? "充值渠道" : "提现渠道"));

const acceptParams = ({ row, channelType, getTableList }: DialogParams) => {
  isEdit.value = !!row;
  form.id = row?.id || 0;
  form.type = row?.type || channelType;
  form.name = row?.name || "";
  form.json_value = row?.json_value || "";
  form.status = Number(row?.status ?? 1);
  refreshTable.value = getTableList;
  dialogVisible.value = true;
};

const handleSubmit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;

    if (isEdit.value) {
      await updatePayChannel({
        id: Number(form.id),
        type: Number(form.type),
        name: form.name,
        json_value: form.json_value,
        status: Number(form.status)
      });
      ElMessage.success("渠道已更新");
    } else {
      await addPayChannel({
        type: Number(form.type),
        name: form.name || "",
        json_value: form.json_value || "",
        status: Number(form.status)
      });
      ElMessage.success("渠道已新增");
    }

    dialogVisible.value = false;
    refreshTable.value?.();
  });
};

defineExpose({
  acceptParams
});
</script>
