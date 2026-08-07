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
        <el-table-column prop="code" label="通知书代码" width="130" />
        <el-table-column prop="source" label="通知来源" width="100" />
        <el-table-column prop="fullName" label="全称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="shortName" label="简称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="category" label="业务大类" width="100" />
        <el-table-column prop="deadlineMonths" label="答复期限(月)" width="120">
          <template #default="{ row }">{{ row.deadlineMonths ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="extendable" label="可延期" width="80" />
        <el-table-column prop="formNo" label="表格编号" width="130">
          <template #default="{ row }">{{ row.formNo || '-' }}</template>
        </el-table-column>
        <el-table-column prop="riskLevel" label="风险等级" width="90">
          <template #default="{ row }">
            <el-tag :type="riskTag(row.riskLevel)" size="small">{{ row.riskLevel || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="internalDays" label="内部时限(天)" width="120">
          <template #default="{ row }">{{ row.internalDays ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="remindDay1" label="提醒一(天)" width="110">
          <template #default="{ row }">{{ row.remindDay1 ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="remindDay2" label="提醒二(天)" width="110">
          <template #default="{ row }">{{ row.remindDay2 ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="predecessor" label="前置关联代码" width="140">
          <template #default="{ row }">{{ row.predecessor || '-' }}</template>
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
    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑条目' : '新增条目'" width="580px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="130px">
        <el-form-item label="通知书代码" required>
          <el-input v-model="form.code" :disabled="dialog.isEdit" placeholder="6位代码" />
        </el-form-item>
        <el-form-item label="通知来源" required>
          <el-select v-model="form.source" style="width:100%">
            <el-option label="中国专利" value="中国专利" />
            <el-option label="PCT专利" value="PCT专利" />
            <el-option label="他国专利" value="他国专利" />
          </el-select>
        </el-form-item>
        <el-form-item label="全称" required>
          <el-input v-model="form.fullName" placeholder="通知书全称" />
        </el-form-item>
        <el-form-item label="简称" required>
          <el-input v-model="form.shortName" placeholder="通知书简称" />
        </el-form-item>
        <el-form-item label="业务大类">
          <el-input v-model="form.category" placeholder="业务大类" />
        </el-form-item>
        <el-form-item label="法定答复期限(月)">
          <el-input-number v-model="form.deadlineMonths" :min="0" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="是否可延长期限">
          <el-select v-model="form.extendable" style="width:100%">
            <el-option label="是" value="是" />
            <el-option label="否" value="否" />
          </el-select>
        </el-form-item>
        <el-form-item label="配套答复表格编号">
          <el-input v-model="form.formNo" placeholder="表格编号" />
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="form.riskLevel" style="width:100%">
            <el-option label="低" value="低" />
            <el-option label="中" value="中" />
            <el-option label="高" value="高" />
          </el-select>
        </el-form-item>
        <el-form-item label="内部处理时限(天)">
          <el-input-number v-model="form.internalDays" :min="0" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="第一次提醒(天)">
          <el-input-number v-model="form.remindDay1" :min="0" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="第二次提醒(天)">
          <el-input-number v-model="form.remindDay2" :min="0" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="前置关联通知书代码">
          <el-input v-model="form.predecessor" placeholder="前置关联代码" />
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
import { noticeData as staticData } from '../../data/noticeDictionary'

const STORAGE_KEY = 'patent_notice_dictionary'

const riskTag = (level) => ({ 低: 'info', 中: 'warning', 高: 'danger' }[level] || 'info')

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const selected = ref([])
const filterFields = [
  { key: 'code', label: '通知书代码', type: 'input', placeholder: '如 001' },
  { key: 'source', label: '通知来源', type: 'select', options: ['中国专利', 'PCT专利', '他国专利'] },
  { key: 'fullName', label: '全称', type: 'input', placeholder: '全称关键词' },
  { key: 'shortName', label: '简称', type: 'input', placeholder: '简称关键词' },
  { key: 'category', label: '业务大类', type: 'input', placeholder: '业务大类' },
  { key: 'extendable', label: '可延期', type: 'select', options: ['是', '否'] },
  { key: 'formNo', label: '表格编号', type: 'input', placeholder: '表格编号' },
  { key: 'riskLevel', label: '风险等级', type: 'select', options: ['低', '中', '高'] },
  { key: 'predecessor', label: '前置代码', type: 'input', placeholder: '前置关联代码' },
  { key: 'remark', label: '备注', type: 'input', placeholder: '备注信息' }
]

const query = reactive({
  code: '', source: '', fullName: '', shortName: '', category: '',
  extendable: '', formNo: '', riskLevel: '', predecessor: '', remark: ''
})
const dialog = reactive({ visible: false, isEdit: false, index: -1 })

// 逐字段 AND 过滤
const filteredData = computed(() => {
  let rows = tableData.value
  if (query.code) rows = rows.filter(r => r.code && r.code.toLowerCase().includes(query.code.toLowerCase()))
  if (query.source) rows = rows.filter(r => r.source === query.source)
  if (query.fullName) rows = rows.filter(r => r.fullName && r.fullName.toLowerCase().includes(query.fullName.toLowerCase()))
  if (query.shortName) rows = rows.filter(r => r.shortName && r.shortName.toLowerCase().includes(query.shortName.toLowerCase()))
  if (query.category) rows = rows.filter(r => r.category && r.category.toLowerCase().includes(query.category.toLowerCase()))
  if (query.extendable) rows = rows.filter(r => r.extendable === query.extendable)
  if (query.formNo) rows = rows.filter(r => r.formNo && r.formNo.toLowerCase().includes(query.formNo.toLowerCase()))
  if (query.riskLevel) rows = rows.filter(r => r.riskLevel === query.riskLevel)
  if (query.predecessor) rows = rows.filter(r => r.predecessor && r.predecessor.toLowerCase().includes(query.predecessor.toLowerCase()))
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
  source: '中国专利', code: '', fullName: '', shortName: '', category: '',
  deadlineMonths: null, extendable: '否', formNo: '', riskLevel: '低',
  internalDays: null, remindDay1: null, remindDay2: null, predecessor: ''
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
  if (!form.code.trim()) { ElMessage.warning('请输入通知书代码'); return }
  if (!form.fullName.trim()) { ElMessage.warning('请输入全称'); return }
  if (!form.shortName.trim()) { ElMessage.warning('请输入简称'); return }
  saving.value = true
  try {
    const data = { ...form, deadlineMonths: form.deadlineMonths || null, internalDays: form.internalDays || null, remindDay1: form.remindDay1 || null, remindDay2: form.remindDay2 || null }
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
    await ElMessageBox.confirm('确认删除该条目？', '提示', { type: 'warning' })
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
