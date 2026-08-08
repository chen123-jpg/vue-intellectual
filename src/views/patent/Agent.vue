<template>
  <div class="page">
    <el-card>
      <SearchBar
        v-model="query"
        :fields="searchFields"
        :loading="loading"
        boxed
        @search="fetchData"
        @reset="resetQuery"
      />

      <div class="toolbar">
        <el-button v-if="hasPerm('patent:agent:add')" type="primary" @click="openAdd">新增</el-button>
        <el-button v-if="hasPerm('patent:agent:delete')" type="danger" :disabled="!selected.length" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="代理人姓名" min-width="200" />
        <el-table-column prop="createTime" label="创建时间" width="160" :formatter="(_,__,v) => formatDate(v)" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPerm('patent:agent:edit')" size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="hasPerm('patent:agent:delete')" size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
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

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑代理人' : '新增代理人'"
      width="500px"
      destroy-on-close
      :before-close="handleDialogBeforeClose"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="代理人姓名" required>
          <el-input v-model="form.name" placeholder="请输入代理人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogCancel">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, getById, create, update, remove, batchRemove } from '../../api/externalPersonnelController.js'
import { useDialogAddDraft } from '../../composables/useFormDraft'
import { useUserStore } from '../../stores/user'
import { useSearch } from '../../composables/useSearch'
import SearchBar from '../../components/SearchBar.vue'
import { formatDate } from '../../utils/format'

const { state } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

const searchFields = [
  { key: 'name', label: '代理人姓名', type: 'input', matchType: 'fuzzy', width: 240 }
]

const { query, page, loading } = useSearch({
  defaultQuery: { name: '' }
})

const tableData = ref([])
const selected = ref([])
const saving = ref(false)
const dialog = reactive({ visible: false, isEdit: false })
const emptyForm = () => ({ id: null, name: '' })
const form = reactive(emptyForm())
const addDraft = useDialogAddDraft('patent-agent-add', {
  getEmptyData: emptyForm,
  getCurrentData: () => ({ ...form }),
  reset: () => Object.assign(form, emptyForm()),
  applyData: (data) => Object.assign(form, { ...emptyForm(), ...data })
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize }
    Object.keys(query).forEach(k => {
      const v = query[k]
      if (v !== '' && v !== null && v !== undefined) params[k] = v
    })
    const res = await getList(params)
    if (res.code === 200) {
      tableData.value = res.data.records || []
      page.total = res.data.total || 0
    }
  } finally { loading.value = false }
}

const resetQuery = () => {
  page.pageNum = 1
  fetchData()
}

const openAdd = () => {
  dialog.isEdit = false
  addDraft.open(() => { dialog.visible = true })
}

const openEdit = async (row) => {
  try {
    const res = await getById(row.id)
    if (res.code === 200) {
      Object.assign(form, res.data)
      dialog.isEdit = true
      dialog.visible = true
    }
  } catch { /* handled */ }
}

const handleSave = async () => {
  if (!form.name) { ElMessage.warning('请输入代理人姓名'); return }
  saving.value = true
  try {
    const res = dialog.isEdit ? await update({ ...form }) : await create({ ...form })
    if (res.code === 200) {
      if (!dialog.isEdit) addDraft.clear()
      ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
      dialog.visible = false
      fetchData()
    }
  } finally { saving.value = false }
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

const handleDialogCancel = async () => {
  if (dialog.isEdit) {
    dialog.visible = false
    return
  }
  await addDraft.cancel(() => { dialog.visible = false })
}

const handleDialogBeforeClose = async (done) => {
  if (dialog.isEdit) {
    done()
    return
  }
  await addDraft.cancel(done)
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
