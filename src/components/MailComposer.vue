<template>
  <div class="mail-composer">
    <input ref="imageFileInputRef" type="file" accept="image/*" style="display:none" @change="onImageFileChosen" />
    <!-- ========== 弹窗模式 ========== -->
    <el-dialog
      v-if="mode === 'dialog'"
      v-model="visible"
      :title="title || '发送邮件'"
      width="720px"
      destroy-on-close
      @closed="onClosed"
    >
      <el-form label-width="110px" class="composer-form">
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
          <el-divider />
          <template v-for="v in templateVariables" :key="v">
            <el-form-item v-if="isImageVar(v)" :label="templateVarLabel(v)">
              <template v-if="templateData[v]">
                <div class="var-image-filled">
                  <img :src="templateData[v]" class="var-image-thumb" />
                  <el-button size="small" type="danger" text @click="clearImageVar(v)">清除</el-button>
                </div>
              </template>
              <span v-else class="var-image-waiting">上传图片后自动填入模板对应位置</span>
            </el-form-item>
            <el-form-item v-else :label="templateVarLabel(v)" required>
              <el-input v-model="templateData[v]" :placeholder="`输入${templateVarLabel(v)}`" @input="onVarChange" />
            </el-form-item>
          </template>
        </template>

        <!-- 邮件预览 -->
        <template v-if="sendMode === 'template' && selectedTemplate">
          <el-divider />
          <el-form-item label="主题">
            <el-input v-model="previewSubject" @input="onSubjectInput" placeholder="邮件主题" />
          </el-form-item>
          <el-form-item label="正文">
            <div class="editor-toolbar" @mousedown.prevent>
              <el-button-group>
                <el-button size="small" text title="撤销" @click="execCmd('undo')"><el-icon><RefreshLeft /></el-icon></el-button>
                <el-button size="small" text title="重做" @click="execCmd('redo')"><el-icon><RefreshRight /></el-icon></el-button>
              </el-button-group>
              <el-divider direction="vertical" />
              <el-button-group>
                <el-button size="small" text title="加粗" @click="execCmd('bold')"><b>B</b></el-button>
                <el-button size="small" text title="斜体" @click="execCmd('italic')"><i>I</i></el-button>
                <el-button size="small" text title="下划线" @click="execCmd('underline')"><u>U</u></el-button>
                <el-button size="small" text title="删除线" @click="execCmd('strikeThrough')"><s>S</s></el-button>
              </el-button-group>
              <el-divider direction="vertical" />
              <el-button-group>
                <el-button size="small" text title="无序列表" @click="execCmd('insertUnorderedList')"><el-icon><List /></el-icon></el-button>
                <el-button size="small" text title="有序列表" @click="execCmd('insertOrderedList')"><el-icon><Tickets /></el-icon></el-button>
              </el-button-group>
              <el-divider direction="vertical" />
              <el-button-group>
                <el-button size="small" text title="插入链接" @click="insertLink"><el-icon><Link /></el-icon></el-button>
                <el-button size="small" text title="插入图片" :loading="insertingImage" @click="insertImage"><el-icon><Picture /></el-icon></el-button>
                <el-button size="small" text title="清除格式" @click="execCmd('removeFormat')"><el-icon><Delete /></el-icon></el-button>
              </el-button-group>
              <div class="editor-toolbar__spacer"></div>
              <el-button size="small" @click="regeneratePreview" title="根据模板变量重新生成预览">重新生成</el-button>
            </div>
            <div
              ref="contentEditableRef"
              class="content-preview editable-preview"
              contenteditable="true"
              v-loading="previewLoading"
              @input="onContentInput"
              @mouseup="captureEditorSelection"
              @keyup="captureEditorSelection"
              @focus="captureEditorSelection"
            ></div>
            <div v-if="contentDirty || subjectDirty" class="dirty-hint">
              <el-icon><InfoFilled /></el-icon>
              <span>已手动修改，修改模板变量不会自动刷新预览，点击『重新生成』恢复模板渲染。</span>
            </div>
          </el-form-item>

          <!-- 已插入图片管理：显示在邮件预览下方 -->
          <el-form-item v-if="imageUrls.length" label="已插入图片">
            <div class="image-preview-list" @mousedown.prevent>
              <div v-for="(url, idx) in imageUrls" :key="idx" class="image-preview-item">
                <img :src="url" class="image-thumb" />
                <span class="image-url-text">{{ getFileName(url) }}</span>
                <div class="image-url-actions">
                  <el-button size="small" type="primary" text @click="insertImageAtCaret(url)">插入</el-button>
                  <el-button size="small" type="danger" text @click="removeImage(idx)">删除</el-button>
                </div>
              </div>
            </div>
            <div class="image-insert-hint">先在预览正文中点击图片要插入的位置，再点『插入』。</div>
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

      <el-form label-width="110px" class="composer-form">
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
          <el-divider />
          <template v-for="v in templateVariables" :key="v">
            <el-form-item v-if="isImageVar(v)" :label="templateVarLabel(v)">
              <template v-if="templateData[v]">
                <div class="var-image-filled">
                  <img :src="templateData[v]" class="var-image-thumb" />
                  <el-button size="small" type="danger" text @click="clearImageVar(v)">清除</el-button>
                </div>
              </template>
              <span v-else class="var-image-waiting">上传图片后自动填入模板对应位置</span>
            </el-form-item>
            <el-form-item v-else :label="templateVarLabel(v)" required>
              <el-input v-model="templateData[v]" :placeholder="`输入${templateVarLabel(v)}`" @input="onVarChange" />
            </el-form-item>
          </template>
        </template>

        <!-- 邮件预览 -->
        <template v-if="sendMode === 'template' && selectedTemplate">
          <el-divider />
          <el-form-item label="主题">
            <el-input v-model="previewSubject" @input="onSubjectInput" placeholder="邮件主题" />
          </el-form-item>
          <el-form-item label="正文">
            <div class="editor-toolbar" @mousedown.prevent>
              <el-button-group>
                <el-button size="small" text title="撤销" @click="execCmd('undo')"><el-icon><RefreshLeft /></el-icon></el-button>
                <el-button size="small" text title="重做" @click="execCmd('redo')"><el-icon><RefreshRight /></el-icon></el-button>
              </el-button-group>
              <el-divider direction="vertical" />
              <el-button-group>
                <el-button size="small" text title="加粗" @click="execCmd('bold')"><b>B</b></el-button>
                <el-button size="small" text title="斜体" @click="execCmd('italic')"><i>I</i></el-button>
                <el-button size="small" text title="下划线" @click="execCmd('underline')"><u>U</u></el-button>
                <el-button size="small" text title="删除线" @click="execCmd('strikeThrough')"><s>S</s></el-button>
              </el-button-group>
              <el-divider direction="vertical" />
              <el-button-group>
                <el-button size="small" text title="无序列表" @click="execCmd('insertUnorderedList')"><el-icon><List /></el-icon></el-button>
                <el-button size="small" text title="有序列表" @click="execCmd('insertOrderedList')"><el-icon><Tickets /></el-icon></el-button>
              </el-button-group>
              <el-divider direction="vertical" />
              <el-button-group>
                <el-button size="small" text title="插入链接" @click="insertLink"><el-icon><Link /></el-icon></el-button>
                <el-button size="small" text title="插入图片" :loading="insertingImage" @click="insertImage"><el-icon><Picture /></el-icon></el-button>
                <el-button size="small" text title="清除格式" @click="execCmd('removeFormat')"><el-icon><Delete /></el-icon></el-button>
              </el-button-group>
              <div class="editor-toolbar__spacer"></div>
              <el-button size="small" @click="regeneratePreview" title="根据模板变量重新生成预览">重新生成</el-button>
            </div>
            <div
              ref="contentEditableRef"
              class="content-preview editable-preview"
              contenteditable="true"
              v-loading="previewLoading"
              @input="onContentInput"
              @mouseup="captureEditorSelection"
              @keyup="captureEditorSelection"
              @focus="captureEditorSelection"
            ></div>
            <div v-if="contentDirty || subjectDirty" class="dirty-hint">
              <el-icon><InfoFilled /></el-icon>
              <span>已手动修改，修改模板变量不会自动刷新预览，点击『重新生成』恢复模板渲染。</span>
            </div>
          </el-form-item>

          <!-- 已插入图片管理：显示在邮件预览下方 -->
          <el-form-item v-if="imageUrls.length" label="已插入图片">
            <div class="image-preview-list" @mousedown.prevent>
              <div v-for="(url, idx) in imageUrls" :key="idx" class="image-preview-item">
                <img :src="url" class="image-thumb" />
                <span class="image-url-text">{{ getFileName(url) }}</span>
                <div class="image-url-actions">
                  <el-button size="small" type="primary" text @click="insertImageAtCaret(url)">插入</el-button>
                  <el-button size="small" type="danger" text @click="removeImage(idx)">删除</el-button>
                </div>
              </div>
            </div>
            <div class="image-insert-hint">先在预览正文中点击图片要插入的位置，再点『插入』。</div>
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
import { sendMail, sendMailWithTemplate, renderMailPreview, getTemplateList, uploadFile, deleteFile } from '../api/mail'
import { ArrowRight, RefreshLeft, RefreshRight, List, Tickets, Link, Picture, Delete, InfoFilled } from '@element-plus/icons-vue'
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
  referenceId: { type: String, default: '' },
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
const fileUploadRef = ref(null)
const templateList = ref([])
const templateLoading = ref(false)
const selectedTemplate = ref(null)
const templateVariables = ref([])
const templateData = reactive({})

