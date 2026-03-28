<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="460px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="用户ID">
        <el-input :model-value="String(form.id || '')" disabled />
      </el-form-item>
      <el-form-item label="操作类型" prop="action">
        <el-radio-group v-model="form.action">
          <el-radio-button label="inc">增加</el-radio-button>
          <el-radio-button label="dec">扣除</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="amountLabel" prop="amount">
        <el-input-number v-model="form.amount" :min="0" :precision="2" :step="1" controls-position="right" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { User } from "@/api/interface";
import { updateUserBalance, updateUserIntegral } from "@/api/modules/user";

type Mode = "balance" | "integral";

interface DialogParams {
  mode: Mode;
  row: User.ResUserList;
  getTableList?: () => void;
}

const dialogVisible = ref(false);
const mode = ref<Mode>("balance");
const formRef = ref<FormInstance>();
const refreshTable = ref<(() => void) | undefined>();

const form = reactive<User.UpdateAmountParams>({
  id: 0,
  action: "inc",
  amount: 0
});

const rules: FormRules = {
  action: [{ required: true, message: "请选择操作类型", trigger: "change" }],
  amount: [{ required: true, message: "请输入调整数值", trigger: "blur" }]
};

const dialogTitle = computed(() => (mode.value === "balance" ? "调整余额" : "调整积分"));
const amountLabel = computed(() => (mode.value === "balance" ? "金额" : "积分"));

const acceptParams = ({ mode: currentMode, row, getTableList }: DialogParams) => {
  mode.value = currentMode;
  form.id = row.id;
  form.action = "inc";
  form.amount = 0;
  refreshTable.value = getTableList;
  dialogVisible.value = true;
};

const handleSubmit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;
    const payload = {
      id: form.id,
      action: form.action,
      amount: Number(form.amount)
    };

    if (mode.value === "balance") {
      await updateUserBalance(payload);
      ElMessage.success("余额调整成功");
    } else {
      await updateUserIntegral(payload);
      ElMessage.success("积分调整成功");
    }

    dialogVisible.value = false;
    refreshTable.value?.();
  });
};

defineExpose({
  acceptParams
});
</script>
