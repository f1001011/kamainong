<template>
  <div class="showcase-page">
    <div class="period-grid">
      <div v-for="item in periodCards" :key="item.key" class="period-card">
        <div class="period-title">{{ item.title }}</div>
        <strong>{{ currencyPrefix }}{{ formatMoney(item.data.amount_total) }}</strong>
        <div class="period-meta">
          <span>展示 {{ item.data.show_count }}</span>
          <span>用户 {{ item.data.user_count }}</span>
        </div>
        <div class="period-meta">
          <span>评论 {{ item.data.comment_total }}</span>
          <span>点赞 {{ item.data.like_total }}</span>
        </div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">展示记录数</span>
        <strong>{{ showcasePagination.total }}</strong>
      </div>
      <div class="summary-card success">
        <span class="summary-label">评论记录数</span>
        <strong>{{ commentPagination.total }}</strong>
      </div>
      <div class="summary-card primary">
        <span class="summary-label">当前详情ID</span>
        <strong>{{ detail?.id || 0 }}</strong>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="展示列表" name="showcase">
        <div class="panel">
          <div class="panel-header">
            <div class="page-title">
              <span>提现凭证展示</span>
              <el-tag type="success" effect="plain">真实接口：/withdraw/showcase/list</el-tag>
            </div>
            <div class="header-actions">
              <el-input
                v-model="showcaseSearch.user_id"
                clearable
                placeholder="用户ID"
                style="width: 120px"
                @keyup.enter="handleShowcaseSearch"
              />
              <el-input
                v-model="showcaseSearch.withdraw_id"
                clearable
                placeholder="提现订单ID"
                style="width: 140px"
                @keyup.enter="handleShowcaseSearch"
              />
              <el-select v-model="showcaseSearch.status" clearable placeholder="状态" style="width: 120px">
                <el-option label="隐藏" :value="0" />
                <el-option label="展示" :value="1" />
              </el-select>
              <el-date-picker
                v-model="showcaseSearch.date_range"
                type="datetimerange"
                value-format="YYYY-MM-DD HH:mm:ss"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 320px"
              />
              <el-button @click="resetShowcaseSearch">重置</el-button>
              <el-button type="primary" @click="handleShowcaseSearch">查询</el-button>
              <el-button @click="fetchShowcaseList">刷新</el-button>
              <el-button type="primary" @click="openShowcaseDialog()">新增展示</el-button>
            </div>
          </div>

          <el-table v-loading="showcaseLoading" :data="showcaseList" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="user_id" label="用户ID" width="100" />
            <el-table-column label="用户信息" min-width="220">
              <template #default="{ row }">
                <div class="info-cell">
                  <span>账号：{{ row.user_name || "-" }}</span>
                  <span>昵称：{{ row.nickname || "-" }}</span>
                  <span>电话：{{ row.phone || "-" }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="withdraw_id" label="提现订单ID" min-width="120" />
            <el-table-column prop="amount" label="金额" min-width="120">
              <template #default="{ row }">{{ currencyPrefix }}{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="like_count" label="点赞数" min-width="90" />
            <el-table-column prop="comment_count" label="评论数" min-width="90" />
            <el-table-column prop="status" label="状态" min-width="100">
              <template #default="{ row }">
                <el-tag :type="Number(row.status) === 1 ? 'success' : 'warning'" effect="light">
                  {{ Number(row.status) === 1 ? "展示中" : "隐藏中" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="voucher_image" label="凭证图" min-width="100">
              <template #default="{ row }">
                <el-link v-if="row.voucher_image" :href="row.voucher_image" target="_blank" type="primary">查看凭证</el-link>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="创建时间" min-width="180" />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleViewDetail(row)">详情</el-button>
                <el-button type="success" link @click="handleViewComments(row)">评论</el-button>
                <el-button type="primary" link @click="openShowcaseDialog(row)">编辑</el-button>
                <el-button type="danger" link @click="handleDeleteShowcase(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="showcasePagination.page"
              :page-size="showcasePagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="showcasePagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleShowcasePageChange"
              @size-change="handleShowcaseSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="展示详情" name="detail">
        <div class="panel detail-panel">
          <div class="panel-header">
            <div class="page-title">
              <span>展示详情</span>
              <el-tag type="info" effect="plain">真实接口：/withdraw/showcase/detail</el-tag>
            </div>
            <div class="header-actions">
              <el-input-number v-model="detailId" :min="1" placeholder="详情ID" style="width: 160px" />
              <el-button type="primary" @click="fetchDetail">查询详情</el-button>
            </div>
          </div>

          <el-empty v-if="!detail" description="请选择展示记录查看详情" />
          <div v-else class="detail-grid">
            <div class="detail-card">
              <span class="detail-label">展示ID</span>
              <strong>{{ detail.id }}</strong>
            </div>
            <div class="detail-card">
              <span class="detail-label">用户ID</span>
              <strong>{{ detail.user_id }}</strong>
            </div>
            <div class="detail-card">
              <span class="detail-label">提现订单ID</span>
              <strong>{{ detail.withdraw_id }}</strong>
            </div>
            <div class="detail-card">
              <span class="detail-label">展示状态</span>
              <strong>{{ Number(detail.status) === 1 ? "展示中" : "隐藏中" }}</strong>
            </div>
            <div class="detail-card">
              <span class="detail-label">点赞数</span>
              <strong>{{ detail.like_count || 0 }}</strong>
            </div>
            <div class="detail-card">
              <span class="detail-label">评论数</span>
              <strong>{{ detail.comment_count || 0 }}</strong>
            </div>
            <div class="detail-card wide">
              <span class="detail-label">用户信息</span>
              <div class="detail-text">
                <span>账号：{{ detail.user_name || "-" }}</span>
                <span>昵称：{{ detail.nickname || "-" }}</span>
                <span>电话：{{ detail.phone || "-" }}</span>
              </div>
            </div>
            <div class="detail-card wide">
              <span class="detail-label">凭证图片</span>
              <el-link v-if="detail.voucher_image" :href="detail.voucher_image" target="_blank" type="primary">
                查看凭证图片
              </el-link>
              <span v-else>-</span>
            </div>
            <div class="detail-card wide">
              <span class="detail-label">创建时间</span>
              <span>{{ detail.create_time }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="评论列表" name="comment">
        <div class="panel">
          <div class="panel-header">
            <div class="page-title">
              <span>评论列表</span>
              <el-tag type="info" effect="plain">真实接口：/withdraw/showcase/comment/list</el-tag>
            </div>
            <div class="header-actions">
              <el-input
                v-model="commentSearch.showcase_id"
                clearable
                placeholder="展示ID"
                style="width: 120px"
                @keyup.enter="handleCommentSearch"
              />
              <el-input
                v-model="commentSearch.user_id"
                clearable
                placeholder="用户ID"
                style="width: 120px"
                @keyup.enter="handleCommentSearch"
              />
              <el-button @click="resetCommentSearch">重置</el-button>
              <el-button type="primary" @click="handleCommentSearch">查询</el-button>
              <el-button @click="fetchCommentList">刷新</el-button>
              <el-button type="primary" @click="openCommentDialog()">新增评论</el-button>
            </div>
          </div>

          <el-table v-loading="commentLoading" :data="commentList" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="showcase_id" label="展示ID" width="100" />
            <el-table-column prop="user_id" label="用户ID" width="100" />
            <el-table-column label="用户信息" min-width="220">
              <template #default="{ row }">
                <div class="info-cell">
                  <span>账号：{{ row.user_name || "-" }}</span>
                  <span>昵称：{{ row.nickname || "-" }}</span>
                  <span>电话：{{ row.phone || "-" }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="评论内容" min-width="260" show-overflow-tooltip />
            <el-table-column prop="create_time" label="创建时间" min-width="180" />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openCommentDialog(row)">编辑</el-button>
                <el-button type="danger" link @click="handleDeleteComment(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              :current-page="commentPagination.page"
              :page-size="commentPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="commentPagination.total"
              background
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleCommentPageChange"
              @size-change="handleCommentSizeChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showcaseDialogVisible" :title="showcaseForm.id ? '编辑展示' : '新增展示'" width="620px">
      <el-form :model="showcaseForm" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户ID">
              <el-input-number v-model="showcaseForm.user_id" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提现订单ID">
              <el-input-number v-model="showcaseForm.withdraw_id" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额">
              <el-input-number v-model="showcaseForm.amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="showcaseForm.status" style="width: 100%">
                <el-option label="隐藏" :value="0" />
                <el-option label="展示" :value="1" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="凭证图片">
          <el-input v-model="showcaseForm.voucher_image" placeholder="请输入凭证图片 URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showcaseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveShowcase">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="commentDialogVisible" :title="commentForm.id ? '编辑评论' : '新增评论'" width="560px">
      <el-form :model="commentForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="展示ID">
              <el-input-number v-model="commentForm.showcase_id" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户ID">
              <el-input-number v-model="commentForm.user_id" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="评论内容">
          <el-input v-model="commentForm.content" type="textarea" :rows="4" placeholder="请输入评论内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="commentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveComment">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="withdrawShowcaseManage">
import dayjs from "dayjs";
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { WithdrawShowcase } from "@/api/interface";
import {
  addWithdrawComment,
  addWithdrawShowcase,
  deleteWithdrawComment,
  deleteWithdrawShowcase,
  getWithdrawCommentList,
  getWithdrawShowcaseDetail,
  getWithdrawShowcaseList,
  getWithdrawShowcaseStats,
  updateWithdrawComment,
  updateWithdrawShowcase
} from "@/api/modules/product";
import { currencyPrefix } from "@/utils";

const activeTab = ref("showcase");
const showcaseLoading = ref(false);
const commentLoading = ref(false);
const showcaseDialogVisible = ref(false);
const commentDialogVisible = ref(false);

const showcaseList = ref<WithdrawShowcase.ResListItem[]>([]);
const commentList = ref<WithdrawShowcase.CommentItem[]>([]);
const detail = ref<WithdrawShowcase.ResListItem | null>(null);
const detailId = ref<number | undefined>(undefined);

const showcasePagination = reactive({ page: 1, limit: 20, total: 0 });
const commentPagination = reactive({ page: 1, limit: 20, total: 0 });

const createEmptyStats = (): WithdrawShowcase.StatsData => ({
  total_count: 0,
  user_count: 0,
  show_count: 0,
  hide_count: 0,
  amount_total: 0,
  comment_total: 0,
  like_total: 0
});

const periodStats = reactive<Record<string, WithdrawShowcase.StatsData>>({
  today: createEmptyStats(),
  yesterday: createEmptyStats(),
  week: createEmptyStats(),
  month: createEmptyStats()
});

const showcaseSearch = reactive({
  user_id: "",
  withdraw_id: "",
  status: undefined as number | undefined,
  date_range: [] as string[]
});

const commentSearch = reactive({
  showcase_id: "",
  user_id: ""
});

const createDefaultShowcaseForm = (): WithdrawShowcase.SaveParams => ({
  user_id: 1,
  withdraw_id: 1,
  voucher_image: "",
  amount: 0,
  status: 1
});

const createDefaultCommentForm = (): WithdrawShowcase.SaveCommentParams => ({
  showcase_id: 1,
  user_id: 1,
  content: ""
});

const getPeriodRange = (type: "today" | "yesterday" | "week" | "month") => {
  const now = dayjs();
  if (type === "yesterday") {
    return {
      start_time: now.subtract(1, "day").startOf("day").format("YYYY-MM-DD HH:mm:ss"),
      end_time: now.subtract(1, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss")
    };
  }
  if (type === "week") {
    return {
      start_time: now.startOf("week").format("YYYY-MM-DD HH:mm:ss"),
      end_time: now.endOf("week").format("YYYY-MM-DD HH:mm:ss")
    };
  }
  if (type === "month") {
    return {
      start_time: now.startOf("month").format("YYYY-MM-DD HH:mm:ss"),
      end_time: now.endOf("month").format("YYYY-MM-DD HH:mm:ss")
    };
  }
  return {
    start_time: now.startOf("day").format("YYYY-MM-DD HH:mm:ss"),
    end_time: now.endOf("day").format("YYYY-MM-DD HH:mm:ss")
  };
};

const fetchPeriodStats = async () => {
  const [todayRes, yesterdayRes, weekRes, monthRes] = await Promise.all([
    getWithdrawShowcaseStats(getPeriodRange("today")),
    getWithdrawShowcaseStats(getPeriodRange("yesterday")),
    getWithdrawShowcaseStats(getPeriodRange("week")),
    getWithdrawShowcaseStats(getPeriodRange("month"))
  ]);

  periodStats.today = todayRes.data;
  periodStats.yesterday = yesterdayRes.data;
  periodStats.week = weekRes.data;
  periodStats.month = monthRes.data;
};

const periodCards = computed(() => [
  { key: "today", title: "今天", data: periodStats.today },
  { key: "yesterday", title: "昨天", data: periodStats.yesterday },
  { key: "week", title: "本周", data: periodStats.week },
  { key: "month", title: "本月", data: periodStats.month }
]);

const showcaseForm = reactive<WithdrawShowcase.SaveParams>(createDefaultShowcaseForm());
const commentForm = reactive<WithdrawShowcase.SaveCommentParams>(createDefaultCommentForm());

const resetShowcaseForm = () => {
  Object.assign(showcaseForm, createDefaultShowcaseForm());
  delete showcaseForm.id;
};

const resetCommentForm = () => {
  Object.assign(commentForm, createDefaultCommentForm());
  delete commentForm.id;
};

const openShowcaseDialog = (row?: WithdrawShowcase.ResListItem) => {
  resetShowcaseForm();
  if (row) {
    showcaseForm.id = row.id;
    showcaseForm.user_id = Number(row.user_id);
    showcaseForm.withdraw_id = Number(row.withdraw_id);
    showcaseForm.voucher_image = row.voucher_image;
    showcaseForm.amount = Number(row.amount);
    showcaseForm.status = Number(row.status);
  }
  showcaseDialogVisible.value = true;
};

const openCommentDialog = (row?: WithdrawShowcase.CommentItem) => {
  resetCommentForm();
  if (row) {
    commentForm.id = row.id;
    commentForm.showcase_id = Number(row.showcase_id);
    commentForm.user_id = Number(row.user_id);
    commentForm.content = row.content;
  } else if (commentSearch.showcase_id) {
    commentForm.showcase_id = Number(commentSearch.showcase_id);
  } else if (detail.value?.id) {
    commentForm.showcase_id = Number(detail.value.id);
  }
  commentDialogVisible.value = true;
};

const fetchShowcaseList = async () => {
  showcaseLoading.value = true;
  try {
    const res = await getWithdrawShowcaseList({
      page: showcasePagination.page,
      limit: showcasePagination.limit,
      user_id: showcaseSearch.user_id || undefined,
      withdraw_id: showcaseSearch.withdraw_id || undefined,
      status: showcaseSearch.status,
      start_time: showcaseSearch.date_range?.[0],
      end_time: showcaseSearch.date_range?.[1]
    });
    showcaseList.value = res.data.data || [];
    showcasePagination.total = Number(res.data.total || 0);
  } finally {
    showcaseLoading.value = false;
  }
};

const fetchCommentList = async () => {
  commentLoading.value = true;
  try {
    const res = await getWithdrawCommentList({
      page: commentPagination.page,
      limit: commentPagination.limit,
      showcase_id: commentSearch.showcase_id || undefined,
      user_id: commentSearch.user_id || undefined
    });
    commentList.value = res.data.data || [];
    commentPagination.total = Number(res.data.total || 0);
  } finally {
    commentLoading.value = false;
  }
};

const fetchDetail = async () => {
  if (!detailId.value) {
    detail.value = null;
    return;
  }
  const res = await getWithdrawShowcaseDetail({ id: detailId.value });
  detail.value = res.data;
};

const handleViewDetail = async (row: WithdrawShowcase.ResListItem) => {
  detailId.value = row.id;
  activeTab.value = "detail";
  await fetchDetail();
};

const handleViewComments = async (row: WithdrawShowcase.ResListItem) => {
  commentSearch.showcase_id = String(row.id);
  commentPagination.page = 1;
  activeTab.value = "comment";
  await fetchCommentList();
};

const handleSaveShowcase = async () => {
  const payload: WithdrawShowcase.SaveParams = {
    ...(showcaseForm.id ? { id: showcaseForm.id } : {}),
    user_id: Number(showcaseForm.user_id),
    withdraw_id: Number(showcaseForm.withdraw_id),
    voucher_image: showcaseForm.voucher_image,
    amount: Number(showcaseForm.amount),
    status: Number(showcaseForm.status)
  };
  const res = showcaseForm.id ? await updateWithdrawShowcase(payload) : await addWithdrawShowcase(payload);
  ElMessage.success(res.message || "保存成功");
  showcaseDialogVisible.value = false;
  await fetchShowcaseList();
  await fetchPeriodStats();
  if (showcaseForm.id && detailId.value === showcaseForm.id) {
    await fetchDetail();
  }
};

const handleSaveComment = async () => {
  const payload: WithdrawShowcase.SaveCommentParams = {
    ...(commentForm.id ? { id: commentForm.id } : {}),
    showcase_id: Number(commentForm.showcase_id),
    user_id: Number(commentForm.user_id),
    content: commentForm.content
  };
  const res = commentForm.id
    ? await updateWithdrawComment({ id: payload.id!, content: payload.content })
    : await addWithdrawComment(payload);
  ElMessage.success(res.message || "保存成功");
  commentDialogVisible.value = false;
  await fetchCommentList();
  if (detailId.value) await fetchDetail();
  await fetchShowcaseList();
  await fetchPeriodStats();
};

const handleDeleteShowcase = (row: WithdrawShowcase.ResListItem) => {
  ElMessageBox.confirm(`确认删除展示记录 #${row.id} 吗？`, "删除确认", { type: "warning" }).then(async () => {
    const res = await deleteWithdrawShowcase({ id: row.id });
    ElMessage.success(res.message || "删除成功");
    await fetchShowcaseList();
    await fetchPeriodStats();
    if (detailId.value === row.id) detail.value = null;
  });
};

const handleDeleteComment = (row: WithdrawShowcase.CommentItem) => {
  ElMessageBox.confirm(`确认删除评论 #${row.id} 吗？`, "删除确认", { type: "warning" }).then(async () => {
    const res = await deleteWithdrawComment({ id: row.id });
    ElMessage.success(res.message || "删除成功");
    await fetchCommentList();
    if (detailId.value) await fetchDetail();
    await fetchShowcaseList();
    await fetchPeriodStats();
  });
};

const handleShowcaseSearch = async () => {
  showcasePagination.page = 1;
  await fetchShowcaseList();
};

const resetShowcaseSearch = async () => {
  showcaseSearch.user_id = "";
  showcaseSearch.withdraw_id = "";
  showcaseSearch.status = undefined;
  showcaseSearch.date_range = [];
  showcasePagination.page = 1;
  await fetchShowcaseList();
};

const handleCommentSearch = async () => {
  commentPagination.page = 1;
  await fetchCommentList();
};

const resetCommentSearch = async () => {
  commentSearch.showcase_id = "";
  commentSearch.user_id = "";
  commentPagination.page = 1;
  await fetchCommentList();
};

const handleShowcasePageChange = (page: number) => {
  showcasePagination.page = page;
  fetchShowcaseList();
};

const handleShowcaseSizeChange = (size: number) => {
  showcasePagination.limit = size;
  showcasePagination.page = 1;
  fetchShowcaseList();
};

const handleCommentPageChange = (page: number) => {
  commentPagination.page = page;
  fetchCommentList();
};

const handleCommentSizeChange = (size: number) => {
  commentPagination.limit = size;
  commentPagination.page = 1;
  fetchCommentList();
};

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2);

onMounted(async () => {
  await Promise.allSettled([fetchShowcaseList(), fetchCommentList(), fetchPeriodStats()]);
});
</script>

<style scoped lang="scss">
.showcase-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.period-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.period-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
  border-radius: 14px;
  border: 1px solid #dbeafe;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

.period-title {
  color: #475569;
  font-size: 13px;
}

.period-card strong {
  color: #0f172a;
  font-size: 26px;
}

.period-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
}

.detail-panel {
  min-height: 240px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.detail-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.detail-card strong {
  font-size: 22px;
  color: #111827;
}

.detail-card.wide {
  grid-column: span 3;
}

.detail-label {
  font-size: 13px;
  color: #64748b;
}

.detail-text {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  color: #334155;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 1200px) {
  .period-grid,
  .summary-grid,
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-card.wide {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .period-grid,
  .summary-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-card.wide {
    grid-column: span 1;
  }

  .panel-header,
  .page-title,
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
