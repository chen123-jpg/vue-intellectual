<template>
  <div class="mail-records-page">
    <!-- 搜索栏 -->
    <div class="filter-box">
      <div class="filter-box__title"><span>筛选条件</span></div>
      <div class="filter-grid">
        <div class="filter-cell">
          <label class="filter-cell__label">收件人</label>
          <el-input v-model="sentQuery.toEmails" placeholder="模糊搜索" clearable style="width:180px" />
        </div>
        <div class="filter-cell">
          <label class="filter-cell__label">主题</label>
          <el-input v-model="sentQuery.subject" placeholder="模糊搜索" clearable style="width:180px" />
        </div>
        <div class="filter-cell">
          <label class="filter-cell__label">状态</label>
          <el-select v-model="sentQuery.sendStatus" placeholder="全部" clearable style="width:130px">
            <el-option label="待发送" :value="0" />
            <el-option label="发送成功" :value="1" />
            <el-option label="发送失败" :value="2" />
          </el-select>
        </div>
        <div class="filter-cell">
          <label class="filter-cell__label">时间</label>
          <el-date-picker
            v-model="sentDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:260px"
          />
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="fetchSentLogs">查询</el-button>
        <el-button @click="resetSentQuery">重置</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-table :data="sentTableData" v-loading="sentLoading" border stripe @selection-change="onSentSelectionChange">
      <el-table-column type="selection" width="45" />
      <el-table-column prop="id" label="ID" width="65" />
      <el-table-column prop="toEmails" label="收件人" min-width="180" show-overflow-tooltip />
      <el-table-column prop="subject" label="主题" min-width="220" show-overflow-tooltip />
      <el-table-column prop="sendStatus" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.sendStatus)" size="small">
            {{ statusLabel(row.sendStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="senderName" label="发送人" width="100" />
      <el-table-column prop="sentAt" label="发送时间" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.sentAt || row.createTime) || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="viewSentDetail(row)">详情</el-button>
          <el-button v-if="row.sendStatus === 2" size="small" type="warning" @click="handleResend(row.id)">重发</el-button>
          <el-button size="small" type="danger" @click="handleDeleteSent(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="toolbar-row">
      <el-button type="danger" :disabled="!sentSelected.length" @click="handleBatchDeleteSent">批量删除</el-button>
      <el-pagination
        v-model:current-page="sentPage.pageNum"
        v-model:page-size="sentPage.pageSize"
        :total="sentPage.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchSentLogs"
        @current-change="fetchSentLogs"
        class="pagination"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="sentDetailVisible" title="发送邮件详情" width="750px" destroy-on-close>
      <el-descriptions v-if="sentDetail" :column="2" border>
        <el-descriptions-item label="收件人" :span="2">{{ sentDetail.toEmails }}</el-descriptions-item>
        <el-descriptions-item label="抄送" :span="2">{{ sentDetail.ccEmails || '无' }}</el-descriptions-item>
        <el-descriptions-item label="主题" :span="2">{{ sentDetail.subject }}</el-descriptions-item>
        <el-descriptions-item label="发送人">{{ sentDetail.senderName }}</el-descriptions-item>
        <el-descriptions-item label="发送状态">
          <el-tag :type="statusType(sentDetail.sendStatus)" size="small">
            {{ statusLabel(sentDetail.sendStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发送时间" :span="2">
          {{ formatDateTime(sentDetail.sentAt || sentDetail.createTime) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="sentDetail.errorMessage" label="失败原因" :span="2">
          <span style="color:#f56c6c">{{ sentDetail.errorMessage }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="模板编码" v-if="sentDetail.templateCode">
          {{ sentDetail.templateCode }}
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="sentDetail" style="margin-top: 16px">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #303133">邮件正文预览</h4>
        <div class="content-preview" v-html="sentDetail.content || sentDetail.body || sentDetail.text || '无'"></div>
      </div>
      <div v-if="sentAttachments.length" style="margin-top: 16px">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #303133">附件（{{ sentAttachments.length }}）</h4>
        <div class="attachment-list">
          <div v-for="att in sentAttachments" :key="att.id" class="attachment-item">
            <img v-if="isImageFile(att.fileName)" :src="att.fileUrl" class="attachment-thumb" :title="att.fileName" @click="openFile(att.fileUrl)" />
            <el-icon v-else class="attachment-icon"><Document /></el-icon>
            <span class="attachment-name">{{ att.fileName }}</span>
            <span class="attachment-size">{{ formatSize(att.fileSize) }}</span>
            <el-button size="small" type="primary" link @click="downloadAttachment(att)">下载</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { getSendLogs, getSendLogById, removeSendLog, batchRemoveSendLog, resendMail } from '../../api/mailRecord'
import { useUserStore } from '@/stores/user.js'
import { formatDateTime, downloadFile } from '@/utils/format.js'

const { state } = useUserStore()

// ==================== 状态映射 ====================
const statusType = (s) => ({ 0: 'info', 1: 'success', 2: 'danger' }[s] || 'info')
const statusLabel = (s) => ({ 0: '待发送', 1: '成功', 2: '失败' }[s] || '未知')

// ==================== 查询 & 分页 ====================
const sentQuery = reactive({ toEmails: '', subject: '', sendStatus: '' })
const sentDateRange = ref([])
const sentPage = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const sentTableData = ref([])
const sentSelected = ref([])
const sentLoading = ref(false)

const sentDetailVisible = ref(false)
const sentDetail = ref(null)
const sentAttachments = ref([])

const isImageFile = (name) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name || '')
const formatSize = (bytes) => {
  if (bytes == null) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}
const downloadAttachment = (att) => {
  if (att?.fileUrl) downloadFile(att.fileUrl)
}
const openFile = (url) => {
  if (url) window.open(url, '_blank')
}

const fetchSentLogs = async () => {
  sentLoading.value = true
  try {
    const params = {
      userId: state.userId,
      pageNum: sentPage.pageNum,
      pageSize: sentPage.pageSize,
      ...sentQuery
    }
    if (sentDateRange.value && sentDateRange.value.length === 2) {
      params.startDate = sentDateRange.value[0]
      params.endDate = sentDateRange.value[1]
    }
    Object.keys(params).forEach(k => { if (!params[k] && params[k] !== 0) delete params[k] })
    const res = await getSendLogs(params)
    if (res.code === 200) {
      sentTableData.value = res.data.records || []
      sentPage.total = res.data.total || 0
    }

  } finally { sentLoading.value = false }
}

const resetSentQuery = () => {
  Object.keys(sentQuery).forEach(k => sentQuery[k] = '')
  sentDateRange.value = []
  sentPage.pageNum = 1
  fetchSentLogs()
}

const viewSentDetail = async (row) => {
  try {
    const res = await getSendLogById(row.id)
    if (res.code === 200) {
      const data = res.data
      sentDetail.value = data.mailSendLog || data
      sentAttachments.value = data.attachmentList || []
      sentDetailVisible.value = true
    }
  } catch { /* handled */ }
}

const handleDeleteSent = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该发送记录？', '提示', { type: 'warning' })
    const res = await removeSendLog(id)
    if (res.code === 200) { ElMessage.success('删除成功'); fetchSentLogs() }
  } catch { /* cancelled */ }
}

const handleBatchDeleteSent = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${sentSelected.value.length} 条记录？`, '提示', { type: 'warning' })
    const res = await batchRemoveSendLog(sentSelected.value.map(r => r.id))
    if (res.code === 200) { ElMessage.success('批量删除成功'); fetchSentLogs() }
  } catch { /* cancelled */ }
}

const handleResend = async (id) => {
  try {
    await ElMessageBox.confirm('确认重新发送该邮件？', '提示', { type: 'warning' })
    const res = await resendMail(id)
    if (res.code === 200) { ElMessage.success('重发成功'); fetchSentLogs() }
  } catch { /* cancelled */ }
}

const onSentSelectionChange = (sel) => { sentSelected.value = sel }

onMounted(() => fetchSentLogs())
</script>

<style scoped>
.mail-records-page { max-width: 1600px; }
.search-form { margin-bottom: 10px; }
.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}
.pagination { margin: 0; }
.content-preview {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.8;
  width: 100%;
  border: 1px solid #e4e7ed;
}
.content-preview img { max-width: 100%; }
.content-preview :deep(table) { border-collapse: collapse; width: 100%; }
.content-preview :deep(td), .content-preview :deep(th) { border: 1px solid #d4dde8; padding: 6px 10px; }
.attachment-list { display: flex; flex-direction: column; gap: 8px; }
.attachment-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid #e4e7ed; border-radius: 4px; background: #fafafa; }
.attachment-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #e4e7ed; }
.attachment-icon { font-size: 32px; color: #909399; }
.attachment-name { flex: 1; font-size: 13px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.attachment-size { font-size: 12px; color: #909399; white-space: nowrap; }
</style>
