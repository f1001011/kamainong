<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="860px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="订单ID">
            <el-input :model-value="String(form.id || '')" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户ID">
            <el-input :model-value="String(currentRow?.u_id || '')" disabled />
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
          <el-form-item label="代付通道">
            <el-select v-model="form.channel_id" clearable filterable placeholder="请选择渠道" style="width: 100%">
              <el-option v-for="item in channelOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="提现金额" prop="money">
            <el-input-number v-model="form.money" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手续费">
            <el-input-number v-model="form.fee" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="实际到账">
            <el-input-number v-model="form.actual_amount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="订单号">
            <el-input v-model.trim="form.order_on" placeholder="请输入订单号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="三方订单号">
            <el-input v-model.trim="form.trilateral_order" placeholder="请输入三方订单号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="支付方式">
            <el-input v-model.trim="form.pay_type" placeholder="请输入支付方式" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="平台提交">
            <el-select v-model="form.is_status" placeholder="请选择" style="width: 100%">
              <el-option label="未提交" :value="0" />
              <el-option label="已提交" :value="1" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="银行名称">
            <el-input v-model.trim="form.u_bank_name" placeholder="请输入银行名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="收款账号">
            <el-input v-model.trim="form.u_back_card" placeholder="请输入收款账号" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="收款人">
            <el-input v-model.trim="form.u_back_user_name" placeholder="请输入收款人" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="审核时间">
            <el-date-picker
              v-model="form.success_time"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择审核时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="拒绝原因">
            <el-input v-model.trim="form.reject_reason" placeholder="拒绝时可填写" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input v-model.trim="form.msg" type="textarea" :rows="3" placeholder="请输入备注" />
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
import { Cash, PayChannel } from "@/api/interface";
import { getPayChannelList, updateCashOrder } from "@/api/modules/payment";

interface DialogParams {
  row: Cash.ResListItem;
  getTableList?: () => void;
}

const dialogVisible = ref(false);
const dialogTitle = ref("编辑提现订单");
const formRef = ref<FormInstance>();
const refreshTable = ref<(() => void) | undefined>();
const currentRow = ref<Cash.ResListItem>();
const channelOptions = ref<{ label: string; value: number }[]>([]);

const form = reactive<Cash.UpdateParams>({
  id: 0,
  status: 0,
  money: 0,
  fee: 0,
  actual_amount: 0,
  channel_id: undefined,
  order_on: "",
  pay_type: "",
  u_bank_name: "",
  u_back_card: "",
  u_back_user_name: "",
  reject_reason: "",
  trilateral_order: "",
  success_time: "",
  msg: "",
  is_status: 0
});

const statusOptions = [
  { label: "申请中", value: 0 },
  { label: "已完成", value: 1 },
  { label: "已拒绝", value: 2 }
];

const rules: FormRules = {
  status: [{ required: true, message: "请选择订单状态", trigger: "change" }]
};

const loadChannelOptions = async () => {
  const { data } = await getPayChannelList({ page: 1, limit: 200, type: 2 });
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
  form.fee = Number(row.fee || 0);
  form.actual_amount = Number(row.actual_amount || 0);
  form.channel_id = row.channel_id;
  form.order_on = row.order_on || "";
  form.pay_type = row.pay_type || "";
  form.u_bank_name = row.u_bank_name || "";
  form.u_back_card = row.u_back_card || "";
  form.u_back_user_name = row.u_back_user_name || "";
  form.reject_reason = row.reject_reason || "";
  form.trilateral_order = row.trilateral_order || "";
  form.success_time = row.success_time || "";
  form.msg = row.msg || "";
  form.is_status = Number(row.is_status || 0);
  refreshTable.value = getTableList;
  await loadChannelOptions();
  dialogVisible.value = true;
};

const handleSubmit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;

    await updateCashOrder({
      ...form,
      money: Number(form.money || 0),
      fee: Number(form.fee || 0),
      actual_amount: Number(form.actual_amount || 0)
    });
    ElMessage.success("提现订单已更新");
    dialogVisible.value = false;
    refreshTable.value?.();
  });
};

defineExpose({
  acceptParams
});
</script>
