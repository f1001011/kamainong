<template>
  <div class="table-box">
    <ProTable
      :columns="columns"
      :request-api="requestGoodsOrderList"
      :data-callback="dataCallback"
      :tool-button="['refresh', 'setting', 'search']"
    >
      <template #tableHeader>
        <div class="page-title">
          <span>商品订单</span>
          <el-tag type="info" effect="plain">真实接口：/goods/order/list</el-tag>
        </div>
      </template>

      <template #status="scope">
        <el-tag :type="getStatusTag(scope.row.status)" effect="light">
          {{ getStatusText(scope.row.status) }}
        </el-tag>
      </template>

      <template #order_money="scope">
        <span class="amount">{{ currencyPrefix }}{{ formatMoney(scope.row.order_money) }}</span>
      </template>

      <template #total_red_money="scope">
        <span class="success-text">{{ currencyPrefix }}{{ formatMoney(scope.row.total_red_money) }}</span>
      </template>

      <template #coupon_money="scope">
        <span>{{ currencyPrefix }}{{ formatMoney(scope.row.coupon_money) }}</span>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="ts" name="goodsOrder">
import { reactive } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps } from "@/components/ProTable/interface";
import { GoodsOrder } from "@/api/interface";
import { getGoodsOrderList } from "@/api/modules/product";
import { currencyPrefix } from "@/utils";

const statusOptions = [
  { label: "全部", value: "" },
  { label: "分红中", value: 0 },
  { label: "返佣完成", value: 1 },
  { label: "利息完成", value: 2 },
  { label: "本金完成", value: 3 },
  { label: "已删除", value: -1 }
];

const columns = reactive<ColumnProps<GoodsOrder.ResListItem>[]>([
  { type: "index", label: "#", width: 70 },
  { prop: "id", label: "订单ID", width: 90 },
  { prop: "user_id", label: "用户ID", width: 100, search: { el: "input" } },
  { prop: "goods_id", label: "产品ID", width: 100, search: { el: "input" } },
  { prop: "order_no", label: "订单号", minWidth: 180, search: { el: "input" } },
  { prop: "goods_name", label: "产品名称", minWidth: 160 },
  {
    prop: "status",
    label: "订单状态",
    width: 120,
    enum: statusOptions,
    search: { el: "select", props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  { prop: "order_money", label: "订单金额", width: 120 },
  { prop: "order_number", label: "数量", width: 80 },
  { prop: "total_red_money", label: "总分红", width: 120 },
  { prop: "already_red_money", label: "已分红", width: 120 },
  { prop: "surplus_red_money", label: "剩余分红", width: 120 },
  { prop: "coupon_money", label: "优惠券金额", width: 120 },
  { prop: "next_red_date", label: "下次分红", minWidth: 160 },
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

const requestGoodsOrderList = (params: Record<string, any>) => {
  const newParams: GoodsOrder.ReqParams = {
    page: params.pageNum,
    limit: params.pageSize,
    user_id: params.user_id,
    goods_id: params.goods_id,
    order_no: params.order_no,
    status: params.status
  };

  if (Array.isArray(params.date_range)) {
    newParams.start_time = params.date_range[0];
    newParams.end_time = params.date_range[1];
  }

  return getGoodsOrderList(newParams);
};

const dataCallback = (res: GoodsOrder.ResListData) => ({
  list: res.data || [],
  total: res.total || 0
});

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

const getStatusText = (value: number | string) => {
  const map: Record<number, string> = {
    [-1]: "已删除",
    0: "分红中",
    1: "返佣完成",
    2: "利息完成",
    3: "本金完成"
  };
  return map[Number(value)] || `状态${value}`;
};

const getStatusTag = (value: number | string) => {
  const map: Record<number, "danger" | "warning" | "success" | "primary" | "info"> = {
    [-1]: "danger",
    0: "warning",
    1: "primary",
    2: "success",
    3: "info"
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

.success-text {
  font-weight: 600;
  color: #16a34a;
}
</style>
