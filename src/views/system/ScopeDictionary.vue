<template>
  <div class="page">
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="权限ID">
          <el-input v-model="query.code" placeholder="权限ID" clearable style="width:130px" />
        </el-form-item>
        <el-form-item label="角色ID">
          <el-input v-model="query.roleId" placeholder="角色ID" clearable style="width:130px" />
        </el-form-item>
        <el-form-item label="数据权限范围">
          <el-select v-model="query.scope" placeholder="数据权限范围" clearable style="width:150px">
            <el-option label="全部数据" value="全部数据" />
            <el-option label="本组织数据" value="本组织数据" />
            <el-option label="本人数据" value="本人数据" />
            <el-option label="客户专属数据" value="客户专属数据" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="openAdd">新增条目</el-button>
        <el-button type="danger" :disabled="!selected.length" @click="handleBatchDelete">批量删除</el-button>
      </div>

      <el-table :data="filteredData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="code" label="权限ID" width="110" />
        <el-table-column prop="roleId" label="角色ID" width="100" />
        <el-table-column prop="scope" label="数据权限范围" width="130">
          <template #default="{ row }">
            <el-tag :type="scopeTag(row.scope)" size="small">{{ row.scope }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="范围说明" min-width="320" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="120" />
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row, $index }">
            <el-button size="small" type="primary" @click="openEdit($index)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑数据权限' : '新增数据权限'" width="550px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="130px">
        <el-form-item label="权限ID" required>
          <el-input v-model="form.code" :disabled="dialog.isEdit" placeholder="如 SCOPE010" />
        </el-form-item>
        <el-form-item label="角色ID" required>
          <el-input v-model="form.roleId" placeholder="角色ID，如 ROLE001" />
        </el-form-item>
        <el-form-item label="数据权限范围" required>
          <el-select v-model="form.scope" style="width:100%">
            <el-option label="全部数据" value="全部数据" />
            <el-option label="本组织数据" value="本组织数据" />
            <el-option label="本人数据" value="本人数据" />
            <el-option label="客户专属数据" value="客户专属数据" />
          </el-select>
        </el-form-item>
        <el-form-item label="范围说明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="范围说明" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker v-model="form.createTime" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { scopeData as staticData } from '../../data/scopeDictionary'

const STORAGE_KEY = 'dict_scope'

const scopeTag = (s) => ({ '全部数据': 'primary', '本组织数据': 'warning', '本人数据': 'info', '客户专属数据': 'success' }[s] || 'info')
const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const selected = ref([])
const query = reactive({ code: '', roleId: '', scope: '' })
const dialog = reactive({ visible: false, isEdit: false, index: -1 })

const filteredData = computed(() => {
  let rows = tableData.value
  if (query.code) rows = rows.filter(r => r.code && r.code.toLowerCase().includes(query.code.toLowerCase()))
  if (query.roleId) rows = rows.filter(r => r.roleId && r.roleId.toLowerCase().includes(query.roleId.toLowerCase()))
  if (query.scope) rows = rows.filter(r => r.scope && r.scope === query.scope)
  return rows
})

const doSearch = () => {}
const resetSearch = () => { query.code = ''; query.roleId = ''; query.scope = '' }

const emptyForm = () => ({ code: '', roleId: '', scope: '', description: '', createTime: '', remark: '' })
const form = reactive(emptyForm())

const loadData = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) { try { tableData.value = JSON.parse(stored); return } catch {} }
  tableData.value = staticData.map(d => ({ ...d }))
}
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tableData.value))

const openAdd = () => { Object.assign(form, emptyForm()); dialog.isEdit = false; dialog.index = -1; dialog.visible = true }
const openEdit = (idx) => {
  const row = filteredData.value[idx]
  Object.assign(form, { ...row })
  dialog.isEdit = true; dialog.index = tableData.value.indexOf(row); dialog.visible = true
}
const handleSave = () => {
  if (!form.code.trim()) { ElMessage.warning('请输入权限ID'); return }
  if (!form.roleId.trim()) { ElMessage.warning('请输入角色ID'); return }
  if (!form.scope.trim()) { ElMessage.warning('请选择数据权限范围'); return }
  saving.value = true
  try {
    const data = { ...form }
    if (dialog.isEdit && dialog.index >= 0) { tableData.value[dialog.index] = { ...tableData.value[dialog.index], ...data }; ElMessage.success('修改成功') }
    else { tableData.value.push(data); ElMessage.success('新增成功') }
    persist(); dialog.visible = false
  } finally { saving.value = false }
}
const deleteRow = async (idx) => {
  const row = filteredData.value[idx]
  try {
    await ElMessageBox.confirm('确认删除该数据权限配置？', '提示', { type: 'warning' })
    tableData.value.splice(tableData.value.indexOf(row), 1)
    persist(); ElMessage.success('已删除')
  } catch {}
}
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' })
    const idxs = selected.value.map(r => tableData.value.indexOf(r)).filter(i => i >= 0).sort((a, b) => b - a)
    idxs.forEach(i => tableData.value.splice(i, 1))
    selected.value = []; persist(); ElMessage.success('批量删除成功')
  } catch {}
}
const onSelectionChange = (sel) => { selected.value = sel }
onMounted(() => loadData())
</script>

<style scoped>
.page { max-width: 1600px; }
.search-form { margin-bottom: 4px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
</style>
