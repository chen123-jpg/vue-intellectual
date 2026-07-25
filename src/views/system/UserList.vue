<template>
  <div class="page">
    <el-card>
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column prop="loginName" label="登录账号" width="140" />
        <el-table-column prop="userName" label="用户名称" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="phoneNumber" label="手机号" width="140" />
        <el-table-column prop="sex" label="性别" width="70">
          <template #default="{ row }">{{ row.sex === '0' ? '男' : row.sex === '1' ? '女' : '未知' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">
              {{ row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserList } from '../../api/user'

const tableData = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getUserList()
    if (res.code === 200) tableData.value = res.data || []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page { max-width: 1400px; }
</style>
