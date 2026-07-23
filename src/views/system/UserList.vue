<template>
  <div class="user-page">
    <el-card title="用户管理列表">
      <div class="toolbar">
        <el-button type="primary">新增用户</el-button>
      </div>

      <el-table
          :data="tableData"
          border
          stripe
          v-loading="loading"
          style="width:100%;margin-top:16px"
      >
        <el-table-column label="用户ID" prop="userId" width="90" align="center" />
        <el-table-column label="登录账号" prop="loginName" align="center" />
        <el-table-column label="用户昵称" prop="userName" align="center" />
        <el-table-column label="邮箱" prop="email" align="center" />
        <el-table-column label="手机号" prop="phoneNumber" align="center" />
        <el-table-column label="性别" prop="sex" width="70" align="center">
          <template #default="scope">
            {{ scope.row.sex === '0' ? '男' : scope.row.sex === '1' ? '女' : '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="账号状态" prop="status" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录IP" prop="loginIp" align="center" />
        <el-table-column label="创建时间" prop="createTime" align="center" />
        <el-table-column label="操作" width="160" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" text>编辑</el-button>
            <el-button size="small" type="danger" text>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
// 使用相对路径，避免@别名报错
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])

// 请求用户列表
const loadUserList = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/acount/list')
    if (res.code === 200) {
      tableData.value = res.data
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
.user-page {
  padding: 20px;
}
.toolbar {
  display: flex;
  gap: 10px;
}
</style>