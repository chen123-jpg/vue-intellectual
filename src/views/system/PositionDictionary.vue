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
import { Search, Refresh } from '@element-plus/icons-vue'
import { positionData as staticData } from '../../data/positionDictionary'

const STORAGE_KEY = 'dict_position'

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const selected = ref([])
const filterFields = [
  { key: 'code', label: '岗位编号', type: 'input', placeholder: '如 POST001' },
  { key: 'fullName', label: '岗位全称', type: 'input', placeholder: '岗位标准全称' },
  { key: 'shortName', label: '岗位简称', type: 'input', placeholder: '岗位简称' },
  { key: 'department', label: '所属部门', type: 'input', placeholder: '所属部门' },
  { key: 'category', label: '岗位大类', type: 'select', options: ['决策层', '管理层', '专业技术岗', '试用岗', '职能支持岗'] },
  { key: 'superiorPost', label: '上级岗位', type: 'input', placeholder: '直接上级岗位' },
  { key: 'needCert', label: '代理师资格', type: 'select', options: ['是', '否'] },
  { key: 'isManager', label: '管理岗', type: 'select', options: ['是', '否'] },
  { key: 'effectiveDate', label: '生效日期', type: 'input', placeholder: '如 2026-01-01' },
  { key: 'headcount', label: '编制数', type: 'input', placeholder: '岗位编制数量' },
  { key: 'responsibilities', label: '职责', type: 'input', placeholder: '核心岗位职责关键词', span: 2 },
  { key: 'remark', label: '备注', type: 'input', placeholder: '备注信息' }
]

const query = reactive({
  code: '', fullName: '', shortName: '', department: '', category: '',
  superiorPost: '', needCert: '', isManager: '', effectiveDate: '',
  headcount: '', responsibilities: '', remark: ''
})
const dialog = reactive({ visible: false, isEdit: false, index: -1 })

// 逐字段 AND 过滤
const filteredData = computed(() => {
  let rows = tableData.value
  if (query.code) rows = rows.filter(r => r.code && r.code.toLowerCase().includes(query.code.toLowerCase()))
  if (query.fullName) rows = rows.filter(r => r.fullName && r.fullName.toLowerCase().includes(query.fullName.toLowerCase()))
  if (query.shortName) rows = rows.filter(r => r.shortName && r.shortName.toLowerCase().includes(query.shortName.toLowerCase()))
  if (query.department) rows = rows.filter(r => r.department && r.department.toLowerCase().includes(query.department.toLowerCase()))
  if (query.category) rows = rows.filter(r => r.category === query.category)
  if (query.superiorPost) rows = rows.filter(r => r.superiorPost && r.superiorPost.toLowerCase().includes(query.superiorPost.toLowerCase()))
  if (query.needCert) rows = rows.filter(r => r.needCert === query.needCert)
  if (query.isManager) rows = rows.filter(r => r.isManager === query.isManager)
  if (query.effectiveDate) rows = rows.filter(r => r.effectiveDate && r.effectiveDate.includes(query.effectiveDate))
  if (query.headcount) rows = rows.filter(r => String(r.headcount).includes(query.headcount))
  if (query.responsibilities) rows = rows.filter(r => r.responsibilities && r.responsibilities.toLowerCase().includes(query.responsibilities.toLowerCase()))
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
