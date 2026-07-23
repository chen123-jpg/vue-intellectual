<template>
  <div class="container">
    <el-card title="知识产权系统 - 用户信息中心" style="width: 800px; margin: 60px auto;">
      <div v-if="userInfo">
        <el-descriptions border :column="2">
          <el-descriptions-item label="用户ID">{{ userInfo.userId }}</el-descriptions-item>
          <el-descriptions-item label="登录账号">{{ userInfo.loginName }}</el-descriptions-item>
        </el-descriptions>

        <div class="block">
          <h4>用户角色(RoleKey)</h4>
          <el-space wrap>
            <el-tag v-for="role in userInfo.roles" :key="role" type="primary" effect="light">
              {{ role }}
            </el-tag>
          </el-space>
        </div>

        <div class="block">
          <h4>接口权限标识(Permission)</h4>
          <el-space wrap>
            <el-tag v-for="perm in userInfo.permissions" :key="perm" type="success" effect="light">
              {{ perm }}
            </el-tag>
          </el-space>
        </div>

        <div class="btn-group">
          <el-button @click="refreshInfo">刷新信息</el-button>
          <el-button type="primary" @click="goUserList">进入用户列表</el-button>
          <el-button type="danger" @click="handleLogout">退出登录</el-button>
        </div>
      </div>
      <div v-else class="loading-text">加载用户信息中...</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userInfo = ref(null)

// 跳转到用户列表页面
const goUserList = () => {
  router.push('/system/user')
}

// 获取当前登录用户信息
const refreshInfo = async () => {
  const res = await request.get('/api/acount/me')
  if (res.code === 200) {
    userInfo.value = res.data
    // 同步更新本地权限缓存
    localStorage.setItem('permissions', JSON.stringify(res.data.permissions))
  }
}

// 退出登录
const handleLogout = async () => {
  await request.post('/api/acount/logout')
  localStorage.removeItem('token')
  localStorage.removeItem('permissions')
  ElMessage.success('已安全退出')
  router.push('/login')
}

onMounted(() => refreshInfo())
</script>

<style scoped>
.container {
  padding: 20px;
}
.block {
  margin-top: 20px;
}
.btn-group {
  margin-top: 30px;
  display: flex;
  gap: 12px;
}
.loading-text {
  text-align: center;
  padding: 30px;
  color: #999;
}
</style>