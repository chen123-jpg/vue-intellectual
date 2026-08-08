<template>
  <div class="mail-page">
    <!-- 页面头部 -->
    <div class="mail-header">
      <div class="mail-header__icon">
        <el-icon :size="32"><Message /></el-icon>
      </div>
      <div class="mail-header__text">
        <h2 class="mail-header__title">邮件中心</h2>
        <p class="mail-header__subtitle">查看发送记录，管理邮件模板</p>
      </div>
    </div>

    <el-card>
      <el-tabs v-model="activeTab">
        <!-- ==================== Tab: 发送记录 ==================== -->
        <el-tab-pane label="发送记录" name="records">
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

          <!-- 发送详情弹窗 -->
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
        </el-tab-pane>

        <!-- ==================== Tab: 模板管理 ==================== -->
        <el-tab-pane label="模板管理" name="templates">
          <div class="filter-box">
            <div class="filter-box__title"><span>筛选条件</span></div>
            <div class="filter-grid">
              <div class="filter-cell">
                <label class="filter-cell__label">模板编码</label>
                <el-input v-model="tplQuery.templateCode" placeholder="模糊搜索" clearable style="width:160px" />
              </div>
              <div class="filter-cell">
                <label class="filter-cell__label">模板名称</label>
                <el-input v-model="tplQuery.templateName" placeholder="模糊搜索" clearable style="width:160px" />
              </div>
              <div class="filter-cell">
                <label class="filter-cell__label">启用状态</label>
                <el-select v-model="tplQuery.enabled" placeholder="全部" clearable style="width:110px">
                  <el-option label="禁用" :value="0" />
                  <el-option label="启用" :value="1" />
                </el-select>
              </div>
            </div>
            <div class="filter-actions">
              <el-button type="primary" @click="fetchTplData">查询</el-button>
              <el-button @click="resetTplQuery">重置</el-button>
            </div>
          </div>

          <div class="toolbar-row" style="margin-bottom: 12px">
            <div class="toolbar-left">
              <el-button v-if="hasPerm('system:mailTemplate:add')" type="primary" @click="openTplAdd">新增模板</el-button>
              <el-button v-if="hasPerm('system:mailTemplate:delete')" type="danger" :disabled="!tplSelected.length" @click="handleTplBatchDelete">
                批量删除
              </el-button>
            </div>
          </div>

          <el-table :data="tplTableData" v-loading="tplLoading" border stripe @selection-change="onTplSelectionChange">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="templateCode" label="模板编码" width="150" />
            <el-table-column prop="templateName" label="模板名称" min-width="160" />
            <el-table-column prop="subject" label="主题模板" min-width="200" show-overflow-tooltip />
            <el-table-column prop="enabled" label="启用" width="70">
              <template #default="{ row }">
                <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
                  {{ row.enabled === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="success" link @click="openTplPreview(row)">预览</el-button>
                <el-button v-if="hasPerm('system:mailTemplate:edit')" size="small" type="primary" link @click="openTplEdit(row)">编辑</el-button>
                <el-button v-if="hasPerm('system:mailTemplate:delete')" size="small" type="danger" link @click="handleTplDelete(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="tplPage.pageNum"
            v-model:page-size="tplPage.pageSize"
            :total="tplPage.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchTplData"
            @current-change="fetchTplData"
            class="pagination"
          />
        </el-tab-pane>
      </el-tabs>

      <!-- 模板编辑弹窗 -->
      <el-dialog
        v-model="tplDialog.visible"
        :title="tplDialog.isEdit ? '编辑邮件模板' : '新增邮件模板'"
        width="700px"
        destroy-on-close
      >
        <el-form ref="tplFormRef" :model="tplForm" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="模板编码" required>
                <el-input v-model="tplForm.templateCode" placeholder="如 WELCOME" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="模板名称" required>
                <el-input v-model="tplForm.templateName" placeholder="请输入模板名称" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="主题模板">
            <el-input v-model="tplForm.subject" placeholder="支持占位符，如：您好${userName}" />
          </el-form-item>
          <el-form-item label="正文模板">
            <el-input v-model="tplForm.content" type="textarea" :rows="8" placeholder="支持 Thymeleaf 模板语法" />
          </el-form-item>
          <el-form-item label="默认附件类型">
            <el-input v-model="tplForm.defaultAttachTypes" placeholder="逗号分隔" />
          </el-form-item>
          <el-form-item label="启用状态">
            <el-switch v-model="tplForm.enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="tplDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleTplSave" :loading="tplSaving">保存</el-button>
        </template>
      </el-dialog>

      <!-- 模板预览弹窗 -->
      <el-dialog v-model="tplPreviewVisible" title="模板预览" width="800px" destroy-on-close>
        <el-descriptions :column="2" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="模板编码">{{ tplPreviewData.templateCode }}</el-descriptions-item>
          <el-descriptions-item label="模板名称">{{ tplPreviewData.templateName }}</el-descriptions-item>
          <el-descriptions-item label="主题预览" :span="2">
            <div style="font-weight:600;color:#303133">{{ tplRenderedSubject || '-' }}</div>
          </el-descriptions-item>
        </el-descriptions>
        <div style="margin-bottom:8px;font-size:13px;font-weight:600;color:#606266">正文预览</div>
        <div class="preview-content" v-html="tplRenderedContent || '<span style=color:#909399>暂无正文</span>'" />
        <template #footer>
          <el-button @click="tplPreviewVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Message, Document } from '@element-plus/icons-vue'
import { getSendLogs, getSendLogById, removeSendLog, batchRemoveSendLog, resendMail } from '../../api/mailRecord'
import { getList, getById, create, update, remove, batchRemove } from '../../api/mailTemplate'
import { useUserStore } from '../../stores/user'
import { formatDateTime, downloadFile } from '../../utils/format'
import { renderTemplate } from '../../utils/templateHelper'

const { state } = useUserStore()
const hasPerm = (perm) => state.permissions.includes(perm)

// ==================== Tabs ====================
const activeTab = ref('records')

// ==================== 状态映射 ====================
const statusType = (s) => ({ 0: 'info', 1: 'success', 2: 'danger' }[s] || 'info')
const statusLabel = (s) => ({ 0: '待发送', 1: '成功', 2: '失败' }[s] || '未知')

// ==================== 发送记录 ====================
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

// ==================== 模板管理 ====================
const tplQuery = reactive({ templateCode: '', templateName: '', enabled: '' })
const tplPage = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const tplTableData = ref([])
const tplSelected = ref([])
const tplLoading = ref(false)
const tplSaving = ref(false)

const tplDialog = reactive({ visible: false, isEdit: false })
const emptyTplForm = () => ({
  id: null, templateCode: '', templateName: '', subject: '',
  content: '', defaultAttachTypes: '', enabled: 1
})
const tplForm = reactive(emptyTplForm())

const tplPreviewVisible = ref(false)
const tplPreviewData = reactive({ templateCode: '', templateName: '', subject: '', content: '' })
const tplRenderedSubject = computed(() => {
  if (!tplPreviewData.subject) return ''
  return renderTemplate(tplPreviewData.subject, {})
})
const tplRenderedContent = computed(() => {
  if (!tplPreviewData.content) return ''
  return renderTemplate(tplPreviewData.content, {})
})

const openTplPreview = (row) => {
  Object.assign(tplPreviewData, {
    templateCode: row.templateCode || '',
    templateName: row.templateName || '',
    subject: row.subject || '',
    content: row.content || ''
  })
  tplPreviewVisible.value = true
}

const fetchTplData = async () => {
  tplLoading.value = true
  try {
    const params = { pageNum: tplPage.pageNum, pageSize: tplPage.pageSize, ...tplQuery }
    Object.keys(params).forEach(k => { if (!params[k] && params[k] !== 0) delete params[k] })
    const res = await getList(params)
    if (res.code === 200) {
      tplTableData.value = res.data.records || []
      tplPage.total = res.data.total || 0
    }
  } finally { tplLoading.value = false }
}

const resetTplQuery = () => {
  Object.keys(tplQuery).forEach(k => tplQuery[k] = '')
  tplPage.pageNum = 1
  fetchTplData()
}

const openTplAdd = () => {
  Object.assign(tplForm, emptyTplForm())
  tplDialog.isEdit = false
  tplDialog.visible = true
}

const openTplEdit = async (row) => {
  try {
    const res = await getById(row.id)
    if (res.code === 200) {
      Object.assign(tplForm, res.data)
      tplDialog.isEdit = true
      tplDialog.visible = true
    }
  } catch { /* handled */ }
}

const handleTplSave = async () => {
  tplSaving.value = true
  try {
    const res = tplDialog.isEdit ? await update({ ...tplForm }) : await create({ ...tplForm })
    if (res.code === 200) {
      ElMessage.success(tplDialog.isEdit ? '修改成功' : '新增成功')
      tplDialog.visible = false
      fetchTplData()
    }
  } finally { tplSaving.value = false }
}

const handleTplDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该模板？', '提示', { type: 'warning' })
    const res = await remove(id)
    if (res.code === 200) { ElMessage.success('删除成功'); fetchTplData() }
  } catch { /* cancelled */ }
}

const handleTplBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${tplSelected.value.length} 条记录？`, '提示', { type: 'warning' })
    const res = await batchRemove(tplSelected.value.map(r => r.id))
    if (res.code === 200) { ElMessage.success('批量删除成功'); fetchTplData() }
  } catch { /* cancelled */ }
}

const onTplSelectionChange = (sel) => { tplSelected.value = sel }

// ==================== Init ====================
onMounted(() => {
  fetchSentLogs()
  fetchTplData()
})

watch(activeTab, (tab) => {
  if (tab === 'templates' && !tplTableData.value.length) fetchTplData()
})
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

/* ==================== 通用 ==================== */
.search-form { margin-bottom: 10px; }
.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}
.toolbar-left { display: flex; gap: 10px; }
.pagination { margin: 16px 0 0; justify-content: flex-end; }
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
.preview-content {
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  background: #fafbfc;
  line-height: 1.7;
}
</style>
