<template>
  <div class="mail-composer">
    <!-- ========== 弹窗模式 ========== -->
    <el-dialog
      v-if="mode === 'dialog'"
      v-model="visible"
      :title="title || '发送邮件'"
      width="720px"
      destroy-on-close
      @closed="onClosed"
    >
      <el-form label-width="90px" class="composer-form">
        <!-- 发送模式 -->
        <el-form-item label="发送模式">
          <el-radio-group v-model="sendMode" @change="onSendModeChange">
            <el-radio-button value="normal">普通发送</el-radio-button>
            <el-radio-button value="template">模板发送</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 模板选择 -->
        <el-form-item v-if="sendMode === 'template'" label="选择模板">
          <el-select v-model="sendForm.templateCode" placeholder="选择邮件模板" clearable @change="onTemplateSelect" style="width:100%">
            <el-option v-for="tpl in enabledTemplates" :key="tpl.templateCode" :label="`${tpl.templateName} (${tpl.templateCode})`" :value="tpl.templateCode" />
          </el-select>
        </el-form-item>

        <!-- 模板变量 -->
        <template v-if="sendMode === 'template' && templateVariables.length">
          <el-divider content-position="left">模板变量</el-divider>
          <template v-for="v in templateVariables" :key="v">
            <el-form-item v-if="isImageVar(v)" :label="templateVarLabel(v)">
              <template v-if="templateData[v]">
                <div class="var-image-filled">
                  <img :src="templateData[v]" class="var-image-thumb" />
                  <el-button size="small" type="danger" text @click="templateData[v]=''">清除</el-button>
                </div>
              </template>
              <span v-else class="var-image-waiting">上传图片后自动填入</span>
            </el-form-item>
            <el-form-item v-else :label="templateVarLabel(v)" required>
              <el-input v-model="templateData[v]" :placeholder="`输入${templateVarLabel(v)}`" />
            </el-form-item>
          </template>
        </template>

        <!-- 模板预览 -->
        <template v-if="sendMode === 'template' && selectedTemplate">
          <el-divider content-position="left">模板预览</el-divider>
          <el-form-item label="主题">
            <el-input :model-value="renderedSubject" disabled />
          </el-form-item>
          <el-form-item label="正文">
            <div class="content-preview" v-html="selectedTemplate.content"></div>
          </el-form-item>
        </template>

        <el-divider />

        <!-- 收件人 -->
        <el-form-item v-if="showRecipient" label="收件人" required>
          <el-input v-model="sendForm.to" placeholder="多个邮箱用逗号或分号分隔" />
        </el-form-item>

        <!-- 抄送 / 密送 折叠区 -->
        <div class="cc-bcc-area">
          <div class="cc-bcc-label">
            <span class="cc-bcc-toggle" @click="showCcBcc = !showCcBcc">
              <el-icon :size="14" class="toggle-icon" :class="{ rotated: showCcBcc }"><ArrowRight /></el-icon>
              <span>抄送/密送</span>
            </span>
          </div>
          <div class="cc-bcc-body">
            <span v-if="!showCcBcc && (sendForm.cc || sendForm.bcc)" class="cc-bcc-hint">
              {{ [sendForm.cc, sendForm.bcc].filter(Boolean).join('；') }}
            </span>
            <template v-if="showCcBcc">
              <el-form-item label="抄送">
                <el-input v-model="sendForm.cc" placeholder="多个邮箱用逗号或分号分隔" />
              </el-form-item>
              <el-form-item label="密送">
                <el-input v-model="sendForm.bcc" placeholder="多个邮箱用逗号或分号分隔" />
              </el-form-item>
            </template>
          </div>
        </div>

        <!-- 普通模式：主题 + 正文 -->
        <template v-if="sendMode === 'normal'">
          <el-form-item label="主题" required>
            <el-input v-model="sendForm.subject" placeholder="邮件主题" />
          </el-form-item>
          <el-form-item label="正文" required>
            <el-input v-model="sendForm.text" type="textarea" :rows="6" placeholder="邮件正文，支持 HTML" />
          </el-form-item>
        </template>

        <!-- 模板模式：图片上传（仅模板含图片变量时显示） -->
        <template v-if="sendMode === 'template' && templateVariables.some(v => isImageVar(v))">
          <el-form-item label="插入图片">
            <div class="image-upload-area">
              <el-upload
                :show-file-list="false"
                :before-upload="beforeImageUpload"
                :http-request="uploadImage"
                accept="image/*"
                action="#"
              >
                <el-button :loading="uploadingImage" size="small">选择图片</el-button>
              </el-upload>
              <span class="upload-tip">上传后在模板正文中以 cid 或 URL 引用</span>
            </div>
            <div v-if="imageUrls.length" class="image-preview-list">
              <div v-for="(url, idx) in imageUrls" :key="idx" class="image-preview-item">
                <img :src="url" class="image-thumb" @click="copyImageUrl(url)" title="点击复制 URL" />
                <span class="image-url-text">{{ getFileName(url) }}</span>
                <div class="image-url-actions">
                  <el-button size="small" text @click="copyImageUrl(url)">复制URL</el-button>
                  <el-button size="small" type="danger" text @click="removeImage(idx)">删除</el-button>
                </div>
              </div>
            </div>
          </el-form-item>
        </template>

        <!-- 附件 -->
        <el-form-item label="附件">
          <FileUpload ref="fileUploadRef" v-model="attachmentUrls" tip="支持上传多个文件" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSend" :loading="sending" size="large" style="width:120px">
          {{ sending ? '发送中...' : '发送邮件' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ========== 内联模式 ========== -->
    <el-card v-else :shadow="shadow" :body-style="bodyStyle">
      <template v-if="showHeader" #header>
        <span class="card-title">{{ title || '发送邮件' }}</span>
      </template>

      <el-form label-width="90px" class="composer-form">
        <!-- 发送模式 -->
        <el-form-item label="发送模式">
          <el-radio-group v-model="sendMode" @change="onSendModeChange">
            <el-radio-button value="normal">普通发送</el-radio-button>
            <el-radio-button value="template">模板发送</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 模板选择 -->
        <el-form-item v-if="sendMode === 'template'" label="选择模板">
          <el-select v-model="sendForm.templateCode" placeholder="选择邮件模板" clearable @change="onTemplateSelect" style="width:100%">
            <el-option v-for="tpl in enabledTemplates" :key="tpl.templateCode" :label="`${tpl.templateName} (${tpl.templateCode})`" :value="tpl.templateCode" />
          </el-select>
        </el-form-item>

        <!-- 模板变量 -->
        <template v-if="sendMode === 'template' && templateVariables.length">
          <el-divider content-position="left">模板变量</el-divider>
          <template v-for="v in templateVariables" :key="v">
            <el-form-item v-if="isImageVar(v)" :label="templateVarLabel(v)">
              <template v-if="templateData[v]">
                <div class="var-image-filled">
                  <img :src="templateData[v]" class="var-image-thumb" />
                  <el-button size="small" type="danger" text @click="templateData[v]=''">清除</el-button>
                </div>
              </template>
              <span v-else class="var-image-waiting">上传图片后自动填入</span>
            </el-form-item>
            <el-form-item v-else :label="templateVarLabel(v)" required>
              <el-input v-model="templateData[v]" :placeholder="`输入${templateVarLabel(v)}`" />
            </el-form-item>
          </template>
        </template>

        <!-- 模板预览 -->
        <template v-if="sendMode === 'template' && selectedTemplate">
          <el-divider content-position="left">模板预览</el-divider>
          <el-form-item label="主题">
            <el-input :model-value="renderedSubject" disabled />
          </el-form-item>
          <el-form-item label="正文">
            <div class="content-preview" v-html="selectedTemplate.content"></div>
          </el-form-item>
        </template>

        <el-divider />

        <!-- 收件人 -->
        <el-form-item v-if="showRecipient" label="收件人" required>
          <el-input v-model="sendForm.to" placeholder="多个邮箱用逗号或分号分隔" />
        </el-form-item>

        <!-- 抄送 / 密送 折叠区 -->
        <div class="cc-bcc-area">
          <div class="cc-bcc-label">
            <span class="cc-bcc-toggle" @click="showCcBcc = !showCcBcc">
              <el-icon :size="14" class="toggle-icon" :class="{ rotated: showCcBcc }"><ArrowRight /></el-icon>
              <span>抄送/密送</span>
            </span>
          </div>
          <div class="cc-bcc-body">
            <span v-if="!showCcBcc && (sendForm.cc || sendForm.bcc)" class="cc-bcc-hint">
              {{ [sendForm.cc, sendForm.bcc].filter(Boolean).join('；') }}
            </span>
            <template v-if="showCcBcc">
              <el-form-item label="抄送">
                <el-input v-model="sendForm.cc" placeholder="多个邮箱用逗号或分号分隔" />
              </el-form-item>
              <el-form-item label="密送">
                <el-input v-model="sendForm.bcc" placeholder="多个邮箱用逗号或分号分隔" />
              </el-form-item>
            </template>
          </div>
        </div>

        <!-- 普通模式：主题 + 正文 -->
        <template v-if="sendMode === 'normal'">
          <el-form-item label="主题" required>
            <el-input v-model="sendForm.subject" placeholder="邮件主题" />
          </el-form-item>
          <el-form-item label="正文" required>
            <el-input v-model="sendForm.text" type="textarea" :rows="6" placeholder="邮件正文，支持 HTML" />
          </el-form-item>
        </template>

        <!-- 模板模式：图片上传（仅模板含图片变量时显示） -->
        <template v-if="sendMode === 'template' && templateVariables.some(v => isImageVar(v))">
          <el-form-item label="插入图片">
            <div class="image-upload-area">
              <el-upload
                :show-file-list="false"
                :before-upload="beforeImageUpload"
                :http-request="uploadImage"
                accept="image/*"
                action="#"
              >
                <el-button :loading="uploadingImage" size="small">选择图片</el-button>
              </el-upload>
              <span class="upload-tip">上传后在模板正文中以 cid 或 URL 引用</span>
            </div>
            <div v-if="imageUrls.length" class="image-preview-list">
              <div v-for="(url, idx) in imageUrls" :key="idx" class="image-preview-item">
                <img :src="url" class="image-thumb" @click="copyImageUrl(url)" title="点击复制 URL" />
                <span class="image-url-text">{{ getFileName(url) }}</span>
                <div class="image-url-actions">
                  <el-button size="small" text @click="copyImageUrl(url)">复制URL</el-button>
                  <el-button size="small" type="danger" text @click="removeImage(idx)">删除</el-button>
                </div>
              </div>
            </div>
          </el-form-item>
        </template>

        <!-- 附件 -->
        <el-form-item label="附件">
          <FileUpload ref="fileUploadRef" v-model="attachmentUrls" tip="支持上传多个文件" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSend" :loading="sending" size="large" style="width:120px">
            {{ sending ? '发送中...' : '发送邮件' }}
          </el-button>
          <el-button @click="onCancel" style="margin-left:10px">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { sendMail, sendMailWithTemplate, getTemplateList, uploadFile } from '../api/mail'
import { ArrowRight } from '@element-plus/icons-vue'
import { autoFillTemplateVars, templateVarLabel, renderTemplate } from '../utils/templateHelper'
import { useUserStore } from '../stores/user'
import FileUpload from './FileUpload.vue'

// ==================== Props ====================
const props = defineProps({
  mode: { type: String, default: 'inline', validator: v => ['inline', 'dialog'].includes(v) },
  title: { type: String, default: '' },
  shadow: { type: String, default: 'hover' },
  bodyStyle: { type: Object, default: undefined },
  showHeader: { type: Boolean, default: true },
  showRecipient: { type: Boolean, default: true },
  defaultTo: { type: String, default: '' },
  defaultCc: { type: String, default: '' },
  defaultSubject: { type: String, default: '' },
  defaultText: { type: String, default: '' },
  disclosureId: { type: Number, default: null },
  disclosureAttachmentIds: { type: Array, default: () => [] },
  modelValue: { type: Boolean, default: false },
  contextData: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'sent', 'cancel'])
const { state: userState } = useUserStore()

// ==================== 状态 ====================
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const sendMode = ref('normal')
const sending = ref(false)
const attachmentUrls = ref([])
const imageUrls = ref([])
const uploadingImage = ref(false)
const fileUploadRef = ref(null)
const templateList = ref([])
const templateLoading = ref(false)
const selectedTemplate = ref(null)
const templateVariables = ref([])
const templateData = reactive({})

const showCcBcc = ref(false)

const sendForm = reactive({
  to: '',
  cc: '',
  bcc: '',
  subject: '',
  text: '',
  templateCode: ''
})

const enabledTemplates = computed(() => templateList.value.filter(t => t.enabled === 1))

const renderedSubject = computed(() => {
  if (!selectedTemplate.value) return ''
  return renderTemplate(selectedTemplate.value.subject, templateData)
})

// ==================== 监听默认值变化 ====================
watch(() => props.defaultTo, v => { sendForm.to = v || '' })
watch(() => props.defaultCc, v => { sendForm.cc = v || '' })
watch(() => props.defaultSubject, v => { sendForm.subject = v || '' })
watch(() => props.defaultText, v => { sendForm.text = v || '' })

// 弹窗打开时初始化表单值
watch(visible, (val) => {
  if (val) {
    sendForm.to = props.defaultTo || ''
    sendForm.cc = props.defaultCc || ''
    sendForm.bcc = ''
    sendForm.subject = props.defaultSubject || ''
    sendForm.text = props.defaultText || ''
    showCcBcc.value = false
    loadTemplates()
  }
})

// ==================== 方法 ====================
const parseVariables = (text) => {
  const matches = (text || '').match(/\$\{(\w+)\}/g) || []
  return [...new Set(matches.map(m => m.slice(2, -1)))]
}

const onTemplateSelect = (code) => {
  Object.keys(templateData).forEach(k => delete templateData[k])
  if (!code) {
    selectedTemplate.value = null
    templateVariables.value = []
    return
  }
  const tpl = templateList.value.find(t => t.templateCode === code)
  if (tpl) {
    selectedTemplate.value = tpl
    const subjectVars = parseVariables(tpl.subject || '')
    const contentVars = parseVariables(tpl.content || '')
    templateVariables.value = [...new Set([...subjectVars, ...contentVars])]
    Object.keys(templateData).forEach(k => delete templateData[k])
    Object.assign(templateData, autoFillTemplateVars(templateVariables.value, {
      ...props.contextData,
      user: userState.userInfo || {}
    }))
  }
}

const onSendModeChange = () => {
  sendForm.templateCode = ''
  Object.keys(templateData).forEach(k => delete templateData[k])
  selectedTemplate.value = null
  templateVariables.value = []
}

const handleSend = async () => {
  if (!sendForm.to.trim()) { ElMessage.warning('请输入收件人'); return }
  if (sendMode.value === 'normal') {
    if (!sendForm.subject.trim()) { ElMessage.warning('主题不能为空'); return }
    if (!sendForm.text.trim()) { ElMessage.warning('正文不能为空'); return }
  } else {
    if (!sendForm.templateCode) { ElMessage.warning('请选择邮件模板'); return }
    const emptyVar = templateVariables.value.find(v => !templateData[v]?.trim())
    if (emptyVar) { ElMessage.warning(`请填写模板变量：${emptyVar}`); return }
  }

  sending.value = true
  try {
    const allAttachmentUrls = [...attachmentUrls.value, ...imageUrls.value]
    const body = {
      to: sendForm.to.trim(),
      cc: sendForm.cc.trim() || undefined,
      bcc: sendForm.bcc.trim() || undefined,
      attachmentUrls: allAttachmentUrls
    }
    if (props.disclosureId) body.disclosureId = props.disclosureId
    if (props.disclosureAttachmentIds.length) body.disclosureAttachmentIds = props.disclosureAttachmentIds

    let res
    if (sendMode.value === 'normal') {
      body.subject = sendForm.subject.trim()
      body.text = sendForm.text.trim()
      res = await sendMail(body)
    } else {
      body.templateCode = sendForm.templateCode
      body.templateData = { ...templateData }
      body.subject = renderedSubject.value
      res = await sendMailWithTemplate(body)
    }

    if (res.code === 200) {
      ElMessage.success('发送成功')
      emit('sent', {
        to: sendForm.to.trim(),
        cc: sendForm.cc.trim(),
        subject: sendForm.subject.trim(),
        text: sendForm.text.trim(),
        templateCode: sendForm.templateCode
      })
      resetForm()
      if (props.mode === 'dialog') visible.value = false
    }
  } finally { sending.value = false }
}

const onCancel = () => {
  emit('cancel')
  resetForm()
}

const onClosed = () => {
  resetForm()
}

const resetForm = () => {
  sendMode.value = 'normal'
  sendForm.to = props.defaultTo || ''
  sendForm.cc = props.defaultCc || ''
  sendForm.bcc = ''
  sendForm.subject = props.defaultSubject || ''
  sendForm.text = props.defaultText || ''
  sendForm.templateCode = ''
  showCcBcc.value = false
  attachmentUrls.value = []
  imageUrls.value = []
  Object.keys(templateData).forEach(k => delete templateData[k])
  selectedTemplate.value = null
  templateVariables.value = []
  if (fileUploadRef.value) fileUploadRef.value.clearFiles()
}

const loadTemplates = async () => {
  templateLoading.value = true
  try {
    const res = await getTemplateList()
    if (res.code === 200) templateList.value = res.data || []
  } finally { templateLoading.value = false }
}

// ==================== 图片上传 ====================
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) { ElMessage.warning('仅支持图片文件'); return false }
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) { ElMessage.warning('图片大小不能超过 5MB'); return false }
  return true
}

