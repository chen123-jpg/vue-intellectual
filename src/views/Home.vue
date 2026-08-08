<template>
  <div class="dashboard">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header__icon">
        <el-icon :size="24"><HomeFilled /></el-icon>
      </div>
      <div class="page-header__text">
        <h2 class="page-header__title">首页概览</h2>
        <p class="page-header__subtitle">欢迎使用知识产权管理系统</p>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 用户信息 -->
      <el-col :span="8">
        <el-card class="dash-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="18"><UserFilled /></el-icon>
              <span>用户信息</span>
            </div>
          </template>
          <div v-if="state.userInfo">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="用户ID">{{ state.userInfo.userId }}</el-descriptions-item>
              <el-descriptions-item label="登录账号">{{ state.userInfo.loginName }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ state.userInfo.email || '-' }}</el-descriptions-item>
            </el-descriptions>
            <div class="role-section">
              <h4>角色</h4>
              <el-space wrap>
                <el-tag v-for="role in state.userInfo.roles" :key="role" effect="dark" size="small">{{ role }}</el-tag>
              </el-space>
            </div>
          </div>
          <el-skeleton v-else :rows="4" animated />
        </el-card>
      </el-col>

      <!-- 权限列表 -->
      <el-col :span="16">
        <el-card class="dash-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="18"><Lock /></el-icon>
              <span>权限列表</span>
            </div>
          </template>
          <div v-if="state.permissions.length">
            <el-space wrap>
              <el-tag v-for="perm in state.permissions" :key="perm" type="success" effect="light" size="small">{{ perm }}</el-tag>
            </el-space>
          </div>
          <el-empty v-else description="暂无权限数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { HomeFilled, UserFilled, Lock } from '@element-plus/icons-vue'

const { state, fetchUserInfo } = useUserStore()

onMounted(() => fetchUserInfo())
</script>

<style scoped>
.dashboard { max-width: 1400px; }
.dash-card { margin-bottom: 20px; }

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--brand-navy);
}

.role-section {
  margin-top: 16px;
}
.role-section h4 {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
</style>
