<template>
  <div class="goods-page">
    <div class="page-header">
      <div class="page-title">
        <span>产品管理</span>
        <el-tag type="info" effect="plain">真实接口：/goods/list</el-tag>
      </div>
      <div class="header-actions">
        <el-button-group>
          <el-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">卡片</el-button>
          <el-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'">表格</el-button>
        </el-button-group>
        <el-button type="primary" @click="openDialog()">新增产品</el-button>
      </div>
    </div>

    <div class="filter-panel">
      <el-form :inline="true" :model="searchForm" class="filter-form">
        <el-form-item label="产品ID">
          <el-input v-model.trim="searchForm.id" clearable placeholder="请输入" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model.trim="searchForm.goods_name" clearable placeholder="请输入" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="分类ID">
          <el-input v-model.trim="searchForm.goods_type_id" clearable placeholder="请输入" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="VIP等级">
          <el-input v-model.trim="searchForm.level_vip" clearable placeholder="请输入" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="返利方式">
          <el-select v-model="searchForm.red_way" clearable placeholder="全部" style="width: 180px">
            <el-option label="到期还本还息" :value="1" />
            <el-option label="每日返息到期还本" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.date_range"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">产品总数</span>
        <strong>{{ summary.total }}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">上架</span>
        <strong>{{ summary.online }}</strong>
      </div>
      <div class="summary-card warning">
        <span class="summary-label">即将推出</span>
        <strong>{{ summary.coming }}</strong>
      </div>
      <div class="summary-card danger">
        <span class="summary-label">下架</span>
        <strong>{{ summary.offline }}</strong>
      </div>
    </div>

    <div class="list-panel">
      <div class="panel-toolbar">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane :label="`全部 ${summary.total}`" name="all" />
          <el-tab-pane :label="`上架 ${summary.online}`" name="online" />
          <el-tab-pane :label="`即将推出 ${summary.coming}`" name="coming" />
          <el-tab-pane :label="`下架 ${summary.offline}`" name="offline" />
        </el-tabs>
      </div>

      <div v-loading="loading">
        <div v-if="viewMode === 'card'" class="card-grid">
          <div v-for="item in goodsList" :key="item.id" class="goods-card">
            <div class="goods-card__body">
              <div class="goods-card__image">
                <UploadImg
                  :image-url="getImageUrl(item.head_img)"
                  :api="uploadGoodsImg"
                  width="96px"
                  height="96px"
                  border-radius="12px"
                  :drag="false"
                  @update:image-url="value => updateGoodsImage(item, value)"
                >
                  <template #empty>
                    <div class="image-placeholder image-placeholder--upload">
                      <span>点击上传</span>
                    </div>
                  </template>
                </UploadImg>
              </div>

              <div class="goods-card__content">
                <div class="goods-card__title">{{ item.goods_name || `产品-${item.id}` }}</div>
                <div class="goods-card__tags">
                  <el-tag type="primary" effect="plain">VIP{{ item.level_vip || 0 }}</el-tag>
                  <el-tag :type="getStatusTag(item.status)" effect="light">{{ getStatusText(item.status) }}</el-tag>
                  <el-tag :type="Number(item.red_way) === 1 ? 'success' : 'warning'" effect="light">
                    {{ getRedWayText(item.red_way) }}
                  </el-tag>
                </div>

                <div class="goods-card__meta">价格：{{ currencyPrefix }}{{ formatMoney(item.goods_money) }}</div>
                <div class="goods-card__meta">日收益：{{ currencyPrefix }}{{ formatMoney(item.day_red) }}</div>
                <div class="goods-card__meta">总收益：{{ currencyPrefix }}{{ formatMoney(item.total_money) }}</div>
                <div class="goods-card__meta">返利方式：{{ getRedWayText(item.red_way) }}</div>
                <div class="goods-card__meta">周期：{{ item.period || 0 }} 天</div>
                <div class="goods-card__meta">限购：{{ item.buy_num || 0 }} 份</div>
              </div>
            </div>

            <div class="goods-card__footer">
              <div class="goods-card__extra">
                <span>产品ID：{{ item.id }}</span>
                <span>创建：{{ item.create_time || "-" }}</span>
              </div>
              <div class="goods-card__actions">
                <el-button size="small" @click="openDialog(item)">编辑</el-button>
                <el-button
                  size="small"
                  :type="Number(item.status) === 1 ? 'warning' : 'success'"
                  plain
                  @click="toggleStatus(item)"
                >
                  {{ Number(item.status) === 1 ? "下架" : "上架" }}
                </el-button>
                <el-button size="small" type="danger" plain @click="handleDelete(item)">删除</el-button>
              </div>
            </div>
          </div>

          <el-empty v-if="!goodsList.length" description="暂无产品数据" />
        </div>

        <div v-else class="table-wrap">
          <el-table :data="goodsList" border>
            <el-table-column prop="id" label="产品ID" width="90" />
            <el-table-column prop="goods_name" label="产品名称" min-width="180" />
            <el-table-column prop="goods_type_id" label="分类ID" width="100" />
            <el-table-column prop="level_vip" label="VIP等级" width="100" />
            <el-table-column prop="goods_money" label="价格" width="120">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.goods_money) }}</template>
            </el-table-column>
            <el-table-column prop="day_red" label="日收益" width="120">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.day_red) }}</template>
            </el-table-column>
            <el-table-column prop="total_money" label="总收益" width="120">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.total_money) }}</template>
            </el-table-column>
            <el-table-column prop="red_way" label="返利方式" min-width="170">
              <template #default="{ row }">{{ getRedWayText(row.red_way) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status)" effect="light">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="创建时间" min-width="180" />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openDialog(row)">编辑</el-button>
                <el-button type="warning" link @click="toggleStatus(row)">
                  {{ Number(row.status) === 1 ? "下架" : "上架" }}
                </el-button>
                <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="pagination-wrap">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :page-sizes="[12, 20, 40, 80]"
          :total="pagination.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <GoodsDialog ref="dialogRef" />
  </div>