const uploadImage = async (option) => {
  const { file, onSuccess, onError } = option
  uploadingImage.value = true
  try {
    const res = await uploadFile(file)
    if (res.code === 200) {
      imageUrls.value.push(res.data)
      ElMessage.success('图片上传成功')
      // 自动填入匹配的模板变量（qrImageUrl/imageUrl/logo 等）并通知后端
      const imageVar = templateVariables.value.find(v => isImageVar(v))
      if (imageVar) {
        templateData[imageVar] = res.data
      }
      onSuccess(res)
    } else {
      onError(new Error(res.message || '上传失败'))
    }
  } catch (e) {
    onError(e)
  } finally { uploadingImage.value = false }
}

const isImageVar = (name) => /image|logo|pic|img|photo|banner|icon|avatar|qr/i.test(name)

const removeImage = (idx) => { imageUrls.value.splice(idx, 1) }

const copyImageUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('URL 已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动选择 URL')
  }
}

const getFileName = (url) => {
  const m = (url || '').match(/[?&]name=([^&]+)/)
  return m ? decodeURIComponent(m[1]) : (url || '').split('/').pop() || 'image'
}

// ==================== 暴露给外部的方法 ====================
const open = () => {
  if (props.mode === 'dialog') visible.value = true
  loadTemplates()
}

