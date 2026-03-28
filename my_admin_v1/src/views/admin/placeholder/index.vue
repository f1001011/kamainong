<template>
  <div class="placeholder-page">
    <div class="card hero">
      <div>
        <div class="eyebrow">BAE Admin</div>
        <h2 class="title">{{ pageTitle }}</h2>
        <p class="desc">
          这个模块的菜单结构已经就位，页面样式会按后台截图方向继续完善。
          当前阶段我们优先接通列表类页面和管理流程，这里先作为占位入口。
        </p>
      </div>
      <el-tag type="warning" effect="light">待接入</el-tag>
    </div>

    <div class="card content">
      <el-empty description="页面正在排期接入中" />
      <div class="tips">
        <span>下一步优先接入：</span>
        <el-tag>用户列表</el-tag>
        <el-tag>资金流水</el-tag>
        <el-tag>充值管理</el-tag>
        <el-tag>提现管理</el-tag>
        <el-tag>支付渠道</el-tag>
        <el-tag>产品列表</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="adminPlaceholder">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const pageTitle = computed(() => (route.meta.title as string) || "后台页面");
</script>

<style scoped lang="scss">
.placeholder-page {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 28px;
    background: linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
    border: 1px solid #e4ecfb;

    .eyebrow {
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #6b7a99;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .title {
      margin: 0 0 10px;
      font-size: 24px;
      font-weight: 700;
      color: #1f2a44;
    }

    .desc {
      max-width: 760px;
      margin: 0;
      line-height: 1.8;
      color: #5f6b85;
    }
  }

  .content {
    padding: 36px 28px;

    .tips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-top: 24px;
      color: #6b7280;
    }
  }
}
</style>
