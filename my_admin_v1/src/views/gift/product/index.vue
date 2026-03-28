<template>
  <div class="wares-page">
    <div class="page-header">
      <div class="page-title">
        <span>兑换商品管理</span>
        <el-tag type="info" effect="plain">真实接口：/wares/list</el-tag>
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
        <el-form-item label="商品ID">
          <el-input v-model.trim="searchForm.id" clearable placeholder="请输入" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model.trim="searchForm.wares_name" clearable placeholder="请输入" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="分类ID">
          <el-input v-model.trim="searchForm.wares_type_id" clearable placeholder="请输入" @keyup.enter="handleSearch" />
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
        <span class="summary-label">商品总数</span>
        <strong>{{ summary.total }}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">上架</span>
        <strong>{{ summary.online }}</strong>
      </div>
      <div class="summary-card danger">
        <span class="summary-label">下架</span>
        <strong>{{ summary.offline }}</strong>
      </div>
      <div class="summary-card primary">
        <span class="summary-label">当前页展示</span>
        <strong>{{ waresList.length }}</strong>
      </div>
    </div>

    <div class="list-panel">
      <div class="panel-toolbar">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane :label="`全部 ${summary.total}`" name="all" />
          <el-tab-pane :label="`上架 ${summary.online}`" name="online" />
          <el-tab-pane :label="`下架 ${summary.offline}`" name="offline" />
        </el-tabs>
      </div>

      <div v-loading="loading">
        <div v-if="viewMode === 'card'" class="card-grid">
          <div v-for="item in waresList" :key="item.id" class="wares-card">
            <div class="wares-card__body">
              <div class="wares-card__image">
                <UploadImg
                  :image-url="getImageUrl(item.head_img)"
                  :api="uploadWaresImg"
                  width="84px"
                  height="84px"
                  border-radius="12px"
                  :drag="false"
                  @update:image-url="value => updateWaresImage(item, value)"
                >
                  <template #empty>
                    <div class="image-placeholder image-placeholder--upload">
                      <span>点击上传</span>
                    </div>
                  </template>
                </UploadImg>
              </div>

              <div class="wares-card__content">
                <div class="wares-card__title">{{ item.wares_name || `商品-${item.id}` }}</div>
                <div class="wares-card__tags">
                  <el-tag type="primary" effect="plain">积分兑换</el-tag>
                  <el-tag :type="getStatusTag(item.status)" effect="light">{{ getStatusText(item.status) }}</el-tag>
                </div>

                <div class="wares-card__meta">价格：{{ formatMoney(item.wares_money) }} 积分</div>
                <div class="wares-card__meta">规格：{{ item.wares_spec || "-" }}</div>
                <div class="wares-card__meta">分类ID：{{ item.wares_type_id || "-" }}</div>
                <div class="wares-card__meta">排序：{{ item.sort || 0 }}</div>
                <div class="wares-card__desc">{{ item.content || "暂无商品介绍" }}</div>
              </div>
            </div>

            <div class="wares-card__footer">
              <div class="wares-card__extra">
                <span>商品ID：{{ item.id }}</span>
                <span>创建：{{ item.create_time || "-" }}</span>
              </div>
              <div class="wares-card__actions">
                <el-button size="small" @click="openDialog(item)">编辑</el-button>
                <el-button size="small" type="success" plain :disabled="Number(item.status) === 1" @click="setStatus(item, 1)">
                  上架
                </el-button>
                <el-button size="small" type="warning" plain :disabled="Number(item.status) === 0" @click="setStatus(item, 0)">
                  下架
                </el-button>
                <el-button size="small" type="danger" plain @click="handleDelete(item)">删除</el-button>
              </div>
            </div>
          </div>

          <el-empty v-if="!waresList.length" description="暂无商品数据" />
        </div>

        <div v-else class="table-wrap">
          <el-table :data="waresList" border>
            <el-table-column prop="id" label="商品ID" width="90" />
            <el-table-column prop="wares_name" label="商品名称" min-width="180" />
            <el-table-column prop="wares_type_id" label="分类ID" width="100" />
            <el-table-column prop="wares_spec" label="商品规格" min-width="140" />
            <el-table-column prop="wares_money" label="兑换积分" width="120">
              <template #default="{ row }">{{ formatMoney(row.wares_money) }} 积分</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status)" effect="light">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" width="90" />
            <el-table-column prop="create_time" label="创建时间" min-width="180" />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openDialog(row)">编辑</el-button>
                <el-button type="success" link :disabled="Number(row.status) === 1" @click="setStatus(row, 1)">上架</el-button>
                <el-button type="warning" link :disabled="Number(row.status) === 0" @click="setStatus(row, 0)">下架</el-button>
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

    <WaresDialog ref="dialogRef" />
  </div>
</template>

<script setup lang="ts" name="giftProduct">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Wares } from "@/api/interface";
import { deleteWares, getWaresList, updateWares } from "@/api/modules/product";
import { uploadImg } from "@/api/modules/upload";
import { getImageUrl } from "@/utils";
import UploadImg from "@/components/Upload/Img.vue";
import WaresDialog from "@/views/gift/components/WaresDialog.vue";

type TabType = "all" | "online" | "offline";
type ViewMode = "card" | "table";

const dialogRef = ref<InstanceType<typeof WaresDialog> | null>(null);
const loading = ref(false);
const activeTab = ref<TabType>("all");
const viewMode = ref<ViewMode>("card");
const waresList = ref<Wares.ResListItem[]>([]);

