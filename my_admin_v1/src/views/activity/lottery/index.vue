<template>
  <div class="lottery-page">
    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">奖品总数</span><strong>{{ pagination.total }}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">启用奖品</span><strong>{{ enabledCount }}</strong>
      </div>
      <div class="summary-card primary">
        <span class="summary-label">现金奖品</span><strong>{{ cashCount }}</strong>
      </div>
      <div class="summary-card warning">
        <span class="summary-label">实物奖品</span><strong>{{ physicalCount }}</strong>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="page-title">
          <span>转盘奖品配置</span>
          <el-tag type="success" effect="plain">真实接口：/lottery/prize/list</el-tag>
        </div>
        <div class="header-actions">
          <el-input v-model="search.id" clearable placeholder="ID" style="width: 100px" @keyup.enter="handleSearch" />
          <el-input v-model="search.name" clearable placeholder="奖品名称" style="width: 160px" @keyup.enter="handleSearch" />
          <el-select v-model="search.type" clearable placeholder="类型" style="width: 120px">
            <el-option label="现金" :value="1" />
            <el-option label="实物" :value="2" />
          </el-select>
          <el-select v-model="search.status" clearable placeholder="状态" style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" plain @click="handleSearch">查询</el-button>
          <el-button @click="fetchList">刷新</el-button>
          <el-button type="primary" @click="openDialog()">新增奖品</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="奖品名称" min-width="180" />
        <el-table-column prop="type" label="类型" min-width="100">
          <template #default="{ row }">{{ Number(row.type) === 1 ? "现金" : "实物" }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" min-width="120">
          <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="probability" label="概率(%)" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">{{ Number(row.status) === 1 ? "启用" : "禁用" }}</template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑转盘奖品' : '新增转盘奖品'" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="奖品名称"><el-input v-model="form.name" placeholder="请输入奖品名称" /></el-form-item>
        <el-form-item label="奖品类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="现金" :value="1" />
            <el-option label="实物" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="中奖概率">
          <el-input-number v-model="form.probability" :min="0" :max="100" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="图片地址"><el-input v-model="form.image" placeholder="可空" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="lotteryManage">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Activity } from "@/api/interface";
import { addLotteryPrize, deleteLotteryPrize, getLotteryPrizeList, updateLotteryPrize } from "@/api/modules/activity";
import { currencyPrefix } from "@/utils";

const loading = ref(false);
const dialogVisible = ref(false);
const list = ref<Activity.LotteryPrizeItem[]>([]);
const pagination = reactive({ page: 1, limit: 20, total: 0 });
const search = reactive({
  id: "",
  name: "",
  type: undefined as number | undefined,
  status: undefined as number | undefined
});

const form = reactive<Activity.SaveLotteryPrizeParams>({
  name: "",
  type: 1,
  amount: 0,
  probability: 0,
  image: "",
  status: 1
});

const enabledCount = computed(() => list.value.filter(item => Number(item.status) === 1).length);
const cashCount = computed(() => list.value.filter(item => Number(item.type) === 1).length);
const physicalCount = computed(() => list.value.filter(item => Number(item.type) === 2).length);

const resetForm = () => {
  delete form.id;
  form.name = "";
  form.type = 1;
  form.amount = 0;
  form.probability = 0;
  form.image = "";
  form.status = 1;
};

const openDialog = (row?: Activity.LotteryPrizeItem) => {
  resetForm();
  if (row) {
    form.id = row.id;
    form.name = row.name;
    form.type = Number(row.type);
    form.amount = Number(row.amount);
    form.probability = Number(row.probability);
    form.image = row.image || "";
    form.status = Number(row.status);
  }
  dialogVisible.value = true;
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getLotteryPrizeList({
      page: pagination.page,
      limit: pagination.limit,
      id: search.id || undefined,
      name: search.name || undefined,
      type: search.type,
      status: search.status
    });
    list.value = res.data.data || [];
    pagination.total = Number(res.data.total || 0);
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  const payload: Activity.SaveLotteryPrizeParams = {
    ...(form.id ? { id: form.id } : {}),
    name: form.name,
    type: Number(form.type),
    amount: Number(form.amount),
    probability: Number(form.probability),
    image: form.image,
    status: Number(form.status)
  };
  const res = form.id ? await updateLotteryPrize(payload) : await addLotteryPrize(payload);
  ElMessage.success(res.message || "转盘奖品保存成功");
  dialogVisible.value = false;
  await fetchList();
};

const handleDelete = (row: Activity.LotteryPrizeItem) => {
  ElMessageBox.confirm(`确认删除奖品“${row.name}”吗？`, "删除确认", { type: "warning" }).then(async () => {
    const res = await deleteLotteryPrize({ id: row.id });
    ElMessage.success(res.message || "转盘奖品已删除");
    await fetchList();
  });
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchList();
};

const handleSearch = async () => {
  pagination.page = 1;
  await fetchList();
};

const resetSearch = async () => {
  search.id = "";
  search.name = "";
  search.type = undefined;
  search.status = undefined;
  pagination.page = 1;
  await fetchList();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.page = 1;
  fetchList();
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

onMounted(fetchList);
</script>

<style scoped lang="scss">
.lottery-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}
.summary-card strong {
  font-size: 24px;
  color: #111827;
}
.summary-card.success {
  border-color: #bbf7d0;
  background: #f0fdf4;
}
.summary-card.primary {
  border-color: #bfdbfe;
  background: #eff6ff;
}
.summary-card.warning {
  border-color: #fde68a;
  background: #fffbeb;
}
.summary-label {
  font-size: 13px;
  color: #6b7280;
}
.panel {
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}
.panel-header,
.page-title,
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.panel-header {
  justify-content: space-between;
  margin-bottom: 16px;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .panel-header,
  .page-title,
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
