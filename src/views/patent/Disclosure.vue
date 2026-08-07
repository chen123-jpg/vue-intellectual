<template>
  <div class="page">
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="交底名称">
          <el-input v-model="query.disclosureName" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="内部编号">
          <el-input v-model="query.internalNo" placeholder="精确搜索" clearable />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="query.applicant" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="主办人">
          <el-input v-model="query.sponsor" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="发明人">
          <el-input v-model="query.inventor" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="指导人">
          <el-input v-model="query.mentor" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="业务人员">
          <el-input v-model="query.businessPersonnel" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button v-if="hasPerm('patent:disclosure:add')" type="primary" @click="openAdd">新增</el-button>
        <el-button v-if="hasPerm('patent:disclosure:delete')" type="danger" :disabled="!selected.length" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="tempNo" label="临时编号" width="120" />
        <el-table-column prop="internalNo" label="内部编号" width="120" />
        <el-table-column prop="disclosureName" label="交底名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="patentType" label="专利类型" width="100" />
        <el-table-column prop="patentStatus" label="专利状态" width="100" />
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column prop="inventor" label="发明人" width="100" />
        <el-table-column prop="sponsor" label="主办人" width="100" />
        <el-table-column prop="agent" label="代理人" width="100" />
        <el-table-column prop="mentor" label="指导人" min-width="180" show-overflow-tooltip />
        <el-table-column prop="businessPersonnel" label="业务人员" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPerm('patent:disclosure:edit')" size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="hasPerm('patent:disclosure:delete')" size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
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
      :title="dialog.isEdit ? '编辑专利交底' : '新增专利交底'"
      width="700px"
      destroy-on-close
      :before-close="handleDialogBeforeClose"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="内部编号"><el-input v-model="form.internalNo" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利状态"><el-input v-model="form.patentStatus" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交底名称" required><el-input v-model="form.disclosureName" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利类型"><el-select v-model="form.patentType" style="width:100%"><el-option label="发明" value="发明" /><el-option label="实用新型" value="实用新型" /><el-option label="外观" value="外观" /></el-select></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人"><ApplicantAgentSelect v-model="form.applicant" type="applicant" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发明人"><el-input v-model="form.inventor" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人"><el-input v-model="form.contactPerson" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主办人"><el-input v-model="form.sponsor" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="代理人"><ApplicantAgentSelect v-model="form.agent" type="agent" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指导人"><el-input v-model.trim="form.mentor" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务人员"><el-input v-model.trim="form.businessPersonnel" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交底日期"><el-date-picker v-model="form.disclosureDate" type="date" style="width:100%" value-format="YYYY-MM-DD" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="要求"><el-input v-model="form.requirement" /></el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">附件管理</el-divider>
        <DisclosureAttachmentEditor
          :disclosure-id="dialog.isEdit ? form.id : null"
          v-model:document-file="disclosureDocument"
          v-model:other-files="otherAttachments"
        />
      </el-form>
      <template #footer>
        <el-button @click="handleDialogCancel">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, getById, create, update, remove, batchRemove } from '../../api/ttable'
import ApplicantAgentSelect from '../../components/ApplicantAgentSelect.vue'
import DisclosureAttachmentEditor from '../../components/DisclosureAttachmentEditor.vue'
import { useDialogAddDraft } from '../../composables/useFormDraft'
import { useUserStore } from '../../stores/user'

const { state } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

const tableData = ref([])
const selected = ref([])
const loading = ref(false)
const saving = ref(false)
const disclosureDocument = ref(null)
const otherAttachments = ref([])

const query = reactive({
  disclosureName: '',
  patentType: '',
  patentStatus: '',
  internalNo: '',
  applicant: '',
  sponsor: '',
  inventor: '',
  mentor: '',
  businessPersonnel: ''
})
const page = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const dialog = reactive({ visible: false, isEdit: false })
const emptyForm = () => ({
  id: null, internalNo: '', patentStatus: '', disclosureName: '', patentType: '',
  applicant: '', inventor: '', contactPerson: '', sponsor: '', agent: '', mentor: '', businessPersonnel: '',
  disclosureDate: '', requirement: '', remark: '',
  _hasLocalDocument: false, _otherAttachmentCount: 0
})
const form = reactive(emptyForm())
const addDraft = useDialogAddDraft('patent-disclosure-add', {
  getEmptyData: emptyForm,
  getCurrentData: () => ({
    ...form,
    _hasLocalDocument: !!disclosureDocument.value,
    _otherAttachmentCount: otherAttachments.value.length
  }),
  reset: () => {
    Object.assign(form, emptyForm())
    disclosureDocument.value = null
    otherAttachments.value = []
  },
  applyData: (data) => {
    const { _hasLocalDocument, _otherAttachmentCount, ...draftForm } = data
    Object.assign(form, { ...emptyForm(), ...draftForm })
    disclosureDocument.value = null
    otherAttachments.value = []
  },
  onRestored: (data) => {
    if (data._hasLocalDocument || data._otherAttachmentCount) {
      ElMessage.warning('暂存只恢复了表单内容，本地附件需要重新选择')
    }
  },
  closeSavedMessage: '已暂存，下次可继续填写；本地附件需要重新选择'
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize, ...query }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const res = await getList(params)
    if (res.code === 200) {
      console.log('fetchData sample record:', res.data.records && res.data.records[0])
      tableData.value = res.data.records || []
      page.total = res.data.total || 0
    }
  } finally { loading.value = false }
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

const openEdit = async (row) => {
  try {
    const res = await getById(row.id)
    if (res.code === 200) {
      Object.assign(form, res.data)
      disclosureDocument.value = null
      otherAttachments.value = []
      dialog.isEdit = true
      dialog.visible = true
    }
  } catch { /* handled */ }
}

const handleSave = async () => {
  if (!dialog.isEdit && !disclosureDocument.value) {
    ElMessage.warning('请选择一份 Word 格式的交底书')
    return
  }
  saving.value = true
  try {
    const { _hasLocalDocument, _otherAttachmentCount, ...payload } = form
    const res = dialog.isEdit
      ? await update(payload)
      : await create(payload, disclosureDocument.value, otherAttachments.value)
    if (res.code === 200) {
      if (!dialog.isEdit) addDraft.clear()
      ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
      dialog.visible = false
      fetchData()
    }
  } finally { saving.value = false }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该记录？', '提示', { type: 'warning' })
    const res = await remove(id)
    if (res.code === 200) { ElMessage.success('删除成功'); fetchData() }
  } catch { /* cancelled */ }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' })
    const res = await batchRemove(selected.value.map(r => r.id))
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

onMounted(() => fetchData())
</script>

<style scoped>
.page { max-width: 1600px; }
.search-form { margin-bottom: 8px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
