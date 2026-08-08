<template>
  <div class="process-page">
    <el-button class="back-btn" @click="$router.push('/patent/disclosure')" text>
      <el-icon><ArrowLeft /></el-icon> 返回
    </el-button>

    <div class="process-header">
      <div class="process-header__icon">
        <el-icon :size="26"><DocumentChecked /></el-icon>
      </div>
      <div class="process-header__text">
        <h2 class="process-header__title">处理交底：{{ form.disclosureName || '加载中...' }}</h2>
        <p class="process-header__subtitle">
          当前状态：<el-tag :type="statusTag(form.patentStatus)" size="small" effect="dark">{{ form.patentStatus || '-' }}</el-tag>
          <el-button class="edit-basic-btn" type="primary" plain size="small" @click="$router.push(`/patent/disclosure/add?id=${form.id}&returnTo=${encodeURIComponent('/patent/disclosure/process/'+form.id)}`)">
            <el-icon :size="14"><Edit /></el-icon> 编辑基本信息
          </el-button>
        </p>
      </div>
      <el-tag v-if="emailSent" type="success" size="default" style="margin-left:auto">邮件已发送</el-tag>
      <el-tag v-else type="warning" size="default" style="margin-left:auto">请先发送邮件</el-tag>
    </div>

    <el-card class="process-card">
      <el-alert v-if="!emailSent" type="warning" show-icon :closable="false" style="margin-bottom:12px">
        <template #title>请先发送邮件 — 发送成功后，状态变更、申请包、费用、开票功能才会解锁</template>
      </el-alert>
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- 1. 发送邮件 -->
        <el-tab-pane label="发送邮件" name="email">
          <MailComposer
            mode="inline"
            :show-header="false"
            :shadow="'never'"
            :body-style="{ padding: '4px 0 0 0' }"
            :disclosure-id="form.id"
            :reference-id="referenceId"
            :context-data="{ disclosure: form }"
            :default-to="form.contactEmail || ''"
            :default-cc="''"
            :default-subject="defaultSubject"
            @sent="onMailSent"
          />
          <template v-if="mailRecords.length">
            <el-divider />
            <h4 style="margin:4px 0 8px">发送记录（按关联ID查询）</h4>
            <el-table :data="mailRecords" border stripe size="small">
              <el-table-column prop="subject" label="主题" min-width="220" show-overflow-tooltip />
              <el-table-column prop="toEmails" label="收件人" min-width="150" show-overflow-tooltip />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.sendStatus === 1 ? 'success' : row.sendStatus === 2 ? 'danger' : 'warning'" size="small">
                    {{ { 0: '待发送', 1: '成功', 2: '失败' }[row.sendStatus] || row.sendStatus }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.sentAt || row.createTime) }}</template>
              </el-table-column>
            </el-table>
          </template>
        </el-tab-pane>

        <!-- 2-5 状态变更/申请包/费用/开票 需先发邮件 -->
        <el-tab-pane label="状态变更" name="status">
          <div v-if="!emailSent" class="locked-hint">
            <el-icon :size="18"><Lock /></el-icon>
            <span>请先在"发送邮件"标签页发送邮件后，再进行状态变更操作</span>
          </div>
          <template v-else>
          <el-form label-width="100px">
            <el-form-item label="当前状态"><el-tag :type="statusTag(form.patentStatus)" effect="dark">{{ form.patentStatus || '无' }}</el-tag></el-form-item>
            <el-form-item label="变更为" required>
              <el-select v-model="statusForm.toStatus" placeholder="选择新状态" style="width:220px">
                <el-option label="草稿" value="草稿" /><el-option label="受理" value="受理" /><el-option label="审核中" value="审核中" /><el-option label="定稿" value="定稿" /><el-option label="驳回" value="驳回" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注"><el-input v-model="statusForm.remark" type="textarea" :rows="3" placeholder="变更原因" /></el-form-item>
            <el-form-item><el-button type="primary" @click="changeStatusFn" :loading="statusSaving">确认变更</el-button></el-form-item>
          </el-form>
          <el-divider /><h4 style="margin-bottom:8px">状态变更记录</h4>
          <el-table :data="statusLogs" border stripe size="small">
            <el-table-column prop="fromStatus" label="原状态" width="120" />
            <el-table-column prop="toStatus" label="新状态" width="120" />
            <el-table-column prop="operatorName" label="操作人" width="100" />
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="时间" width="160"><template #default="{ row }">{{ formatDateTime(row.createTime) }}</template></el-table-column>
          </el-table>
          </template>
        </el-tab-pane>

        <el-tab-pane label="申请包" name="packages">
          <div v-if="!emailSent" class="locked-hint">
            <el-icon :size="18"><Lock /></el-icon>
            <span>请先在"发送邮件"标签页发送邮件后，再进行申请包操作</span>
          </div>
          <ApplicationPackageComposer v-else :disclosure="form" />
        </el-tab-pane>

        <el-tab-pane label="费用" name="fees">
          <div v-if="!emailSent" class="locked-hint">
            <el-icon :size="18"><Lock /></el-icon>
            <span>请先在"发送邮件"标签页发送邮件后，再查看费用信息</span>
          </div>
          <template v-else>
          <el-table :data="fees" border stripe>
            <el-table-column prop="feeType" label="费用类型" width="120" />
            <el-table-column prop="feeAmount" label="金额" width="120" />
            <el-table-column prop="paymentStatus" label="缴费状态" width="100"><template #default="{ row }"><el-tag :type="row.paymentStatus==='PAID'?'success':row.paymentStatus==='VOID'?'danger':'warning'" size="small">{{ {PENDING:'待缴',PAID:'已缴',PARTIAL:'部分',VOID:'作废'}[row.paymentStatus]||row.paymentStatus }}</el-tag></template></el-table-column>
            <el-table-column prop="payer" label="付款方" width="140" />
            <el-table-column label="缴费止期" width="110"><template #default="{ row }">{{ formatDate(row.paymentDeadline) }}</template></el-table-column>
            <el-table-column label="实缴日期" width="110"><template #default="{ row }">{{ formatDate(row.paymentDate) }}</template></el-table-column>
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
          </el-table>
          </template>
        </el-tab-pane>

        <el-tab-pane label="开票" name="invoices">
          <div v-if="!emailSent" class="locked-hint">
            <el-icon :size="18"><Lock /></el-icon>
            <span>请先在"发送邮件"标签页发送邮件后，再查看开票信息</span>
          </div>
          <template v-else>
          <el-table :data="invoices" border stripe>
            <el-table-column prop="invoiceType" label="发票类型" width="100" />
            <el-table-column prop="invoiceTitle" label="发票抬头" min-width="160" />
            <el-table-column prop="taxNo" label="税号" width="150" />
            <el-table-column prop="invoiceAmount" label="开票金额" width="120" />
            <el-table-column prop="invoiceStatus" label="状态" width="100"><template #default="{ row }"><el-tag :type="row.invoiceStatus==='ISSUED'?'success':row.invoiceStatus==='VOID'?'danger':'warning'" size="small">{{ {PENDING:'待开',ISSUED:'已开',VOID:'作废'}[row.invoiceStatus]||row.invoiceStatus }}</el-tag></template></el-table-column>
            <el-table-column prop="invoiceNo" label="发票号码" width="140" />
            <el-table-column label="开票日期" width="110"><template #default="{ row }">{{ formatDate(row.invoiceDate) }}</template></el-table-column>
          </el-table>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, DocumentChecked, Edit, Lock } from '@element-plus/icons-vue'
