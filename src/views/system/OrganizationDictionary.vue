<template>
  <div class="page">
    <el-card>
      <!-- 筛选面板 -->
      <div class="filter-box">
        <div class="filter-box__title">
          <el-icon :size="15"><Search /></el-icon>
          <span>筛选条件</span>
        </div>
        <div class="filter-grid">
          <div class="filter-cell" v-for="f in filterFields" :key="f.key" :style="{ gridColumn: f.span ? `span ${f.span}` : '' }">
            <label class="filter-cell__label">{{ f.label }}</label>
            <el-input v-if="f.type === 'input'" v-model="query[f.key]" clearable :placeholder="f.placeholder" @keyup.enter="doFilter" @clear="doFilter" />
            <el-select v-else-if="f.type === 'select'" v-model="query[f.key]" clearable placeholder="全部" @change="doFilter">
              <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
            </el-select>
          </div>
        </div>
        <div class="filter-actions">
          <el-button type="primary" @click="doFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </div>
      </div>

      <!-- 表格区域 -->
      <div class="table-section">
        <div class="table-section__bar">
          <span class="table-section__count">
            共 <strong>{{ tableData.length }}</strong> 条
            <template v-if="isFiltered">，筛选结果 <strong>{{ filteredData.length }}</strong> 条</template>
          </span>
          <el-button size="small" @click="doRefresh" :icon="Refresh">刷新</el-button>
          <el-button type="primary" size="small" @click="openAdd">新增条目</el-button>
          <el-button type="danger" size="small" :disabled="!selected.length" @click="handleBatchDelete">批量删除</el-button>
        </div>

      <!-- 表格 -->
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
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row, $index }">
            <el-button size="small" type="primary" link @click="openEdit($index)">编辑</el-button>
            <el-button size="small" type="danger" link @click="deleteRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
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
import { Search, Refresh } from '@element-plus/icons-vue'
import { organizationData as staticData } from '../../data/organizationDictionary'

const STORAGE_KEY = 'dict_organization'

const orgTypeTag = (t) => ({ '总公司': 'primary', '分公司': 'warning', '内部部门': 'info' }[t] || 'info')
const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const selected = ref([])
const filterFields = [
  { key: 'code', label: '组织ID', type: 'input' },
  { key: 'name', label: '组织名称', type: 'input' },
  { key: 'parentCode', label: '上级组织ID', type: 'input' },
  { key: 'type', label: '组织类型', type: 'select', options: ['总公司', '分公司', '内部部门'] },
  { key: 'contact', label: '联系人', type: 'input' },
  { key: 'phone', label: '联系电话', type: 'input' },
  { key: 'status', label: '组织状态', type: 'select', options: ['正常', '停用'] },
  { key: 'remark', label: '备注', type: 'input' }
]

const query = reactive({
  code: '', name: '', parentCode: '', type: '', contact: '', phone: '', status: '', remark: ''
})
const dialog = reactive({ visible: false, isEdit: false, index: -1 })

// 逐字段 AND 过滤
const filteredData = computed(() => {
  let rows = tableData.value
  if (query.code) rows = rows.filter(r => r.code && r.code.toLowerCase().includes(query.code.toLowerCase()))
  if (query.name) rows = rows.filter(r => r.name && r.name.toLowerCase().includes(query.name.toLowerCase()))
  if (query.parentCode) rows = rows.filter(r => r.parentCode && r.parentCode.toLowerCase().includes(query.parentCode.toLowerCase()))
  if (query.type) rows = rows.filter(r => r.type === query.type)
  if (query.contact) rows = rows.filter(r => r.contact && r.contact.toLowerCase().includes(query.contact.toLowerCase()))
  if (query.phone) rows = rows.filter(r => r.phone && r.phone.toLowerCase().includes(query.phone.toLowerCase()))
  if (query.status) rows = rows.filter(r => r.status === query.status)
  if (query.remark) rows = rows.filter(r => r.remark && r.remark.toLowerCase().includes(query.remark.toLowerCase()))
  return rows
})

const doFilter = () => {}
const resetFilter = () => {
  Object.keys(query).forEach(k => query[k] = '')
}
const doRefresh = () => {
  loadData()
  resetFilter()
}

const isFiltered = computed(() => {
  return Object.values(query).some(v => v !== '' && v != null)
})

const emptyForm = () => ({ code: '', name: '', parentCode: '', type: '', contact: '', phone: '', status: '正常', remark: '' })
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
  if (!form.code.trim()) { ElMessage.warning('请输入组织ID'); return }
  if (!form.name.trim()) { ElMessage.warning('请输入组织名称'); return }
  saving.value = true
  try {
    const data = { ...form }
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
    await ElMessageBox.confirm('确认删除该组织？', '提示', { type: 'warning' })
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

.filter-box {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f0f4fa 0%, #f7f9fc 50%, #fafbfd 100%);
  border: 1px solid #d4dde8;
  border-left: 4px solid #1e88e5;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(10,22,40,0.04);
  padding: 0;
  overflow: hidden;
}
.filter-box__title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: rgba(30,136,229,0.06);
  border-bottom: 1px solid #e0e7f0;
  font-size: 12px;
  font-weight: 700;
  color: #1e3a5c;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 20px;
  padding: 16px 20px 8px;
}
.filter-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-cell__label {
  font-size: 11px;
  font-weight: 600;
  color: #7c8799;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-actions {
  padding: 6px 20px 14px;
  display: flex;
  gap: 8px;
}

.table-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.table-section__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #e8ecf1;
}
.table-section__count {
  flex: 1;
  font-size: 13px;
  color: #5f6b7a;
}
.table-section__count strong {
  color: #1e88e5;
  font-weight: 700;
}
</style>