</template>

<script setup lang="ts" name="goodsList">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Goods } from "@/api/interface";
import { deleteGoods, getGoodsList, updateGoods } from "@/api/modules/goods";
import { uploadImg } from "@/api/modules/upload";
import { currencyPrefix, getImageUrl } from "@/utils";
import UploadImg from "@/components/Upload/Img.vue";
import GoodsDialog from "@/views/goods/components/GoodsDialog.vue";

type TabType = "all" | "online" | "coming" | "offline";
type ViewMode = "card" | "table";

const dialogRef = ref<InstanceType<typeof GoodsDialog> | null>(null);
const loading = ref(false);
const activeTab = ref<TabType>("all");
const viewMode = ref<ViewMode>("card");
const goodsList = ref<Goods.ResListItem[]>([]);
const latestRequestId = ref(0);

const searchForm = reactive({
  id: "",
  goods_name: "",
  goods_type_id: "",
  level_vip: "",
  red_way: "" as "" | number,
  date_range: [] as string[]
});

const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0
});

const summary = reactive({
  total: 0,
  online: 0,
  coming: 0,
  offline: 0
});

const uploadGoodsImg = (formData: FormData) => {
  formData.append("type", "goods");
  return uploadImg(formData);
};

const buildBaseParams = () => {
  const params: Goods.ReqParams = {
    page: pagination.page,
    limit: pagination.limit
  };

  if (searchForm.id) params.id = searchForm.id;
  if (searchForm.goods_name) params.goods_name = searchForm.goods_name;
  if (searchForm.goods_type_id) params.goods_type_id = searchForm.goods_type_id;
  if (searchForm.level_vip) params.level_vip = searchForm.level_vip;
  if (searchForm.red_way !== "") params.red_way = searchForm.red_way;

  if (Array.isArray(searchForm.date_range) && searchForm.date_range.length === 2) {
    params.start_time = searchForm.date_range[0];
    params.end_time = searchForm.date_range[1];
  }

  return params;
};

const getTabStatus = () => {
  if (activeTab.value === "online") return 1;
  if (activeTab.value === "coming") return 2;
  if (activeTab.value === "offline") return 0;
  return "";
};

const buildParams = (status?: number | string) => {
  const params = buildBaseParams();
  const nextStatus = status !== undefined ? status : getTabStatus();

  if (nextStatus !== "") {
    params.status = nextStatus;
  }

  return params;
};

const isRequestCanceled = (error: unknown) => {
  return error instanceof Error && (error.name === "CanceledError" || (error as { code?: string }).code === "ERR_CANCELED");
};

const fetchSummary = async (requestId: number) => {
  const baseParams = buildBaseParams();
  const [allRes, onlineRes, comingRes, offlineRes] = await Promise.all([
    getGoodsList({ ...baseParams, page: 1, limit: 1 }, { cancel: false, loading: false }),
    getGoodsList({ ...baseParams, page: 1, limit: 1, status: 1 }, { cancel: false, loading: false }),
    getGoodsList({ ...baseParams, page: 1, limit: 1, status: 2 }, { cancel: false, loading: false }),
    getGoodsList({ ...baseParams, page: 1, limit: 1, status: 0 }, { cancel: false, loading: false })
  ]);

  if (requestId !== latestRequestId.value) return;

  summary.total = Number(allRes.data.total || 0);
  summary.online = Number(onlineRes.data.total || 0);
  summary.coming = Number(comingRes.data.total || 0);
  summary.offline = Number(offlineRes.data.total || 0);
};

const fetchGoodsList = async () => {
  const requestId = latestRequestId.value + 1;
  latestRequestId.value = requestId;
  loading.value = true;

  try {
    const { data } = await getGoodsList(buildParams());
    if (requestId !== latestRequestId.value) return;

    goodsList.value = data.data || [];
    pagination.total = Number(data.total || 0);
    await fetchSummary(requestId);
  } catch (error) {
    if (!isRequestCanceled(error)) {
      throw error;
    }
  } finally {
    if (requestId === latestRequestId.value) {
      loading.value = false;
    }
  }
};

const handleSearch = async () => {
  pagination.page = 1;
  await fetchGoodsList();
};

