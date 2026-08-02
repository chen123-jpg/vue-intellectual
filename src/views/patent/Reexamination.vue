<template>
  <div class="page">
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="专利名称"><el-input v-model="query.patentName" placeholder="模糊搜索" clearable /></el-form-item>
        <el-form-item label="申请号"><el-input v-model="query.applicationNo" placeholder="精确搜索" clearable /></el-form-item>
        <el-form-item label="专利类型">
          <el-select v-model="query.patentType" placeholder="全部" clearable>
            <el-option label="发明" value="发明" />
            <el-option label="实用新型" value="实用新型" />
            <el-option label="外观" value="外观" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.category" placeholder="全部" clearable>
            <el-option label="复审" value="复审" />
            <el-option label="无效" value="无效" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态"><el-input v-model="query.status" placeholder="精确搜索" clearable /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button v-if="hasPerm('patent:reexamination:add')" type="primary" @click="openAdd">新增</el-button>
        <el-button v-if="hasPerm('patent:reexamination:delete')" type="danger" :disabled="!selected.length" @click="handleBatchDelete">批量删除</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="patentType" label="类型" width="90" />
        <el-table-column prop="category" label="分类" width="80" />
        <el-table-column prop="caseNo" label="案件编号" width="120" />
        <el-table-column prop="internalNo" label="内部编号" width="120" />
        <el-table-column prop="applicationNo" label="申请号" width="150" />
        <el-table-column prop="patentName" label="专利名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="applicant" label="申请人" width="140" />
        <el-table-column prop="sponsor" label="主办人" width="100" />
        <el-table-column prop="agent" label="代理人" width="100" />
        <el-table-column label="通知书" width="160">
          <template #default="{ row }">
            <span v-if="row.notification" class="file-link" @click="downloadFile(row.notification)">
              {{ parseFileName(row.notification) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="issueDate" label="发文日" width="110" :formatter="(_,__,v) => formatDate(v)" />
        <el-table-column prop="submitDate" label="提交日期" width="110" :formatter="(_,__,v) => formatDate(v)" />
        <el-table-column prop="officialFee" label="规费" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPerm('patent:reexamination:edit')" size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="hasPerm('patent:reexamination:delete')" size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page.pageNum" v-model:page-size="page.pageSize"
        :total="page.total" :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next" @size-change="fetchData" @current-change="fetchData"
        class="pagination"
      />
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑复审无效' : '新增复审无效'"
      width="750px"
      destroy-on-close
      :before-close="handleDialogBeforeClose"
    >
      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="专利类型"><el-select v-model="form.patentType" style="width:100%"><el-option label="发明" value="发明" /><el-option label="实用新型" value="实用新型" /><el-option label="外观" value="外观" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="分类"><el-select v-model="form.category" style="width:100%"><el-option label="复审" value="复审" /><el-option label="无效" value="无效" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="案件编号"><el-input v-model="form.caseNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="内部编号"><el-input v-model="form.internalNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="申请号"><el-input v-model="form.applicationNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="专利名称" required><el-input v-model="form.patentName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="申请人"><ApplicantAgentSelect v-model="form.applicant" type="applicant" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="主办人"><el-input v-model="form.sponsor" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="代理人"><ApplicantAgentSelect v-model="form.agent" type="agent" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="发文日"><el-date-picker v-model="form.issueDate" type="date" style="width:100%" value-format="YYYY-MM-DD" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="提交日期"><el-date-picker v-model="form.submitDate" type="date" style="width:100%" value-format="YYYY-MM-DD" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="规费"><el-input v-model="form.officialFee" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="缴费时间"><el-input v-model="form.paymentDate" /></el-form-item></el-col>
          <el-col :span="24">
            <el-form-item label="通知书">
              <div class="upload-row">
                <el-upload :show-file-list="false" :http-request="handleUpload" :before-upload="beforeUpload" action="#">
                  <el-button type="primary" :loading="uploading">上传文件</el-button>
                </el-upload>
                <template v-if="form.notification">
                  <span class="upload-name">{{ parseFileName(form.notification) }}</span>
                  <el-button size="small" type="danger" :icon="Delete" circle @click="form.notification = ''" />
                </template>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogCancel">取消</el-button>
        <el-button v-if="!dialog.isEdit" @click="handleSaveDraft">暂存</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import api from '../../api/ptable'
import ApplicantAgentSelect from '../../components/ApplicantAgentSelect.vue'
import { uploadFile } from '../../api/mail'
import { useDialogAddDraft } from '../../composables/useFormDraft'
import { parseFileName, downloadFile, formatDate } from '../../utils/format'
import { useUserStore } from '../../stores/user'

const moduleApi = api['reexamination']
const { state } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

const tableData = ref([])
const selected = ref([])
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)

const query = reactive({ patentName: '', applicationNo: '', patentType: '', category: '', status: '' })
const page = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const dialog = reactive({ visible: false, isEdit: false })
const emptyForm = () => ({
  id: null, patentType: '', category: '', caseNo: '', internalNo: '',
  applicationNo: '', patentName: '', applicant: '', sponsor: '', agent: '',
  officialFee: '', paymentDate: '', notification: '', issueDate: '', submitDate: ''
})
const form = reactive(emptyForm())
const addDraft = useDialogAddDraft('patent-reexamination-add', {
  getEmptyData: emptyForm,
  getCurrentData: () => ({ ...form }),
  reset: () => Object.assign(form, emptyForm()),
  applyData: (data) => Object.assign(form, { ...emptyForm(), ...data }),
  onRestored: (data) => {
    if (data.notification) ElMessage.warning('通知书附件链接已恢复，本地未上传文件需要重新选择')
  },
  closeSavedMessage: '已暂存，下次可继续填写；若有本地未上传附件需重新选择'
})

const beforeUpload = (file) => {
  if (file.size > 10 * 1024 * 1024) { ElMessage.warning('文件超过 10MB 限制'); return false }
  return true
}

const handleUpload = async (option) => {
  const { file, onSuccess, onError } = option
  uploading.value = true
  try {
    const res = await uploadFile(file)
    if (res.code === 200) { form.notification = res.data; onSuccess(res) }
    else { onError(new Error(res.message)) }
  } catch (e) { onError(e) }
  finally { uploading.value = false }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize, ...query }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const res = await moduleApi.getList(params)
    if (res.code === 200) { tableData.value = res.data.records || []; page.total = res.data.total || 0 }
  } finally { loading.value = false }
}