const close = () => {
  if (props.mode === 'dialog') visible.value = false
}

defineExpose({ open, close, resetForm })

onMounted(() => {
  if (props.mode === 'inline') loadTemplates()
  sendForm.to = props.defaultTo || ''
  sendForm.cc = props.defaultCc || ''
  sendForm.subject = props.defaultSubject || ''
  sendForm.text = props.defaultText || ''
})
</script>

<style scoped>
.mail-composer { width: 100%; }
.composer-form .el-form-item { margin-bottom: 18px; }
.content-preview {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
}
.card-title { font-size: 15px; font-weight: 600; }

/* ========== 抄送/密送 折叠区 ========== */
.cc-bcc-area {
  margin-bottom: 18px;
}
.cc-bcc-area {
  display: flex;
  align-items: flex-start;
  margin-bottom: 18px;
}
.cc-bcc-label {
  width: 90px;
  text-align: right;
  padding-right: 12px;
  flex-shrink: 0;
  line-height: 32px;
}
.cc-bcc-body {
  flex: 1;
  min-height: 32px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.cc-bcc-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
  white-space: nowrap;
}
.cc-bcc-toggle:hover {
  color: #409eff;
}
.toggle-icon {
  transition: transform 0.2s ease;
}
.toggle-icon.rotated {
  transform: rotate(90deg);
}
.cc-bcc-hint {
  color: #c0c4cc;
  font-size: 12px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 4px;
}

/* ========== 图片上传区域 ========== */
.image-upload-area {
  display: flex;
  align-items: center;
  gap: 12px;
}
.upload-tip {
  font-size: 12px;
  color: #909399;
}
.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.image-preview-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
}
.image-thumb {
  width: 100px;
  height: 80px;
  object-fit: cover;
  border-radius: 2px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.image-thumb:hover {
  opacity: 0.8;
}
.image-url-text {
  font-size: 12px;
  color: #606266;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}
.image-url-actions {
  display: flex;
  gap: 4px;
}

/* ========== 模板变量图片预览 ========== */
.var-image-filled {
  display: flex;
  align-items: center;
  gap: 10px;
}
.var-image-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
.var-image-waiting {
  color: #909399;
  font-size: 13px;
}
</style>