const searchForm = reactive({
  id: "",
  wares_name: "",
  wares_type_id: "",
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
  offline: 0
});

const uploadWaresImg = (formData: FormData) => {
  formData.append("type", "wares");
  return uploadImg(formData);
};

const buildBaseParams = () => {
  const params: Wares.ReqParams = {
    page: pagination.page,
    limit: pagination.limit
  };

  if (searchForm.id) params.id = searchForm.id;
  if (searchForm.wares_name) params.wares_name = searchForm.wares_name;
  if (searchForm.wares_type_id) params.wares_type_id = searchForm.wares_type_id;

  if (Array.isArray(searchForm.date_range) && searchForm.date_range.length === 2) {
    params.start_time = searchForm.date_range[0];
    params.end_time = searchForm.date_range[1];
  }

  return params;
};

const getTabStatus = () => {
  if (activeTab.value === "online") return 1;
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

const fetchSummary = async () => {
  const baseParams = buildBaseParams();
  const [allRes, onlineRes, offlineRes] = await Promise.all([
    getWaresList({ ...baseParams, page: 1, limit: 1 }),
    getWaresList({ ...baseParams, page: 1, limit: 1, status: 1 }),
    getWaresList({ ...baseParams, page: 1, limit: 1, status: 0 })
  ]);

  summary.total = Number(allRes.data.total || 0);
  summary.online = Number(onlineRes.data.total || 0);
  summary.offline = Number(offlineRes.data.total || 0);
};

const fetchWaresList = async () => {
  loading.value = true;
  try {
    const { data } = await getWaresList(buildParams());
    waresList.value = data.data || [];
    pagination.total = Number(data.total || 0);
    await fetchSummary();
  } catch (error) {
    if (!isRequestCanceled(error)) {
      throw error;
    }
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  pagination.page = 1;
  await fetchWaresList();
};

const resetSearch = async () => {
  searchForm.id = "";
  searchForm.wares_name = "";
  searchForm.wares_type_id = "";
  searchForm.date_range = [];
  activeTab.value = "all";
  pagination.page = 1;
  await fetchWaresList();
};

const handleTabChange = async (name: string | number) => {
  activeTab.value = name as TabType;
  pagination.page = 1;
  await fetchWaresList();
};

const handlePageChange = async (page: number) => {
  pagination.page = page;
  await fetchWaresList();
};

const handleSizeChange = async (limit: number) => {
  pagination.limit = limit;
  pagination.page = 1;
  await fetchWaresList();
};

const openDialog = (row?: Wares.ResListItem) => {
  dialogRef.value?.acceptParams({
    row,
    getTableList: fetchWaresList
  });
};

const buildWaresSavePayload = (row: Wares.ResListItem, overrides: Partial<Wares.SaveParams> = {}): Wares.SaveParams => {
  return {
    id: row.id,
    wares_type_id: Number(row.wares_type_id || 1),
    wares_name: row.wares_name || "",
    wares_money: Number(row.wares_money || 0),
    wares_spec: row.wares_spec || "",
    head_img: row.head_img || "",
    content: row.content || "",
    status: Number(row.status || 0),
    sort: Number(row.sort || 0),
    is_type: Number(row.is_type || 1),
    ...overrides
  };
};

const setStatus = async (row: Wares.ResListItem, nextStatus: 0 | 1) => {
  if (Number(row.status) === nextStatus) return;

  await updateWares(buildWaresSavePayload(row, { status: nextStatus }));

  ElMessage.success(nextStatus === 1 ? "商品已上架" : "商品已下架");
  await fetchWaresList();
};

const updateWaresImage = async (row: Wares.ResListItem, imageUrl: string) => {
  await updateWares(buildWaresSavePayload(row, { head_img: imageUrl }));
  row.head_img = imageUrl;
  ElMessage.success(imageUrl ? "商品图片已更新" : "商品图片已清空");
};

const handleDelete = (row: Wares.ResListItem) => {
  ElMessageBox.confirm(`确认删除“${row.wares_name}”吗？`, "删除确认", {
    type: "warning"
  }).then(async () => {
    await deleteWares({ id: row.id });
    ElMessage.success("兑换商品已删除");
    await fetchWaresList();
  });
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);
const getStatusText = (value: number | string) => (Number(value) === 1 ? "上架" : "下架");
const getStatusTag = (value: number | string) => (Number(value) === 1 ? "success" : "info");

onMounted(fetchWaresList);
</script>

<style scoped lang="scss">
.wares-page {
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

.summary-card.danger {
  border-color: #fecaca;
  background: #fef2f2;
}

.summary-card.primary {
  border-color: #bfdbfe;
  background: #eff6ff;
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
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.wares-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 280px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  transition: all 0.2s ease;
}

.wares-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.wares-card__body {
  display: flex;
  gap: 16px;
  padding: 18px;
}

.wares-card__image {
  width: 84px;
  height: 84px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 12px;
  background: #f3f4f6;
}

.wares-card__image :deep(.el-image) {
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

.wares-card__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.wares-card__title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.wares-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wares-card__meta {
  font-size: 13px;
  color: #4b5563;
}

.wares-card__desc {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 2px;
  font-size: 13px;
  line-height: 1.7;
  color: #6b7280;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.wares-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 18px;
  border-top: 1px solid #f1f5f9;
  background: #fcfcfd;
}

.wares-card__extra {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.wares-card__actions {
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
  .wares-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .wares-card__body {
    flex-direction: column;
  }
}
</style>