const previewSubject = ref('')
const previewContent = ref('')
const contentDirty = ref(false)
const subjectDirty = ref(false)
const previewLoading = ref(false)
const insertingImage = ref(false)
const contentEditableRef = ref(null)
const imageFileInputRef = ref(null)
let renderTimer = null

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

// ==================== 预览渲染 ====================
const syncEditorDom = () => {
  if (contentEditableRef.value) {
    contentEditableRef.value.innerHTML = previewContent.value
  }
}

/** 后端渲染失败时的前端兜底渲染（仅刷新未手动编辑的部分） */
const renderLocalPreview = () => {
  if (!selectedTemplate.value) return
  if (!subjectDirty.value) previewSubject.value = renderTemplate(selectedTemplate.value.subject, templateData)
  if (!contentDirty.value) {
    previewContent.value = renderTemplate(selectedTemplate.value.content, templateData)
    syncEditorDom()
  }
}

const fetchPreview = async () => {
  if (!selectedTemplate.value || !sendForm.templateCode) return
  previewLoading.value = true
  try {
    const res = await renderMailPreview({
      templateCode: sendForm.templateCode,
      templateData: { ...templateData }
    })
    if (res.code === 200) {
      if (!subjectDirty.value) previewSubject.value = res.data.subject || ''
      if (!contentDirty.value) {
        previewContent.value = res.data.content || ''
        syncEditorDom()
      }
    } else {
      renderLocalPreview()
    }
  } catch (e) {
    renderLocalPreview()
  } finally {
    previewLoading.value = false
  }
}

