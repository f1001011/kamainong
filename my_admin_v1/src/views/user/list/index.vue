<template>
  <div class="table-box">
    <ProTable
      ref="proTable"
      :columns="columns"
      :request-api="requestUserList"
      :data-callback="dataCallback"
      :tool-button="['refresh', 'setting', 'search']"
    >
      <template #tableHeader>
        <div class="page-title">
          <span>用户列表</span>
          <el-tag type="info" effect="plain">已对接 admin_api</el-tag>
        </div>
      </template>

      <template #status="scope">
        <el-button
          link
          :type="Number(scope.row.status) === 1 ? 'success' : 'danger'"
          @click="openStatusDialog('status', scope.row)"
        >
          {{ Number(scope.row.status) === 1 ? "正常" : "冻结" }}
        </el-button>
      </template>

      <template #state="scope">
        <el-button link :type="Number(scope.row.state) === 1 ? 'success' : 'info'" @click="openStatusDialog('state', scope.row)">
          {{ Number(scope.row.state) === 1 ? "在线" : "离线" }}
        </el-button>
      </template>

      <template #money_balance="scope">
        <span class="money">{{ currencyPrefix }}{{ formatMoney(scope.row.money_balance) }}</span>
      </template>

      <template #level_vip="scope">
        <el-tag type="warning" effect="light">VIP{{ scope.row.level_vip || 0 }}</el-tag>
      </template>

      <template #pwd_text="scope">
        <span class="pwd-text">{{ scope.row.pwd_text || "-" }}</span>
      </template>

      <template #agent_chain="scope">
        <div class="agent-chain">
          <span>L1: {{ scope.row.agent_id_1 || "-" }}</span>
          <span>L2: {{ scope.row.agent_id_2 || "-" }}</span>
          <span>L3: {{ scope.row.agent_id_3 || "-" }}</span>
        </div>
      </template>

      <template #money_integral="scope">
        <span>{{ formatMoney(scope.row.money_integral) }}</span>
      </template>

      <template #total_recharge="scope">
        <span>{{ currencyPrefix }}{{ formatMoney(scope.row.total_recharge) }}</span>
      </template>

      <template #total_withdraw="scope">
        <span>{{ currencyPrefix }}{{ formatMoney(scope.row.total_withdraw) }}</span>
      </template>

      <template #total_red="scope">
        <span>{{ currencyPrefix }}{{ formatMoney(scope.row.total_red) }}</span>
      </template>

      <template #operation="scope">
        <el-button type="primary" link @click="openBaseDialog(scope.row)">编辑</el-button>
        <el-button type="primary" link @click="openAmountDialog('balance', scope.row)">调余额</el-button>
        <el-button type="primary" link @click="openAmountDialog('integral', scope.row)">调积分</el-button>
      </template>
    </ProTable>

    <UserBaseDialog ref="baseDialogRef" />
    <UserAmountDialog ref="amountDialogRef" />
    <UserStatusDialog ref="statusDialogRef" />
  </div>
</template>

<script setup lang="ts" name="userList">
import { ref, reactive } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { User } from "@/api/interface";
import { getUserList } from "@/api/modules/user";
import { currencyPrefix } from "@/utils";
import UserBaseDialog from "@/views/user/components/UserBaseDialog.vue";
import UserAmountDialog from "@/views/user/components/UserAmountDialog.vue";
import UserStatusDialog from "@/views/user/components/UserStatusDialog.vue";

const proTable = ref<ProTableInstance>();
const baseDialogRef = ref<InstanceType<typeof UserBaseDialog> | null>(null);
const amountDialogRef = ref<InstanceType<typeof UserAmountDialog> | null>(null);
const statusDialogRef = ref<InstanceType<typeof UserStatusDialog> | null>(null);

const statusOptions = [
  { label: "全部", value: "" },
  { label: "正常", value: 1 },
  { label: "冻结", value: 0 }
];

const stateOptions = [
  { label: "全部", value: "" },
  { label: "在线", value: 1 },
  { label: "离线", value: 0 }
];

const vipSearchOptions = ref<{ label: string; value: number }[]>([]);

