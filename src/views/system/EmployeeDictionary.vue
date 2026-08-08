<template>
  <div class="page">
    <el-card>
      <!-- 筛选面板 -->
      <div class="filter-box">
        <div class="filter-box__title">
          <el-icon :size="15"><Search /></el-icon>
          <span>筛选条件</span>
        </div>
        <div class="filter-grid" style="grid-template-columns: repeat(4, 1fr)">
          <div class="filter-cell" v-for="f in filterFields" :key="f.key">
            <label class="filter-cell__label">{{ f.label }}</label>
            <el-input v-if="f.type === 'input'" v-model="query[f.key]" clearable @keyup.enter="doFilter" @clear="doFilter" />
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
        <el-table-column prop="code" label="员工编号" width="100" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="company" label="就职单位" min-width="200" show-overflow-tooltip />
        <el-table-column prop="postCode" label="岗位编号" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="工作邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="entryDate" label="入职时间" width="110" />
        <el-table-column prop="isOrgAgent" label="本机构执业代理师" width="140">
          <template #default="{ row }">
            <el-tag :type="row.isOrgAgent === '是' ? 'success' : 'info'" size="small">{{ row.isOrgAgent }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verificationStatus" label="实名核验状态" width="110">
          <template #default="{ row }">
            <el-tag :type="verificationTag(row.verificationStatus)" size="small">{{ row.verificationStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row, $index }">
            <el-button size="small" type="primary" link @click="openEdit($index)">编辑</el-button>
            <el-button size="small" type="danger" link @click="deleteRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑员工' : '新增员工'" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="170px">
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="员工编号" required>
              <el-input v-model="form.code" :disabled="dialog.isEdit" placeholder="如 EMP008" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" required>
              <el-select v-model="form.status" style="width:100%">
                <el-option label="1-试用" value="1-试用" />
                <el-option label="2-在职" value="2-在职" />
                <el-option label="3-休假/停薪留职" value="3-休假/停薪留职" />
                <el-option label="4-待离职" value="4-待离职" />
                <el-option label="5-已离职" value="5-已离职" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="form.name" placeholder="姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="form.gender" style="width:100%">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-date-picker v-model="form.birthDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" required>
              <el-input v-model="form.phone" placeholder="手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="身份证号">
              <el-input v-model="form.idCard" placeholder="身份证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="籍贯">
              <el-input v-model="form.nativePlace" placeholder="籍贯" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="居住地">
              <el-input v-model="form.residence" placeholder="居住地" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="快递地址">
              <el-input v-model="form.address" placeholder="快递地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 工作信息 -->
        <el-divider content-position="left">工作信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="就职单位">
              <el-input v-model="form.company" placeholder="就职单位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位编号">
              <el-input v-model="form.postCode" placeholder="岗位编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="入职时间">
              <el-date-picker v-model="form.entryDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="离职时间">
              <el-date-picker v-model="form.leaveDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="工作邮箱">
          <el-input v-model="form.email" placeholder="工作邮箱" />
        </el-form-item>

        <!-- 学历信息 -->
        <el-divider content-position="left">学历信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="最高学历">
              <el-select v-model="form.education" style="width:100%">
                <el-option label="高中" value="高中" />
                <el-option label="大专" value="大专" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
                <el-option label="博士" value="博士" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专业">
              <el-input v-model="form.major" placeholder="专业" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="毕业时间">
          <el-date-picker v-model="form.graduationDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
        </el-form-item>

        <!-- 资质证书 -->
        <el-divider content-position="left">资质证书</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="代理师资格证编号">
              <el-input v-model="form.certNo" placeholder="资格证编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资格证获取时间">
              <el-date-picker v-model="form.certDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="代理师执业证号">
              <el-input v-model="form.practiceNo" placeholder="执业证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="首次执业时间">
              <el-date-picker v-model="form.firstPracticeDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="执业专业">
              <el-input v-model="form.practiceField" placeholder="执业专业" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="本机构执业代理师">
              <el-select v-model="form.isOrgAgent" style="width:100%">
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="法律职业资格证号">
              <el-input v-model="form.lawCertNo" placeholder="法律职业资格证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法律职业资格证时间">
              <el-date-picker v-model="form.lawCertDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 其他 -->
        <el-divider content-position="left">其他</el-divider>
        <el-form-item label="实名核验状态">
          <el-select v-model="form.verificationStatus" style="width:100%">
            <el-option label="未核验" value="未核验" />
            <el-option label="已核验" value="已核验" />
            <el-option label="核验中" value="核验中" />
          </el-select>
        </el-form-item>
        <el-form-item label="证件">
          <el-input v-model="form.documents" placeholder="证件信息" />
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
import { employeeData as staticData } from '../../data/employeeDictionary'

const STORAGE_KEY = 'dict_employee'

const filterFields = [
  { key: 'code', label: '员工编号', type: 'input' },
  { key: 'name', label: '姓名', type: 'input' },
  { key: 'status', label: '状态', type: 'select', options: ['1-试用', '2-在职', '3-休假/停薪留职', '4-待离职', '5-已离职'] },
  { key: 'gender', label: '性别', type: 'select', options: ['男', '女'] },
  { key: 'company', label: '就职单位', type: 'input' },
  { key: 'postCode', label: '岗位编号', type: 'input' },
  { key: 'phone', label: '手机号', type: 'input' },
  { key: 'email', label: '工作邮箱', type: 'input' },
  { key: 'education', label: '最高学历', type: 'select', options: ['高中', '大专', '本科', '硕士', '博士'] },
  { key: 'major', label: '专业', type: 'input' },
  { key: 'isOrgAgent', label: '本机构执业代理师', type: 'select', options: ['是', '否'] },
  { key: 'verificationStatus', label: '实名核验状态', type: 'select', options: ['未核验', '已核验', '核验中'] },
  { key: 'idCard', label: '身份证号', type: 'input' },
  { key: 'nativePlace', label: '籍贯', type: 'input' },
  { key: 'entryDate', label: '入职时间', type: 'input' },
  { key: 'remark', label: '备注', type: 'input' }
]

const statusTag = (s) => {
  const m = { '1-试用': 'warning', '2-在职': 'success', '3-休假/停薪留职': 'info', '4-待离职': 'danger', '5-已离职': 'info' }
  return m[s] || 'info'
}
const verificationTag = (s) => ({ '未核验': 'warning', '已核验': 'success', '核验中': 'info' }[s] || 'info')

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const selected = ref([])
const query = reactive({
  code: '', name: '', status: '', gender: '', company: '', postCode: '', phone: '', email: '',
  education: '', major: '', isOrgAgent: '', verificationStatus: '', idCard: '', nativePlace: '', entryDate: '', remark: ''
})
const dialog = reactive({ visible: false, isEdit: false, index: -1 })

const filteredData = computed(() => {
  let rows = tableData.value
  const q = query
  if (q.code) rows = rows.filter(r => r.code && r.code.toLowerCase().includes(q.code.toLowerCase()))
  if (q.name) rows = rows.filter(r => r.name && r.name.toLowerCase().includes(q.name.toLowerCase()))
  if (q.status) rows = rows.filter(r => r.status === q.status)
  if (q.gender) rows = rows.filter(r => r.gender === q.gender)
  if (q.company) rows = rows.filter(r => r.company && r.company.toLowerCase().includes(q.company.toLowerCase()))
  if (q.postCode) rows = rows.filter(r => r.postCode && r.postCode.toLowerCase().includes(q.postCode.toLowerCase()))
  if (q.phone) rows = rows.filter(r => r.phone && r.phone.includes(q.phone))
  if (q.email) rows = rows.filter(r => r.email && r.email.toLowerCase().includes(q.email.toLowerCase()))
  if (q.education) rows = rows.filter(r => r.education === q.education)
  if (q.major) rows = rows.filter(r => r.major && r.major.toLowerCase().includes(q.major.toLowerCase()))
  if (q.isOrgAgent) rows = rows.filter(r => r.isOrgAgent === q.isOrgAgent)
  if (q.verificationStatus) rows = rows.filter(r => r.verificationStatus === q.verificationStatus)
  if (q.idCard) rows = rows.filter(r => r.idCard && r.idCard.includes(q.idCard))
  if (q.nativePlace) rows = rows.filter(r => r.nativePlace && r.nativePlace.toLowerCase().includes(q.nativePlace.toLowerCase()))
  if (q.entryDate) rows = rows.filter(r => r.entryDate && r.entryDate.includes(q.entryDate))
  if (q.remark) rows = rows.filter(r => r.remark && r.remark.toLowerCase().includes(q.remark.toLowerCase()))
  return rows
})

const isFiltered = computed(() => Object.values(query).some(v => v !== '' && v != null))

const doFilter = () => {}
const resetFilter = () => { Object.keys(query).forEach(k => query[k] = '') }
const doRefresh = () => { loadData(); resetFilter() }

const emptyForm = () => ({
  code: '', status: '2-在职', name: '', gender: '', birthDate: '',
  address: '', idCard: '', nativePlace: '', residence: '', phone: '',
  company: 'XX知识产权代理有限公司（总公司）', postCode: '', entryDate: '', leaveDate: null,
  email: '', education: '', major: '', graduationDate: '',
  certNo: '', certDate: '', practiceNo: '', firstPracticeDate: '', practiceField: '',
  isOrgAgent: '否', lawCertNo: '', lawCertDate: '',
  verificationStatus: '未核验', documents: '', remark: ''
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
  if (!form.code.trim()) { ElMessage.warning('请输入员工编号'); return }
  if (!form.name.trim()) { ElMessage.warning('请输入姓名'); return }
  if (!form.phone.trim()) { ElMessage.warning('请输入手机号'); return }
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
    await ElMessageBox.confirm('确认删除该员工信息？', '提示', { type: 'warning' })
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
