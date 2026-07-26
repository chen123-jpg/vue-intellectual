<template>
  <div class="page">
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="包类型">
          <el-select v-model="query.packageType" placeholder="全部" clearable>
            <el-option label="XML申请包" value="XML_PACKAGE" />
            <el-option label="五书申请文件" value="FIVE_BOOKS_WORD" />
          </el-select>
        </el-form-item>
        <el-form-item label="确认状态">
          <el-select v-model="query.confirmStatus" placeholder="全部" clearable>
            <el-option label="未确认" value="UNCONFIRMED" />
            <el-option label="可提交" value="CONFIRMED" />
            <el-option label="已提交" value="SUBMITTED" />
          </el-select>
        </el-form-item>
        <el-form-item label="内部编号">
          <el-input v-model="query.internalNo" placeholder="精确搜索" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button v-if="hasPerm('patent:applicationPackage:delete')" type="danger" :disabled="!selected.length" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="包类型" width="130">
          <template #default="{ row }">
            <el-tag :type="row.packageType === 'XML_PACKAGE' ? 'primary' : 'success'" size="small">
              {{ row.packageType === 'XML_PACKAGE' ? 'XML申请包' : '五书申请文件' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="220" show-overflow-tooltip />
        <el-table-column prop="internalNo" label="内部编号" width="140" />
        <el-table-column prop="versionNo" label="版本" width="70" />
        <el-table-column label="确认状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.confirmStatus === 'SUBMITTED' ? 'success' : row.confirmStatus === 'CONFIRMED' ? 'primary' : 'warning'" size="small">
              {{ row.confirmStatus === 'UNCONFIRMED' ? '未确认' : row.confirmStatus === 'CONFIRMED' ? '可提交' : '已提交' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploadUserName" label="上传人" width="100" />
        <el-table-column prop="confirmUserName" label="确认人" width="100" />
        <el-table-column prop="uploadTime" label="上传时间" width="160" :formatter="(_,__,v) => formatDateTime(v)" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="downloadFile(row.fileUrl)">下载</el-button>
            <el-button v-if="hasPerm('patent:applicationPackage:delete')" size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page.pageNum"
        v-model:page-size="page.pageSize"
        :total="page.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchData"
        @current-change="fetchData"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, remove, batchRemove } from '../../api/applicationPackage'
import { useUserStore } from '../../stores/user'
import { downloadFile, formatDateTime } from '../../utils/format'

const { state } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

const tableData = ref([])
const selected = ref([])
const loading = ref(false)

const query = reactive({ packageType: '', confirmStatus: '', internalNo: '' })
const page = reactive({ pageNum: 1, pageSize: 10, total: 0 })

const fetchData = async () => {
  loading.value = true
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize }
    Object.keys(query).forEach(k => { if (query[k]) params[k] = query[k] })
    const res = await getList(params)
    if (res.code === 200) {
      tableData.value = res.data.records || []
      page.total = res.data.total || 0
    }
  } finally { loading.value = false }
}

const resetQuery = () => {
  Object.keys(query).forEach(k => query[k] = '')
  page.pageNum = 1
  fetchData()
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该记录？', '提示', { type: 'warning' })
    const res = await remove(id)
    if (res.code === 200) { ElMessage.success('删除成功'); fetchData() }
  } catch { /* cancelled */ }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' })
    const res = await batchRemove(selected.value.map(r => r.id))
    if (res.code === 200) { ElMessage.success('批量删除成功'); fetchData() }
  } catch { /* cancelled */ }
}

const onSelectionChange = (sel) => { selected.value = sel }

onMounted(() => fetchData())
</script>

<style scoped>
.page { max-width: 1600px; }
.search-form { margin-bottom: 10px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
