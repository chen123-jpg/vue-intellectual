<template>
  <div class="page">
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="客户ID">
          <el-input v-model="query.code" placeholder="客户ID" clearable style="width:120px" />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="query.name" placeholder="客户名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select v-model="query.type" placeholder="客户类型" clearable style="width:120px">
            <el-option label="单位客户" value="单位客户" />
            <el-option label="自然人客户" value="自然人客户" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户状态">
          <el-select v-model="query.status" placeholder="客户状态" clearable style="width:100px">
            <el-option label="正常" value="正常" />
            <el-option label="停用" value="停用" />
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
        <el-table-column prop="code" label="客户ID" width="100" />
        <el-table-column prop="type" label="客户类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === '单位客户' ? 'primary' : 'warning'" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="客户名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="identityCode" label="身份识别代码" min-width="180" show-overflow-tooltip />
        <el-table-column prop="nature" label="客户性质" width="140" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="address" label="客户地址" min-width="160" show-overflow-tooltip />
        <el-table-column prop="status" label="客户状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="firstCoopDate" label="首次合作时间" width="120" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip>
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

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑客户' : '新增客户'" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="160px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户ID" required>
              <el-input v-model="form.code" :disabled="dialog.isEdit" placeholder="如 CUS005" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户类型" required>
              <el-select v-model="form.type" style="width:100%">
                <el-option label="单位客户" value="单位客户" />
                <el-option label="自然人客户" value="自然人客户" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="客户名称" required>
          <el-input v-model="form.name" placeholder="客户名称" />
        </el-form-item>
        <el-form-item label="身份识别代码">
          <el-input v-model="form.identityCode" placeholder="身份识别代码（统一社会信用代码/身份证号）" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户性质">
              <el-select v-model="form.nature" style="width:100%">
                <el-option label="1-个人" value="1-个人" />
                <el-option label="2-事业单位" value="2-事业单位" />
                <el-option label="3-股份有限公司" value="3-股份有限公司" />
                <el-option label="4-有限责任公司" value="4-有限责任公司" />
                <el-option label="5-其他" value="5-其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法定代表人">
              <el-input v-model="form.legalRep" placeholder="法定代表人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="管理人员">
          <el-input v-model="form.managers" placeholder="管理人员信息" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="管理人员数量">
              <el-input-number v-model="form.managerCount" :min="0" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="允许非管理员注册">
              <el-select v-model="form.allowNonManagerReg" style="width:100%">
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="form.contact" placeholder="联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.phone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="客户地址">
          <el-input v-model="form.address" placeholder="客户地址" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户状态">
              <el-select v-model="form.status" style="width:100%">
                <el-option label="正常" value="正常" />
                <el-option label="停用" value="停用" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="首次合作时间">
              <el-date-picker v-model="form.firstCoopDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
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
import { customerData as staticData } from '../../data/customerDictionary'

const STORAGE_KEY = 'dict_customer'
const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const selected = ref([])
const query = reactive({ code: '', name: '', type: '', status: '' })
const dialog = reactive({ visible: false, isEdit: false, index: -1 })

const filteredData = computed(() => {
  let rows = tableData.value
  if (query.code) rows = rows.filter(r => r.code && r.code.toLowerCase().includes(query.code.toLowerCase()))
  if (query.name) rows = rows.filter(r => r.name && r.name.includes(query.name))
  if (query.type) rows = rows.filter(r => r.type && r.type === query.type)
  if (query.status) rows = rows.filter(r => r.status && r.status === query.status)
  return rows
})

const doSearch = () => {}
const resetSearch = () => { query.code = ''; query.name = ''; query.type = ''; query.status = '' }

const emptyForm = () => ({
  code: '', type: '单位客户', name: '', identityCode: '', nature: '', legalRep: '',
  managers: '', managerCount: 0, allowNonManagerReg: '否', contact: '', phone: '',
  address: '', status: '正常', firstCoopDate: '', remark: ''
})
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
  if (!form.code.trim()) { ElMessage.warning('请输入客户ID'); return }
  if (!form.name.trim()) { ElMessage.warning('请输入客户名称'); return }
  saving.value = true
  try {
    const data = { ...form, managerCount: form.managerCount || 0 }
    if (dialog.isEdit && dialog.index >= 0) { tableData.value[dialog.index] = { ...tableData.value[dialog.index], ...data }; ElMessage.success('修改成功') }
    else { tableData.value.push(data); ElMessage.success('新增成功') }
    persist(); dialog.visible = false
  } finally { saving.value = false }
}
const deleteRow = async (idx) => {
  const row = filteredData.value[idx]
  try {
    await ElMessageBox.confirm('确认删除该客户？', '提示', { type: 'warning' })
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
.search-form { margin-bottom: 4px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
</style>
