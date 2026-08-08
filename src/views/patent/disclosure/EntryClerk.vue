<template>
  <div class="page">
    <el-card>
      <!-- 筛选面板 -->
      <div class="filter-box">
        <div class="filter-box__title"><el-icon :size="15"><Search /></el-icon><span>筛选条件</span></div>
        <div class="filter-grid">
          <div class="filter-cell" v-for="f in ec.searchFields" :key="f.key">
            <label class="filter-cell__label">{{ f.label }}</label>
            <el-input v-if="f.type === 'input'" v-model="ec.query[f.key]" clearable />
            <el-select v-else-if="f.type === 'select'" v-model="ec.query[f.key]" clearable placeholder="全部" @change="ecFetchData">
              <el-option v-for="o in f.options" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </div>
        </div>
        <div class="filter-actions"><el-button type="primary" @click="ecFetchData">查询</el-button><el-button @click="ecResetQuery">重置</el-button></div>
      </div>

      <!-- 表格区域 -->
      <div class="table-section">
        <div class="table-section__bar">
          <span class="table-section__count">共 <strong>{{ ec.page.total }}</strong> 条</span>
          <el-button size="small" @click="ecFetchData" :icon="Refresh">刷新</el-button>
          <el-button v-if="hasPerm('patent:disclosure:add') || hasPerm('patent:disclosure:copy')" type="primary" size="small" @click="ecOpenAdd">新增交底</el-button>

          <el-button v-if="hasPerm('patent:disclosure:delete')" type="danger" size="small" :disabled="!ec.selected.length" @click="ecBatchDelete">批量删除</el-button>
        </div>

        <!-- Table -->
        <el-table :data="ec.tableData" v-loading="ec.loading" border stripe @selection-change="(s) => ec.selected = s">
        <el-table-column type="selection" width="50" />
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
        <el-table-column prop="mentor" label="指导人" min-width="180" show-overflow-tooltip />
        <el-table-column prop="businessPersonnel" label="业务人员" min-width="180" show-overflow-tooltip />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="disclosureDate" label="交底日期" width="110" :formatter="(_,__,v)=>formatDate(v)" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="router.push(`/patent/disclosure/add?id=${row.id}`)">编辑</el-button>
            <el-button size="small" type="danger" link @click="ecDelete(row.id)">删除</el-button>
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
      </div>
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog v-model="ec.editDialog.visible" title="编辑交底" width="900px" destroy-on-close top="3vh">
      <el-tabs v-model="ec.editDialog.activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form ref="ecFormRef" :model="ec.editForm" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="交底名称" required>
                  <el-input v-model="ec.editForm.disclosureName" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="专利类型" required>
                  <el-select v-model="ec.editForm.patentType" style="width:100%">
                    <el-option label="发明" value="发明" />
                    <el-option label="实用新型" value="实用新型" />
                    <el-option label="外观" value="外观" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="内部编号">
                  <el-input v-model="ec.editForm.internalNo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="专利状态">
                  <el-select v-model="ec.editForm.patentStatus" style="width:100%">
                    <el-option label="草稿" value="草稿" />
                    <el-option label="受理" value="受理" />
                    <el-option label="审核中" value="审核中" />
                    <el-option label="定稿" value="定稿" />
                    <el-option label="驳回" value="驳回" />
                    <el-option label="定稿待报" value="定稿待报" disabled />
                    <el-option label="已申报" value="已申报" disabled />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="申请人">
                  <ApplicantAgentSelect v-model="ec.editForm.applicant" type="applicant" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发明人">
                  <el-input v-model="ec.editForm.inventor" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系人">
                  <el-input v-model="ec.editForm.contactPerson" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="主办人" required>
                  <el-select v-model="ec.editForm.sponsorUserId" filterable placeholder="搜索选择主办人" style="width:100%"
                    :loading="ec.sponsorLoading" no-data-text="暂无启用的主办人" @change="ecOnSponsorChange">
                    <el-option v-for="u in ec.userList" :key="u.userId" :label="`${u.userName || u.loginName} (ID:${u.userId})`" :value="u.userId" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="代理人">
                  <ApplicantAgentSelect v-model="ec.editForm.agent" type="agent" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="指导人">
                  <el-input v-model.trim="ec.editForm.mentor" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="业务人员">
                  <el-input v-model.trim="ec.editForm.businessPersonnel" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="交底日期" required>
                  <el-date-picker v-model="ec.editForm.disclosureDate" type="date" style="width:100%" value-format="YYYY-MM-DD" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="要求">
                  <el-input v-model="ec.editForm.requirement" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系邮箱">
                  <el-input v-model="ec.editForm.contactEmail" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系电话">
                  <el-input v-model="ec.editForm.contactPhone" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系信息">
                  <el-input v-model="ec.editForm.contactInfo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="编号模式">
                  <el-select v-model="ec.editForm.noGenerateMode" style="width:100%">
                    <el-option label="自动生成" value="AUTO" />
                    <el-option label="手动输入" value="MANUAL" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="备注">
                  <el-input v-model="ec.editForm.remark" type="textarea" :rows="3" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="附件" name="attachments">
          <DisclosureAttachmentEditor
              :disclosure-id="ec.editForm.id"
              v-model:document-file="ec.pendingDocument"
              v-model:other-files="ec.pendingOthers"
              @changed="ecFetchData"
            />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="ec.editDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="ecSaveEdit" :loading="ec.saving">保存修改</el-button>
      </template>
    </el-dialog>


    <FilePreviewDialog v-model="ec.preview.visible" :attachment="ec.preview.attachment" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getList, getById, getSponsorOptions, update, createWithAttachments, remove, batchRemove } from '../../../api/disclosureWorkflow'
