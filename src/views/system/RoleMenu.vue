<template>
  <div class="page">
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="角色ID">
          <el-input v-model="query.roleId" placeholder="精确搜索" clearable />
        </el-form-item>
        <el-form-item label="菜单ID">
          <el-input v-model="query.menuId" placeholder="精确搜索" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button v-if="hasPerm('system:roleMenu:add')" type="primary" @click="openAdd">新增</el-button>
        <el-button v-if="hasPerm('system:roleMenu:delete')" type="danger" :disabled="!selected.length" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="roleId" label="角色ID" width="120" />
        <el-table-column label="角色名称" width="150">
          <template #default="{ row }">{{ row.roleName || roleNameMap[row.roleId] }}</template>
        </el-table-column>
        <el-table-column prop="menuId" label="菜单ID" width="120" />
        <el-table-column label="菜单名称" width="150">
          <template #default="{ row }">{{ row.menuName || menuNameMap[row.menuId] }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPerm('system:roleMenu:add')" size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="hasPerm('system:roleMenu:delete')" size="small" type="danger" @click="handleDelete(row.menuId)">删除</el-button>
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
      :title="dialog.isEdit ? '编辑角色菜单关联' : '新增角色菜单关联'"
      width="450px"
      destroy-on-close
      :before-close="handleDialogBeforeClose"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="角色" required>
          <el-select v-model="form.roleId" placeholder="请选择角色" filterable style="width:100%">
            <el-option v-for="r in roleOptions" :key="r.roleId" :label="r.roleName" :value="r.roleId" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜单" required>
          <el-select v-model="form.menuId" placeholder="请选择菜单" filterable style="width:100%">
            <el-option v-for="m in menuOptions" :key="m.menuId" :label="m.menuName" :value="m.menuId" />
          </el-select>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, create, remove, batchRemove } from '../../api/roleMenu'
import { useDialogAddDraft } from '../../composables/useFormDraft'
import { getAll as getRoleAll } from '../../api/role'
import { getAll as getMenuAll } from '../../api/menu'
import { useUserStore } from '../../stores/user'

const { state } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

const tableData = ref([])
const selected = ref([])
const loading = ref(false)
const saving = ref(false)
const roleOptions = ref([])
const menuOptions = ref([])

const query = reactive({ roleId: '', menuId: '' })
const page = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const dialog = reactive({ visible: false, isEdit: false })
const emptyForm = () => ({ roleId: null, menuId: null })
const form = reactive(emptyForm())
const editOriginMenuId = ref(null)
const addDraft = useDialogAddDraft('system-role-menu-add', {
  getEmptyData: emptyForm,
  getCurrentData: () => ({ ...form }),
  reset: () => {
    Object.assign(form, emptyForm())
    editOriginMenuId.value = null
  },
  applyData: (data) => Object.assign(form, { ...emptyForm(), ...data })
})

const roleNameMap = computed(() => {
  const map = {}
  roleOptions.value.forEach(r => { map[r.roleId] = r.roleName })
  return map
})
const menuNameMap = computed(() => {
  const map = {}
  menuOptions.value.forEach(m => { map[m.menuId] = m.menuName })
  return map
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize, ...query }
    Object.keys(params).forEach(k => { if (!params[k] && params[k] !== 0) delete params[k] })
    const res = await getList(params)
    if (res.code === 200) {
      tableData.value = res.data.records || []
      page.total = res.data.total || 0
    }
  } finally { loading.value = false }
}

const fetchOptions = async () => {
  const [roleRes, menuRes] = await Promise.all([
    getRoleAll(),
    getMenuAll()
  ])
  if (roleRes.code === 200) {
    roleOptions.value = roleRes.data || []
  }
  if (menuRes.code === 200) {
    menuOptions.value = menuRes.data || []
  }
}

const resetQuery = () => {
  Object.keys(query).forEach(k => query[k] = '')
  page.pageNum = 1
  fetchData()
}

const openAdd = () => {
  dialog.isEdit = false
  addDraft.open(() => { dialog.visible = true })
}

const openEdit = (row) => {
  form.roleId = row.roleId
  form.menuId = row.menuId
  editOriginMenuId.value = row.menuId
  dialog.isEdit = true
  dialog.visible = true
}

const handleSave = async () => {
  saving.value = true
  try {
    if (dialog.isEdit) {
      await remove(editOriginMenuId.value)
    }
    const res = await create({ roleId: form.roleId, menuId: form.menuId })
    if (res.code === 200) {
      if (!dialog.isEdit) addDraft.clear()
      ElMessage.success(dialog.isEdit ? '编辑成功' : '新增成功')
      dialog.visible = false
      fetchData()
    }
  } finally { saving.value = false }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该关联？', '提示', { type: 'warning' })
    const res = await remove(id)
    if (res.code === 200) { ElMessage.success('删除成功'); fetchData() }
  } catch { /* cancelled */ }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' })
    const res = await batchRemove(selected.value.map(r => r.menuId))
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

onMounted(() => { fetchData(); fetchOptions() })
</script>

<style scoped>
.page { max-width: 1600px; }
.search-form { margin-bottom: 10px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
