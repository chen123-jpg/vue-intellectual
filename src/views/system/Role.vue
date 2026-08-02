<template>
  <div class="page">
    <el-card>
      <SearchBar
        v-model="query"
        :fields="searchFields"
        :loading="loading"
        :collapsed-threshold="4"
        @search="fetchData"
        @reset="resetQuery"
      />

      <div class="toolbar">
        <el-button v-if="hasPerm('system:role:add')" type="primary" @click="openAdd">新增</el-button>
        <el-button v-if="hasPerm('system:role:delete')" type="danger" :disabled="!selected.length" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="roleId" label="角色ID" width="80" />
        <el-table-column prop="roleName" label="角色名称" width="140" />
        <el-table-column prop="roleKey" label="权限字符" width="160" />
        <el-table-column prop="roleSort" label="排序" width="70" />
        <el-table-column prop="dataScope" label="数据范围" width="120">
          <template #default="{ row }">
            {{ dataScopeMap[row.dataScope] || row.dataScope }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">
              {{ row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPerm('system:role:edit')" size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="hasPerm('system:role:delete')" size="small" type="danger" @click="handleDelete(row.roleId)">删除</el-button>
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
      :title="dialog.isEdit ? '编辑角色' : '新增角色'"
      width="580px"
      destroy-on-close
      :before-close="handleDialogBeforeClose"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="角色名称" required>
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="权限字符" required>
          <el-input v-model="form.roleKey" placeholder="请输入权限字符" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.roleSort" :min="0" />
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="form.dataScope" style="width:100%">
            <el-option label="全部数据权限" value="1" />
            <el-option label="自定义数据权限" value="2" />
            <el-option label="本部门数据权限" value="3" />
            <el-option label="本部门及以下数据权限" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogCancel">取消</el-button>
        <el-button v-if="!dialog.isEdit" @click="handleSaveDraft">暂存</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, getById, create, update, remove, batchRemove } from '../../api/role'
import { useDialogAddDraft } from '../../composables/useFormDraft'
import { useUserStore } from '../../stores/user'
import { useSearch } from '../../composables/useSearch'
import SearchBar from '../../components/SearchBar.vue'

const { state } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

const dataScopeMap = { '1': '全部', '2': '自定义', '3': '本部门', '4': '本部门及以下' }

const searchFields = [
  { key: 'roleName', label: '角色名称', type: 'input', matchType: 'fuzzy', width: 200 },
  { key: 'roleKey', label: '权限字符', type: 'input', matchType: 'fuzzy', width: 200 },
  { key: 'status', label: '状态', type: 'select', options: [
    { label: '正常', value: '0' },
    { label: '停用', value: '1' }
  ], width: 140 }
]

const { query, page, loading } = useSearch({
  defaultQuery: { roleName: '', roleKey: '', status: '' }
})

const tableData = ref([])
const selected = ref([])
const saving = ref(false)
const dialog = reactive({ visible: false, isEdit: false })
const emptyForm = () => ({
  roleId: null, roleName: '', roleKey: '', roleSort: 0,
  dataScope: '1', status: '0', remark: ''
})
const form = reactive(emptyForm())
const addDraft = useDialogAddDraft('system-role-add', {
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
      if (v === 0 || (v !== '' && v !== null && v !== undefined)) {
        params[k] = typeof v === 'string' ? v.trim() : v
      }
    })
    const res = await getList(params)
    if (res.code === 200) {
      tableData.value = res.data.records || []
      page.total = res.data.total || 0
    }
  } finally { loading.value = false }
}

const openAdd = () => {
  dialog.isEdit = false
  addDraft.open(() => { dialog.visible = true })
}

const openEdit = async (row) => {
  try {
    const res = await getById(row.roleId)
    if (res.code === 200) {
      Object.assign(form, res.data)
      dialog.isEdit = true
      dialog.visible = true
    }
  } catch { /* handled */ }
}

const handleSave = async () => {
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
    await ElMessageBox.confirm('确认删除该角色？', '提示', { type: 'warning' })
    const res = await remove(id)
    if (res.code === 200) { ElMessage.success('删除成功'); fetchData() }
  } catch { /* cancelled */ }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' })
    const res = await batchRemove(selected.value.map(r => r.roleId))
    if (res.code === 200) { ElMessage.success('批量删除成功'); fetchData() }
  } catch { /* cancelled */ }
}

const resetQuery = () => {
  page.pageNum = 1
  fetchData()
}

const onSelectionChange = (sel) => { selected.value = sel }

const handleSaveDraft = () => {
  addDraft.save()
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

onMounted(() => fetchData())
</script>

<style scoped>
.page { max-width: 1600px; }
.search-form { margin-bottom: 10px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
