<template>
  <div class="page">
    <el-card>
      <el-result icon="info" title="流程专员业务已迁移到申请包管理">
        <template #sub-title>
          <p>待接收、审核中、退回、审核通过和提交国知局均以完整申请包为单位处理。</p>
          <p>这里不再提供逐文件确认，也不能通过交底状态按钮模拟国知局提交。</p>
        </template>
        <template #extra>
          <el-button type="primary" @click="goToPackages">进入申请包管理</el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goToPackages = () => router.push('/patent/application-package')
</script>

<style scoped>
.page { max-width: 1100px; }
</style>