const onVarChange = () => {
  clearTimeout(renderTimer)
  if (contentDirty.value && subjectDirty.value) return
  renderTimer = setTimeout(fetchPreview, 400)
}

const onSubjectInput = () => { subjectDirty.value = true }

const onContentInput = () => {
  contentDirty.value = true
  previewContent.value = contentEditableRef.value ? contentEditableRef.value.innerHTML : ''
}

const execCmd = (cmd, value = null) => {
  if (!contentEditableRef.value) return
  contentEditableRef.value.focus()
  document.execCommand(cmd, false, value)
  onContentInput()
}

const insertLink = () => {
  const url = window.prompt('请输入链接地址（以 http:// 或 https:// 开头）')
  if (!url) return
  execCmd('createLink', url)
}

const insertImage = () => {
  imageFileInputRef.value?.click()
}

const onImageFileChosen = async (e) => {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) { ElMessage.warning('仅支持图片文件'); return }
  if (file.size > 5 * 1024 * 1024) { ElMessage.warning('图片大小不能超过 5MB'); return }
  insertingImage.value = true
  try {
    const res = await uploadFile(file)
    if (res.code === 200) {
      imageUrls.value.push(res.data)
      // 自动填入模板中第一个空的图片变量（如 qrImageUrl），图片会出现在模板对应位置
      const imageVar = templateVariables.value.find(v => isImageVar(v) && !templateData[v])
      if (imageVar) {
        templateData[imageVar] = res.data
        onVarChange()
        ElMessage.success('图片已上传并填入模板图片位置')
      } else {
        ElMessage.success('图片上传成功，请在预览中点击要插入的位置后点『插入』')
      }
    } else {
      ElMessage.warning(res.message || '图片上传失败')
    }
  } catch (err) {
    ElMessage.warning('图片上传失败')
  } finally {
    insertingImage.value = false
  }
}

