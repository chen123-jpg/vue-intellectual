<template>
  <div class="mail-page">
    <!-- 页面头部 -->
    <div class="mail-header">
      <div class="mail-header__icon">
        <el-icon :size="32"><Message /></el-icon>
      </div>
      <div class="mail-header__text">
        <h2 class="mail-header__title">发送记录</h2>
        <p class="mail-header__subtitle">查看和管理所有邮件发送历史</p>
      </div>
    </div>

    <!-- 发送记录 -->
    <el-card>
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="sentQuery" class="search-form">
        <el-form-item label="收件人">
          <el-input v-model="sentQuery.toEmails" placeholder="模糊搜索" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="主题">
          <el-input v-model="sentQuery.subject" placeholder="模糊搜索" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="sentQuery.sendStatus" placeholder="全部" clearable style="width:130px">
            <el-option label="待发送" :value="0" />
            <el-option label="发送成功" :value="1" />
            <el-option label="发送失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="sentDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchSentLogs">查询</el-button>
          <el-button @click="resetSentQuery">重置</el-button>
        </el-form-item>
      </el-form>

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
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Message } from '@element-plus/icons-vue'
import { getSendLogs, getSendLogById, removeSendLog, batchRemoveSendLog, resendMail } from '../../api/mailRecord'
import { useUserStore } from '../../stores/user'
import { formatDateTime } from '../../utils/format'

const { state } = useUserStore()

// ==================== 状态映射 ====================
const statusType = (s) => ({ 0: 'info', 1: 'success', 2: 'danger' }[s] || 'info')
const statusLabel = (s) => ({ 0: '待发送', 1: '成功', 2: '失败' }[s] || '未知')

const sentQuery = reactive({ toEmails: '', subject: '', sendStatus: '' })
const sentDateRange = ref([])
const sentPage = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const sentTableData = ref([])
const sentSelected = ref([])
const sentLoading = ref(false)

const sentDetailVisible = ref(false)
const sentDetail = ref(null)

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
/* ==================== 页面头部 ==================== */
.mail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 50%, #f5f7fa 100%);
  border-radius: 8px;
  border: 1px solid #d6e4ff;
}
.mail-header__icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1677ff, #4096ff);
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.35);
}
.mail-header__title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
}
.mail-header__subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #909399;
}

/* ==================== 发送记录 ==================== */
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
</style>
