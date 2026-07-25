<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="info-card">
          <template #header><span>用户信息</span></template>
          <div v-if="state.userInfo">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="用户ID">{{ state.userInfo.userId }}</el-descriptions-item>
              <el-descriptions-item label="登录账号">{{ state.userInfo.loginName }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ state.userInfo.email || '-' }}</el-descriptions-item>
            </el-descriptions>
            <div style="margin-top: 16px;">
              <h4>角色</h4>
              <el-space wrap>
                <el-tag v-for="role in state.userInfo.roles" :key="role" type="primary" effect="light">{{ role }}</el-tag>
              </el-space>
            </div>
          </div>
          <el-skeleton v-else :rows="4" animated />
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header><span>权限列表</span></template>
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

const { state, fetchUserInfo } = useUserStore()

onMounted(() => fetchUserInfo())
</script>

<style scoped>
.dashboard { max-width: 1400px; }
.info-card { margin-bottom: 20px; }
h4 { margin: 0 0 8px; font-size: 14px; color: #606266; }
</style>
