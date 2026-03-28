<template>
  <div class="table-box">
    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">当前页渠道数</span>
        <strong>{{ summary.total }}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">上架数量</span>
        <strong>{{ summary.online }}</strong>
      </div>
      <div class="summary-card danger">
        <span class="summary-label">下架数量</span>
        <strong>{{ summary.offline }}</strong>
      </div>
    </div>

    <ProTable
      ref="proTable"
      :columns="columns"
      :request-api="requestChannelList"
      :data-callback="dataCallback"
      :tool-button="['refresh', 'setting', 'search']"
    >
      <template #tableHeader>
        <div class="table-header">
          <div class="page-title">
            <span>{{ title }}</span>
            <el-tag type="info" effect="plain">{{ tagText }}</el-tag>
          </div>
          <el-button type="primary" @click="openDialog()">新增渠道</el-button>
        </div>
      </template>

      <template #status="scope">
        <el-tag :type="Number(scope.row.status) === 1 ? 'success' : 'info'" effect="light">
          {{ Number(scope.row.status) === 1 ? "上架" : "下架" }}
        </el-tag>
      </template>

      <template #type="scope">
        <el-tag :type="Number(scope.row.type) === 1 ? 'primary' : 'warning'" effect="plain">
          {{ Number(scope.row.type) === 1 ? "充值渠道" : "提现渠道" }}
        </el-tag>
      </template>

      <template #json_value="scope">
        <div class="json-preview">{{ formatJson(scope.row.json_value) }}</div>
      </template>

      <template #operation="scope">
        <el-button type="primary" link @click="openDialog(scope.row)">编辑</el-button>
        <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
      </template>
    </ProTable>

    <ChannelDialog ref="dialogRef" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import type { ColumnProps, ProTableInstance } from "@/components/ProTable/interface";
import { PayChannel } from "@/api/interface";
import { deletePayChannel, getPayChannelList } from "@/api/modules/payment";
import ChannelDialog from "@/views/payment/components/ChannelDialog.vue";

interface Props {
  channelType: number;
  title: string;
  tagText: string;
}

const props = defineProps<Props>();

const proTable = ref<ProTableInstance>();
const dialogRef = ref<InstanceType<typeof ChannelDialog> | null>(null);

const summary = reactive({
  total: 0,
  online: 0,
  offline: 0
});

const statusOptions = [
  { label: "全部", value: "" },
  { label: "上架", value: 1 },
  { label: "下架", value: 0 }
];

const columns = reactive<ColumnProps<PayChannel.ResListItem>[]>([
  { type: "index", label: "#", width: 70 },
  { prop: "id", label: "渠道ID", width: 90, search: { el: "input" } },
  { prop: "name", label: "渠道名称", minWidth: 160, search: { el: "input" } },
  { prop: "type", label: "渠道类型", width: 120 },
  {
    prop: "status",
    label: "状态",
    width: 120,
    enum: statusOptions,
    search: { el: "select", props: { clearable: true } },
    fieldNames: { label: "label", value: "value" }
  },
  { prop: "json_value", label: "渠道配置", minWidth: 320 },
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
  },
  { prop: "operation", label: "操作", fixed: "right", width: 140 }
]);

const requestChannelList = (params: Record<string, any>) => {
  const newParams: PayChannel.ReqParams = {
    page: params.pageNum,
    limit: params.pageSize,
    id: params.id,
    name: params.name,
    status: params.status,
    type: props.channelType
  };

  if (Array.isArray(params.date_range)) {
    newParams.start_time = params.date_range[0];
    newParams.end_time = params.date_range[1];
  }

  return getPayChannelList(newParams);
};

const dataCallback = (res: PayChannel.ResListData) => {
  const list = res.data || [];
  summary.total = list.length;
  summary.online = list.filter(item => Number(item.status) === 1).length;
  summary.offline = list.filter(item => Number(item.status) === 0).length;
  return {
    list,
    total: res.total || 0
  };
};

const openDialog = (row?: PayChannel.ResListItem) => {
  dialogRef.value?.acceptParams({
    row,
    channelType: props.channelType,
    getTableList: () => proTable.value?.getTableList()
  });
};

const handleDelete = (row: PayChannel.ResListItem) => {
  ElMessageBox.confirm(`确认删除渠道“${row.name}”吗？`, "删除确认", {
    type: "warning"
  }).then(async () => {
    await deletePayChannel({ id: row.id });
    ElMessage.success("渠道已删除");
    proTable.value?.getTableList();
  });
};

const formatJson = (value: string) => {
  if (!value) return "-";
  return value.length > 120 ? `${value.slice(0, 120)}...` : value;
};
</script>

<style scoped lang="scss">
.table-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.page-title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.summary-card strong {
  font-size: 24px;
  color: #111827;
}

.summary-card.success {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.summary-card.danger {
  border-color: #fecaca;
  background: #fef2f2;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
}

.json-preview {
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #374151;
  word-break: break-all;
}

@media (max-width: 900px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
