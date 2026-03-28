<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="订单ID">
            <el-input :model-value="String(form.id || '')" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户ID">
            <el-input :model-value="String(currentRow?.uid || '')" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="订单状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="渠道名称">
            <el-select v-model="form.channel_id" clearable filterable placeholder="请选择渠道" style="width: 100%">
              <el-option v-for="item in channelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="充值金额" prop="money">
            <el-input-number v-model="form.money" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="实际到账" prop="actual_amount">
            <el-input-number v-model="form.actual_amount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="订单号">
            <el-input v-model.trim="form.order_no" placeholder="请输入订单号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="三方订单号">
            <el-input v-model.trim="form.trilateral_order" placeholder="请输入三方订单号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="收款账号">
            <el-input v-model.trim="form.sys_bank_id" placeholder="请输入收款账号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="银行名称">
            <el-input v-model.trim="form.u_bank_name" placeholder="请输入银行名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="收款人">
            <el-input v-model.trim="form.u_bank_user_name" placeholder="请输入收款人" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="银行卡号">
            <el-input v-model.trim="form.u_bank_card" placeholder="请输入银行卡号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="过期时间">
            <el-date-picker
              v-model="form.expire_at"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择过期时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="到账时间">
            <el-date-picker
              v-model="form.success_time"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择到账时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="凭证图片">
            <el-input v-model.trim="form.image_url" placeholder="请输入凭证图片 URL" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="驳回原因">
            <el-input v-model.trim="form.reject_reason" type="textarea" :rows="3" placeholder="支付失败时可填写原因" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { PayChannel, Recharge } from "@/api/interface";
import { getPayChannelList, updateRechargeOrder } from "@/api/modules/payment";

interface DialogParams {
  row: Recharge.ResListItem;
  getTableList?: () => void;
}

const dialogVisible = ref(false);
const dialogTitle = ref("编辑充值订单");
const formRef = ref<FormInstance>();
const refreshTable = ref<(() => void) | undefined>();
const currentRow = ref<Recharge.ResListItem>();
const channelOptions = ref<{ label: string; value: number }[]>([]);

const form = reactive<Recharge.UpdateParams>({
  id: 0,
  status: 0,
  money: 0,
  actual_amount: 0,
  channel_id: undefined,
  order_no: "",
  sys_bank_id: "",
  u_bank_name: "",
  u_bank_user_name: "",
  u_bank_card: "",
  reject_reason: "",
  trilateral_order: "",
  image_url: "",
  expire_at: "",
  success_time: ""
});

const statusOptions = [
  { label: "创建订单", value: 0 },
  { label: "待支付", value: 1 },
  { label: "已到账", value: 2 },
  { label: "支付失败", value: 3 }
];

const rules: FormRules = {
  status: [{ required: true, message: "请选择订单状态", trigger: "change" }]
};

const loadChannelOptions = async () => {
  const { data } = await getPayChannelList({ page: 1, limit: 200, type: 1 });
  channelOptions.value = (data.data || []).map((item: PayChannel.ResListItem) => ({
    label: item.name,
    value: item.id
  }));
};

const acceptParams = async ({ row, getTableList }: DialogParams) => {
  currentRow.value = row;
  form.id = row.id;
  form.status = Number(row.status);
  form.money = Number(row.money || 0);
  form.actual_amount = Number(row.actual_amount || 0);
  form.channel_id = row.channel_id;
  form.order_no = row.order_no || "";
  form.sys_bank_id = row.sys_bank_id || "";
  form.u_bank_name = row.u_bank_name || "";
  form.u_bank_user_name = row.u_bank_user_name || "";
  form.u_bank_card = row.u_bank_card || "";
  form.reject_reason = row.reject_reason || "";
  form.trilateral_order = row.trilateral_order || "";
  form.image_url = row.image_url || "";
  form.expire_at = row.expire_at || "";
  form.success_time = row.success_time || "";
  refreshTable.value = getTableList;
  await loadChannelOptions();
  dialogVisible.value = true;
};

const handleSubmit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;

    await updateRechargeOrder({
      ...form,
      money: Number(form.money || 0),
      actual_amount: Number(form.actual_amount || 0)
    });
    ElMessage.success("充值订单已更新");
    dialogVisible.value = false;
    refreshTable.value?.();
  });
};

defineExpose({
  acceptParams
});
</script>