import { getById, changeStatus, getStatusLogs, getFees, getInvoices } from '../../../api/disclosureWorkflow'
import { getSendLogsByReference } from '../../../api/mailRecord'
import ApplicationPackageComposer from '../../../components/ApplicationPackageComposer.vue'
import MailComposer from '../../../components/MailComposer.vue'
import { formatDate, formatDateTime } from '../../../utils/format'
import { useUserStore } from '../../../stores/user'
import { statusTag } from './shared'

const route = useRoute()
const { state: userState } = useUserStore()
const disclosureId = route.params.id
const activeTab = ref('email')
const emailSent = ref(false)
const form = ref({})
const statusForm = reactive({ toStatus: '', remark: '' })
const statusSaving = ref(false)
const statusLogs = ref([])
const fees = ref([])
const invoices = ref([])
const mailRecords = ref([])

const defaultSubject = computed(() => form.value.disclosureName ? `关于专利交底"${form.value.disclosureName}"的通知` : '')

// 关联ID：优先用内部编号（P表关联键），否则用交底ID
const referenceId = computed(() => form.value.internalNo || String(form.value.id || ''))

const loadData = async () => {
  try {
    const r = await getById(disclosureId)
    if (r.code === 200) form.value = r.data
    await loadMailRecords()
  } catch {
    ElMessage.error('加载失败')
  }
}

