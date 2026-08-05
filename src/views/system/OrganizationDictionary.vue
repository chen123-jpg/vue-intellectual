<template>
  <div class="page">
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="组织ID">
          <el-input v-model="query.code" placeholder="组织ID" clearable style="width:130px" />
        </el-form-item>
        <el-form-item label="组织名称">
          <el-input v-model="query.name" placeholder="组织名称" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="组织类型">
          <el-select v-model="query.type" placeholder="组织类型" clearable style="width:130px">
            <el-option label="总公司" value="总公司" />
            <el-option label="分公司" value="分公司" />
            <el-option label="内部部门" value="内部部门" />
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
        <el-table-column prop="code" label="组织ID" width="100" />
        <el-table-column prop="name" label="组织名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="parentCode" label="上级组织ID" width="120">
          <template #default="{ row }">{{ row.parentCode || '-' }}</template>
        </el-table-column>
        <el-table-column prop="type" label="组织类型" width="110">
          <template #default="{ row }">
            <el-tag :type="orgTypeTag(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="status" label="组织状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip>
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

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑组织' : '新增组织'" width="550px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-form-item label="组织ID" required>
          <el-input v-model="form.code" :disabled="dialog.isEdit" placeholder="如 ORG007" />
        </el-form-item>
        <el-form-item label="组织名称" required>
          <el-input v-model="form.name" placeholder="组织名称" />
        </el-form-item>
        <el-form-item label="上级组织ID">
          <el-input v-model="form.parentCode" placeholder="上级组织ID" />
        </el-form-item>
        <el-form-item label="组织类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="总公司" value="总公司" />
            <el-option label="分公司" value="分公司" />
            <el-option label="内部部门" value="内部部门" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact" placeholder="联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="联系电话" />
        </el-form-item>
        <el-form-item label="组织状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option label="正常" value="正常" />
            <el-option label="停用" value="停用" />
          </el-select>
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
import { organizationData as staticData } from '../../data/organizationDictionary'

const STORAGE_KEY = 'dict_organization'

const orgTypeTag = (t) => ({ '总公司': 'primary', '分公司': 'warning', '内部部门': 'info' }[t] || 'info')
const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const selected = ref([])
const query = reactive({ code: '', name: '', type: '' })
const dialog = reactive({ visible: false, isEdit: false, index: -1 })

const filteredData = computed(() => {
  let rows = tableData.value
  if (query.code) rows = rows.filter(r => r.code && r.code.toLowerCase().includes(query.code.toLowerCase()))
  if (query.name) rows = rows.filter(r => r.name && r.name.includes(query.name))
  if (query.type) rows = rows.filter(r => r.type && r.type === query.type)
  return rows
})

const doSearch = () => {}
const resetSearch = () => { query.code = ''; query.name = ''; query.type = '' }

const emptyForm = () => ({ code: '', name: '', parentCode: '', type: '', contact: '', phone: '', status: '正常', remark: '' })
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
  if (!form.code.trim()) { ElMessage.warning('请输入组织ID'); return }
  if (!form.name.trim()) { ElMessage.warning('请输入组织名称'); return }
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
    await ElMessageBox.confirm('确认删除该组织？', '提示', { type: 'warning' })
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
