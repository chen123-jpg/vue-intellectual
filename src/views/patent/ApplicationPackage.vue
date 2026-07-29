<template>
  <div class="page">
    <el-card>
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 160px">
            <el-option v-for="(meta, code) in statusMap" :key="code" :label="meta.label" :value="code" />
          </el-select>
        </el-form-item>
        <el-form-item label="内部编号">
          <el-input v-model="query.internalNo" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="交底名称">
          <el-input v-model="query.disclosureName" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="主办人">
          <el-input v-model="query.sponsorName" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="internalNo" label="内部编号" width="145" />
        <el-table-column prop="disclosureName" label="交底名称" min-width="210" show-overflow-tooltip />
        <el-table-column prop="sponsorUserName" label="主办人" width="110" />
        <el-table-column prop="processUserName" label="流程专员" width="110" />
        <el-table-column label="状态" width="125">
          <template #default="{ row }">
            <el-tag :type="statusOf(row.status).type" effect="dark" size="small">{{ statusOf(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="roundNo" label="轮次" width="70" align="center" />
        <el-table-column label="发送时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.sentAt) || '-' }}</template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.updateTime) || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page.pageNum"
        v-model:page-size="page.pageSize"
        :total="page.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <el-dialog
      v-model="detailVisible"
      :title="`申请包：${detail?.disclosureName || ''}`"
      width="94vw"
      top="2vh"
      destroy-on-close
    >
      <div v-if="detail" v-loading="detailLoading">
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="内部编号">{{ detail.internalNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="statusOf(detail.status).type" effect="dark">{{ statusOf(detail.status).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核轮次">第 {{ detail.roundNo || 1 }} 轮</el-descriptions-item>
          <el-descriptions-item label="流程专员">{{ detail.processUserName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="主办人">{{ detail.sponsorUserName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ formatDateTime(detail.sentAt) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="接收时间">{{ formatDateTime(detail.receivedAt) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="通过时间">{{ formatDateTime(detail.approvedAt) || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.cnipaSubmissionNo" label="国知局流水号">{{ detail.cnipaSubmissionNo }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.submittedAt" label="国知局提交时间">{{ formatDateTime(detail.submittedAt) }}</el-descriptions-item>
        </el-descriptions>

        <el-alert
          v-if="detail.status === 'REJECTED'"
          :title="`退回原因：${detail.rejectReason || '-'}`"
          type="error"
          :closable="false"
          show-icon
          class="section reject-alert"
        />

        <div class="action-bar">
          <el-button v-if="canReceive" type="primary" :loading="acting" @click="receive">接收申请包</el-button>
          <el-button v-if="canReview" type="danger" @click="openReject">退回修改</el-button>
          <el-button v-if="canReview" type="success" :loading="acting" @click="approve">审核通过并锁定</el-button>
          <el-button v-if="canUnlock" type="warning" @click="unlockVisible = true">管理员解锁</el-button>
          <el-button v-if="canSubmit" type="primary" @click="openSubmit">登记提交国知局</el-button>
          <span v-if="!canReceive && !canReview && !canUnlock && !canSubmit" class="muted">当前状态没有可执行操作</span>
        </div>

        <el-divider content-position="left">当前文件</el-divider>
        <el-table :data="sortedCurrentFiles" border stripe size="small">
          <el-table-column label="文件类型" width="150">
            <template #default="{ row }">
              <el-tag :type="row.fileRole === 'CNIPA_RECEIPT' ? 'success' : 'info'" size="small">
                {{ documentLabel(row.documentCode) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fileName" label="文件名" min-width="230" show-overflow-tooltip />
          <el-table-column prop="versionNo" label="版本" width="70" />
          <el-table-column label="大小" width="100"><template #default="{ row }">{{ fmtSize(row.fileSize) }}</template></el-table-column>
          <el-table-column prop="uploadUserName" label="上传人" width="110" />
          <el-table-column label="上传时间" width="170"><template #default="{ row }">{{ formatDateTime(row.uploadTime) }}</template></el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="preview(row)">预览</el-button>
              <el-button link type="primary" @click="download(row)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-tabs class="section">
          <el-tab-pane :label="`审核问题（${detail.issues?.length || 0}）`">
            <el-empty v-if="!detail.issues?.length" description="暂无审核问题" :image-size="70" />
            <el-table v-else :data="detail.issues" border size="small">
              <el-table-column prop="roundNo" label="轮次" width="70" />
              <el-table-column label="文件" width="150"><template #default="{ row }">{{ documentLabel(row.documentCode) }}</template></el-table-column>
              <el-table-column label="问题说明" min-width="260">
                <template #default="{ row }"><div class="pre-wrap">{{ row.issueText }}</div></template>
              </el-table-column>
              <el-table-column prop="reviewerUserName" label="审核人" width="110" />
              <el-table-column label="时间" width="170"><template #default="{ row }">{{ formatDateTime(row.createTime) }}</template></el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane :label="`历史版本（${detail.fileHistory?.length || 0}）`">
            <el-empty v-if="!detail.fileHistory?.length" description="暂无历史版本" :image-size="70" />
            <el-table v-else :data="detail.fileHistory" border size="small">
              <el-table-column label="文件类型" width="150"><template #default="{ row }">{{ documentLabel(row.documentCode) }}</template></el-table-column>
              <el-table-column prop="fileName" label="文件名" min-width="230" />
              <el-table-column prop="versionNo" label="版本" width="70" />
              <el-table-column prop="uploadUserName" label="上传人" width="110" />
              <el-table-column label="上传时间" width="170"><template #default="{ row }">{{ formatDateTime(row.uploadTime) }}</template></el-table-column>
              <el-table-column label="操作" width="130">
                <template #default="{ row }">
                  <el-button link type="primary" @click="preview(row)">预览</el-button>
                  <el-button link type="primary" @click="download(row)">下载</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane :label="`操作记录（${detail.actions?.length || 0}）`">
            <el-empty v-if="!detail.actions?.length" description="暂无操作记录" :image-size="70" />
            <el-timeline v-else class="timeline">
              <el-timeline-item v-for="(action, index) in detail.actions" :key="index" :timestamp="formatDateTime(action.createTime)" placement="top">
                <el-card shadow="never">
                  <div><strong>{{ actionLabel(action.actionType) }}</strong> · {{ action.operatorUserName || '-' }} · 第 {{ action.roundNo || 1 }} 轮</div>
                  <div v-if="action.fromStatus || action.toStatus" class="muted">{{ statusOf(action.fromStatus).label }} → {{ statusOf(action.toStatus).label }}</div>
                  <div v-if="action.remark" class="pre-wrap">{{ action.remark }}</div>
                  <div v-if="action.mailStatus === 'FAILED'" class="mail-failed">业务已成功，邮件通知失败：{{ action.mailError || '未知原因' }}</div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer><el-button @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="退回申请包" width="680px" append-to-body>
      <el-form label-width="120px">
        <el-form-item label="整体退回原因" required>
          <el-input v-model="rejectForm.reason" type="textarea" :rows="3" maxlength="1000" show-word-limit />
        </el-form-item>
        <el-divider content-position="left">文件问题（选填）</el-divider>
        <el-form-item v-for="slot in documentSlots" :key="slot.code" :label="slot.label">
          <el-input
            v-model="rejectForm.issues[slot.code]"
            type="textarea"
            :rows="3"
            placeholder="没有问题可留空"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="acting" @click="reject">确认退回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="unlockVisible" title="管理员解锁申请包" width="520px" append-to-body>
      <el-alert title="解锁后回到审核中；如需修改文件，仍须由流程专员退回。" type="warning" :closable="false" show-icon />
      <el-input v-model="unlockReason" type="textarea" :rows="4" maxlength="1000" show-word-limit placeholder="请输入解锁原因（必填）" class="section" />
      <template #footer>
        <el-button @click="unlockVisible = false">取消</el-button>
        <el-button type="warning" :loading="acting" @click="unlock">确认解锁</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="submitVisible" title="登记提交国知局" width="560px" append-to-body>
      <el-form label-width="130px">
        <el-form-item label="提交流水号" required><el-input v-model="submitForm.submissionNo" maxlength="100" /></el-form-item>
        <el-form-item label="提交时间" required>
          <el-date-picker v-model="submitForm.submittedAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="XML 回执文件" required>
          <el-upload action="#" :auto-upload="false" :limit="1" accept=".xml" :on-change="onReceiptChange" :on-remove="onReceiptRemove">
            <el-button type="primary" plain>选择 XML 回执</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitVisible = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="submit">确认登记</el-button>
      </template>
    </el-dialog>

    <FilePreviewDialog v-model="previewVisible" :attachment="previewAttachment" :downloadable="false" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  approveBatch,
  createDownloadTicket,
  getBatch,
  getBatches,
  receiveBatch,
  rejectBatch,
  submitCnipa,
  unlockBatch
} from '../../api/applicationPackage'
import { BASE_URL } from '../../utils/request'
import { fetchFileBlob, formatDateTime } from '../../utils/format'
import { useUserStore } from '../../stores/user'
import FilePreviewDialog from '../../components/FilePreviewDialog.vue'

const { state } = useUserStore()
const hasPerm = (permission) => state.permissions.includes(permission)
const statusMap = {
  DRAFT: { label: '待组包', type: 'info' },
  PENDING_RECEIVE: { label: '待接收', type: 'warning' },
  REVIEWING: { label: '审核中', type: 'primary' },
  REJECTED: { label: '已退回', type: 'danger' },
  APPROVED: { label: '审核通过', type: 'success' },
  SUBMITTED: { label: '已提交国知局', type: 'success' }
}
const documentSlots = [
  { code: 'XML', label: 'XML 申请文件' },
  { code: 'REQUEST', label: '请求书' },
  { code: 'DESCRIPTION', label: '说明书' },
  { code: 'CLAIMS', label: '权利要求书' },
  { code: 'ABSTRACT', label: '摘要' },
  { code: 'ABSTRACT_DRAWING', label: '摘要附图' }
]
const documentOrder = [...documentSlots.map((item) => item.code), 'CNIPA_RECEIPT']
const actionLabels = {
  CREATE_DRAFT: '创建草稿', UPLOAD_FILE: '上传文件', REPLACE_FILE: '替换文件', REMOVE_FILE: '移除文件', SEND: '首次发送', RESEND: '重新发送',
  RECEIVE: '接收申请包', REJECT: '退回修改', APPROVE: '审核通过', UNLOCK: '管理员解锁', SUBMIT_CNIPA: '提交国知局'
}

const query = reactive({ status: '', internalNo: '', disclosureName: '', sponsorName: '' })
const page = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const tableData = ref([])
const loading = ref(false)
const detail = ref(null)
const detailVisible = ref(false)
const detailLoading = ref(false)
const acting = ref(false)
const rejectVisible = ref(false)
const rejectForm = reactive({ reason: '', issues: {} })
const unlockVisible = ref(false)
const unlockReason = ref('')
const submitVisible = ref(false)
const submitForm = reactive({ submissionNo: '', submittedAt: '', receipt: null })
const previewVisible = ref(false)
const previewAttachment = ref(null)

const statusOf = (status) => statusMap[status] || { label: status || '-', type: 'info' }
const documentLabel = (code) => documentSlots.find((item) => item.code === code)?.label || (code === 'CNIPA_RECEIPT' ? '国知局 XML 回执' : code || '整体原因')
const actionLabel = (code) => actionLabels[code] || code
const fmtSize = (size) => !size ? '0 B' : size < 1024 ? `${size} B` : size < 1048576 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1048576).toFixed(1)} MB`
const sortedCurrentFiles = computed(() => [...(detail.value?.currentFiles || [])].sort((a, b) => documentOrder.indexOf(a.documentCode) - documentOrder.indexOf(b.documentCode)))
const canReceive = computed(() => detail.value?.status === 'PENDING_RECEIVE' && hasPerm('patent:applicationPackage:receive'))
const canReview = computed(() => detail.value?.status === 'REVIEWING' && hasPerm('patent:applicationPackage:review'))
const canUnlock = computed(() => detail.value?.status === 'APPROVED' && hasPerm('patent:applicationPackage:unlock'))
const canSubmit = computed(() => detail.value?.status === 'APPROVED' && hasPerm('patent:applicationPackage:submit'))

const fetchData = async () => {
  loading.value = true
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize }
    Object.entries(query).forEach(([key, value]) => { if (value) params[key] = value })
    const response = await getBatches(params)
    tableData.value = response.data.records || []
    page.total = response.data.total || 0
  } finally { loading.value = false }
}
const search = () => { page.pageNum = 1; fetchData() }
const resetQuery = () => { Object.keys(query).forEach((key) => { query[key] = '' }); search() }

const loadDetail = async () => {
  if (!detail.value?.packageToken) return
  detailLoading.value = true
  try { detail.value = (await getBatch(detail.value.packageToken)).data }
  finally { detailLoading.value = false }
}
const openDetail = async (row) => {
  detail.value = row
  detailVisible.value = true
  await loadDetail()
}
const refreshAfterAction = async (response) => {
  detail.value = response.data
  await fetchData()
  await loadDetail()
  const latestAction = detail.value?.actions?.[0]
  if (latestAction?.mailStatus === 'FAILED' || latestAction?.mailStatus === 'SKIPPED') {
    ElMessage.warning(`业务操作成功，邮件通知失败：${latestAction.mailError || '收件人或邮箱配置异常'}`)
  }
}

const receive = async () => {
  acting.value = true
  try { await refreshAfterAction(await receiveBatch(detail.value.packageToken)); ElMessage.success('申请包已接收，进入审核中') }
  finally { acting.value = false }
}
const approve = async () => {
  try {
    await ElMessageBox.confirm('审核通过后申请包将锁定，交底状态变为“定稿待报”。确认继续？', '审核通过', { type: 'warning' })
    acting.value = true
    await refreshAfterAction(await approveBatch(detail.value.packageToken))
    ElMessage.success('申请包已审核通过并锁定')
  } catch (error) { if (error !== 'cancel' && error !== 'close') return }
  finally { acting.value = false }
}
const openReject = () => {
  rejectForm.reason = ''
  documentSlots.forEach((slot) => { rejectForm.issues[slot.code] = '' })
  rejectVisible.value = true
}
const reject = async () => {
  if (!rejectForm.reason.trim()) { ElMessage.warning('请填写整体退回原因'); return }
  acting.value = true
  try {
    const issues = documentSlots.filter((slot) => rejectForm.issues[slot.code]?.trim()).map((slot) => ({
      documentCode: slot.code, issueText: rejectForm.issues[slot.code].trim()
    }))
    await refreshAfterAction(await rejectBatch(detail.value.packageToken, { reason: rejectForm.reason.trim(), issues }))
    rejectVisible.value = false
    ElMessage.success('申请包已退回主办人')
  } finally { acting.value = false }
}
const unlock = async () => {
  if (!unlockReason.value.trim()) { ElMessage.warning('请填写解锁原因'); return }
  acting.value = true
  try {
    await refreshAfterAction(await unlockBatch(detail.value.packageToken, unlockReason.value.trim()))
    unlockVisible.value = false
    unlockReason.value = ''
    ElMessage.success('申请包已解锁并回到审核中')
  } finally { acting.value = false }
}
const localDateTime = () => {
  const date = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
const openSubmit = () => {
  submitForm.submissionNo = ''
  submitForm.submittedAt = localDateTime()
  submitForm.receipt = null
  submitVisible.value = true
}
const onReceiptChange = (uploadFile) => { submitForm.receipt = uploadFile.raw }
const onReceiptRemove = () => { submitForm.receipt = null }
const submit = async () => {
  if (!submitForm.submissionNo.trim() || !submitForm.submittedAt || !submitForm.receipt) {
    ElMessage.warning('提交流水号、提交时间和 XML 回执均为必填项')
    return
  }
  if (!String(submitForm.receipt.name || '').toLowerCase().endsWith('.xml')) {
    ElMessage.warning('国知局回执必须是 XML 文件')
    return
  }
  try {
    await ElMessageBox.confirm('真实国知局提交不可逆，登记后申请包不能解锁。确认已提交成功？', '最终确认', { type: 'warning' })
    acting.value = true
    await refreshAfterAction(await submitCnipa(detail.value.packageToken, submitForm))
    submitVisible.value = false
    ElMessage.success('已登记提交国知局，并同步生成新申请记录')
  } catch (error) { if (error !== 'cancel' && error !== 'close') return }
  finally { acting.value = false }
}

const ticketUrl = async (file) => `${BASE_URL}${(await createDownloadTicket(file.fileToken)).data.downloadUrl}`
const download = async (file) => {
  try {
    const blob = await fetchFileBlob(await ticketUrl(file))
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  } catch { ElMessage.error('文件下载失败或下载凭证已失效') }
}
const preview = async (file) => {
  try {
    previewAttachment.value = { ...file, fileUrl: await ticketUrl(file) }
    previewVisible.value = true
  } catch { ElMessage.error('预览凭证生成失败') }
}

onMounted(fetchData)
</script>

<style scoped>
.page { max-width: 1700px; }
.search-form { margin-bottom: 8px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.section { margin-top: 16px; }
.action-bar { display: flex; align-items: center; gap: 10px; margin-top: 16px; padding: 12px; background: #f5f7fa; border-radius: 6px; }
.muted { color: #909399; font-size: 13px; }
.timeline { max-height: 440px; overflow: auto; padding: 4px 16px; }
.timeline :deep(.el-card__body) { padding: 10px 14px; line-height: 1.7; }
.mail-failed { color: #e6a23c; }
.pre-wrap { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.6; }
:deep(.reject-alert .el-alert__title) { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.6; }
</style>