const resetQuery = () => { Object.keys(query).forEach(k => query[k] = ''); page.pageNum = 1; fetchData() }
const openAdd = () => { dialog.isEdit = false; addDraft.open(() => { dialog.visible = true }) }
const openEdit = async (row) => {
  try { const res = await moduleApi.getById(row.id); if (res.code === 200) { Object.assign(form, res.data); dialog.isEdit = true; dialog.visible = true } } catch { /* */ }
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = dialog.isEdit ? await moduleApi.update({ ...form }) : await moduleApi.create({ ...form })
    if (res.code === 200) {
      if (!dialog.isEdit) addDraft.clear()
      ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
      dialog.visible = false
      fetchData()
    }
  } finally { saving.value = false }
}

const handleDelete = async (id) => {
  try { await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' }); const res = await moduleApi.remove(id); if (res.code === 200) { ElMessage.success('删除成功'); fetchData() } } catch { /* */ }
}

const handleBatchDelete = async () => {
  try { await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条记录？`, '提示', { type: 'warning' }); const res = await moduleApi.batchRemove(selected.value.map(r => r.id)); if (res.code === 200) { ElMessage.success('批量删除成功'); fetchData() } } catch { /* */ }
}

const handleSaveDraft = () => {
  addDraft.save({ message: '已暂存，下次可继续填写；若有本地未上传附件需重新选择' })
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
.search-form { margin-bottom: 10px; }
.toolbar { margin-bottom: 12px; display: flex; gap: 10px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.file-link { color: #409eff; text-decoration: none; }
.file-link:hover { text-decoration: underline; }
.upload-row { display: flex; align-items: center; gap: 8px; }
.upload-row .el-input { flex: 1; }
.upload-name { font-size: 12px; color: #67c23a; white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
</style>
