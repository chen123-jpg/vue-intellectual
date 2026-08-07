<template>
  <div class="page">
    <el-card>
      <!-- 筛选面板 -->
      <div class="filter-box">
        <div class="filter-box__title"><el-icon :size="15"><Search /></el-icon><span>筛选条件</span></div>
        <div class="filter-grid">
          <div class="filter-cell" v-for="f in ad.searchFields" :key="f.key">
            <label class="filter-cell__label">{{ f.label }}</label>
            <el-input v-if="f.type === 'input'" v-model="ad.query[f.key]" clearable />
            <el-select v-else-if="f.type === 'select'" v-model="ad.query[f.key]" clearable placeholder="全部" @change="adFetchData">
              <el-option v-for="o in f.options" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </div>
        </div>
        <div class="filter-actions"><el-button type="primary" @click="adFetchData">查询</el-button><el-button @click="adResetQuery">重置</el-button></div>
      </div>

      <!-- 表格区域 -->
      <div class="table-section">
        <div class="table-section__bar">
          <span class="table-section__count">共 <strong>{{ ad.page.total }}</strong> 条</span>
          <el-button size="small" @click="adFetchData" :icon="Refresh">刷新</el-button>
          <el-button v-if="hasPerm('patent:disclosure:add')" type="primary" size="small" @click="adOpenAdd">新增交底</el-button>
          <el-button v-if="hasPerm('patent:disclosure:delete')" type="danger" size="small" :disabled="!ad.selected.length" @click="adBatchDelete">批量删除</el-button>
        </div>

        <el-table
        :data="ad.tableData"
        v-loading="ad.loading"
        border
        stripe
        @selection-change="(sel) => (ad.selected = sel)"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="tempNo" label="临时编号" width="120" />
        <el-table-column prop="internalNo" label="内部编号" width="120" />
        <el-table-column prop="disclosureName" label="交底名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="专利状态" width="110">
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
        <el-table-column label="同步" width="70">
          <template #default="{ row }">
            <el-tag :type="row.syncedToPatent===1?'success':'info'" size="small">{{ row.syncedToPatent===1?'已同步':'未' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="交底书" min-width="180">
          <template #default="{ row }">
            <DisclosureAttachmentLinks
              :attachments="row.attachments"
              biz-type="DISCLOSURE_DOC"
              @preview="adOpenPreview"
            />
          </template>
        </el-table-column>
        <el-table-column label="其他文件" min-width="200">
          <template #default="{ row }">
            <DisclosureAttachmentLinks
              :attachments="row.attachments"
              biz-type="DISCLOSURE_OTHER"
              @preview="adOpenPreview"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="hasPerm('patent:disclosure:edit')"
              size="small"
              type="primary"
              link
              @click="router.push(`/patent/disclosure/add?id=${row.id}`)"
            >
              编辑
            </el-button>
            <el-button
              v-if="hasPerm('patent:disclosure:delete')"
              size="small"
              type="danger"
              link
              @click="adDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="ad.page.pageNum"
        v-model:page-size="ad.page.pageSize"
        :total="ad.page.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="adFetchData"
        @current-change="adFetchData"
        class="pagination"
      />
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="ad.editDialog.visible"
      title="编辑专利交底"
      width="700px"
      destroy-on-close
    >
      <el-form ref="adFormRef" :model="ad.editForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="交底名称" required>
              <el-input v-model="ad.editForm.disclosureName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利类型" required>
              <el-select v-model="ad.editForm.patentType" style="width:100%">
                <el-option label="发明" value="发明" />
                <el-option label="实用新型" value="实用新型" />
                <el-option label="外观" value="外观" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内部编号">
              <el-input v-model="ad.editForm.internalNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利状态">
              <el-select v-model="ad.editForm.patentStatus" style="width:100%">
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
              <ApplicantAgentSelect v-model="ad.editForm.applicant" type="applicant" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发明人">
              <el-input v-model="ad.editForm.inventor" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="ad.editForm.contactPerson" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主办人" required>
              <el-select
                v-model="ad.editForm.sponsorUserId"
                filterable
                :loading="ad.sponsorLoading"
                placeholder="搜索选择主办人"
                no-data-text="暂无启用的主办人"
                style="width:100%"
                @change="adOnSponsorChange"
              >
                <el-option
                  v-for="u in ad.sponsorOptions"
                  :key="u.userId"
                  :label="`${u.userName || u.loginName} (ID:${u.userId})`"
                  :value="u.userId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="代理人">
              <ApplicantAgentSelect v-model="ad.editForm.agent" type="agent" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指导人">
              <el-input v-model.trim="ad.editForm.mentor" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务人员">
              <el-input v-model.trim="ad.editForm.businessPersonnel" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交底日期" required>
              <el-date-picker
                v-model="ad.editForm.disclosureDate"
                type="date"
                style="width:100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="要求">
              <el-input v-model="ad.editForm.requirement" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系邮箱">
              <el-input v-model="ad.editForm.contactEmail" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="ad.editForm.contactPhone" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="ad.editForm.remark" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">附件管理</el-divider>
        <DisclosureAttachmentEditor
          :disclosure-id="ad.editForm.id"
          v-model:document-file="ad.disclosureDocument"
          v-model:other-files="ad.otherAttachments"
          @changed="adFetchData"
        />
      </el-form>
      <template #footer>
        <el-button @click="ad.editDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="adSaveEdit" :loading="ad.saving">保存修改</el-button>
      </template>
        </el-dialog>

    <FilePreviewDialog v-model="ad.preview.visible" :attachment="ad.preview.attachment" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getList, getById, getSponsorOptions, update, remove, batchRemove } from '../../../api/disclosureWorkflow'
import ApplicantAgentSelect from '../../../components/ApplicantAgentSelect.vue'
import DisclosureAttachmentEditor from '../../../components/DisclosureAttachmentEditor.vue'
import DisclosureAttachmentLinks from '../../../components/DisclosureAttachmentLinks.vue'
import FilePreviewDialog from '../../../components/FilePreviewDialog.vue'
import { formatDate } from '../../../utils/format'
import { statusTag, emptyForm, hasPerm, mergeDisclosureAttachments } from './shared'

const router = useRouter()
const ad = reactive({
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
  editDialog: { visible: false },
  preview: { visible: false, attachment: null },
  editForm: emptyForm(),
  disclosureDocument: null,
  otherAttachments: [],
  saving: false,
  sponsorOptions: [],
  sponsorLoading: false
})

const adLoadSponsors = async () => {
  ad.sponsorLoading = true
  try {
    const res = await getSponsorOptions()
    ad.sponsorOptions = res.code === 200 && Array.isArray(res.data) ? res.data : []
  } catch {
    ad.sponsorOptions = []
    ElMessage.error('主办人列表加载失败，请稍后重试')
  } finally {
    ad.sponsorLoading = false
  }
}

const adOnSponsorChange = (userId) => {
  const sponsor = ad.sponsorOptions.find(item => item.userId === userId)
  ad.editForm.sponsor = sponsor ? (sponsor.userName || sponsor.loginName) : ''
}

const adFetchData = async () => {
  ad.loading = true
  try {
    const params = { pageNum: ad.page.pageNum, pageSize: ad.page.pageSize }
    Object.keys(ad.query).forEach(k => {
      if (k === 'disclosureDateRange' && ad.query[k] && ad.query[k].length === 2) {
        params.disclosureDateStart = ad.query[k][0]
        params.disclosureDateEnd = ad.query[k][1]
      } else if (k === 'createTimeRange' && ad.query[k] && ad.query[k].length === 2) {
        params.createTimeStart = ad.query[k][0] + ' 00:00:00'
        params.createTimeEnd = ad.query[k][1] + ' 23:59:59'
      } else if (ad.query[k] !== '' && ad.query[k] !== null) {
        params[k] = ad.query[k]
      }
    })
    const res = await getList(params)
    if (res.code === 200) {
      ad.tableData = res.data.records || []
      ad.page.total = res.data.total || 0
    }
  } finally {
    ad.loading = false
  }
}

const adResetQuery = () => {
  Object.keys(ad.query).forEach(k => {
    if (k.endsWith('Range')) ad.query[k] = null
    else ad.query[k] = ''
  })
  ad.page.pageNum = 1
  adFetchData()
}

const adOpenAdd = () => {
  router.push('/patent/disclosure/add')
}

const adOpenPreview = (attachment) => {
  ad.preview.attachment = attachment
  ad.preview.visible = true
}

const adOpenEdit = async (row) => {
  try {
    const res = await getById(row.id)
    if (res.code === 200) {
      Object.assign(ad.editForm, res.data)
      ad.disclosureDocument = null
      ad.otherAttachments = []
      ad.editDialog.visible = true
      if (!ad.sponsorOptions.length) adLoadSponsors()
    }
  } catch {
    /* handled */
  }
}

const adSaveEdit = async () => {
  if (!ad.editForm.disclosureName) { ElMessage.warning('请输入交底名称'); return }
  if (!ad.editForm.patentType) { ElMessage.warning('请选择专利类型'); return }
  if (!ad.editForm.disclosureDate) { ElMessage.warning('请选择交底日期'); return }
  if (!ad.editForm.sponsorUserId) { ElMessage.warning('请选择主办人'); return }
  ad.saving = true
  try {
    const res = await update({ ...ad.editForm })
    if (res.code === 200) {
      ElMessage.success('修改成功')
      ad.editDialog.visible = false
      adFetchData()
    }
  } finally {
    ad.saving = false
  }
}

const adDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该记录？', '提示', { type: 'warning' })
    const res = await remove(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      adFetchData()
    }
  } catch {
    /* cancelled */
  }
}

const adBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${ad.selected.length} 条记录？`, '提示', { type: 'warning' })
    const res = await batchRemove(ad.selected.map(r => r.id))
    if (res.code === 200) {
      ElMessage.success('批量删除成功')
      adFetchData()
    }
  } catch {
    /* cancelled */
  }
}

onMounted(() => {
  adFetchData()
  adLoadSponsors()
})
</script>

<style scoped>
.page {
  max-width: 1600px;
}
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
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
  display: flex;
}
</style>
