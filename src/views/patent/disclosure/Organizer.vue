<template>
  <div class="page">
    <el-card>
      <!-- 筛选面板 -->
      <div class="filter-box">
        <div class="filter-box__title"><el-icon :size="15"><Search /></el-icon><span>筛选条件</span></div>
        <div class="filter-grid">
          <div class="filter-cell" v-for="f in og.searchFields" :key="f.key">
            <label class="filter-cell__label">{{ f.label }}</label>
            <el-input v-if="f.type === 'input'" v-model="og.query[f.key]" clearable />
            <el-select v-else-if="f.type === 'select'" v-model="og.query[f.key]" clearable placeholder="全部" @change="ogFetchData">
              <el-option v-for="o in f.options" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </div>
        </div>
        <div class="filter-actions"><el-button type="primary" @click="ogFetchData">查询</el-button><el-button @click="ogResetQuery">重置</el-button></div>
      </div>

      <!-- 表格区域 -->
      <div class="table-section">
        <div class="table-section__bar">
          <span class="table-section__count">共 <strong>{{ og.page.total }}</strong> 条</span>
          <el-button size="small" @click="ogFetchData" :icon="Refresh">刷新</el-button>
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
            <el-button size="small" type="primary" link @click="ogOpenProcess(row)">处理</el-button>
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
      </div>
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
            <input ref="emailImageFileInputRef" type="file" accept="image/*" style="display:none" @change="ogOnEmailImageFileChosen" />
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
                      <el-button size="small" type="danger" text @click="ogOnEmailClearImageVar(v)">清除</el-button>
                    </div>
                  </template>
                  <span v-else class="var-image-waiting">上传图片后自动填入模板对应位置</span>
                </el-form-item>
                <el-form-item v-else :label="templateVarLabel(v)" required>
                  <el-input v-model="og.emailTemplateData[v]" :placeholder="`输入${templateVarLabel(v)}`" @input="ogOnEmailVarChange" />
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
              <el-divider content-position="left">邮件预览</el-divider>
              <el-form-item label="主题">
                <el-input v-model="og.emailPreviewSubject" @input="ogOnEmailSubjectInput" placeholder="邮件主题" />
              </el-form-item>
              <el-form-item label="正文">
                <div class="editor-toolbar" @mousedown.prevent>
                  <el-button-group>
                    <el-button size="small" text title="撤销" @click="ogEmailExecCmd('undo')"><el-icon><RefreshLeft /></el-icon></el-button>
                    <el-button size="small" text title="重做" @click="ogEmailExecCmd('redo')"><el-icon><RefreshRight /></el-icon></el-button>
                  </el-button-group>
                  <el-divider direction="vertical" />
                  <el-button-group>
                    <el-button size="small" text title="加粗" @click="ogEmailExecCmd('bold')"><b>B</b></el-button>
                    <el-button size="small" text title="斜体" @click="ogEmailExecCmd('italic')"><i>I</i></el-button>
                    <el-button size="small" text title="下划线" @click="ogEmailExecCmd('underline')"><u>U</u></el-button>
                    <el-button size="small" text title="删除线" @click="ogEmailExecCmd('strikeThrough')"><s>S</s></el-button>
                  </el-button-group>
                  <el-divider direction="vertical" />
                  <el-button-group>
                    <el-button size="small" text title="无序列表" @click="ogEmailExecCmd('insertUnorderedList')"><el-icon><List /></el-icon></el-button>
                    <el-button size="small" text title="有序列表" @click="ogEmailExecCmd('insertOrderedList')"><el-icon><Tickets /></el-icon></el-button>
                  </el-button-group>
                  <el-divider direction="vertical" />
                  <el-button-group>
                    <el-button size="small" text title="插入链接" @click="ogEmailInsertLink"><el-icon><Link /></el-icon></el-button>
                    <el-button size="small" text title="插入图片" :loading="og.emailInsertingImage" @click="ogEmailInsertImage"><el-icon><Picture /></el-icon></el-button>
                    <el-button size="small" text title="清除格式" @click="ogEmailExecCmd('removeFormat')"><el-icon><Delete /></el-icon></el-button>
                  </el-button-group>
                  <div class="editor-toolbar__spacer"></div>
                  <el-button size="small" @click="ogRegenerateEmailPreview" title="根据模板变量重新生成预览">重新生成</el-button>
                </div>
                <div
                  ref="emailContentEditableRef"
                  class="content-preview editable-preview"
                  contenteditable="true"
                  v-loading="og.emailPreviewLoading"
                  @input="ogOnEmailContentInput"
                  @mouseup="ogEmailCaptureEditorSelection"
                  @keyup="ogEmailCaptureEditorSelection"
                  @focus="ogEmailCaptureEditorSelection"
                ></div>
                <div v-if="og.emailContentDirty || og.emailSubjectDirty" class="dirty-hint">
                  <el-icon><InfoFilled /></el-icon>
                  <span>已手动修改，修改模板变量不会自动刷新预览，点击『重新生成』恢复模板渲染。</span>
                </div>
              </el-form-item>
            </template>

            <template v-if="og.emailMode === 'template' && og.emailImageUrls.length">
              <el-form-item label="已插入图片">
                <div class="image-preview-list" @mousedown.prevent>
                  <div v-for="(url, idx) in og.emailImageUrls" :key="idx" class="image-preview-item">
                    <img :src="url" class="image-thumb" />
                    <span class="image-url-text">{{ ogGetImageName(url) }}</span>
                    <div class="image-url-actions">
                      <el-button size="small" type="primary" text @click="ogEmailInsertImageAtCaret(url)">插入</el-button>
                      <el-button size="small" type="danger" text @click="ogRemoveEmailImage(idx)">删除</el-button>
                    </div>
                  </div>
                </div>
                <div class="image-insert-hint">先在预览正文中点击图片要插入的位置，再点『插入』。</div>
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
                    @click="ogRemoveEmailAtt(idx)"
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
import { Delete, Search, Refresh, RefreshLeft, RefreshRight, List, Tickets, Link, Picture, InfoFilled } from '@element-plus/icons-vue'
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
  renderMailPreview,
  uploadFile,
  deleteFile
} from '../../../api/disclosureWorkflow'
import ApplicantAgentSelect from '../../../components/ApplicantAgentSelect.vue'
import ApplicationPackageComposer from '../../../components/ApplicationPackageComposer.vue'
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
  emailInsertingImage: false,
  emailPreviewSubject: '',
  emailPreviewContent: '',
  emailContentDirty: false,
  emailSubjectDirty: false,
  emailPreviewLoading: false,
  templateList: [],
  enabledTemplates: computed(() => og.templateList.filter((t) => t.enabled === 1))
})

