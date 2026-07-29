<template>
  <div v-if="files.length" class="attachment-links">
    <el-button
      v-for="file in files"
      :key="file.id || `${file.fileName}-${file.fileUrl}`"
      link
      type="primary"
      class="attachment-link"
      :title="file.fileName"
      @click="emit('preview', file)"
    >
      {{ file.fileName }}
    </el-button>
  </div>
  <span v-else class="empty-value">—</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  attachments: { type: Array, default: () => [] },
  bizType: { type: String, required: true }
})

const emit = defineEmits(['preview'])

const files = computed(() =>
  props.attachments.filter(item => item.bizType === props.bizType)
)
</script>

<style scoped>
.attachment-links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}
.attachment-link {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0;
  padding: 2px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty-value { color: #c0c4cc; }
</style>
