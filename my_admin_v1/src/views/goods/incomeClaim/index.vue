<template>
  <div class="table-box">
    <ProTable
      :columns="columns"
      :request-api="requestIncomeClaimList"
      :data-callback="dataCallback"
      :tool-button="['refresh', 'setting', 'search']"
    >
      <template #tableHeader>
        <div class="page-title">
          <span>收益领取记录</span>
          <el-tag type="info" effect="plain">真实接口：/income/claim/log/list</el-tag>
        </div>
      </template>

      <template #status="scope">
        <el-tag :type="getStatusTag(scope.row.status)" effect="light">
          {{ getStatusText(scope.row.status) }}
        </el-tag>
      </template>

      <template #claim_amount="scope">
        <span class="amount success-text">{{ currencyPrefix }}{{ formatMoney(scope.row.claim_amount) }}</span>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="ts" name="incomeClaimLog">
import { reactive } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { IncomeClaimLog } from "@/api/interface";
import { getIncomeClaimLogList } from "@/api/modules/product";
import { currencyPrefix } from "@/utils";

const statusOptions = [
  { label: "全部", value: "" },
  { label: "待领取", value: 0 },
  { label: "已领取", value: 1 },
  { label: "已过期", value: 2 }
];

const columns = reactive<ColumnProps<IncomeClaimLog.ResListItem>[]>([
  { type: "index", label: "#", width: 70 },
  { prop: "id", label: "记录ID", width: 90 },
  { prop: "user_id", label: "用户ID", width: 100, search: { el: "input" } },
  { prop: "order_id", label: "订单ID", width: 100, search: { el: "input" } },
  { prop: "goods_id", label: "产品ID", width: 100, search: { el: "input" } },
  {
    prop: "status",
    label: "状态",
    width: 120,
    enum: statusOptions,
    search: { el: "select", props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  { prop: "claim_amount", label: "领取金额", width: 120 },
  { prop: "date_time", label: "发放日期", width: 120 },
  { prop: "claim_time", label: "领取时间", minWidth: 160 },
  { prop: "expire_time", label: "过期时间", minWidth: 160 },
  {
    prop: "create_time",
    label: "创建时间",
    minWidth: 180,
    search: {
      el: "date-picker",
      key: "date_range",
      span: 2,
      props: { type: "datetimerange", valueFormat: "YYYY-MM-DD HH:mm:ss" }
    }
  }
]);

const requestIncomeClaimList = (params: Record<string, any>) => {
  const newParams: IncomeClaimLog.ReqParams = {
    page: params.pageNum,
    limit: params.pageSize,
    user_id: params.user_id,
    order_id: params.order_id,
    goods_id: params.goods_id,
    status: params.status
  };

  if (Array.isArray(params.date_range)) {
    newParams.start_time = params.date_range[0];
    newParams.end_time = params.date_range[1];
  }

  return getIncomeClaimLogList(newParams);
};

const dataCallback = (res: IncomeClaimLog.ResListData) => ({
  list: res.data || [],
  total: res.total || 0
});

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

const getStatusText = (value: number | string) => {
  const map: Record<number, string> = {
    0: "待领取",
    1: "已领取",
    2: "已过期"
  };
  return map[Number(value)] || `状态${value}`;
};

const getStatusTag = (value: number | string) => {
  const map: Record<number, "warning" | "success" | "danger"> = {
    0: "warning",
    1: "success",
    2: "danger"
  };
  return map[Number(value)] || "warning";
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

.amount {
  font-weight: 600;
}

.success-text {
  color: #16a34a;
}
</style>
