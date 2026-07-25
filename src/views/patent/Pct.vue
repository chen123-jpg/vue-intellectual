<template>
  <div class="page">
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="申请名称"><el-input v-model="query.applicationName" placeholder="模糊搜索" clearable /></el-form-item>
        <el-form-item label="申请号"><el-input v-model="query.applicationNo" placeholder="精确搜索" clearable /></el-form-item>
        <el-form-item label="状态"><el-input v-model="query.status" placeholder="精确搜索" clearable /></el-form-item>
        <el-form-item label="申请人"><el-input v-model="query.applicant" placeholder="模糊搜索" clearable /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button v-if="hasPerm('patent:pct:add')" type="primary" @click="openAdd">新增</el-button>
        <el-button v-if="hasPerm('patent:pct:delete')" type="danger" :disabled="!selected.length" @click="handleBatchDelete">批量删除</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="seqNo" label="序号" width="70" />
        <el-table-column prop="pctInternalNo" label="PCT内部编号" width="130" />
        <el-table-column prop="applicationName" label="申请名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="applicationNo" label="申请号(PCT号)" width="140" />
        <el-table-column prop="status" label="状态" width="90" />
        <el-table-column prop="applicant" label="申请人" width="140" />
        <el-table-column prop="inventor" label="发明人" width="120" />
        <el-table-column prop="sponsor" label="主办人" width="100" />
        <el-table-column prop="pctApplicationDate" label="PCT申请日" width="110" :formatter="(_,__,v) => formatDate(v)" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPerm('patent:pct:edit')" size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="hasPerm('patent:pct:delete')" size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page.pageNum" v-model:page-size="page.pageSize"
        :total="page.total" :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next" @size-change="fetchData" @current-change="fetchData"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑PCT' : '新增PCT'" width="700px" destroy-on-close>
      <el-form :model="form" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="PCT内部编号"><el-input v-model="form.pctInternalNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="申请名称" required><el-input v-model="form.applicationName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="申请号"><el-input v-model="form.applicationNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-input v-model="form.status" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="申请人"><el-input v-model="form.applicant" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="发明人"><el-input v-model="form.inventor" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="主办人"><el-input v-model="form.sponsor" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="代理人"><el-input v-model="form.agent" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="在先内部编号"><el-input v-model="form.priorInternalNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="在先申请号"><el-input v-model="form.priorApplicationNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PCT申请日"><el-date-picker v-model="form.pctApplicationDate" type="date" style="width:100%" value-format="YYYY-MM-DD" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate } from '../../utils/format'
import api from '../../api/ptable'
import { useUserStore } from '../../stores/user'

const moduleApi = api['pct']
const { state } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

const tableData = ref([])
const selected = ref([])
const loading = ref(false)
const saving = ref(false)

const query = reactive({ applicationName: '', applicationNo: '', status: '', applicant: '' })
const page = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const dialog = reactive({ visible: false, isEdit: false })
const form = reactive({
  id: null, pctInternalNo: '', applicationName: '', applicationNo: '', status: '',
  applicant: '', inventor: '', sponsor: '', agent: '',
  priorInternalNo: '', priorApplicationNo: '', pctApplicationDate: '', remark: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize, ...query }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const res = await moduleApi.getList(params)
    if (res.code === 200) { tableData.value = res.data.records || []; page.total = res.data.total || 0 }
  } finally { loading.value = false }
}

const resetQuery = () => { Object.keys(query).forEach(k => query[k] = ''); page.pageNum = 1; fetchData() }
const openAdd = () => { Object.keys(form).forEach(k => form[k] = k === 'id' ? null : ''); dialog.isEdit = false; dialog.visible = true }
const openEdit = async (row) => {
  try { const res = await moduleApi.getById(row.id); if (res.code === 200) { Object.assign(form, res.data); dialog.isEdit = true; dialog.visible = true } } catch { /* */ }
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = dialog.isEdit ? await moduleApi.update({ ...form }) : await moduleApi.create({ ...form })
    if (res.code === 200) { ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功'); dialog.visible = false; fetchData() }
  } finally { saving.value = false }
}

const handleDelete = async (id) => {
  try { await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' }); const res = await moduleApi.remove(id); if (res.code === 200) { ElMessage.success('删除成功'); fetchData() } } catch { /* */ }
}

const handleBatchDelete = async () => {
  try { await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' }); const res = await moduleApi.batchRemove(selected.value.map(r => r.id)); if (res.code === 200) { ElMessage.success('批量删除成功'); fetchData() } } catch { /* */ }
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