import ApplicantAgentSelect from '../../../components/ApplicantAgentSelect.vue'
import DisclosureAttachmentEditor from '../../../components/DisclosureAttachmentEditor.vue'
import DisclosureAttachmentLinks from '../../../components/DisclosureAttachmentLinks.vue'
import FilePreviewDialog from '../../../components/FilePreviewDialog.vue'
import { formatDate } from '../../../utils/format'
import { statusTag, emptyForm, hasPerm, mergeDisclosureAttachments } from './shared'

const router = useRouter()

// ========================== Reactive State ==========================
const ec = reactive({
  searchFields: [
    { key: 'disclosureName', label: '名称', type: 'input', matchType: 'fuzzy', width: 200 },
    { key: 'internalNo', label: '内部编号', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'tempNo', label: '临时编号', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'patentType', label: '专利类型', type: 'select', options: [{label:'发明',value:'发明'},{label:'实用新型',value:'实用新型'},{label:'外观',value:'外观'}], width: 120 },
    { key: 'patentStatus', label: '状态', type: 'select', options: [{label:'草稿',value:'草稿'},{label:'受理',value:'受理'},{label:'审核中',value:'审核中'},{label:'定稿',value:'定稿'},{label:'驳回',value:'驳回'}], width: 120 },
    { key: 'applicant', label: '申请人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'inventor', label: '发明人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'agent', label: '代理人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'mentor', label: '指导人', type: 'input', matchType: 'fuzzy', width: 180 },
    { key: 'businessPersonnel', label: '业务人员', type: 'input', matchType: 'fuzzy', width: 180 },
    { key: 'sponsor', label: '主办人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'contactPerson', label: '联系人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'manager', label: '管理人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'syncedToPatent', label: '同步状态', type: 'select', options: [{label:'已同步',value:1},{label:'未同步',value:0}], width: 120 },
    { key: 'disclosureDateRange', label: '交底日期', type: 'daterange', width: 260 },
    { key: 'createTimeRange', label: '创建时间', type: 'daterange', width: 260 }
  ],
  query: { 
    disclosureName: '', internalNo: '', tempNo: '', patentType: '', patentStatus: '',
    applicant: '', inventor: '', agent: '', mentor: '', businessPersonnel: '', sponsor: '', contactPerson: '', manager: '',
    syncedToPatent: '', disclosureDateRange: null, createTimeRange: null 
  },
  page: { pageNum: 1, pageSize: 10, total: 0 },
  tableData: [],
  selected: [],
  loading: false,
  editDialog: { visible: false, activeTab: 'basic' },
  preview: { visible: false, attachment: null },
  editForm: emptyForm(),
  saving: false,
  pendingDocument: null,
  pendingOthers: [],
  userList: [],
  sponsorLoading: false
})

const ecFormRef = ref(null)

// ========================== Data Fetching ==========================
const ecFetchData = async () => {
  ec.loading = true
  try {
    const params = { pageNum: ec.page.pageNum, pageSize: ec.page.pageSize }
    Object.keys(ec.query).forEach(k => {
      if (k === 'disclosureDateRange' && ec.query[k] && ec.query[k].length === 2) {
        params.disclosureDateStart = ec.query[k][0]
        params.disclosureDateEnd = ec.query[k][1]
      } else if (k === 'createTimeRange' && ec.query[k] && ec.query[k].length === 2) {
        params.createTimeStart = ec.query[k][0] + ' 00:00:00'
        params.createTimeEnd = ec.query[k][1] + ' 23:59:59'
      } else if (ec.query[k] !== '' && ec.query[k] !== null && ec.query[k] !== undefined) {
        params[k] = ec.query[k]
      }
    })
    const res = await getList(params)
    if (res.code === 200) {
      ec.tableData = res.data.records || []
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
  Object.keys(ec.query).forEach(k => {
    if (k.endsWith('Range')) ec.query[k] = null
    else ec.query[k] = ''
  })
  ec.page.pageNum = 1
  ecFetchData()
}

// ========================== User Loading ==========================
const ecLoadUsers = async () => {
  ec.sponsorLoading = true
  try {
    const r = await getSponsorOptions()
    if (r.code === 200 && r.data) {
      ec.userList = Array.isArray(r.data) ? r.data : []
    }
  } catch {
    ec.userList = []
    ElMessage.error('主办人列表加载失败，请稍后重试')
  } finally {
    ec.sponsorLoading = false
  }
}

const ecOnSponsorChange = (uid) => {
  const u = ec.userList.find(u => u.userId === uid)
  ec.editForm.sponsor = u ? (u.userName || u.loginName) : ''
}

// ========================== Add / Edit ==========================
const ecOpenAdd = () => {
  router.push('/patent/disclosure/add')
}

const ecOpenEdit = async (row) => {
  try {
    const res = await getById(row.id)
    if (res.code === 200) {
      Object.assign(ec.editForm, res.data)
      ec.editDialog.visible = true
      ec.editDialog.activeTab = 'basic'
      ec.pendingDocument = null
      ec.pendingOthers = []
      if (!ec.userList.length) ecLoadUsers()
    }
  } catch {
    // silently ignore
  }
}

// ========================== Save Edit ==========================
const ecSaveEdit = async () => {
  if (!ec.editForm.disclosureName) { ElMessage.warning('请输入交底名称'); return }
  if (!ec.editForm.patentType) { ElMessage.warning('请选择专利类型'); return }
  if (!ec.editForm.disclosureDate) { ElMessage.warning('请选择交底日期'); return }
  if (!ec.editForm.sponsorUserId) { ElMessage.warning('请选择主办人'); return }
  ec.saving = true
  try {
    let res
    if (ec.editForm.id) {
      res = await update({ ...ec.editForm })
    } else {
      res = await createWithAttachments({ ...ec.editForm }, ec.pendingDocument || new Blob(), ec.pendingOthers || [])
    }
    if (res.code === 200) {
      ElMessage.success(ec.editForm.id ? '修改成功' : '新增成功')
      ec.editDialog.visible = false
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

// ========================== Mount ==========================
onMounted(() => {
  ecFetchData()
  ecLoadUsers()
})
</script>

<style scoped>
.page { max-width: 1600px; }
.filter-box { margin-bottom:20px; background:linear-gradient(135deg,#f0f4fa 0%,#f7f9fc 50%,#fafbfd 100%); border:1px solid #d4dde8; border-left:4px solid #1e88e5; border-radius:8px; box-shadow:0 2px 8px rgba(10,22,40,0.04); overflow:hidden; }
.filter-box__title { display:flex;align-items:center;gap:8px; padding:8px 20px; background:rgba(30,136,229,0.06); border-bottom:1px solid #e0e7f0; font-size:12px;font-weight:700;color:#1e3a5c; }
.filter-grid { display:grid;grid-template-columns:repeat(4,1fr); gap:10px 20px; padding:16px 20px 8px; }
.filter-cell { display:flex;align-items:center;gap:8px; }
.filter-cell__label { font-size:11px;font-weight:600;color:#7c8799;white-space:nowrap;flex-shrink:0; }
.filter-actions { padding:6px 20px 14px;display:flex;gap:8px; }
.table-section { border:1px solid #e2e8f0;border-radius:8px;overflow:hidden; }
.table-section__bar { display:flex;align-items:center;gap:8px; padding:10px 16px; background:#fafbfc; border-bottom:1px solid #e8ecf1; }
.table-section__count { flex:1;font-size:13px;color:#5f6b7a; }
.table-section__count strong { color:#1e88e5;font-weight:700; }
.pagination { margin-top: 16px; justify-content: flex-end; display: flex; }
.search-form { margin-bottom: 10px; }
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
