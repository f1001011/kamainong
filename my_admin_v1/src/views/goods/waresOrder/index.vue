<template>
  <div class="table-box">
    <ProTable
      :columns="columns"
      :request-api="requestWaresOrderList"
      :data-callback="dataCallback"
      :tool-button="['refresh', 'setting', 'search']"
    >
      <template #tableHeader>
        <div class="page-title">
          <span>兑换订单</span>
          <el-tag type="info" effect="plain">真实接口：/wares/order/list</el-tag>
        </div>
      </template>

      <template #status="scope">
        <el-tag :type="getStatusTag(scope.row.status)" effect="light">
          {{ getStatusText(scope.row.status) }}
        </el-tag>
      </template>

      <template #wares_money="scope">
        <span class="amount">{{ formatMoney(scope.row.wares_money) }} 积分</span>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="ts" name="waresOrder">
import { reactive } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { WaresOrder } from "@/api/interface";
import { getWaresOrderList } from "@/api/modules/product";

const statusOptions = [
  { label: "全部", value: "" },
  { label: "下单", value: 0 },
  { label: "发货中", value: 1 },
  { label: "运输中", value: 2 },
  { label: "签收", value: 3 },
  { label: "拒签", value: 4 }
];

const columns = reactive<ColumnProps<WaresOrder.ResListItem>[]>([
  { type: "index", label: "#", width: 70 },
  { prop: "id", label: "订单ID", width: 90 },
  { prop: "uid", label: "用户ID", width: 100, search: { el: "input" } },
  { prop: "wares_id", label: "商品ID", width: 100, search: { el: "input" } },
  { prop: "wares_no", label: "订单号", minWidth: 180, search: { el: "input" } },
  {
    prop: "status",
    label: "状态",
    width: 120,
    enum: statusOptions,
    search: { el: "select", props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  { prop: "wares_spec", label: "商品规格", minWidth: 140 },
  { prop: "wares_money", label: "兑换积分", width: 120 },
  { prop: "phone", label: "联系电话", minWidth: 140 },
  { prop: "address", label: "收货地址", minWidth: 220 },
  { prop: "success_time", label: "完成时间", minWidth: 160 },
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

const requestWaresOrderList = (params: Record<string, any>) => {
  const newParams: WaresOrder.ReqParams = {
    page: params.pageNum,
    limit: params.pageSize,
    user_id: params.uid,
    wares_id: params.wares_id,
    wares_no: params.wares_no,
    status: params.status
  };

  if (Array.isArray(params.date_range)) {
    newParams.start_time = params.date_range[0];
    newParams.end_time = params.date_range[1];
  }

  return getWaresOrderList(newParams);
};

const dataCallback = (res: WaresOrder.ResListData) => ({
  list: res.data || [],
  total: res.total || 0
});

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

const getStatusText = (value: number | string) => {
  const map: Record<number, string> = {
    0: "下单",
    1: "发货中",
    2: "运输中",
    3: "签收",
    4: "拒签"
  };
  return map[Number(value)] || `状态${value}`;
};

const getStatusTag = (value: number | string) => {
  const map: Record<number, "info" | "warning" | "primary" | "success" | "danger"> = {
    0: "info",
    1: "warning",
    2: "primary",
    3: "success",
    4: "danger"
  };
  return map[Number(value)] || "info";
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
  color: #111827;
}
</style>