// 记录预览内最后一次光标位置，用于把图片插入到用户选择的位置
let editorSelection = null
const captureEditorSelection = () => {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0 && contentEditableRef.value && contentEditableRef.value.contains(sel.anchorNode)) {
    editorSelection = sel.getRangeAt(0).cloneRange()
  }
}

const insertImageAtCaret = (url) => {
  const el = contentEditableRef.value
  if (!el) return
  el.focus()
  if (editorSelection && document.contains(editorSelection.startContainer)) {
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(editorSelection)
    }
  }
  document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:100%" />`)
  onContentInput()
}

const regeneratePreview = () => {
  contentDirty.value = false
  subjectDirty.value = false
  imageUrls.value = []
  clearTimeout(renderTimer)
  fetchPreview()
}

const getEditorHtml = () => {
  return contentEditableRef.value ? contentEditableRef.value.innerHTML : previewContent.value
}

const buildDefaultCc = (extraCc) => {
  const userEmail = userState.userInfo?.email || userState.email || ''
  const parts = [userEmail]
  if (extraCc) parts.push(extraCc)
  // TODO: 后续接入指导人邮箱
  return [...new Set(parts.filter(Boolean))].join(', ')
}

// ==================== 监听默认值变化 ====================
watch(() => props.defaultTo, v => { sendForm.to = v || '' })
watch(() => props.defaultCc, v => { sendForm.cc = buildDefaultCc(v) })
watch(() => props.defaultSubject, v => { sendForm.subject = v || '' })
watch(() => props.defaultText, v => { sendForm.text = v || '' })

