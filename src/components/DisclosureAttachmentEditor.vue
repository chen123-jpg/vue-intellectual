<template>
  <div class="attachment-editor" v-loading="loading">
    <section class="attachment-section">
      <div class="section-heading">
        <div>
          <h4>交底书 <el-tag size="small" type="danger">必填</el-tag></h4>
          <p>只能保留一份 Word 文档，支持 .doc / .docx；编辑时可直接更换。</p>
        </div>
        <el-button type="primary" :loading="uploadingDocument" @click="documentInput?.click()">
          {{ disclosureId && existingDocument ? '更换交底书' : '选择交底书' }}
        </el-button>
        <input
          ref="documentInput"
          class="hidden-input"
          type="file"
          accept=".doc,.docx"
          @change="handleDocumentSelected"
        />
      </div>

      <div v-if="documentFile" class="attachment-row pending-row">
        <div class="file-info">
          <span class="file-name">{{ documentFile.name }}</span>
          <el-tag size="small" type="warning">待提交</el-tag>
          <span class="file-size">{{ fmtSize(documentFile.size) }}</span>
        </div>
        <div class="row-actions">
          <el-button size="small" type="primary" plain @click="openPreview(documentFile)">在线预览</el-button>
          <el-button size="small" type="danger" plain @click="removePendingDocument">移除</el-button>
        </div>
      </div>

      <div v-if="existingDocument" class="attachment-row">
        <div class="file-info">
          <span class="file-name">{{ existingDocument.fileName }}</span>
          <span class="file-size">{{ fmtSize(existingDocument.fileSize) }}</span>
        </div>
        <div class="row-actions">
          <el-button size="small" type="primary" plain @click="openPreview(existingDocument)">在线预览</el-button>
          <el-button size="small" @click="downloadFile(existingDocument.fileUrl)">下载</el-button>
          <el-button size="small" type="danger" plain @click="removeExisting(existingDocument)">删除</el-button>
        </div>
      </div>

      <el-empty
        v-if="!documentFile && !existingDocument"
        :image-size="45"
        description="尚未选择交底书"
      />
    </section>

    <el-divider />

    <section class="attachment-section">
      <div class="section-heading">
        <div>
          <h4>其他附件</h4>
          <p>支持一次选择多件，也可以分多次继续添加。</p>
        </div>
        <el-button :loading="uploadingOthers" @click="otherInput?.click()">添加其他附件</el-button>
        <input
          ref="otherInput"
          class="hidden-input"
          type="file"
          multiple
          @change="handleOthersSelected"
        />
      </div>

      <div v-for="file in otherFiles" :key="fileKey(file)" class="attachment-row pending-row">
        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <el-tag size="small" type="warning">待提交</el-tag>
          <span class="file-size">{{ fmtSize(file.size) }}</span>
        </div>
        <div class="row-actions">
          <el-button size="small" type="primary" plain @click="openPreview(file)">在线预览</el-button>
          <el-button size="small" type="danger" plain @click="removePendingOther(file)">移除</el-button>
        </div>
      </div>

      <div v-for="attachment in existingOthers" :key="attachment.id" class="attachment-row">
        <div class="file-info">
          <span class="file-name">{{ attachment.fileName }}</span>
          <span class="file-size">{{ fmtSize(attachment.fileSize) }}</span>
        </div>
        <div class="row-actions">
          <el-button size="small" type="primary" plain @click="openPreview(attachment)">在线预览</el-button>
          <el-button size="small" @click="downloadFile(attachment.fileUrl)">下载</el-button>
          <el-button size="small" type="danger" plain @click="removeExisting(attachment)">删除</el-button>
        </div>
      </div>

      <el-empty
        v-if="!otherFiles.length && !existingOthers.length"
        :image-size="45"
        description="暂无其他附件"
      />
    </section>

    <el-alert
      v-if="disclosureId"
      class="save-hint"
      type="info"
      :closable="false"
      show-icon
      title="编辑已有交底时，附件的上传、更换和删除会立即保存。"
    />

    <FilePreviewDialog v-model="previewVisible" :attachment="previewAttachment" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteAttachment,
  getAttachments,
  replaceDisclosureDocument,
  uploadAttachment
} from '../api/disclosureWorkflow'
import { downloadFile } from '../utils/format'
import FilePreviewDialog from './FilePreviewDialog.vue'