const emailContentEditableRef = ref(null)
const emailImageFileInputRef = ref(null)
let emailRenderTimer = null

// ==================== 邮件预览渲染 ====================
const ogEmailSyncEditorDom = () => {
  if (emailContentEditableRef.value) {
    emailContentEditableRef.value.innerHTML = og.emailPreviewContent
  }
}

/** 后端渲染失败时的前端兜底渲染（仅刷新未手动编辑的部分） */
const ogEmailRenderLocalPreview = () => {
  if (!og.emailSelectedTemplate) return
  if (!og.emailSubjectDirty) og.emailPreviewSubject = renderTemplate(og.emailSelectedTemplate.subject, og.emailTemplateData)
  if (!og.emailContentDirty) {
    og.emailPreviewContent = renderTemplate(og.emailSelectedTemplate.content, og.emailTemplateData)
    ogEmailSyncEditorDom()
  }
}

const ogFetchEmailPreview = async () => {
  if (!og.emailSelectedTemplate || !og.emailForm.templateCode) return
  og.emailPreviewLoading = true
  try {
    const r = await renderMailPreview({
      templateCode: og.emailForm.templateCode,
      templateData: { ...og.emailTemplateData }
    })
    if (r.code === 200) {
      if (!og.emailSubjectDirty) og.emailPreviewSubject = r.data.subject || ''
      if (!og.emailContentDirty) {
        og.emailPreviewContent = r.data.content || ''
        ogEmailSyncEditorDom()
      }
    } else {
      ogEmailRenderLocalPreview()
    }
  } catch (e) {
    ogEmailRenderLocalPreview()
  } finally {
    og.emailPreviewLoading = false
  }
}