// 弹窗打开时初始化表单值
watch(visible, (val) => {
  if (val) {
    sendForm.to = props.defaultTo || ''
    sendForm.cc = buildDefaultCc(props.defaultCc)
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
  clearTimeout(renderTimer)
  previewSubject.value = ''
  previewContent.value = ''
  contentDirty.value = false
  subjectDirty.value = false
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
    fetchPreview()
  }
}

const onSendModeChange = () => {
  sendForm.templateCode = ''
  Object.keys(templateData).forEach(k => delete templateData[k])
  selectedTemplate.value = null
  templateVariables.value = []
  previewSubject.value = ''
  previewContent.value = ''
  contentDirty.value = false
  subjectDirty.value = false
  clearTimeout(renderTimer)
}

const handleSend = async () => {
  if (!sendForm.to.trim()) { ElMessage.warning('请输入收件人'); return }
  if (sendMode.value === 'normal') {
    if (!sendForm.subject.trim()) { ElMessage.warning('主题不能为空'); return }
    if (!sendForm.text.trim()) { ElMessage.warning('正文不能为空'); return }
  } else {
    if (!sendForm.templateCode) { ElMessage.warning('请选择邮件模板'); return }
    const bodyHtml = getEditorHtml()
    if (!bodyHtml.trim()) { ElMessage.warning('邮件正文为空，请等待预览生成或编辑预览内容后再发送'); return }
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
    if (props.referenceId) body.referenceId = props.referenceId
    else if (props.disclosureId) body.disclosureId = props.disclosureId
    if (props.disclosureAttachmentIds.length) body.disclosureAttachmentIds = props.disclosureAttachmentIds

    let res
    if (sendMode.value === 'normal') {
      body.subject = sendForm.subject.trim()
      body.text = sendForm.text.trim()
      res = await sendMail(body)
    } else {
      body.templateCode = sendForm.templateCode
      body.templateData = { ...templateData }
      body.subject = previewSubject.value.trim() || undefined
      body.text = getEditorHtml()
      res = await sendMailWithTemplate(body)
    }

    if (res.code === 200) {
      ElMessage.success('发送成功')
      emit('sent', {
        to: sendForm.to.trim(),
        cc: sendForm.cc.trim(),
        subject: sendMode.value === 'template' ? previewSubject.value.trim() : sendForm.subject.trim(),
        text: sendMode.value === 'template' ? getEditorHtml() : sendForm.text.trim(),
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
  sendForm.cc = buildDefaultCc(props.defaultCc)
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
  previewSubject.value = ''
  previewContent.value = ''
  contentDirty.value = false
  subjectDirty.value = false
  clearTimeout(renderTimer)
  if (fileUploadRef.value) fileUploadRef.value.clearFiles()
}

const loadTemplates = async () => {
  templateLoading.value = true
  try {
    const res = await getTemplateList()
    if (res.code === 200) templateList.value = res.data || []
  } finally { templateLoading.value = false }
}

// ==================== 已插入图片管理 ====================
const isImageVar = (name) => /image|logo|pic|img|photo|banner|icon|avatar|qr/i.test(name)

const clearImageVar = (v) => {
  templateData[v] = ''
  onVarChange()
}

const removeImage = async (idx) => {
  const url = imageUrls.value[idx]
  imageUrls.value.splice(idx, 1)
  // 若该图片已填入模板图片变量，一并清除
  const varName = templateVariables.value.find(v => templateData[v] === url)
  if (varName) {
    templateData[varName] = ''
  }
  if (contentEditableRef.value) {
    contentEditableRef.value.querySelectorAll('img').forEach(img => {
      if (img.getAttribute('src') === url) img.remove()
    })
  }
  // 预览处于模板渲染态（未手动编辑）时，清除变量后重新渲染以恢复占位；否则按手动编辑处理
  if (varName && !contentDirty.value) {
    onVarChange()
  } else {
    onContentInput()
  }
  if (url) {
    const res = await deleteFile(url)
    if (!res || res.code !== 200) {
      ElMessage.warning('服务器文件删除失败（请确认后端已更新删除接口），已仅从界面移除')
    }
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
  sendForm.cc = buildDefaultCc(props.defaultCc)
  sendForm.subject = props.defaultSubject || ''
  sendForm.text = props.defaultText || ''
})
</script>

<style scoped>
.mail-composer { width: 100%; }
.composer-form .el-form-item { margin-bottom: 18px; }
.composer-form :deep(.el-form-item__label) { white-space: nowrap; }
.composer-form :deep(.el-radio-button.is-active .el-radio-button__inner) { background:#1e88e5!important;border-color:#1e88e5!important;box-shadow:-1px 0 0 0 #1e88e5!important; }
.content-preview {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  min-height: 150px;
  max-height: 360px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.8;
  border: 1px solid #e4e7ed;
  /* 作为 el-form-item__content(flex-wrap) 的项，占满整行 */
  flex-grow: 1;
  min-width: 0;
  box-sizing: border-box;
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
  width: 110px;
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

/* ========== 已插入图片列表 ========== */
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

/* ========== 可编辑预览 ========== */
.editor-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  /* 强制占满整行：el-form-item__content 是 flex-wrap 布局，
     若不占满整行，模板较小时工具栏会被挤到预览左边 */
  width: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
  padding: 6px 8px;
  margin-bottom: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
  /* 滚动页面/弹窗时工具栏始终吸附在预览上方 */
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.editor-toolbar__spacer {
  flex: 1;
}
.editable-preview {
  background: #fff;
  border: 1px solid #dcdfe6;
  outline: none;
  cursor: text;
  transition: border-color .2s, box-shadow .2s;
}
.editable-preview:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, .15);
}
.editable-preview:empty::before {
  content: '点击此处可直接编辑邮件正文…';
  color: #c0c4cc;
  pointer-events: none;
}
.dirty-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #e6a23c;
}
.image-insert-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}
.editable-preview img:not([src]),
.editable-preview img[src=""],
.editable-preview img[src="#"] {
  min-width: 140px;
  min-height: 80px;
  border: 1px dashed #c0c4cc;
  background: #f7f8fa;
}
.var-image-filled { display: flex; align-items: center; gap: 10px; }
.var-image-thumb { width: 60px; height: 60px; object-fit: cover; border: 1px solid #e4e7ed; border-radius: 4px; }
.var-image-waiting { color: #909399; font-size: 13px; }
</style>