const props = defineProps({
  disclosureId: { type: [Number, String], default: null },
  documentFile: { type: Object, default: null },
  otherFiles: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:documentFile', 'update:otherFiles', 'changed'])

const documentInput = ref(null)
const otherInput = ref(null)
const attachments = ref([])
const loading = ref(false)
const uploadingDocument = ref(false)
const uploadingOthers = ref(false)
const previewVisible = ref(false)
const previewAttachment = ref(null)

const existingDocument = computed(() =>
  attachments.value.find(item => item.bizType === 'DISCLOSURE_DOC') || null
)
const existingOthers = computed(() =>
  attachments.value.filter(item => item.bizType === 'DISCLOSURE_OTHER')
)

const fmtSize = (bytes) => {
  if (bytes === null || bytes === undefined) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`

const openPreview = (target) => {
  previewAttachment.value = typeof File !== 'undefined' && target instanceof File
    ? {
        file: target,
        fileName: target.name,
        contentType: target.type
      }
    : target
  previewVisible.value = true
}

const loadAttachments = async () => {
  if (!props.disclosureId) {
    attachments.value = []
    return
  }
  loading.value = true
  try {
    const response = await getAttachments(props.disclosureId)
    attachments.value = response.data || []
  } catch {
    attachments.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.disclosureId, loadAttachments, { immediate: true })

const resetInput = (inputRef) => {
  if (inputRef.value) inputRef.value.value = ''
}

const handleDocumentSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['doc', 'docx'].includes(extension)) {
    ElMessage.warning('交底书只能选择 .doc 或 .docx 格式的 Word 文档')
    resetInput(documentInput)
    return
  }

  if (!props.disclosureId) {
    emit('update:documentFile', file)
    resetInput(documentInput)
    return
  }

  uploadingDocument.value = true
  try {
    await replaceDisclosureDocument(props.disclosureId, file)
    ElMessage.success(existingDocument.value ? '交底书更换成功' : '交底书上传成功')
    await loadAttachments()
    emit('changed')
  } catch {
    // 请求层已经展示错误信息
  } finally {
    uploadingDocument.value = false
    resetInput(documentInput)
  }
}

const handleOthersSelected = async (event) => {
  const selectedFiles = Array.from(event.target.files || [])
  if (!selectedFiles.length) return

  if (!props.disclosureId) {
    const merged = [...props.otherFiles]
    const existingKeys = new Set(merged.map(fileKey))
    selectedFiles.forEach(file => {
      const key = fileKey(file)
      if (!existingKeys.has(key)) {
        existingKeys.add(key)
        merged.push(file)
      }
    })
    emit('update:otherFiles', merged)
    resetInput(otherInput)
    return
  }

  uploadingOthers.value = true
  try {
    for (const file of selectedFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bizType', 'DISCLOSURE_OTHER')
      await uploadAttachment(props.disclosureId, formData)
    }
    ElMessage.success(`已上传 ${selectedFiles.length} 个附件`)
    emit('changed')
  } catch {
    // 请求层已经展示错误信息；finally 中刷新已成功上传的文件
  } finally {
    await loadAttachments()
    uploadingOthers.value = false
    resetInput(otherInput)
  }
}

const removePendingDocument = () => {
  emit('update:documentFile', null)
  resetInput(documentInput)
}

const removePendingOther = (target) => {
  emit('update:otherFiles', props.otherFiles.filter(file => fileKey(file) !== fileKey(target)))
}

const removeExisting = async (attachment) => {
  try {
    const label = attachment.bizType === 'DISCLOSURE_DOC' ? '交底书' : '附件'
    await ElMessageBox.confirm(`确认删除“${attachment.fileName}”吗？`, `删除${label}`, {
      type: 'warning'
    })
    await deleteAttachment(attachment.id)
    ElMessage.success(`${label}已删除`)
    await loadAttachments()
    emit('changed')
  } catch {
    // 用户取消或请求层已经提示错误
  }
}

defineExpose({ reload: loadAttachments })
</script>

<style scoped>
.attachment-editor { min-height: 180px; }
.attachment-section { padding: 2px 0; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.section-heading h4 { margin: 0 0 5px; font-size: 15px; color: #303133; }
.section-heading p { margin: 0; font-size: 12px; color: #909399; }
.hidden-input { display: none; }
.attachment-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; padding: 9px 12px; border: 1px solid #ebeef5; border-radius: 6px; background: #fff; }
.pending-row { border-color: #e6a23c; background: #fdf6ec; }
.file-info { display: flex; align-items: center; gap: 9px; min-width: 0; }
.file-name { max-width: 520px; color: #606266; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-size { color: #909399; font-size: 12px; white-space: nowrap; }
.row-actions { display: flex; flex-shrink: 0; }
.save-hint { margin-top: 16px; }
:deep(.el-empty) { padding: 8px 0 0; }
</style>
