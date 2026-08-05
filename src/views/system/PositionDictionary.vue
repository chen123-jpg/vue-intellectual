<template>
  <div class="page">
    <el-card>
      <!-- 搜索 -->
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="岗位编号">
          <el-input v-model="query.code" placeholder="岗位编号" clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="query.name" placeholder="全称/简称" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="岗位大类">
          <el-select v-model="query.category" placeholder="岗位大类" clearable style="width:140px">
            <el-option label="决策层" value="决策层" />
            <el-option label="管理层" value="管理层" />
            <el-option label="专业技术岗" value="专业技术岗" />
            <el-option label="试用岗" value="试用岗" />
            <el-option label="职能支持岗" value="职能支持岗" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 工具栏 -->
      <div class="toolbar">
        <el-button type="primary" @click="openAdd">新增条目</el-button>
        <el-button type="danger" :disabled="!selected.length" @click="handleBatchDelete">批量删除</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="filteredData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="code" label="岗位编号" width="110" />
        <el-table-column prop="fullName" label="岗位标准全称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="shortName" label="岗位简称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="department" label="所属部门" width="160" show-overflow-tooltip />
        <el-table-column prop="category" label="岗位大类" width="110" />
        <el-table-column prop="responsibilities" label="核心岗位职责" min-width="240" show-overflow-tooltip />
        <el-table-column prop="superiorPost" label="直接上级岗位" width="130">
          <template #default="{ row }">{{ row.superiorPost || '-' }}</template>
        </el-table-column>
        <el-table-column prop="headcount" label="岗位编制数" width="100" />
        <el-table-column prop="needCert" label="需代理师资格证" width="130">
          <template #default="{ row }">
            <el-tag :type="row.needCert === '是' ? 'warning' : 'info'" size="small">{{ row.needCert }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isManager" label="是否为管理岗" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isManager === '是' ? 'primary' : 'info'" size="small">{{ row.isManager }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="effectiveDate" label="岗位生效日期" width="120" />
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑岗位' : '新增岗位'" width="620px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="150px">
        <el-form-item label="岗位编号" required>
          <el-input v-model="form.code" :disabled="dialog.isEdit" placeholder="岗位编号，如 POST015" />
        </el-form-item>
        <el-form-item label="岗位标准全称" required>
          <el-input v-model="form.fullName" placeholder="岗位标准全称" />
        </el-form-item>
        <el-form-item label="岗位简称" required>
          <el-input v-model="form.shortName" placeholder="岗位简称" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-input v-model="form.department" placeholder="所属部门" />
        </el-form-item>
        <el-form-item label="岗位大类">
          <el-select v-model="form.category" style="width:100%">
            <el-option label="决策层" value="决策层" />
            <el-option label="管理层" value="管理层" />
            <el-option label="专业技术岗" value="专业技术岗" />
            <el-option label="试用岗" value="试用岗" />
            <el-option label="职能支持岗" value="职能支持岗" />
          </el-select>
        </el-form-item>
        <el-form-item label="核心岗位职责">
          <el-input v-model="form.responsibilities" type="textarea" :rows="3" placeholder="核心岗位职责" />
        </el-form-item>
        <el-form-item label="直接上级岗位">
          <el-input v-model="form.superiorPost" placeholder="直接上级岗位" />
        </el-form-item>
        <el-form-item label="岗位编制数">
          <el-input-number v-model="form.headcount" :min="0" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="是否需要代理师资格证">
          <el-select v-model="form.needCert" style="width:100%">
            <el-option label="是" value="是" />
            <el-option label="否" value="否" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否为管理岗">
          <el-select v-model="form.isManager" style="width:100%">
            <el-option label="是" value="是" />
            <el-option label="否" value="否" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位生效日期">
          <el-date-picker v-model="form.effectiveDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
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
import { positionData as staticData } from '../../data/positionDictionary'

const STORAGE_KEY = 'dict_position'

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const selected = ref([])
const query = reactive({ code: '', name: '', category: '' })
const dialog = reactive({ visible: false, isEdit: false, index: -1 })

const filteredData = computed(() => {
  let rows = tableData.value
  if (query.code) rows = rows.filter(r => r.code && r.code.toLowerCase().includes(query.code.toLowerCase()))
  if (query.name) rows = rows.filter(r =>
    (r.fullName && r.fullName.includes(query.name)) ||
    (r.shortName && r.shortName.includes(query.name))
  )
  if (query.category) rows = rows.filter(r => r.category && r.category === query.category)
  return rows
})

const doSearch = () => {}
const resetSearch = () => { query.code = ''; query.name = ''; query.category = '' }

const emptyForm = () => ({
  code: '', fullName: '', shortName: '', department: '', category: '',
  responsibilities: '', superiorPost: '', headcount: null, needCert: '否',
  isManager: '否', effectiveDate: '', remark: ''
})

const form = reactive(emptyForm())

const loadData = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try { tableData.value = JSON.parse(stored); return } catch {}
  }
  tableData.value = staticData.map(d => ({ ...d }))
}

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tableData.value))
}

const openAdd = () => {
  Object.assign(form, emptyForm())
  dialog.isEdit = false
  dialog.index = -1
  dialog.visible = true
}

const openEdit = (idx) => {
  const row = filteredData.value[idx]
  const realIdx = tableData.value.indexOf(row)
  Object.assign(form, { ...row })
  dialog.isEdit = true
  dialog.index = realIdx
  dialog.visible = true
}

const handleSave = () => {
  if (!form.code.trim()) { ElMessage.warning('请输入岗位编号'); return }
  if (!form.fullName.trim()) { ElMessage.warning('请输入岗位标准全称'); return }
  if (!form.shortName.trim()) { ElMessage.warning('请输入岗位简称'); return }
  saving.value = true
  try {
    const data = {
      ...form,
      headcount: form.headcount || null
    }
    if (dialog.isEdit && dialog.index >= 0) {
      tableData.value[dialog.index] = { ...tableData.value[dialog.index], ...data }
      ElMessage.success('修改成功')
    } else {
      tableData.value.push(data)
      ElMessage.success('新增成功')
    }
    persist()
    dialog.visible = false
  } finally { saving.value = false }
}

const deleteRow = async (idx) => {
  const row = filteredData.value[idx]
  const realIdx = tableData.value.indexOf(row)
  try {
    await ElMessageBox.confirm('确认删除该岗位？', '提示', { type: 'warning' })
    tableData.value.splice(realIdx, 1)
    persist()
    ElMessage.success('已删除')
  } catch {}
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' })
    const idxs = selected.value.map(r => tableData.value.indexOf(r)).filter(i => i >= 0).sort((a, b) => b - a)
    idxs.forEach(i => tableData.value.splice(i, 1))
    selected.value = []
    persist()
    ElMessage.success('批量删除成功')
  } catch {}
}

const onSelectionChange = (sel) => { selected.value = sel }

onMounted(() => loadData())
</script>

<style scoped>
.page { max-width: 1800px; }
.search-form { margin-bottom: 4px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
</style>
