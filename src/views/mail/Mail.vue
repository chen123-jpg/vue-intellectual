<template>
  <div class="mail-container">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="发送邮件" name="send">
          <el-form ref="sendFormRef" :model="sendForm" label-width="80px" class="send-form">
            <el-form-item label="发送模式">
              <el-radio-group v-model="sendMode" @change="onSendModeChange">
                <el-radio-button value="normal">普通发送</el-radio-button>
                <el-radio-button value="template">模板发送</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="sendMode === 'template'" label="选择模板">
              <el-select v-model="sendForm.templateCode" placeholder="选择邮件模板" clearable @change="onTemplateSelect" style="width:100%">
                <el-option v-for="tpl in enabledTemplates" :key="tpl.templateCode" :label="`${tpl.templateName} (${tpl.templateCode})`" :value="tpl.templateCode" />
              </el-select>
            </el-form-item>

            <template v-if="sendMode === 'template' && templateVariables.length">
              <el-divider content-position="left">模板变量</el-divider>
              <template v-for="v in templateVariables" :key="v">
                <el-form-item v-if="isImageVar(v)" :label="v">
                  <template v-if="templateData[v]">
                    <div class="var-image-filled">
                      <img :src="templateData[v]" class="var-image-thumb" />
                      <el-button size="small" type="danger" text @click="templateData[v]=''">清除</el-button>
                    </div>
                  </template>
                  <span v-else class="var-image-waiting">上传图片后自动填入</span>
                </el-form-item>
                <el-form-item v-else :label="v" required>
                  <el-input v-model="templateData[v]" :placeholder="`输入 ${v} 的值`" />
                </el-form-item>
              </template>
            </template>

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

            <el-form-item label="收件人" required>
              <el-input v-model="sendForm.to" placeholder="多个邮箱用逗号或分号分隔" />
            </el-form-item>

            <el-form-item label="抄送">
              <el-input v-model="sendForm.cc" placeholder="多个邮箱用逗号或分号分隔" />
            </el-form-item>

            <template v-if="sendMode === 'normal'">
              <el-form-item label="主题" required>
                <el-input v-model="sendForm.subject" placeholder="邮件主题" />
              </el-form-item>
              <el-form-item label="正文" required>
                <el-input v-model="sendForm.text" type="textarea" :rows="6" placeholder="邮件正文，支持 HTML" />
              </el-form-item>
            </template>

            <template v-if="sendMode === 'template' && templateVariables.some(v => isImageVar(v))">
              <el-form-item label="插入图片">
                <div class="image-upload-area">
                  <el-upload :show-file-list="false" :before-upload="beforeImageUpload" :http-request="uploadImage" accept="image/*" action="#">
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

            <el-form-item label="附件">
              <FileUpload ref="fileUploadRef" v-model="attachmentUrls" tip="支持上传多个文件" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSend" :loading="sending" size="large" style="width:120px">
                {{ sending ? '发送中...' : '发送邮件' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="模板管理" name="templates">
          <div style="margin-bottom:12px;">
            <el-button type="primary" @click="loadTemplates" :loading="templateLoading">刷新</el-button>
          </div>
          <el-table :data="templateList" v-loading="templateLoading" border>
            <el-table-column prop="templateCode" label="编码" width="180" />
            <el-table-column prop="templateName" label="名称" width="160" />
            <el-table-column prop="subject" label="主题模板" min-width="200" show-overflow-tooltip />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.enabled === 1 ? 'success' : 'danger'">
                  {{ row.enabled === 1 ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="applyTemplate(row.templateCode)">使用模板</el-button>
              </template>
            </el-table-column>
          </el-table>
          <p v-if="!templateList.length && !templateLoading" style="color:#909399;">暂无模板数据</p>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { sendMail, sendMailWithTemplate, getTemplateList, uploadFile } from '../../api/mail'
import FileUpload from '../../components/FileUpload.vue'

const activeTab = ref('send')
const sendMode = ref('normal')
const fileUploadRef = ref(null)

const sendForm = reactive({
  to: '', cc: '', subject: '', text: '', templateCode: ''
})
const templateData = reactive({})
const attachmentUrls = ref([])
const imageUrls = ref([])
const uploadingImage = ref(false)
const sending = ref(false)
const templateList = ref([])
const templateLoading = ref(false)
const selectedTemplate = ref(null)
const templateVariables = ref([])

const enabledTemplates = computed(() => templateList.value.filter(t => t.enabled === 1))

const parseVariables = (text) => {
  const matches = text.match(/\$\{(\w+)\}/g) || []
  return [...new Set(matches.map(m => m.slice(2, -1)))]
}

const onTemplateSelect = (code) => {
  Object.keys(templateData).forEach(k => delete templateData[k])
  if (!code) { selectedTemplate.value = null; templateVariables.value = []; return }
  const tpl = templateList.value.find(t => t.templateCode === code)
  if (tpl) {
    selectedTemplate.value = tpl
    const subjectVars = parseVariables(tpl.subject || '')
    const contentVars = parseVariables(tpl.content || '')
    templateVariables.value = [...new Set([...subjectVars, ...contentVars])]
    templateVariables.value.forEach(v => { templateData[v] = '' })
  }
}

const handleSend = async () => {
  if (!sendForm.to.trim()) { ElMessage.warning('请输入收件人'); return }
  if (sendMode.value === 'normal') {
    if (!sendForm.subject.trim() || !sendForm.text.trim()) { ElMessage.warning('主题和正文不能为空'); return }
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
      attachmentUrls: allAttachmentUrls
    }

    let res
    if (sendMode.value === 'normal') {
      body.subject = sendForm.subject.trim()
      body.text = sendForm.text.trim()
    } else {
      body.templateCode = sendForm.templateCode
      body.templateData = { ...templateData }
    }
    res = sendMode.value === 'normal' ? await sendMail(body) : await sendMailWithTemplate(body)

    if (res.code === 200) {
      ElMessage.success('发送成功')
      resetSendForm()
    }
  } finally { sending.value = false }
}

const resetSendForm = () => {
  sendForm.to = ''; sendForm.cc = ''; sendForm.subject = ''; sendForm.text = ''; sendForm.templateCode = ''
  Object.keys(templateData).forEach(k => delete templateData[k])
  attachmentUrls.value = []
  imageUrls.value = []
  selectedTemplate.value = null; templateVariables.value = []
  if (fileUploadRef.value) fileUploadRef.value.clearFiles()
}

const onSendModeChange = () => {
  sendForm.subject = ''; sendForm.text = ''; sendForm.templateCode = ''
  Object.keys(templateData).forEach(k => delete templateData[k])
  selectedTemplate.value = null; templateVariables.value = []
}

const loadTemplates = async () => {
  templateLoading.value = true
  try {
    const res = await getTemplateList()
    if (res.code === 200) templateList.value = res.data || []
  } finally { templateLoading.value = false }
}

const applyTemplate = (code) => {
  sendMode.value = 'template'
  sendForm.templateCode = code
  onTemplateSelect(code)
  activeTab.value = 'send'
  ElMessage.success(`已切换到模板发送：${code}`)
}

const onTabChange = (tabName) => {
  if (tabName === 'templates' && !templateList.value.length) loadTemplates()
}

// ==================== 图片上传 ====================
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) { ElMessage.warning('仅支持图片文件'); return false }
  if (file.size > 5 * 1024 * 1024) { ElMessage.warning('图片大小不能超过 5MB'); return false }
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

onMounted(() => loadTemplates())
</script>

<style scoped>
.mail-container { max-width: 1200px; }
.send-form .el-form-item { margin-bottom: 18px; }
.content-preview { background: #f5f7fa; padding: 12px; border-radius: 4px; max-height: 200px; overflow-y: auto; font-size: 13px; }
.image-upload-area { display: flex; align-items: center; gap: 12px; }
.upload-tip { font-size: 12px; color: #909399; }
.image-preview-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
.image-preview-item { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px; border: 1px solid #e4e7ed; border-radius: 4px; background: #fafafa; }
.image-thumb { width: 100px; height: 80px; object-fit: cover; border-radius: 2px; cursor: pointer; transition: opacity 0.2s; }
.image-thumb:hover { opacity: 0.8; }
.image-url-text { font-size: 12px; color: #606266; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.image-url-actions { display: flex; gap: 4px; }
.var-image-filled { display: flex; align-items: center; gap: 10px; }
.var-image-thumb { width: 60px; height: 60px; object-fit: cover; border: 1px solid #e4e7ed; border-radius: 4px; }
.var-image-waiting { color: #909399; font-size: 13px; }
</style>
