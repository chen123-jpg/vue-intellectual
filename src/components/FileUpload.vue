<template>
  <div class="file-upload">
    <el-upload
      ref="uploadRef"
      action="#"
      :auto-upload="true"
      :multiple="multiple"
      :accept="accept"
      :limit="limit"
      :disabled="disabled"
      :file-list="fileList"
      :http-request="customUpload"
      :before-upload="beforeUpload"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :on-success="handleSuccess"
      :on-error="handleError"
      drag
      v-bind="$attrs"
    >
      <el-icon><Upload /></el-icon>
      <div class="el-upload__text">
        拖拽或<em>点击选择</em>文件
      </div>
    </el-upload>
    <p v-if="tip" class="upload-tip">{{ tip }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { uploadFile } from '../api/mail'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  multiple: {
    type: Boolean,
    default: true
  },
  accept: {
    type: String,
    default: ''
  },
  limit: {
    type: Number,
    default: 10
  },
  disabled: {
    type: Boolean,
    default: false
  },
  tip: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const uploadRef = ref(null)
const fileList = ref([])

const syncModelValue = () => {
  const urls = fileList.value
    .filter(f => f.status === 'success' && f.url)
    .map(f => f.url)
  emit('update:modelValue', urls)
}

const beforeUpload = (file) => {
  const isOverLimit = fileList.value.filter(f => f.status !== 'fail').length >= props.limit
  if (isOverLimit) {
    ElMessage.warning(`最多上传 ${props.limit} 个文件`)
    return false
  }
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.warning(`"${file.name}" 超过 10MB 限制`)
    return false
  }
  return true
}

const customUpload = async (option) => {
  const { file, onSuccess, onError } = option
  try {
    const res = await uploadFile(file)
    if (res.code === 200) {
      file.url = res.data
      onSuccess(res)
    } else {
      onError(new Error(res.message || '上传失败'))
    }
  } catch (e) {
    onError(e)
  }
}

const handleChange = () => {
  // el-upload manages file-list internally
}

const handleRemove = () => {
  syncModelValue()
}

const handleSuccess = () => {
  syncModelValue()
}

const handleError = (err, file) => {
  ElMessage.error(`"${file.name}" 上传失败`)
  syncModelValue()
}

const clearFiles = () => {
  fileList.value = []
  syncModelValue()
}

defineExpose({ clearFiles })
</script>

<style scoped>
.file-upload {
  width: 100%;
}
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
</style>
