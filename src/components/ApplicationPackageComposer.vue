<template>
  <div class="package-composer" v-loading="loading">
    <el-alert
      v-if="!eligible"
      :title="`当前交底状态为“${disclosure?.patentStatus || '-'}”，定稿后才能组建申请包`"
      type="info"
      :closable="false"
      show-icon
    />

    <template v-else-if="batch">
      <el-descriptions :column="3" border size="small" class="summary">
        <el-descriptions-item label="申请包状态">
          <el-tag :type="statusMeta.type">{{ statusMeta.label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核轮次">第 {{ batch.roundNo || 1 }} 轮</el-descriptions-item>
        <el-descriptions-item label="流程专员">{{ batch.processUserName || '尚未指定' }}</el-descriptions-item>
        <el-descriptions-item label="最近发送">{{ formatDateTime(batch.sentAt) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最近接收">{{ formatDateTime(batch.receivedAt) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(batch.updateTime) || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-alert
        v-if="batch.status === 'REJECTED'"
        :title="`退回原因：${batch.rejectReason || '-'}`"
        type="error"
        :closable="false"
        show-icon
        class="block-gap reject-alert"
      />
      <el-alert
        v-else-if="!canEdit"
        title="申请包当前已锁定；审核通过后如需修改，应先由管理员解锁，再由流程专员退回。"
        type="info"
        :closable="false"
        show-icon
        class="block-gap"
      />

      <!-- XML 申请文件 -->
      <h4 class="section-title">XML 申请文件</h4>
      <div class="slot-grid" style="grid-template-columns:1fr">
        <el-card v-for="slot in xmlSlots" :key="slot.code" shadow="never" class="file-slot">
          <template #header><div class="slot-header"><span>{{ slot.label }}</span></div></template>
          <div v-if="currentFile(slot.code)" class="current-file"><span class="file-name" :title="currentFile(slot.code).fileName">{{ currentFile(slot.code).fileName }}</span><span class="file-meta">v{{ currentFile(slot.code).versionNo }} · {{ fmtSize(currentFile(slot.code).fileSize) }}</span></div>
          <div v-else class="empty-file">等待上传</div>
          <div class="slot-actions">
            <el-upload v-if="canEdit" action="#" :show-file-list="false" :accept="slot.accept" :before-upload="(file)=>beforeUpload(file,slot)" :http-request="(opts)=>uploadSlot(opts,slot)" :disabled="uploadingCode===slot.code"><el-button size="small" type="primary" :loading="uploadingCode===slot.code">{{ currentFile(slot.code)?'替换文件':'上传文件' }}</el-button></el-upload>
            <el-button v-if="canEdit&&currentFile(slot.code)" size="small" type="danger" plain :loading="removingCode===slot.code" @click="removeSlot(slot)">移除</el-button>
            <el-button v-if="currentFile(slot.code)" size="small" @click="preview(currentFile(slot.code))">预览</el-button>
            <el-button v-if="currentFile(slot.code)" size="small" @click="download(currentFile(slot.code))">下载</el-button>
          </div>
        </el-card>
      </div>

      <!-- 五书申请文件 -->
      <h4 class="section-title">五书申请文件</h4>
      <el-card shadow="never" class="five-docs-card">
        <div v-for="slot in fiveDocsSlots" :key="slot.code" class="five-docs-row">
          <span class="five-docs-row__label">{{ slot.label }}</span>
          <template v-if="currentFile(slot.code)">
            <span class="file-name-inline" :title="currentFile(slot.code).fileName">{{ currentFile(slot.code).fileName }}</span>
            <span class="file-meta">v{{ currentFile(slot.code).versionNo }} · {{ fmtSize(currentFile(slot.code).fileSize) }}</span>
            <el-upload v-if="canEdit" action="#" :show-file-list="false" :accept="slot.accept" :before-upload="(file)=>beforeUpload(file,slot)" :http-request="(opts)=>uploadSlot(opts,slot)" :disabled="uploadingCode===slot.code"><el-button size="small" type="primary" text :loading="uploadingCode===slot.code">替换</el-button></el-upload>
            <el-button v-if="canEdit" size="small" type="danger" text :loading="removingCode===slot.code" @click="removeSlot(slot)">移除</el-button>
            <el-button size="small" text @click="preview(currentFile(slot.code))">预览</el-button>
            <el-button size="small" text @click="download(currentFile(slot.code))">下载</el-button>
          </template>
          <template v-else>
            <span class="file-meta">等待上传</span>
            <el-upload v-if="canEdit" action="#" :show-file-list="false" :accept="slot.accept" :before-upload="(file)=>beforeUpload(file,slot)" :http-request="(opts)=>uploadSlot(opts,slot)" :disabled="uploadingCode===slot.code"><el-button size="small" type="primary" :loading="uploadingCode===slot.code">上传</el-button></el-upload>
          </template>
        </div>
      </el-card>

      <div v-if="canSend" class="send-panel">
        <el-select
          v-model="selectedProcessUserId"
          :disabled="batch.status === 'REJECTED'"
          placeholder="选择流程专员"
          filterable
          style="width: 260px"
        >
          <el-option
            v-for="operator in processOperators"
            :key="operator.userId"
            :label="`${operator.userName}${operator.email ? `（${operator.email}）` : ''}`"
            :value="operator.userId"
          />
        </el-select>
        <el-button type="primary" :disabled="!filesComplete || !selectedProcessUserId" :loading="sending" @click="send">
          {{ batch.status === 'REJECTED' ? '重新发送给原流程专员' : '发送给流程专员' }}
        </el-button>
        <span class="send-tip">六个固定文件齐全后才能发送。</span>
      </div>

      <el-collapse v-if="batch.issues?.length || batch.fileHistory?.length" class="history">
        <el-collapse-item v-if="batch.issues?.length" title="审核问题记录" name="issues">
          <el-table :data="batch.issues" border size="small">
            <el-table-column prop="roundNo" label="轮次" width="70" />
            <el-table-column label="文件" width="140">
              <template #default="{ row }">{{ documentLabel(row.documentCode) }}</template>
            </el-table-column>
            <el-table-column label="问题" min-width="240">
              <template #default="{ row }"><div class="pre-wrap">{{ row.issueText }}</div></template>
            </el-table-column>
            <el-table-column prop="reviewerUserName" label="审核人" width="110" />
            <el-table-column label="时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
        <el-collapse-item v-if="batch.fileHistory?.length" title="历史文件版本" name="versions">
          <el-table :data="batch.fileHistory" border size="small">
            <el-table-column label="文书" width="140">
              <template #default="{ row }">{{ documentLabel(row.documentCode) }}</template>
            </el-table-column>
            <el-table-column prop="fileName" label="文件名" min-width="220" />
            <el-table-column prop="versionNo" label="版本" width="70" />
            <el-table-column prop="uploadUserName" label="上传人" width="110" />
            <el-table-column label="上传时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.uploadTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="130">
              <template #default="{ row }">
                <el-button link type="primary" @click="preview(row)">预览</el-button>
                <el-button link type="primary" @click="download(row)">下载</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </template>

    <el-empty v-else-if="!loading && eligible" description="尚未创建申请包草稿">
      <el-button v-if="hasPerm('patent:applicationPackage:compose')" type="primary" @click="initialize">
        创建申请包草稿
      </el-button>
    </el-empty>
    <FilePreviewDialog v-model="previewVisible" :attachment="previewAttachment" :downloadable="false" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createDownloadTicket,
  createDraft,
  getBatch,
  getBatchByDisclosure,
  getProcessOperators,
  removeBatchFile,
  sendBatch,
  uploadBatchFile
} from '../api/applicationPackage'
import { BASE_URL } from '../utils/request'
import { fetchFileBlob, formatDateTime } from '../utils/format'
import { useUserStore } from '../stores/user'
import FilePreviewDialog from './FilePreviewDialog.vue'

const props = defineProps({ disclosure: { type: Object, required: true } })
const emit = defineEmits(['changed'])
const { state } = useUserStore()
const hasPerm = (permission) => state.permissions.includes(permission)

const documentSlots = [
  { code: 'XML', label: 'XML 申请文件', accept: '.xml' },
  { code: 'REQUEST', label: '请求书', accept: '.doc,.docx' },
  { code: 'DESCRIPTION', label: '说明书', accept: '.doc,.docx' },
  { code: 'CLAIMS', label: '权利要求书', accept: '.doc,.docx' },
  { code: 'ABSTRACT', label: '摘要', accept: '.doc,.docx' },
  { code: 'ABSTRACT_DRAWING', label: '摘要附图', accept: '.doc,.docx' }
]
const xmlSlots = computed(() => documentSlots.filter(s => s.code === 'XML'))
const fiveDocsSlots = computed(() => documentSlots.filter(s => s.code !== 'XML'))
const statusMap = {
  DRAFT: { label: '待组包', type: 'info' },
  PENDING_RECEIVE: { label: '待接收', type: 'warning' },
  REVIEWING: { label: '审核中', type: 'primary' },
  REJECTED: { label: '已退回', type: 'danger' },
  APPROVED: { label: '审核通过', type: 'success' },
  SUBMITTED: { label: '已提交国知局', type: 'success' }
}

const batch = ref(null)
const loading = ref(false)
const uploadingCode = ref('')
const removingCode = ref('')
const sending = ref(false)
const processOperators = ref([])
const selectedProcessUserId = ref(null)
const previewVisible = ref(false)
const previewAttachment = ref(null)

const eligible = computed(() => ['定稿', '定稿待报', '已申报'].includes(props.disclosure?.patentStatus))
const statusMeta = computed(() => statusMap[batch.value?.status] || { label: batch.value?.status || '-', type: 'info' })
const canEdit = computed(() => hasPerm('patent:applicationPackage:compose') && ['DRAFT', 'REJECTED'].includes(batch.value?.status))
const canSend = computed(() => hasPerm('patent:applicationPackage:send') && ['DRAFT', 'REJECTED'].includes(batch.value?.status))
const filesComplete = computed(() => documentSlots.every((slot) => currentFile(slot.code)))

const currentFile = (code) => batch.value?.currentFiles?.find((item) => item.documentCode === code && item.fileRole === 'PACKAGE_DOCUMENT')
const documentLabel = (code) => documentSlots.find((slot) => slot.code === code)?.label || (code === 'CNIPA_RECEIPT' ? '国知局回执' : '整体原因')
const fmtSize = (size) => {
  if (!size) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const load = async () => {
  if (!eligible.value || !props.disclosure?.id) {
    batch.value = null
    return
  }
  loading.value = true
  try {
    const response = await getBatchByDisclosure(props.disclosure.id)
    batch.value = response.data || null
    selectedProcessUserId.value = response.data?.processUserId || null
    if (response.data?.status === 'DRAFT' && hasPerm('patent:applicationPackage:send')) {
      const operatorResponse = await getProcessOperators()
      processOperators.value = operatorResponse.data || []
    }
  } finally {
    loading.value = false
  }
}

const initialize = async () => {
  loading.value = true
  try {
    const response = await createDraft(props.disclosure.id)
    batch.value = response.data
    selectedProcessUserId.value = response.data.processUserId || null
    if (hasPerm('patent:applicationPackage:send')) {
      processOperators.value = (await getProcessOperators()).data || []
    }
    ElMessage.success('申请包草稿已创建')
  } finally { loading.value = false }
}

const beforeUpload = (file, slot) => {
  const ext = String(file.name || '').split('.').pop().toLowerCase()
  const allowed = slot.code === 'XML' ? ['xml'] : ['doc', 'docx']
  if (!allowed.includes(ext)) {
    ElMessage.warning(`${slot.label}文件格式不正确`)
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('单个文件不能超过 10 MB')
    return false
  }
  return true
}

const uploadSlot = async ({ file, onSuccess, onError }, slot) => {
  uploadingCode.value = slot.code
  try {
    const response = await uploadBatchFile(batch.value.packageToken, slot.code, file)
    batch.value = response.data
    ElMessage.success(`${slot.label}上传成功`)
    emit('changed', response.data)
    onSuccess(response)
  } catch (error) {
    onError(error)
  } finally {
    uploadingCode.value = ''
  }
}

const removeSlot = async (slot) => {
  try {
    await ElMessageBox.confirm(
      `确认移除“${slot.label}”的当前版本吗？该版本仍会保留在历史版本中。`,
      '移除申请文件',
      { type: 'warning' }
    )
    removingCode.value = slot.code
    const response = await removeBatchFile(batch.value.packageToken, slot.code)
    batch.value = response.data
    ElMessage.success(`${slot.label}已移除`)
    emit('changed', response.data)
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') return
  } finally {
    removingCode.value = ''
  }
}

const send = async () => {
  const isResend = batch.value.status === 'REJECTED'
  try {
    await ElMessageBox.confirm(
      isResend ? '确认修改完成并重新发送给原流程专员？' : '发送后文件将暂时锁定，确认继续？',
      isResend ? '重新发送' : '发送申请包',
      { type: 'warning' }
    )
    sending.value = true
    const response = await sendBatch(batch.value.packageToken, selectedProcessUserId.value)
    batch.value = (await getBatch(response.data.packageToken)).data
    ElMessage.success(isResend ? '已重新发送' : '已发送给流程专员')
    const latestAction = batch.value.actions?.[0]
    if (latestAction?.mailStatus === 'FAILED' || latestAction?.mailStatus === 'SKIPPED') {
      ElMessage.warning(`业务操作成功，邮件通知失败：${latestAction.mailError || '收件人或邮箱配置异常'}`)
    }
    emit('changed', response.data)
  } catch { /* 取消或接口错误已统一提示 */ } finally {
    sending.value = false
  }
}

const ticketUrl = async (file) => {
  const response = await createDownloadTicket(file.fileToken)
  return `${BASE_URL}${response.data.downloadUrl}`
}

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
  } catch {
    ElMessage.error('文件下载失败或下载凭证已失效')
  }
}

const preview = async (file) => {
  try {
    previewAttachment.value = { ...file, fileUrl: await ticketUrl(file) }
    previewVisible.value = true
  } catch {
    ElMessage.error('预览凭证生成失败')
  }
}

watch(() => props.disclosure?.id, load)
onMounted(load)
</script>

<style scoped>
.summary { margin-bottom: 14px; }
.section-title { margin: 16px 0 10px; padding-left: 10px; font-size: 14px; font-weight: 700; color: #37474f; border-left: 3px solid #1e88e5; line-height: 1.2; }
.five-docs-row { display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0;gap:10px }
.five-docs-row:last-child { border-bottom:none }
.five-docs-row__label { font-weight:600;font-size:13px;white-space:nowrap;width:90px;flex-shrink:0 }
.file-name-inline { overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#5f6b7a;max-width:200px;flex:1 }
.block-gap { margin-bottom: 14px; }
.slot-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.file-slot :deep(.el-card__header) { padding: 10px 14px; }
.file-slot :deep(.el-card__body) { padding: 14px; }
.slot-header, .slot-actions, .send-panel { display: flex; align-items: center; gap: 10px; }
.slot-header { justify-content: space-between; font-weight: 600; }
.current-file { min-height: 42px; display: flex; flex-direction: column; gap: 4px; }
.file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-meta, .send-tip, .empty-file { color: #909399; font-size: 12px; }
.empty-file { min-height: 42px; }
.slot-actions { margin-top: 10px; }
.send-panel { margin-top: 16px; padding: 14px; border-radius: 6px; background: #f5f7fa; }
.history { margin-top: 16px; }
.pre-wrap { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.6; }
:deep(.reject-alert .el-alert__title) { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.6; }
@media (max-width: 900px) { .slot-grid { grid-template-columns: 1fr; } }
</style>