const columns = reactive<ColumnProps<User.ResUserList>[]>([
  { type: "index", label: "#", width: 70 },
  { prop: "id", label: "用户ID", width: 90, search: { el: "input" } },
  { prop: "user_name", label: "账号", minWidth: 120, search: { el: "input" } },
  { prop: "user_team", label: "团队号", minWidth: 120 },
  { prop: "invitation_code", label: "邀请码", minWidth: 120 },
  { prop: "nickname", label: "昵称", minWidth: 120 },
  { prop: "phone", label: "手机号", minWidth: 140, search: { el: "input" } },
  { prop: "ip", label: "IP", minWidth: 140 },
  { prop: "level_vip", label: "VIP等级", width: 110, search: { el: "input" } },
  { prop: "pwd_text", label: "登录密码", minWidth: 140 },
  { prop: "agent_chain", label: "代理关系", minWidth: 180, isSetting: false },
  {
    prop: "status",
    label: "冻结状态",
    width: 130,
    enum: statusOptions,
    search: { el: "select", props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  {
    prop: "state",
    label: "在线状态",
    width: 130,
    enum: stateOptions,
    search: { el: "select", props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  { prop: "money_balance", label: "可用余额", width: 120 },
  { prop: "money_integral", label: "可用积分", width: 120 },
  { prop: "total_recharge", label: "累计充值", width: 120 },
  { prop: "total_withdraw", label: "累计提现", width: 120 },
  { prop: "total_red", label: "累计红包", width: 120 },
  {
    prop: "create_time",
    label: "注册时间",
    minWidth: 180,
    search: {
      el: "date-picker",
      key: "date_range",
      span: 2,
      props: { type: "datetimerange", valueFormat: "YYYY-MM-DD HH:mm:ss" }
    }
  },
  { prop: "operation", label: "操作", fixed: "right", width: 220 }
]);

const vipColumn = columns.find(item => item.prop === "level_vip");
if (vipColumn) {
  vipColumn.enum = vipSearchOptions;
  vipColumn.search = {
    el: "select",
    tooltip: "按所选 VIP 等级进行大于等于筛选",
    props: { clearable: true, filterable: true }
  };
}

const requestUserList = (params: Record<string, any>) => {
  const newParams: User.ReqUserParams = {
    page: params.pageNum,
    limit: params.pageSize,
    user_id: params.id,
    user_name: params.user_name,
    phone: params.phone,
    level_vip: params.level_vip,
    status: params.status,
    state: params.state
  };

  if (Array.isArray(params.date_range)) {
    newParams.start_time = params.date_range[0];
    newParams.end_time = params.date_range[1];
  }

  return getUserList(newParams);
};

const dataCallback = (data: User.ResUserListData) => {
  const nextVipOptions = Array.from(
    new Set((data.data || []).map(item => Number(item.level_vip || 0)).filter(level => !Number.isNaN(level)))
  )
    .sort((first, second) => first - second)
    .map(level => ({
      label: `VIP${level}`,
      value: level
    }));

  vipSearchOptions.value = nextVipOptions;

  return {
    list:
      (data.data || []).map(item => ({
        ...item,
        agent_chain: `L1:${item.agent_id_1 || "-"} / L2:${item.agent_id_2 || "-"} / L3:${item.agent_id_3 || "-"}`
      })) || [],
    total: data.total || 0
  };
};

const formatMoney = (value: number | string) => {
  const amount = Number(value || 0);
  return amount.toFixed(2);
};

const refreshTable = () => {
  proTable.value?.getTableList();
};

const openBaseDialog = (row: User.ResUserList) => {
  baseDialogRef.value?.acceptParams({
    row,
    getTableList: refreshTable
  });
};

const openAmountDialog = (mode: "balance" | "integral", row: User.ResUserList) => {
  amountDialogRef.value?.acceptParams({
    mode,
    row,
    getTableList: refreshTable
  });
};

const openStatusDialog = (mode: "status" | "state", row: User.ResUserList) => {
  statusDialogRef.value?.acceptParams({
    mode,
    row,
    getTableList: refreshTable
  });
};
</script>

<style scoped lang="scss">
.page-title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.money {
  font-weight: 600;
  color: #2563eb;
}

.pwd-text {
  font-family: Consolas, "Courier New", monospace;
  color: #374151;
}

.agent-chain {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: #4b5563;
}
</style>
