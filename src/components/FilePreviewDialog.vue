<template>
  <el-dialog
    v-model="visible"
    :title="`在线预览：${displayName}`"
    width="92vw"
    top="3vh"
    append-to-body
    destroy-on-close
    class="file-preview-dialog"
    @closed="cleanup"
  >
    <div class="preview-shell" v-loading="loading" element-loading-text="文件加载中...">
      <VueOfficeDocx
        v-if="previewKind === 'docx' && previewSource"
        :src="previewSource"
        class="office-preview"
        @rendered="loading = false"
        @error="handleRenderError"
      />

      <VueOfficeExcel
        v-else-if="previewKind === 'excel' && previewSource"
        :src="previewSource"
        class="office-preview"
        @rendered="loading = false"
        @error="handleRenderError"
      />

      <VueOfficePptx
        v-else-if="previewKind === 'pptx' && previewSource"
        :src="previewSource"
        class="office-preview"
        @rendered="loading = false"
        @error="handleRenderError"
      />

      <iframe
        v-else-if="previewKind === 'pdf' && blobUrl"
        :src="blobUrl"
        class="frame-preview"
        title="PDF 在线预览"
        @load="loading = false"
      />

      <div v-else-if="previewKind === 'image' && blobUrl" class="media-preview">
        <img :src="blobUrl" :alt="displayName" @load="loading = false" />
      </div>

      <div v-else-if="previewKind === 'video' && blobUrl" class="media-preview">
        <video :src="blobUrl" controls autoplay @loadeddata="loading = false" />
      </div>

      <div v-else-if="previewKind === 'audio' && blobUrl" class="audio-preview">
        <audio :src="blobUrl" controls autoplay @loadeddata="loading = false" />
      </div>

      <pre v-else-if="previewKind === 'text'" class="text-preview">{{ textContent }}</pre>

      <el-result
        v-else-if="errorMessage"
        icon="warning"
        title="暂时无法在线预览"
        :sub-title="errorMessage"
      />
    </div>

    <template #footer>
      <span class="preview-tip">预览数据只保存在当前浏览器内存中，不会下载到本地文件夹。</span>
      <el-button
        v-if="downloadable && attachment?.fileUrl"
        @click="downloadFile(attachment.fileUrl)"
      >
        下载原文件
      </el-button>
      <el-button type="primary" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'
import { convertLegacyWordToPdf, downloadFile, fetchFileBlob } from '../utils/format'

// 按需异步加载 Office 预览组件，避免首屏打包体积过大
const VueOfficeDocx = defineAsyncComponent(() => import('@vue-office/docx'))
const VueOfficeExcel = defineAsyncComponent(() => import('@vue-office/excel'))
const VueOfficePptx = defineAsyncComponent(() => import('@vue-office/pptx'))

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  attachment: { type: Object, default: null },
  downloadable: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const loading = ref(false)
const previewKind = ref('')
const previewSource = ref(null)
const blobUrl = ref('')
const textContent = ref('')
const errorMessage = ref('')

const displayName = computed(() => props.attachment?.fileName || props.attachment?.file?.name || '文件')

const getExtension = () => {
  const explicit = props.attachment?.fileExt
  if (explicit) return String(explicit).toLowerCase()
  const name = displayName.value
  const dotIndex = name.lastIndexOf('.')
  return dotIndex >= 0 ? name.substring(dotIndex + 1).toLowerCase() : ''
}

const cleanup = () => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
  blobUrl.value = ''
  previewSource.value = null
  textContent.value = ''
  previewKind.value = ''
  errorMessage.value = ''
  loading.value = false
}

const readBlob = async () => {
  if (typeof Blob !== 'undefined' && props.attachment?.file instanceof Blob) return props.attachment.file
  if (props.attachment?.fileUrl) return fetchFileBlob(props.attachment.fileUrl)
  throw new Error('没有可读取的文件地址')
}

const loadPreview = async () => {
  cleanup()
  if (!props.attachment) return

  const extension = getExtension()
  if (extension === 'ppt') {
    errorMessage.value = '旧版 .ppt 是二进制格式，当前预览服务暂未支持，请下载查看。'
    return
  }

  loading.value = true
  try {
    const blob = await readBlob()
    const contentType = props.attachment?.contentType || blob.type || ''

    if (extension === 'doc') {
      const pdf = await convertLegacyWordToPdf(blob, displayName.value)
      previewKind.value = 'pdf'
      blobUrl.value = URL.createObjectURL(pdf)
      return
    }
    if (extension === 'docx') {
      previewKind.value = 'docx'
      previewSource.value = await blob.arrayBuffer()
      return
    }
    if (['xls', 'xlsx'].includes(extension)) {
      previewKind.value = 'excel'
      previewSource.value = await blob.arrayBuffer()
      return
    }
    if (extension === 'pptx') {
      previewKind.value = 'pptx'
      previewSource.value = await blob.arrayBuffer()
      return
    }
    if (extension === 'pdf' || contentType === 'application/pdf') {
      previewKind.value = 'pdf'
      blobUrl.value = URL.createObjectURL(blob)
      return
    }
    if (contentType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
      previewKind.value = 'image'
      blobUrl.value = URL.createObjectURL(blob)
      return
    }
    if (contentType.startsWith('video/') || ['mp4', 'webm', 'ogg'].includes(extension)) {
      previewKind.value = 'video'
      blobUrl.value = URL.createObjectURL(blob)
      return
    }
    if (contentType.startsWith('audio/') || ['mp3', 'wav', 'm4a'].includes(extension)) {
      previewKind.value = 'audio'
      blobUrl.value = URL.createObjectURL(blob)
      return
    }
    if (contentType.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(extension)) {
      previewKind.value = 'text'
      textContent.value = await blob.text()
      loading.value = false
      return
    }

    loading.value = false
    errorMessage.value = `暂不支持 .${extension || '未知'} 格式在线预览，请下载原文件查看。`
  } catch (error) {
    loading.value = false
    errorMessage.value = error?.message || '文件读取或转换失败'
  }
}

const handleRenderError = () => {
  loading.value = false
  const failedType = previewKind.value === 'excel'
    ? 'Excel'
    : previewKind.value === 'pptx' ? 'PPTX' : 'DOCX'
  previewKind.value = ''
  errorMessage.value = `${failedType} 渲染失败，文件可能已损坏或包含暂不支持的文档特性。`
}

watch(() => props.modelValue, value => {
  if (value) loadPreview()
  else cleanup()
})
</script>

<style scoped>
.preview-shell { height: 78vh; min-height: 480px; overflow: hidden; background: #f5f7fa; border: 1px solid #e4e7ed; border-radius: 6px; }
.office-preview { min-height: 100%; padding: 20px 0; }
.frame-preview { width: 100%; height: 100%; border: 0; background: #fff; }
.media-preview { min-height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
.media-preview img { max-width: 100%; max-height: 72vh; object-fit: contain; }
.media-preview video { max-width: 100%; max-height: 72vh; }
.audio-preview { height: 100%; display: flex; align-items: center; justify-content: center; }
.audio-preview audio { width: min(720px, 85%); }
.text-preview { height: 100%; box-sizing: border-box; margin: 0; padding: 20px; overflow: auto; white-space: pre-wrap; word-break: break-word; background: #fff; color: #303133; font: 14px/1.7 Consolas, 'Microsoft YaHei', monospace; }
.preview-tip { margin-right: auto; color: #909399; font-size: 12px; }
:deep(.el-dialog__footer) { display: flex; align-items: center; gap: 10px; }
</style>
