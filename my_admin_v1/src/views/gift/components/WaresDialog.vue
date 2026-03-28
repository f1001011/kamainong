<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="分类ID" prop="wares_type_id">
            <el-input-number v-model="form.wares_type_id" :min="1" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品名称" prop="wares_name">
            <el-input v-model.trim="form.wares_name" placeholder="请输入商品名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="兑换积分" prop="wares_money">
            <el-input-number v-model="form.wares_money" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品规格" prop="wares_spec">
            <el-input v-model.trim="form.wares_spec" placeholder="请输入规格，如：大号/礼盒版" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="下架" :value="0" />
              <el-option label="上架" :value="1" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="兑换类型">
            <el-select v-model="form.is_type" style="width: 100%">
              <el-option label="积分兑换" :value="1" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="商品图片">
            <el-input v-model.trim="form.head_img" placeholder="请输入商品图片 URL" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="商品介绍" prop="content">
            <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入商品介绍" />
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
import { Wares } from "@/api/interface";
import { addWares, updateWares } from "@/api/modules/product";

interface DialogParams {
  row?: Wares.ResListItem;
  getTableList?: () => void;
}

const dialogVisible = ref(false);
const dialogTitle = ref("新增赠送产品");
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const refreshTable = ref<(() => void) | undefined>();

const createDefaultForm = (): Wares.SaveParams => ({
  wares_type_id: 1,
  wares_name: "",
  wares_money: 0,
  wares_spec: "",
  head_img: "",
  content: "",
  status: 1,
  sort: 0,
  is_type: 1
});

const form = reactive<Wares.SaveParams>(createDefaultForm());

const rules: FormRules = {
  wares_type_id: [{ required: true, message: "请输入分类ID", trigger: "blur" }],
  wares_name: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  wares_money: [{ required: true, message: "请输入兑换积分", trigger: "blur" }],
  wares_spec: [{ required: true, message: "请输入商品规格", trigger: "blur" }],
  content: [{ required: true, message: "请输入商品介绍", trigger: "blur" }]
};

const resetForm = () => {
  Object.assign(form, createDefaultForm());
};

const acceptParams = ({ row, getTableList }: DialogParams) => {
  resetForm();
  isEdit.value = !!row;
  dialogTitle.value = row ? "编辑赠送产品" : "新增赠送产品";
  if (row) {
    Object.assign(form, {
      id: row.id,
      wares_type_id: Number(row.wares_type_id || 1),
      wares_name: row.wares_name || "",
      wares_money: Number(row.wares_money || 0),
      wares_spec: row.wares_spec || "",
      head_img: row.head_img || "",
      content: row.content || "",
      status: Number(row.status || 0),
      sort: Number(row.sort || 0),
      is_type: Number(row.is_type || 1)
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
      wares_type_id: Number(form.wares_type_id),
      wares_money: Number(form.wares_money),
      status: Number(form.status),
      sort: Number(form.sort),
      is_type: Number(form.is_type)
    };

    if (isEdit.value) {
      await updateWares(payload);
      ElMessage.success("赠送产品已更新");
    } else {
      await addWares(payload);
      ElMessage.success("赠送产品已新增");
    }

    dialogVisible.value = false;
    refreshTable.value?.();
  });
};

defineExpose({
  acceptParams
});
</script>