const ogOnEmailVarChange = () => {
  clearTimeout(emailRenderTimer)
  if (og.emailContentDirty && og.emailSubjectDirty) return
  emailRenderTimer = setTimeout(ogFetchEmailPreview, 400)
}

const ogOnEmailSubjectInput = () => { og.emailSubjectDirty = true }

const ogOnEmailContentInput = () => {
  og.emailContentDirty = true
  og.emailPreviewContent = emailContentEditableRef.value ? emailContentEditableRef.value.innerHTML : ''
}

const ogEmailExecCmd = (cmd, value = null) => {
  if (!emailContentEditableRef.value) return
  emailContentEditableRef.value.focus()
  document.execCommand(cmd, false, value)
  ogOnEmailContentInput()
}

const ogEmailInsertLink = () => {
  const url = window.prompt('请输入链接地址（以 http:// 或 https:// 开头）')
  if (!url) return
  ogEmailExecCmd('createLink', url)
}

const ogEmailInsertImage = () => {
  emailImageFileInputRef.value?.click()
}

const ogOnEmailImageFileChosen = async (e) => {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) { ElMessage.warning('仅支持图片文件'); return }
  if (file.size > 5 * 1024 * 1024) { ElMessage.warning('图片大小不能超过 5MB'); return }
  og.emailInsertingImage = true
  try {
    const r = await uploadFile(file)
    if (r.code === 200) {
      og.emailImageUrls.push(r.data)
      // 自动填入模板中第一个空的图片变量（如 qrImageUrl），图片会出现在模板对应位置
      const imageVar = og.emailTemplateVars.find(v => ogIsImageVar(v) && !og.emailTemplateData[v])
      if (imageVar) {
        og.emailTemplateData[imageVar] = r.data
        ogOnEmailVarChange()
        ElMessage.success('图片已上传并填入模板图片位置')
      } else {
        ElMessage.success('图片上传成功，请在预览中点击要插入的位置后点『插入』')
      }
    } else {
      ElMessage.warning(r.message || '图片上传失败')
    }
  } catch (err) {
    ElMessage.warning('图片上传失败')
  } finally {
    og.emailInsertingImage = false
  }
}

// 记录预览内最后一次光标位置，用于把图片插入到用户选择的位置
let ogEmailEditorSelection = null
const ogEmailCaptureEditorSelection = () => {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0 && emailContentEditableRef.value && emailContentEditableRef.value.contains(sel.anchorNode)) {
    ogEmailEditorSelection = sel.getRangeAt(0).cloneRange()
  }
}

const ogEmailInsertImageAtCaret = (url) => {
  const el = emailContentEditableRef.value
  if (!el) return
  el.focus()
  if (ogEmailEditorSelection && document.contains(ogEmailEditorSelection.startContainer)) {
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(ogEmailEditorSelection)
    }
  }
  document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:100%" />`)
  ogOnEmailContentInput()
}

const ogRegenerateEmailPreview = () => {
  og.emailContentDirty = false
  og.emailSubjectDirty = false
  og.emailImageUrls = []
  clearTimeout(emailRenderTimer)
  ogFetchEmailPreview()
}

const ogEmailGetHtml = () => {
  return emailContentEditableRef.value ? emailContentEditableRef.value.innerHTML : og.emailPreviewContent
}

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
      const userEmail = userState.userInfo?.email || userState.email || ''
      og.emailForm = {
        to: r.data.contactEmail || '',
        cc: userEmail,
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
  clearTimeout(emailRenderTimer)
  og.emailPreviewSubject = ''
  og.emailPreviewContent = ''
  og.emailContentDirty = false
  og.emailSubjectDirty = false
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
    ogFetchEmailPreview()
  }
}

