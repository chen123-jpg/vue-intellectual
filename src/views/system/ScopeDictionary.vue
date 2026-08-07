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
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row, $index }">
            <el-button size="small" type="primary" link @click="openEdit($index)">编辑</el-button>
            <el-button size="small" type="danger" link @click="deleteRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
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
import { Search, Refresh } from '@element-plus/icons-vue'
import { scopeData as staticData } from '../../data/scopeDictionary'

const STORAGE_KEY = 'dict_scope'

const scopeTag = (s) => ({ '全部数据': 'primary', '本组织数据': 'warning', '本人数据': 'info', '客户专属数据': 'success' }[s] || 'info')
const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const selected = ref([])
const filterFields = [
  { key: 'code', label: '权限ID', type: 'input', placeholder: '如 SCOPE010' },
  { key: 'roleId', label: '角色ID', type: 'input', placeholder: '如 ROLE001' },
  { key: 'scope', label: '权限范围', type: 'select', options: ['全部数据', '本组织数据', '本人数据', '客户专属数据'] },
  { key: 'description', label: '范围说明', type: 'input', placeholder: '范围说明关键词' },
  { key: 'createTime', label: '创建时间', type: 'input', placeholder: '如 2026-01-01' },
  { key: 'remark', label: '备注', type: 'input', placeholder: '备注信息' }
]

const query = reactive({
  code: '', roleId: '', scope: '', description: '', createTime: '', remark: ''
})
const dialog = reactive({ visible: false, isEdit: false, index: -1 })

// 逐字段 AND 过滤
const filteredData = computed(() => {
  let rows = tableData.value
  if (query.code) rows = rows.filter(r => r.code && r.code.toLowerCase().includes(query.code.toLowerCase()))
  if (query.roleId) rows = rows.filter(r => r.roleId && r.roleId.toLowerCase().includes(query.roleId.toLowerCase()))
  if (query.scope) rows = rows.filter(r => r.scope === query.scope)
  if (query.description) rows = rows.filter(r => r.description && r.description.toLowerCase().includes(query.description.toLowerCase()))
  if (query.createTime) rows = rows.filter(r => r.createTime && r.createTime.includes(query.createTime))
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
