<template>
  <div class="page">
    <el-card>
      <!-- Search Form -->
      <SearchBar
        v-model="og.query"
        :fields="og.searchFields"
        :loading="og.loading"
        :collapsed-threshold="4"
        @search="ogFetchData"
        @reset="ogResetQuery"
      />

      <!-- Toolbar -->
      <div class="toolbar">
        <span class="view-hint">我的交底处理列表（共 {{ og.page.total }} 条）</span>
      </div>

      <!-- Table -->
      <el-table :data="og.tableData" v-loading="og.loading" border stripe>
        <el-table-column prop="tempNo" label="临时编号" width="120" />
        <el-table-column prop="internalNo" label="内部编号" width="120" />
        <el-table-column prop="disclosureName" label="交底名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="patentType" label="专利类型" width="100" />
        <el-table-column label="专利状态" width="130">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.patentStatus)" size="small" effect="dark">{{ row.patentStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="130" />
        <el-table-column prop="inventor" label="发明人" width="120" />
        <el-table-column prop="agent" label="代理人" width="130" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="disclosureDate" label="交底日期" width="110">
          <template #default="{ row }">
            {{ formatDate(row.disclosureDate) }}
          </template>
        </el-table-column>
        <el-table-column label="同步" width="70">
          <template #default="{ row }">
            <el-tag :type="row.syncedToPatent === 1 ? 'success' : 'info'" size="small">
              {{ row.syncedToPatent === 1 ? '已同步' : '未' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="ogOpenProcess(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="og.page.pageNum"
        v-model:page-size="og.page.pageSize"
        :total="og.page.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="ogFetchData"
        @current-change="ogFetchData"
        class="pagination"
      />
    </el-card>

    <!-- Process Dialog -->
    <el-dialog
      v-model="og.dialog.visible"
      :title="'处理交底：' + og.form.disclosureName"
      width="950px"
      destroy-on-close
      top="3vh"
    >
      <el-tabs v-model="og.dialog.activeTab" @tab-change="ogOnTabChange">
        <!-- Tab 1: 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="og.form" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="交底名称" required>
                  <el-input v-model="og.form.disclosureName" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="专利类型">
                  <el-select v-model="og.form.patentType" style="width: 100%">
                    <el-option label="发明" value="发明" />
                    <el-option label="实用新型" value="实用新型" />
                    <el-option label="外观" value="外观" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="内部编号">
                  <el-input v-model="og.form.internalNo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="申请人">
                  <ApplicantAgentSelect v-model="og.form.applicant" type="applicant" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发明人">
                  <el-input v-model="og.form.inventor" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系人">
                  <el-input v-model="og.form.contactPerson" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="主办人">
                  <el-input :model-value="og.form.sponsor || '-'" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="代理人">
                  <ApplicantAgentSelect v-model="og.form.agent" type="agent" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系邮箱">
                  <el-input v-model="og.form.contactEmail" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="交底日期" required>
                  <el-date-picker
                    v-model="og.form.disclosureDate"
                    type="date"
                    style="width: 100%"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="要求">
                  <el-input v-model="og.form.requirement" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="备注">
                  <el-input v-model="og.form.remark" type="textarea" :rows="2" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <div style="text-align: right; margin-top: 10px">
            <el-button type="primary" @click="ogSaveBasic" :loading="og.saving">保存基本信息</el-button>
          </div>
        </el-tab-pane>

        <!-- Tab 2: 状态变更 -->
        <el-tab-pane label="状态变更" name="status">
          <el-form label-width="100px">
            <el-form-item label="当前状态">
              <el-tag :type="statusTag(og.form.patentStatus)" effect="dark">
                {{ og.form.patentStatus || '无' }}
              </el-tag>
            </el-form-item>
            <el-form-item label="变更为" required>
              <el-select v-model="og.statusForm.toStatus" placeholder="选择新状态" style="width: 220px">
                <el-option label="草稿" value="草稿" />
                <el-option label="受理" value="受理" />
                <el-option label="审核中" value="审核中" />
                <el-option label="定稿" value="定稿" />
                <el-option label="驳回" value="驳回" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="og.statusForm.remark"
                type="textarea"
                :rows="3"
                placeholder="变更原因（可选）"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="ogChangeStatus" :loading="og.statusSaving">
                确认变更
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider />
          <h4 style="margin-bottom: 8px">状态变更记录</h4>
          <el-table :data="og.statusLogs" border stripe size="small">
            <el-table-column prop="fromStatus" label="原状态" width="120" />
            <el-table-column prop="toStatus" label="新状态" width="120" />
            <el-table-column prop="operatorName" label="操作人" width="100" />
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Tab 3: 申请包 -->
        <el-tab-pane label="申请包" name="packages">
          <ApplicationPackageComposer :disclosure="og.form" />
        </el-tab-pane>

        <!-- Tab 4: 发送邮件 -->
        <el-tab-pane label="发送邮件" name="email">
          <el-form label-width="80px">
            <el-form-item label="发送模式">
              <el-radio-group v-model="og.emailMode" @change="ogOnEmailModeChange">
                <el-radio-button value="normal">普通发送</el-radio-button>
                <el-radio-button value="template">模板发送</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="og.emailMode === 'template'" label="选择模板">
              <el-select
                v-model="og.emailForm.templateCode"
                placeholder="选择邮件模板"
                clearable
                @change="ogOnEmailTemplateSelect"
                style="width: 100%"
              >
                <el-option
                  v-for="tpl in og.enabledTemplates"
                  :key="tpl.templateCode"
                  :label="`${tpl.templateName} (${tpl.templateCode})`"
                  :value="tpl.templateCode"
                />
              </el-select>
            </el-form-item>

            <template v-if="og.emailMode === 'template' && og.emailTemplateVars.length">
              <template v-for="v in og.emailTemplateVars" :key="v">
                <el-form-item v-if="ogIsImageVar(v)" :label="templateVarLabel(v)">
                  <template v-if="og.emailTemplateData[v]">
                    <div class="var-image-filled">
                      <img :src="og.emailTemplateData[v]" class="var-image-thumb" />
                      <el-button size="small" type="danger" text @click="og.emailTemplateData[v]=''">清除</el-button>
                    </div>
                  </template>
                  <span v-else class="var-image-waiting">上传图片后自动填入</span>
                </el-form-item>
                <el-form-item v-else :label="templateVarLabel(v)" required>
                  <el-input v-model="og.emailTemplateData[v]" :placeholder="`输入${templateVarLabel(v)}`" />
                </el-form-item>
              </template>
            </template>

            <el-divider />
            <el-form-item label="收件人" required>
              <el-input v-model="og.emailForm.to" placeholder="多个邮箱用逗号或分号分隔" />
            </el-form-item>
            <el-form-item label="抄送">
              <el-input v-model="og.emailForm.cc" placeholder="多个邮箱用逗号或分号分隔" />
            </el-form-item>

            <template v-if="og.emailMode === 'normal'">
              <el-form-item label="主题" required>
                <el-input v-model="og.emailForm.subject" />
              </el-form-item>
              <el-form-item label="正文" required>
                <el-input v-model="og.emailForm.text" type="textarea" :rows="6" />
              </el-form-item>
            </template>

            <template v-if="og.emailMode === 'template' && og.emailSelectedTemplate">
              <el-divider content-position="left">模板预览</el-divider>
              <el-form-item label="主题">
                <el-input :model-value="ogRenderedSubject" disabled />
              </el-form-item>
              <el-form-item label="正文">
                <div class="content-preview" v-html="og.emailSelectedTemplate.content"></div>
              </el-form-item>
            </template>

            <template v-if="og.emailMode === 'template' && og.emailTemplateVars.some(v => ogIsImageVar(v))">
              <el-form-item label="插入图片">
                <div class="image-upload-area">
                  <el-upload :show-file-list="false" :before-upload="ogBeforeImageUpload" :http-request="ogUploadImage" accept="image/*" action="#">
                    <el-button :loading="og.emailImageUploading" size="small">选择图片</el-button>
                  </el-upload>
                  <span class="upload-tip">上传后在模板正文中以 cid 或 URL 引用</span>
                </div>
                <div v-if="og.emailImageUrls.length" class="image-preview-list">
                  <div v-for="(url, idx) in og.emailImageUrls" :key="idx" class="image-preview-item">
                    <img :src="url" class="image-thumb" @click="ogCopyImageUrl(url)" title="点击复制 URL" />
                    <span class="image-url-text">{{ ogGetImageName(url) }}</span>
                    <div class="image-url-actions">
                      <el-button size="small" text @click="ogCopyImageUrl(url)">复制URL</el-button>
                      <el-button size="small" type="danger" text @click="og.emailImageUrls.splice(idx, 1)">删除</el-button>
                    </div>
                  </div>
                </div>
              </el-form-item>
            </template>

            <el-divider />
            <el-form-item label="附件">
              <el-upload :show-file-list="false" :http-request="ogUploadEmailAtt" action="#">
                <el-button :loading="og.emailUploading">添加附件</el-button>
              </el-upload>
              <div v-if="og.emailAttachments.length" class="attach-items" style="margin-top: 8px">
                <div
                  v-for="(a, idx) in og.emailAttachments"
                  :key="idx"
                  class="attach-row"
                >
                  <span>{{ a.name || a.url }}</span>
                  <el-button
                    size="small"
                    type="danger"
                    :icon="Delete"
                    circle
                    @click="og.emailAttachments.splice(idx, 1)"
                  />
                </div>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="ogSendEmail"
                :loading="og.emailSending"
                size="large"
                style="width: 120px"
              >
                {{ og.emailSending ? '发送中...' : '发送邮件' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Tab 5: 费用 -->
        <el-tab-pane label="费用" name="fees">
          <el-table :data="og.fees" border stripe>
            <el-table-column prop="feeType" label="费用类型" width="120" />
            <el-table-column prop="feeAmount" label="金额" width="120" />
            <el-table-column prop="paymentStatus" label="缴费状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.paymentStatus === 'PAID' ? 'success' : row.paymentStatus === 'VOID' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ { PENDING: '待缴', PAID: '已缴', PARTIAL: '部分', VOID: '作废' }[row.paymentStatus] || row.paymentStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="payer" label="付款方" width="140" />
            <el-table-column label="缴费止期" width="110">
              <template #default="{ row }">
                {{ formatDate(row.paymentDeadline) }}
              </template>
            </el-table-column>
            <el-table-column label="实缴日期" width="110">
              <template #default="{ row }">
                {{ formatDate(row.paymentDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>

        <!-- Tab 6: 开票 -->
        <el-tab-pane label="开票" name="invoices">
          <el-table :data="og.invoices" border stripe>
            <el-table-column prop="invoiceType" label="发票类型" width="100" />
            <el-table-column prop="invoiceTitle" label="发票抬头" min-width="160" />
            <el-table-column prop="taxNo" label="税号" width="150" />
            <el-table-column prop="invoiceAmount" label="开票金额" width="120" />
            <el-table-column prop="invoiceStatus" label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.invoiceStatus === 'ISSUED' ? 'success' : row.invoiceStatus === 'VOID' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ { PENDING: '待开', ISSUED: '已开', VOID: '作废' }[row.invoiceStatus] || row.invoiceStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="invoiceNo" label="发票号码" width="140" />
            <el-table-column label="开票日期" width="110">
              <template #default="{ row }">
                {{ formatDate(row.invoiceDate) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="og.dialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import {
  search,
  getById,
  update,
  changeStatus,
  getStatusLogs,
  getFees,
  getInvoices,
  getTemplateList,
  sendMail,
  sendMailWithTemplate,
  uploadFile
} from '../../../api/disclosureWorkflow'
import ApplicantAgentSelect from '../../../components/ApplicantAgentSelect.vue'
import ApplicationPackageComposer from '../../../components/ApplicationPackageComposer.vue'
import SearchBar from '../../../components/SearchBar.vue'
import { downloadFile, formatDate, formatDateTime } from '../../../utils/format'
import { autoFillTemplateVars, templateVarLabel, renderTemplate } from '../../../utils/templateHelper'
import { useUserStore } from '../../../stores/user'
import { statusTag, fmtSize, hasPerm, userId, userName } from './shared'

const { state: userState } = useUserStore()

// ========================== State ==========================
const og = reactive({
  searchFields: [
    { key: 'disclosureName', label: '名称', type: 'input', matchType: 'fuzzy', width: 200 },
    { key: 'internalNo', label: '内部编号', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'tempNo', label: '临时编号', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'patentType', label: '专利类型', type: 'select', options: [{label:'发明',value:'发明'},{label:'实用新型',value:'实用新型'},{label:'外观',value:'外观'}], width: 120 },
    { key: 'patentStatus', label: '状态', type: 'select', options: [{label:'草稿',value:'草稿'},{label:'受理',value:'受理'},{label:'审核中',value:'审核中'},{label:'定稿',value:'定稿'},{label:'驳回',value:'驳回'}], width: 120 },
    { key: 'applicant', label: '申请人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'inventor', label: '发明人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'agent', label: '代理人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'sponsor', label: '主办人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'contactPerson', label: '联系人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'manager', label: '管理人', type: 'input', matchType: 'fuzzy', width: 160 },
    { key: 'syncedToPatent', label: '同步状态', type: 'select', options: [{label:'已同步',value:1},{label:'未同步',value:0}], width: 120 },
    { key: 'disclosureDateRange', label: '交底日期', type: 'daterange', width: 260 },
    { key: 'createTimeRange', label: '创建时间', type: 'daterange', width: 260 }
  ],
  query: { 
    disclosureName: '', internalNo: '', tempNo: '', patentType: '', patentStatus: '',
    applicant: '', inventor: '', agent: '', sponsor: '', contactPerson: '', manager: '',
    syncedToPatent: '', disclosureDateRange: null, createTimeRange: null 
  },
  page: { pageNum: 1, pageSize: 10, total: 0 },
  tableData: [],
  loading: false,
  dialog: { visible: false, activeTab: 'basic' },
  form: {},
  saving: false,
  statusForm: { toStatus: '', remark: '' },
  statusLogs: [],
  statusSaving: false,
  packages: [],
  uploading: false,
  pkgType: '',
  fees: [],
  invoices: [],
  emailMode: 'normal',
  emailForm: { to: '', cc: '', subject: '', text: '', templateCode: '' },
  emailTemplateVars: [],
  emailTemplateData: {},
  emailSelectedTemplate: null,
  emailAttachments: [],
  emailImageUrls: [],
  emailSending: false,
  emailUploading: false,
  emailImageUploading: false,
  templateList: [],
  enabledTemplates: computed(() => og.templateList.filter((t) => t.enabled === 1))
})

const ogRenderedSubject = computed(() => {
  if (!og.emailSelectedTemplate) return ''
  return renderTemplate(og.emailSelectedTemplate.subject, og.emailTemplateData)
})

// ========================== Data Fetching ==========================
const ogFetchData = async () => {
  og.loading = true
  try {
    const body = {}
    if (userId.value) body.sponsorUserId = userId.value
    if (userName.value) body.sponsor = userName.value
    const keyword = og.query.internalNo
    Object.keys(og.query).forEach((k) => {
      if (k === 'disclosureDateRange' && og.query[k] && og.query[k].length === 2) {
        body.disclosureDateStart = og.query[k][0]
        body.disclosureDateEnd = og.query[k][1]
      } else if (k === 'createTimeRange' && og.query[k] && og.query[k].length === 2) {
        body.createTimeStart = og.query[k][0] + ' 00:00:00'
        body.createTimeEnd = og.query[k][1] + ' 23:59:59'
      } else if (og.query[k] !== '' && og.query[k] !== null && k !== 'internalNo') {
        body[k] = og.query[k]
      }
    })
    const r = await search(
      { pageNum: og.page.pageNum, pageSize: og.page.pageSize },
      body
    )
    if (r.code === 200) {
      let records = r.data.records || []
      if (keyword) records = records.filter(r => r.internalNo && r.internalNo.includes(keyword))
      og.tableData = records
      og.page.total = r.data.total || 0
    }
  } finally {
    og.loading = false
  }
}

const ogResetQuery = () => {
  Object.keys(og.query).forEach((k) => {
    if (k.endsWith('Range')) og.query[k] = null
    else og.query[k] = ''
  })
  og.page.pageNum = 1
  ogFetchData()
}

// ========================== Process Dialog ==========================
const ogOpenProcess = async (row) => {
  try {
    const r = await getById(row.id)
    if (r.code === 200) {
      Object.assign(og.form, r.data)
      og.dialog = { visible: true, activeTab: 'basic' }
      og.statusForm = { toStatus: '', remark: '' }
      og.statusLogs = []
      og.packages = []
      og.fees = []
      og.invoices = []
      og.emailMode = 'normal'
      og.emailForm = {
        to: r.data.contactEmail || '',
        cc: '',
        subject: `关于专利交底"${r.data.disclosureName}"的通知`,
        text: '',
        templateCode: ''
      }
      og.emailTemplateVars = []
      og.emailTemplateData = {}
      og.emailSelectedTemplate = null
      og.emailAttachments = []
      og.emailImageUrls = []
    }
  } catch {
    /* ignore */
  }
}

// ========================== Basic Info ==========================
const ogSaveBasic = async () => {
  if (!og.form.disclosureDate) {
    ElMessage.warning('请选择交底日期')
    return
  }
  og.saving = true
  try {
    const { sponsor, sponsorUserId, ...editableForm } = og.form
    const r = await update(editableForm)
    if (r.code === 200) {
      ElMessage.success('已保存')
    }
  } finally {
    og.saving = false
  }
}

// ========================== Status Change ==========================
const ogChangeStatus = async () => {
  if (!og.statusForm.toStatus) {
    ElMessage.warning('请选择新状态')
    return
  }
  og.statusSaving = true
  try {
    const r = await changeStatus(og.form.id, {
      toStatus: og.statusForm.toStatus,
      remark: og.statusForm.remark
    })
    if (r.code === 200) {
      ElMessage.success('状态变更成功')
      og.form.patentStatus = og.statusForm.toStatus
      og.statusForm.toStatus = ''
      og.statusForm.remark = ''
      ogFetchStatusLogs()
      ogFetchData()
    }
  } finally {
    og.statusSaving = false
  }
}

const ogFetchStatusLogs = async () => {
  try {
    const r = await getStatusLogs(og.form.id)
    if (r.code === 200) og.statusLogs = r.data || []
  } catch {
    og.statusLogs = []
  }
}

// ========================== Fees & Invoices ==========================
const ogFetchFees = async () => {
  try {
    const r = await getFees(og.form.id)
    if (r.code === 200) og.fees = r.data || []
  } catch {
    og.fees = []
  }
}

const ogFetchInvoices = async () => {
  try {
    const r = await getInvoices(og.form.id)
    if (r.code === 200) og.invoices = r.data || []
  } catch {
    og.invoices = []
  }
}

// ========================== Tab Change ==========================
const ogOnTabChange = (tab) => {
  if (tab === 'status') ogFetchStatusLogs()
  else if (tab === 'fees') ogFetchFees()
  else if (tab === 'invoices') ogFetchInvoices()
  else if (tab === 'email' && !og.templateList.length) ogLoadTemplates()
}

// ========================== Email ==========================
const ogLoadTemplates = async () => {
  try {
    const r = await getTemplateList()
    if (r.code === 200) og.templateList = r.data || []
  } catch {
    og.templateList = []
  }
}

const parseVars = (text) => [
  ...new Set((text.match(/\$\{(\w+)\}/g) || []).map((m) => m.slice(2, -1)))
]

const ogOnEmailTemplateSelect = (code) => {
  Object.keys(og.emailTemplateData).forEach((k) => delete og.emailTemplateData[k])
  if (!code) {
    og.emailSelectedTemplate = null
    og.emailTemplateVars = []
    return
  }
  const tpl = og.templateList.find((t) => t.templateCode === code)
  if (tpl) {
    og.emailSelectedTemplate = tpl
    const vars = [
      ...new Set([
        ...parseVars(tpl.subject || ''),
        ...parseVars(tpl.content || '')
      ])
    ]
    og.emailTemplateVars = vars
    Object.assign(og.emailTemplateData, autoFillTemplateVars(vars, {
      disclosure: og.form,
      user: userState.userInfo || {}
    }))
  }
}

const ogOnEmailModeChange = () => {
  og.emailForm.subject = ''
  og.emailForm.text = ''
  og.emailForm.templateCode = ''
  Object.keys(og.emailTemplateData).forEach((k) => delete og.emailTemplateData[k])
  og.emailSelectedTemplate = null
  og.emailTemplateVars = []
}

const ogUploadEmailAtt = async (opt) => {
  const { file, onSuccess, onError } = opt
  og.emailUploading = true
  try {
    const r = await uploadFile(file)
    if (r.code === 200) {
      og.emailAttachments.push({ name: file.name, url: r.data })
      ElMessage.success('上传成功')
      onSuccess(r)
    } else {
      onError(new Error(r.message))
    }
  } catch (e) {
    onError(e)
  } finally {
    og.emailUploading = false
  }
}

const ogBeforeImageUpload = (file) => {
  if (!file.type.startsWith('image/')) { ElMessage.warning('仅支持图片文件'); return false }
  if (file.size > 5 * 1024 * 1024) { ElMessage.warning('图片大小不能超过 5MB'); return false }
  return true
}

const ogUploadImage = async (opt) => {
  const { file, onSuccess, onError } = opt
  og.emailImageUploading = true
  try {
    const r = await uploadFile(file)
    if (r.code === 200) {
      og.emailImageUrls.push(r.data)
      ElMessage.success('图片上传成功')
      const imageVar = og.emailTemplateVars.find(v => ogIsImageVar(v))
      if (imageVar) {
        og.emailTemplateData[imageVar] = r.data
      }
      onSuccess(r)
    } else {
      onError(new Error(r.message || '上传失败'))
    }
  } catch (e) {
    onError(e)
  } finally { og.emailImageUploading = false }
}

const ogIsImageVar = (name) => /image|logo|pic|img|photo|banner|icon|avatar|qr/i.test(name)

const ogGetImageName = (url) => {
  const m = (url || '').match(/[?&]name=([^&]+)/)
  return m ? decodeURIComponent(m[1]) : (url || '').split('/').pop() || 'image'
}

const ogCopyImageUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('URL 已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动选择 URL')
  }
}

const ogSendEmail = async () => {
  if (!og.emailForm.to.trim()) {
    ElMessage.warning('请输入收件人')
    return
  }
  if (og.emailMode === 'normal') {
    if (!og.emailForm.subject.trim() || !og.emailForm.text.trim()) {
      ElMessage.warning('主题和正文不能为空')
      return
    }
  } else {
    if (!og.emailForm.templateCode) {
      ElMessage.warning('请选择邮件模板')
      return
    }
    const ev = og.emailTemplateVars.find(
      (v) => !og.emailTemplateData[v]?.trim()
    )
    if (ev) {
      ElMessage.warning(`请填写模板变量：${ev}`)
      return
    }
  }
  og.emailSending = true
  try {
    const attachmentUrls = [...og.emailAttachments.map(a => a.url), ...og.emailImageUrls]
    let r
    if (og.emailMode === 'normal') {
      r = await sendMail({
        disclosureId: og.form.id,
        to: og.emailForm.to.trim(),
        subject: og.emailForm.subject.trim(),
        text: og.emailForm.text.trim(),
        cc: og.emailForm.cc.trim() || undefined,
        attachmentUrls
      })
    } else {
      r = await sendMailWithTemplate({
        disclosureId: og.form.id,
        to: og.emailForm.to.trim(),
        cc: og.emailForm.cc.trim() || undefined,
        subject: ogRenderedSubject.value,
        templateCode: og.emailForm.templateCode,
        templateData: { ...og.emailTemplateData },
        attachmentUrls
      })
    }
    if (r.code === 200) {
      ElMessage.success('发送成功')
    }
  } finally {
    og.emailSending = false
  }
}

// ========================== Init ==========================
onMounted(() => {
  ogFetchData()
})
</script>

<style scoped>
.page {
  max-width: 1600px;
}

.search-form {
  margin-bottom: 10px;
}

.toolbar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.view-hint {
  color: #909399;
  font-size: 13px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
  display: flex;
}

.upload-group {
  margin-bottom: 4px;
}

.upload-group h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.attach-items {
  margin-top: 8px;
}

.attach-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.attach-row:last-child {
  border-bottom: none;
}

.file-link {
  color: #409eff;
  cursor: pointer;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-link:hover {
  text-decoration: underline;
}

.file-size {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.empty-hint {
  color: #909399;
  font-size: 13px;
  padding: 12px 0;
}

.content-preview {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 13px;
}
.image-upload-area { display: flex; align-items: center; gap: 12px; }
.image-preview-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
.image-preview-item { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px; border: 1px solid #e4e7ed; border-radius: 4px; background: #fafafa; }
.image-thumb { width: 100px; height: 80px; object-fit: cover; border-radius: 2px; cursor: pointer; transition: opacity 0.2s; }
.image-thumb:hover { opacity: 0.8; }
.image-url-text { font-size: 12px; color: #606266; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.image-url-actions { display: flex; gap: 4px; }
.var-image-filled { display: flex; align-items: center; gap: 10px; }
.var-image-thumb { width: 60px; height: 60px; object-fit: cover; border: 1px solid #e4e7ed; border-radius: 4px; }
.var-image-waiting { color: #909399; font-size: 13px; }
</style>