const ogOnEmailModeChange = () => {
  og.emailForm.subject = ''
  og.emailForm.text = ''
  og.emailForm.templateCode = ''
  Object.keys(og.emailTemplateData).forEach((k) => delete og.emailTemplateData[k])
  og.emailSelectedTemplate = null
  og.emailTemplateVars = []
  og.emailPreviewSubject = ''
  og.emailPreviewContent = ''
  og.emailContentDirty = false
  og.emailSubjectDirty = false
  clearTimeout(emailRenderTimer)
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

const ogIsImageVar = (name) => /image|logo|pic|img|photo|banner|icon|avatar|qr/i.test(name)

const ogOnEmailClearImageVar = (v) => {
  og.emailTemplateData[v] = ''
  ogOnEmailVarChange()
}

const ogRemoveEmailImage = async (idx) => {
  const url = og.emailImageUrls[idx]
  og.emailImageUrls.splice(idx, 1)
  // 若该图片已填入模板图片变量，一并清除
  const varName = og.emailTemplateVars.find(v => og.emailTemplateData[v] === url)
  if (varName) {
    og.emailTemplateData[varName] = ''
  }
  if (emailContentEditableRef.value) {
    emailContentEditableRef.value.querySelectorAll('img').forEach(img => {
      if (img.getAttribute('src') === url) img.remove()
    })
  }
  // 预览处于模板渲染态（未手动编辑）时，清除变量后重新渲染以恢复占位；否则按手动编辑处理
  if (varName && !og.emailContentDirty) {
    ogOnEmailVarChange()
  } else {
    ogOnEmailContentInput()
  }
  if (url) {
    const res = await deleteFile(url)
    if (!res || res.code !== 200) {
      ElMessage.warning('服务器文件删除失败（请确认后端已更新删除接口），已仅从界面移除')
    }
  }
}

const ogRemoveEmailAtt = async (idx) => {
  const att = og.emailAttachments[idx]
  og.emailAttachments.splice(idx, 1)
  if (att?.url) {
    const res = await deleteFile(att.url)
    if (!res || res.code !== 200) {
      ElMessage.warning('服务器文件删除失败（请确认后端已更新删除接口）')
    }
  }
}

const ogGetImageName = (url) => {
  const m = (url || '').match(/[?&]name=([^&]+)/)
  return m ? decodeURIComponent(m[1]) : (url || '').split('/').pop() || 'image'
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
    const bodyHtml = ogEmailGetHtml()
    if (!bodyHtml.trim()) { ElMessage.warning('邮件正文为空，请等待预览生成或编辑预览内容后再发送'); return }
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
        subject: og.emailPreviewSubject.trim() || undefined,
        text: ogEmailGetHtml(),
        templateCode: og.emailForm.templateCode,
        templateData: { ...og.emailTemplateData },
        attachmentUrls
      })
    }
    if (r.code === 200) {
      ElMessage.success('发送成功')
      // 发送成功跳转回工作界面（关闭处理对话框）
      og.dialog.visible = false
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
  padding: 16px;
  border-radius: 4px;
  min-height: 150px;
  max-height: 360px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.8;
  border: 1px solid #e4e7ed;
}
.editor-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 6px 8px; margin-bottom: 8px; border: 1px solid #e4e7ed; border-radius: 4px; background: #fafafa; }
.editor-toolbar__spacer { flex: 1; }
.editable-preview { background: #fff; border: 1px solid #dcdfe6; outline: none; cursor: text; transition: border-color .2s, box-shadow .2s; }
.editable-preview:focus { border-color: #409eff; box-shadow: 0 0 0 2px rgba(64, 158, 255, .15); }
.editable-preview:empty::before { content: '点击此处可直接编辑邮件正文…'; color: #c0c4cc; pointer-events: none; }
.dirty-hint { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12px; color: #e6a23c; }
.image-insert-hint { margin-top: 6px; font-size: 12px; color: #909399; }
.editable-preview img:not([src]), .editable-preview img[src=""], .editable-preview img[src="#"] { min-width: 140px; min-height: 80px; border: 1px dashed #c0c4cc; background: #f7f8fa; }
.var-image-filled { display: flex; align-items: center; gap: 10px; }
.var-image-thumb { width: 60px; height: 60px; object-fit: cover; border: 1px solid #e4e7ed; border-radius: 4px; }
.var-image-waiting { color: #909399; font-size: 13px; }
.image-preview-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
.image-preview-item { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px; border: 1px solid #e4e7ed; border-radius: 4px; background: #fafafa; }
.image-thumb { width: 100px; height: 80px; object-fit: cover; border-radius: 2px; cursor: pointer; transition: opacity 0.2s; }
.image-thumb:hover { opacity: 0.8; }
.image-url-text { font-size: 12px; color: #606266; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.image-url-actions { display: flex; gap: 4px; }
</style>
