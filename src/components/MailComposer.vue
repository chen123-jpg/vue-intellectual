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
          <el-form-item v-for="v in templateVariables" :key="v" :label="v" required>
            <el-input v-model="templateData[v]" :placeholder="`输入 ${v} 的值`" />
          </el-form-item>
        </template>

        <!-- 模板预览 -->
        <template v-if="sendMode === 'template' && selectedTemplate">
          <el-divider content-position="left">模板预览</el-divider>
          <el-form-item label="主题">
            <el-input :model-value="selectedTemplate.subject" disabled />
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
          <el-form-item v-for="v in templateVariables" :key="v" :label="v" required>
            <el-input v-model="templateData[v]" :placeholder="`输入 ${v} 的值`" />
          </el-form-item>
        </template>

        <!-- 模板预览 -->
        <template v-if="sendMode === 'template' && selectedTemplate">
          <el-divider content-position="left">模板预览</el-divider>
          <el-form-item label="主题">
            <el-input :model-value="selectedTemplate.subject" disabled />
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
import { sendMail, sendMailWithTemplate, getTemplateList } from '../api/mail'
import { ArrowRight } from '@element-plus/icons-vue'
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
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'sent', 'cancel'])

// ==================== 状态 ====================
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const sendMode = ref('normal')
const sending = ref(false)
const attachmentUrls = ref([])
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
    templateVariables.value.forEach(v => { templateData[v] = '' })
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
    const body = {
      to: sendForm.to.trim(),
      cc: sendForm.cc.trim() || undefined,
      bcc: sendForm.bcc.trim() || undefined,
      attachmentUrls: attachmentUrls.value
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
</style>
