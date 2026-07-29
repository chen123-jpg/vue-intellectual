<template>
  <div class="page">
    <el-card>
      <!-- Search Form -->
      <el-form :inline="true" :model="ec.query" class="search-form">
        <el-form-item label="交底名称">
          <el-input v-model="ec.query.disclosureName" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="专利类型">
          <el-select v-model="ec.query.patentType" placeholder="全部" clearable>
            <el-option label="发明" value="发明" />
            <el-option label="实用新型" value="实用新型" />
            <el-option label="外观" value="外观" />
          </el-select>
        </el-form-item>
        <el-form-item label="专利状态">
          <el-input v-model="ec.query.patentStatus" placeholder="精确搜索" clearable />
        </el-form-item>
        <el-form-item label="内部编号">
          <el-input v-model="ec.query.internalNo" placeholder="精确搜索" clearable />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="ec.query.applicant" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="ecFetchData">查询</el-button>
          <el-button @click="ecResetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Toolbar -->
      <div class="toolbar">
        <el-button v-if="hasPerm('patent:disclosure:add')" type="primary" @click="ecOpenAdd">新增交底</el-button>
        <el-button v-if="hasPerm('patent:disclosure:copy') || hasPerm('patent:disclosure:add')" type="success" @click="ecOpenCopy">复制历史交底</el-button>
        <el-button v-if="hasPerm('patent:disclosure:delete')" type="danger" :disabled="!ec.selected.length" @click="ecBatchDelete">批量删除</el-button>
      </div>

      <!-- Table -->
      <el-table :data="ec.tableData" v-loading="ec.loading" border stripe @selection-change="(s) => ec.selected = s">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="tempNo" label="临时编号" width="120" />
        <el-table-column prop="internalNo" label="内部编号" width="120" />
        <el-table-column label="交底书" min-width="180">
          <template #default="{ row }">
            <DisclosureAttachmentLinks
              :attachments="row.attachments"
              biz-type="DISCLOSURE_DOC"
              @preview="ecOpenPreview"
            />
          </template>
        </el-table-column>
        <el-table-column label="其他文件" min-width="200">
          <template #default="{ row }">
            <DisclosureAttachmentLinks
              :attachments="row.attachments"
              biz-type="DISCLOSURE_OTHER"
              @preview="ecOpenPreview"
            />
          </template>
        </el-table-column>
        <el-table-column prop="disclosureName" label="交底名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="patentType" label="专利类型" width="100" />
        <el-table-column prop="patentStatus" label="专利状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.patentStatus)" size="small">{{ row.patentStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="130" />
        <el-table-column prop="inventor" label="发明人" width="120" />
        <el-table-column prop="sponsor" label="主办人" width="100" />
        <el-table-column prop="agent" label="代理人" width="130" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="disclosureDate" label="交底日期" width="110" :formatter="(_,__,v)=>formatDate(v)" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="ecOpenEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="ecDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="ec.page.pageNum" v-model:page-size="ec.page.pageSize"
        :total="ec.page.total" :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next" @size-change="ecFetchData" @current-change="ecFetchData"
        class="pagination"
      />
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="ec.dialog.visible" :title="ec.dialog.isEdit ? '编辑交底' : '新增交底'" width="900px" destroy-on-close top="3vh">
      <el-tabs v-model="ec.dialog.activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form ref="ecFormRef" :model="ec.form" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="交底名称" required>
                  <el-input v-model="ec.form.disclosureName" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="专利类型" required>
                  <el-select v-model="ec.form.patentType" style="width:100%">
                    <el-option label="发明" value="发明" />
                    <el-option label="实用新型" value="实用新型" />
                    <el-option label="外观" value="外观" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="内部编号">
                  <el-input v-model="ec.form.internalNo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="专利状态">
                  <el-input v-model="ec.form.patentStatus" placeholder="如：草稿" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="申请人">
                  <ApplicantAgentSelect v-model="ec.form.applicant" type="applicant" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发明人">
                  <el-input v-model="ec.form.inventor" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系人">
                  <el-input v-model="ec.form.contactPerson" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="主办人" required>
                  <el-select v-if="ec.userList.length" v-model="ec.form.sponsorUserId" filterable placeholder="搜索选择主办人" style="width:100%"
                    @change="ecOnSponsorChange">
                    <el-option v-for="u in ec.userList" :key="u.userId" :label="`${u.userName || u.loginName} (ID:${u.userId})`" :value="u.userId" />
                  </el-select>
                  <el-input v-else v-model="ec.form.sponsor" placeholder="主办人姓名" @input="ec.form.sponsorUserId = null" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="代理人">
                  <ApplicantAgentSelect v-model="ec.form.agent" type="agent" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="交底日期">
                  <el-date-picker v-model="ec.form.disclosureDate" type="date" style="width:100%" value-format="YYYY-MM-DD" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="要求">
                  <el-input v-model="ec.form.requirement" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系邮箱">
                  <el-input v-model="ec.form.contactEmail" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系电话">
                  <el-input v-model="ec.form.contactPhone" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系信息">
                  <el-input v-model="ec.form.contactInfo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="编号模式">
                  <el-select v-model="ec.form.noGenerateMode" style="width:100%">
                    <el-option label="自动生成" value="AUTO" />
                    <el-option label="手动输入" value="MANUAL" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="备注">
                  <el-input v-model="ec.form.remark" type="textarea" :rows="3" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="附件" name="attachments">
          <DisclosureAttachmentEditor
              :disclosure-id="ec.dialog.isEdit ? ec.form.id : null"
              v-model:document-file="ec.pendingDocument"
              v-model:other-files="ec.pendingOthers"
              @changed="ecFetchData"
            />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="ec.dialog.visible = false">关闭</el-button>
        <el-button v-if="ec.dialog.activeTab === 'basic' || !ec.dialog.isEdit" type="primary" @click="ecSave" :loading="ec.saving">
          {{ ec.dialog.isEdit ? '保存修改' : '创建交底' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Copy Dialog -->
    <el-dialog v-model="ec.copyDialog.visible" title="复制历史交底" width="850px" destroy-on-close>
      <el-form :inline="true" :model="ec.copyQuery" class="search-form">
        <el-form-item label="交底名称">
          <el-input v-model="ec.copyQuery.disclosureName" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="内部编号">
          <el-input v-model="ec.copyQuery.internalNo" placeholder="精确搜索" clearable />
        </el-form-item>
        <el-form-item label="专利类型">
          <el-select v-model="ec.copyQuery.patentType" placeholder="全部" clearable>
            <el-option label="发明" value="发明" />
            <el-option label="实用新型" value="实用新型" />
            <el-option label="外观" value="外观" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="ecCopySearch">查询</el-button>
          <el-button @click="ec.copyQuery.disclosureName='';ec.copyQuery.internalNo='';ec.copyQuery.patentType='';ecCopySearch()">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="ec.copyList" v-loading="ec.copyLoading" border stripe max-height="350" @row-dblclick="ecDoCopy">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="internalNo" label="内部编号" width="120" />
        <el-table-column prop="disclosureName" label="交底名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="patentType" label="类型" width="90" />
        <el-table-column prop="patentStatus" label="状态" width="100" />
        <el-table-column prop="applicant" label="申请人" width="130" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="ecDoCopy(row)">复制</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="ec.copyPage.pageNum" v-model:page-size="ec.copyPage.pageSize"
        :total="ec.copyPage.total" :page-sizes="[10, 20]"
        layout="total, sizes, prev, pager, next" @size-change="ecCopySearch" @current-change="ecCopySearch"
        class="pagination"
      />
      <template #footer>
        <el-button @click="ec.copyDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <FilePreviewDialog v-model="ec.preview.visible" :attachment="ec.preview.attachment" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getList, getById, createWithAttachments, update, remove, batchRemove } from '../../../api/disclosureWorkflow'
import ApplicantAgentSelect from '../../../components/ApplicantAgentSelect.vue'
import DisclosureAttachmentEditor from '../../../components/DisclosureAttachmentEditor.vue'
import DisclosureAttachmentLinks from '../../../components/DisclosureAttachmentLinks.vue'
import FilePreviewDialog from '../../../components/FilePreviewDialog.vue'
import { getUserList } from '../../../api/user'
import { formatDate } from '../../../utils/format'
import { statusTag, emptyForm, hasPerm, mergeDisclosureAttachments } from './shared'

// ========================== Reactive State ==========================
const ec = reactive({
  query: { disclosureName: '', patentType: '', patentStatus: '', internalNo: '', applicant: '' },
  page: { pageNum: 1, pageSize: 10, total: 0 },
  tableData: [],
  selected: [],
  loading: false,
  dialog: { visible: false, isEdit: false, activeTab: 'basic' },
  preview: { visible: false, attachment: null },
  form: emptyForm(),
  saving: false,
  pendingDocument: null,
  pendingOthers: [],
  copySourceId: null,
  copyDialog: { visible: false },
  copyQuery: { disclosureName: '', internalNo: '', patentType: '' },
  copyPage: { pageNum: 1, pageSize: 10, total: 0 },
  copyList: [],
  copyLoading: false,
  userList: []
})

const ecFormRef = ref(null)

// ========================== Data Fetching ==========================
const ecFetchData = async () => {
  ec.loading = true
  try {
    const params = { pageNum: ec.page.pageNum, pageSize: ec.page.pageSize }
    Object.keys(ec.query).forEach(k => { if (ec.query[k]) params[k] = ec.query[k] })
    const res = await getList(params)
    if (res.code === 200) {
      ec.tableData = mergeDisclosureAttachments(
        res.data.records,
        res.data.attachmentsByDisclosureId
      )
      ec.page.total = res.data.total || 0
    }
  } finally {
    ec.loading = false
  }
}

const ecOpenPreview = (attachment) => {
  ec.preview.attachment = attachment
  ec.preview.visible = true
}

const ecResetQuery = () => {
  Object.keys(ec.query).forEach(k => ec.query[k] = '')
  ec.page.pageNum = 1
  ecFetchData()
}

// ========================== User Loading ==========================
const ecLoadUsers = async () => {
  try {
    const r = await getUserList({ pageSize: 999 })
    if (r.code === 200 && r.data) {
      ec.userList = Array.isArray(r.data) ? r.data : (r.data.records || [])
    }
  } catch {
    ec.userList = []
  }
}

const ecOnSponsorChange = (uid) => {
  const u = ec.userList.find(u => u.userId === uid)
  ec.form.sponsor = u ? (u.userName || u.loginName) : ''
}

// ========================== Add / Edit ==========================
const ecOpenAdd = () => {
  Object.assign(ec.form, emptyForm())
  ec.dialog.visible = true
  ec.dialog.isEdit = false
  ec.dialog.activeTab = 'basic'
  ec.pendingDocument = null
  ec.pendingOthers = []
  ec.copySourceId = null
  if (!ec.userList.length) ecLoadUsers()
}

const ecOpenEdit = async (row) => {
  try {
    const res = await getById(row.id)
    if (res.code === 200) {
      Object.assign(ec.form, res.data)
      ec.dialog.visible = true
      ec.dialog.isEdit = true
      ec.dialog.activeTab = 'basic'
      ec.pendingDocument = null
      ec.pendingOthers = []
      ec.copySourceId = null
      if (!ec.userList.length) ecLoadUsers()
    }
  } catch {
    // silently ignore
  }
}

// ========================== Save ==========================
const ecSave = async () => {
  if (!ec.form.disclosureName) {
    ElMessage.warning('请输入交底名称')
    return
  }
  if (!ec.form.patentType) {
    ElMessage.warning('请选择专利类型')
    return
  }
  if (!ec.dialog.isEdit && !ec.pendingDocument) {
    ElMessage.warning('请在附件页上传一份 Word 格式的交底书')
    ec.dialog.activeTab = 'attachments'
    return
  }
  ec.saving = true
  try {
    const res = ec.dialog.isEdit
      ? await update({ ...ec.form })
      : await createWithAttachments(
          { ...ec.form },
          ec.pendingDocument,
          ec.pendingOthers,
          ec.copySourceId
        )
    if (res.code === 200) {
      ElMessage.success(ec.dialog.isEdit ? '修改成功' : '交底信息和附件创建成功')
      if (!ec.dialog.isEdit && res.data?.id) {
        ec.form.id = res.data.id
        ec.dialog.isEdit = true
        ec.pendingDocument = null
        ec.pendingOthers = []
        ec.copySourceId = null
      }
      ecFetchData()
    }
  } finally {
    ec.saving = false
  }
}

// ========================== Delete / Batch Delete ==========================
const ecDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
    const r = await remove(id)
    if (r.code === 200) {
      ElMessage.success('已删除')
      ecFetchData()
    }
  } catch {
    // user cancelled
  }
}

const ecBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ec.selected.length} 条？`, '提示', { type: 'warning' })
    const r = await batchRemove(ec.selected.map(s => s.id))
    if (r.code === 200) {
      ElMessage.success('已批量删除')
      ec.selected = []
      ecFetchData()
    }
  } catch {
    // user cancelled
  }
}

// ========================== Copy ==========================
const ecOpenCopy = () => {
  ec.copyDialog.visible = true
  ecCopySearch()
}

const ecCopySearch = async () => {
  ec.copyLoading = true
  try {
    const params = { pageNum: ec.copyPage.pageNum, pageSize: ec.copyPage.pageSize }
    Object.keys(ec.copyQuery).forEach(k => { if (ec.copyQuery[k]) params[k] = ec.copyQuery[k] })
    const r = await getList(params)
    if (r.code === 200) {
      ec.copyList = r.data.records || []
      ec.copyPage.total = r.data.total || 0
    }
  } finally {
    ec.copyLoading = false
  }
}

const ecDoCopy = async (row) => {
  try {
    await ElMessageBox.confirm(`确认复制"${row.disclosureName}"的交底信息？`, '确认复制', { type: 'info' })
    const copiedForm = emptyForm()
    Object.keys(copiedForm).forEach(key => {
      if (row[key] !== undefined && row[key] !== null) copiedForm[key] = row[key]
    })
    copiedForm.id = null
    copiedForm.internalNo = ''
    copiedForm.patentStatus = '草稿'
    Object.assign(ec.form, copiedForm)
    ec.copySourceId = row.id
    ec.pendingDocument = null
    ec.pendingOthers = []
    ec.dialog.isEdit = false
    ec.dialog.activeTab = 'basic'
    ec.dialog.visible = true
    ec.copyDialog.visible = false
    if (!ec.userList.length) ecLoadUsers()
    ElMessage.success('历史信息已回填，请确认内容并上传新的交底书')
  } catch {
    // user cancelled
  }
}

// ========================== Mount ==========================
onMounted(() => {
  ecFetchData()
})
</script>

<style scoped>
.page { max-width: 1600px; }
.search-form { margin-bottom: 10px; }
.toolbar { margin-bottom: 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; display: flex; }
.tab-section { padding: 4px 0; }
.upload-group { margin-bottom: 4px; }
.upload-group h4 { margin: 0 0 8px 0; font-size: 14px; color: #303133; }
.upload-hint { font-size: 12px; color: #909399; margin-left: 8px; }
.attach-items { margin-top: 8px; }
.attach-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.attach-row:last-child { border-bottom: none; }
.pending-attach { background: #f0f9eb; padding-left: 8px; padding-right: 8px; }
.file-link { color: #409eff; cursor: pointer; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-link:hover { text-decoration: underline; }
.file-size { font-size: 12px; color: #909399; white-space: nowrap; }
</style>