// 按关联ID查邮件发送记录，存在发送成功记录才算"邮件已发送"
const loadMailRecords = async () => {
  if (!referenceId.value) {
    mailRecords.value = []
    emailSent.value = false
    return
  }
  try {
    const r = await getSendLogsByReference(referenceId.value)
    if (r.code === 200) {
      mailRecords.value = (r.data || []).map(d => d.mailSendLog)
      emailSent.value = mailRecords.value.some(log => log.sendStatus === 1)
    }
  } catch {
    mailRecords.value = []
    emailSent.value = false
  }
}
const onTabChange = tab => {
  if (tab === 'status' && emailSent.value) fetchStatusLogs()
  else if (tab === 'fees' && emailSent.value) fetchFees()
  else if (tab === 'invoices' && emailSent.value) fetchInvoices()
}
const fetchStatusLogs = async () => { try { const r = await getStatusLogs(form.value.id); if (r.code === 200) statusLogs.value = r.data || [] } catch { statusLogs.value = [] } }
const fetchFees = async () => { try { const r = await getFees(form.value.id); if (r.code === 200) fees.value = r.data || [] } catch { fees.value = [] } }
const fetchInvoices = async () => { try { const r = await getInvoices(form.value.id); if (r.code === 200) invoices.value = r.data || [] } catch { invoices.value = [] } }
const changeStatusFn = async () => {
  if (!statusForm.toStatus) { ElMessage.warning('请选择新状态'); return }
  statusSaving.value = true
  try {
    const r = await changeStatus(form.value.id, { toStatus: statusForm.toStatus, remark: statusForm.remark })
    if (r.code === 200) {
      ElMessage.success('状态变更成功')
      form.value.patentStatus = statusForm.toStatus
      statusForm.toStatus = ''
      statusForm.remark = ''
      fetchStatusLogs()
    }
  } finally { statusSaving.value = false }
}

// 邮件发送成功：刷新记录、解锁其他功能并跳转到状态变更
const onMailSent = () => {
  loadMailRecords()
  activeTab.value = 'status'
  fetchStatusLogs()
}

onMounted(() => { loadData() })
</script>

<style scoped>
.process-page{max-width:1200px}
.back-btn{margin-bottom:10px;color:#5f6b7a;padding-left:0;font-weight:500}
.back-btn:hover{color:#1e88e5}
.process-header{display:flex;align-items:center;gap:14px;padding:14px 20px;margin-bottom:16px;background:linear-gradient(135deg,#e8f0fe,#eef5ff 50%,#f5f7fa);border-radius:10px;border:1px solid #d6e4ff}
.process-header__icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1565c0,#1e88e5);border-radius:10px;color:#fff;box-shadow:0 3px 10px rgba(22,119,255,.3);flex-shrink:0}
.process-header__title{margin:0;font-size:18px;font-weight:700;color:#1a1a2e}
.process-header__subtitle{margin:2px 0 0;font-size:13px;color:#5f6b7a;display:flex;align-items:center;gap:8px}
.edit-basic-btn{margin-left:16px;font-weight:600}
.locked-hint{display:flex;align-items:center;gap:10px;padding:32px 20px;color:#e65100;font-size:14px;font-weight:600}
.process-card{margin-bottom:20px}
.email-actions-bottom{display:flex;justify-content:flex-end;margin-top:8px}
.preview-toggle-btn{border:2px dashed #bbdefb;color:#1e88e5;font-weight:600}
.preview-toggle-btn:hover,.preview-toggle-btn.active{border-color:#1e88e5;background:#e8f0fe}
.preview-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:24px}
.preview-meta{display:flex;flex-direction:column;gap:10px}
.preview-row{display:flex;gap:12px;font-size:14px}
.preview-row strong{color:#37474f;white-space:nowrap;min-width:50px}
.preview-row span{color:#5f6b7a;word-break:break-all}
.preview-note{display:flex;align-items:center;gap:8px;padding:12px 16px;background:#f5f7fa;border-radius:6px;font-size:13px;color:#5f6b7a}
</style>
