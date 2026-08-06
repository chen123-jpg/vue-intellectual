<template>
  <div class="placeholder-page">
    <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
    <p class="placeholder-text">页面开发中...</p>
  </div>
</template>

<script setup>
import { Document } from '@element-plus/icons-vue'
</script>

<style scoped>
.placeholder-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: #c0c4cc;
}
.placeholder-text {
  margin-top: 16px;
  font-size: 15px;
  color: #909399;
}
</style>
