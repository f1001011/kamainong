<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="420px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="用户ID">
        <el-input :model-value="String(form.id || '')" disabled />
      </el-form-item>
      <el-form-item :label="fieldLabel" prop="value">
        <el-radio-group v-model="form.value">
          <el-radio-button v-for="item in currentOptions" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
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
import { User } from "@/api/interface";
import { updateUserState, updateUserStatus } from "@/api/modules/user";

type Mode = "status" | "state";

interface DialogParams {
  mode: Mode;
  row: User.ResUserList;
  getTableList?: () => void;
}

const dialogVisible = ref(false);
const mode = ref<Mode>("status");
const refreshTable = ref<(() => void) | undefined>();
const formRef = ref<FormInstance>();

const form = reactive({
  id: 0,
  value: 1
});

const rules: FormRules = {
  value: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const statusOptions = [
  { label: "正常", value: 1 },
  { label: "冻结", value: 0 }
];

const stateOptions = [
  { label: "在线", value: 1 },
  { label: "离线", value: 0 }
];

const dialogTitle = computed(() => (mode.value === "status" ? "修改冻结状态" : "修改在线状态"));
const fieldLabel = computed(() => (mode.value === "status" ? "冻结状态" : "在线状态"));
const currentOptions = computed(() => (mode.value === "status" ? statusOptions : stateOptions));

const acceptParams = ({ mode: currentMode, row, getTableList }: DialogParams) => {
  mode.value = currentMode;
  form.id = row.id;
  form.value = Number(currentMode === "status" ? row.status : row.state);
  refreshTable.value = getTableList;
  dialogVisible.value = true;
};

const handleSubmit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;

    if (mode.value === "status") {
      await updateUserStatus({ id: form.id, status: Number(form.value) });
      ElMessage.success("冻结状态已更新");
    } else {
      await updateUserState({ id: form.id, state: Number(form.value) });
      ElMessage.success("在线状态已更新");
    }

    dialogVisible.value = false;
    refreshTable.value?.();
  });
};

defineExpose({
  acceptParams
});
</script>
