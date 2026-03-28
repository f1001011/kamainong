<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="920px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="商品分类" prop="goods_type_id">
            <el-input-number v-model="form.goods_type_id" :min="1" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品名称" prop="goods_name">
            <el-input v-model.trim="form.goods_name" placeholder="请输入商品名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="商品价格" prop="goods_money">
            <el-input-number v-model="form.goods_money" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="项目规模">
            <el-input-number v-model="form.project_scale" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="总收益">
            <el-input-number v-model="form.total_money" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="日收益">
            <el-input-number v-model="form.day_red" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="每日次数">
            <el-input-number v-model="form.income_times_per_day" :min="1" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="单次收益">
            <el-input-number
              v-model="form.income_per_time"
              :min="0"
              :precision="2"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="收益率">
            <el-input-number v-model="form.revenue_lv" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="投资周期">
            <el-input-number v-model="form.period" :min="0" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="领取分钟">
            <el-input-number v-model="form.minute_claim" :min="0" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="商品状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
              <el-option label="下架" :value="0" />
              <el-option label="上架" :value="1" />
              <el-option label="即将推出" :value="2" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="返利方式" prop="red_way">
            <el-select v-model="form.red_way" placeholder="请选择返利方式" style="width: 100%">
              <el-option label="到期还本还息" :value="1" />
              <el-option label="每日返息到期还本" :value="2" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="VIP等级">
            <el-input-number v-model="form.level_vip" :min="0" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="购买次数">
            <el-input-number v-model="form.buy_num" :min="0" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="进度">
            <el-input-number v-model="form.progress_rate" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="体验产品">
            <el-select v-model="form.is_examine" style="width: 100%">
              <el-option label="否" :value="0" />
              <el-option label="是" :value="1" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="优惠券">
            <el-select v-model="form.is_coupon" style="width: 100%">
              <el-option label="不可用" :value="0" />
              <el-option label="可用" :value="1" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="一级返佣">
            <el-input-number v-model="form.goods_agent_1" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="二级返佣">
            <el-input-number v-model="form.goods_agent_2" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="三级返佣">
            <el-input-number v-model="form.goods_agent_3" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="担保公司">
            <el-input v-model.trim="form.warrant" placeholder="请输入担保公司" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="封面图">
            <el-input v-model.trim="form.head_img" placeholder="请输入封面图 URL" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="详情图">
            <el-input v-model.trim="form.bottom_img" placeholder="请输入详情图 URL" />
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
import { Goods } from "@/api/interface";
import { addGoods, updateGoods } from "@/api/modules/goods";

interface DialogParams {
  row?: Goods.ResListItem;
  getTableList?: () => void;
}

const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const refreshTable = ref<(() => void) | undefined>();

const createDefaultForm = (): Goods.SaveParams => ({
  goods_type_id: 1,
  goods_name: "",
  goods_money: 0,
  project_scale: 0,
  day_red: 0,
  income_times_per_day: 1,
  income_per_time: 0,
  total_money: 0,
  revenue_lv: 0,
  period: 0,
  status: 1,
  red_way: 2,
  warrant: "",
  head_img: "",
  bottom_img: "",
  is_examine: 0,
  sort: 0,
  is_coupon: 1,
  progress_rate: 0,
  goods_agent_1: 0,
  goods_agent_2: 0,
  goods_agent_3: 0,
  buy_num: 0,
  level_vip: 0,
  minute_claim: 0
});

const form = reactive<Goods.SaveParams>(createDefaultForm());

const rules: FormRules = {
  goods_type_id: [{ required: true, message: "请输入商品分类", trigger: "blur" }],
  goods_name: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  goods_money: [{ required: true, message: "请输入商品价格", trigger: "blur" }],
  status: [{ required: true, message: "请选择商品状态", trigger: "change" }],
  red_way: [{ required: true, message: "请选择返利方式", trigger: "change" }]
};

const dialogTitle = ref("新增产品");

const resetForm = () => {
  Object.assign(form, createDefaultForm());
};

const acceptParams = ({ row, getTableList }: DialogParams) => {
  resetForm();
  isEdit.value = !!row;
  dialogTitle.value = row ? "编辑产品" : "新增产品";
  if (row) {
    Object.assign(form, {
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
      minute_claim: Number(row.minute_claim || 0)
    });
  }
  refreshTable.value = getTableList;
  dialogVisible.value = true;
};

const handleSubmit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;

    const payload = {
      ...form,
      goods_type_id: Number(form.goods_type_id),
      goods_money: Number(form.goods_money),
      project_scale: Number(form.project_scale),
      day_red: Number(form.day_red),
      income_times_per_day: Number(form.income_times_per_day),
      income_per_time: Number(form.income_per_time),
      total_money: Number(form.total_money),
      revenue_lv: Number(form.revenue_lv),
      period: Number(form.period),
      status: Number(form.status),
      red_way: Number(form.red_way),
      is_examine: Number(form.is_examine),
      sort: Number(form.sort),
      is_coupon: Number(form.is_coupon),
      progress_rate: Number(form.progress_rate),
      goods_agent_1: Number(form.goods_agent_1),
      goods_agent_2: Number(form.goods_agent_2),
      goods_agent_3: Number(form.goods_agent_3),
      buy_num: Number(form.buy_num),
      level_vip: Number(form.level_vip),
      minute_claim: Number(form.minute_claim)
    };

    if (isEdit.value) {
      await updateGoods(payload);
      ElMessage.success("产品已更新");
    } else {
      await addGoods(payload);
      ElMessage.success("产品已新增");
    }

    dialogVisible.value = false;
    refreshTable.value?.();
  });
};

defineExpose({
  acceptParams
});
</script>