const resetSearch = async () => {
  searchForm.id = "";
  searchForm.goods_name = "";
  searchForm.goods_type_id = "";
  searchForm.level_vip = "";
  searchForm.red_way = "";
  searchForm.date_range = [];
  activeTab.value = "all";
  pagination.page = 1;
  await fetchGoodsList();
};

const handleTabChange = async (name: string | number) => {
  activeTab.value = name as TabType;
  pagination.page = 1;
  await fetchGoodsList();
};

const handlePageChange = async (page: number) => {
  pagination.page = page;
  await fetchGoodsList();
};

const handleSizeChange = async (limit: number) => {
  pagination.limit = limit;
  pagination.page = 1;
  await fetchGoodsList();
};

const openDialog = (row?: Goods.ResListItem) => {
  dialogRef.value?.acceptParams({
    row,
    getTableList: fetchGoodsList
  });
};

const buildGoodsSavePayload = (row: Goods.ResListItem, overrides: Partial<Goods.SaveParams> = {}): Goods.SaveParams => {
  return {
    id: row.id,
    goods_type_id: Number(row.goods_type_id || 1),
    goods_name: row.goods_name || "",
    goods_money: Number(row.goods_money || 0),
    project_scale: Number(row.project_scale || 0),
    day_red: Number(row.day_red || 0),
    income_times_per_day: Number(row.income_times_per_day || 1),
    income_per_time: Number(row.income_per_time || 0),
    total_money: Number(row.total_money || 0),
    revenue_lv: Number(row.revenue_lv || 0),
    period: Number(row.period || 0),
    status: Number(row.status || 0),
    red_way: Number(row.red_way || 1),
    warrant: row.warrant || "",
    head_img: row.head_img || "",
    bottom_img: row.bottom_img || "",
    is_examine: Number(row.is_examine || 0),
    sort: Number(row.sort || 0),
    is_coupon: Number(row.is_coupon || 0),
    progress_rate: Number(row.progress_rate || 0),
    goods_agent_1: Number(row.goods_agent_1 || 0),
    goods_agent_2: Number(row.goods_agent_2 || 0),
    goods_agent_3: Number(row.goods_agent_3 || 0),
    buy_num: Number(row.buy_num || 0),
    level_vip: Number(row.level_vip || 0),
    minute_claim: Number(row.minute_claim || 0),
    ...overrides
  };
};

const toggleStatus = async (row: Goods.ResListItem) => {
  const nextStatus = Number(row.status) === 1 ? 0 : 1;

  await updateGoods(buildGoodsSavePayload(row, { status: nextStatus }));

  ElMessage.success(nextStatus === 1 ? "产品已上架" : "产品已下架");
  await fetchGoodsList();
};

const updateGoodsImage = async (row: Goods.ResListItem, imageUrl: string) => {
  await updateGoods(buildGoodsSavePayload(row, { head_img: imageUrl }));
  row.head_img = imageUrl;
  ElMessage.success(imageUrl ? "封面图已更新" : "封面图已清空");
};

const handleDelete = (row: Goods.ResListItem) => {
  ElMessageBox.confirm(`确认删除产品“${row.goods_name}”吗？`, "删除确认", {
    type: "warning"
  }).then(async () => {
    await deleteGoods({ id: row.id });
    ElMessage.success("产品已删除");
    await fetchGoodsList();
  });
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

const getStatusText = (value: number | string) => {
  const map: Record<number, string> = {
    0: "下架",
    1: "上架",
    2: "即将推出"
  };
  return map[Number(value)] || `状态${value}`;
};

const getStatusTag = (value: number | string) => {
  const map: Record<number, "info" | "success" | "warning"> = {
    0: "info",
    1: "success",
    2: "warning"
  };
  return map[Number(value)] || "info";
};

const getRedWayText = (value: number | string) => {
  const map: Record<number, string> = {
    1: "到期还本还息",
    2: "每日返息到期还本"
  };
  return map[Number(value)] || "-";
};

onMounted(fetchGoodsList);
</script>

<style scoped lang="scss">
.goods-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header,
.filter-panel,
.list-panel {
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.page-title,
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 0;
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
  background: #fff;
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

.summary-card.warning {
  border-color: #fde68a;
  background: #fffbeb;
}

.summary-card.danger {
  border-color: #fecaca;
  background: #fef2f2;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
}

.panel-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 18px;
}

.goods-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 300px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  transition: all 0.2s ease;
}

.goods-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.goods-card__body {
  display: flex;
  gap: 16px;
  padding: 18px;
}

.goods-card__image {
  width: 96px;
  height: 96px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 12px;
  background: #f3f4f6;
}

.goods-card__image :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
  color: #9ca3af;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
}

.image-placeholder--upload {
  cursor: pointer;
}

.goods-card__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.goods-card__title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.goods-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.goods-card__meta {
  font-size: 13px;
  color: #4b5563;
}

.goods-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 18px;
  border-top: 1px solid #f1f5f9;
  background: #fcfcfd;
}

.goods-card__extra {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.goods-card__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.table-wrap {
  margin-top: 8px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page-header,
  .panel-toolbar,
  .goods-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .goods-card__body {
    flex-direction: column;
  }
}
</style>
