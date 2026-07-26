<template>
  <el-select
    :model-value="innerValue"
    @update:model-value="onChange"
    multiple
    filterable
    allow-create
    default-first-option
    :placeholder="placeholder"
    :reserve-keyword="false"
    style="width:100%"
  >
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAll as getAgentAll, getApplicantAll } from '../api/externalPersonnelController.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String, required: true, validator: (v) => ['agent', 'applicant'].includes(v) }
})

const emit = defineEmits(['update:modelValue'])

const options = ref([])

const placeholder = computed(() => props.type === 'agent' ? '选择或输入代理人' : '选择或输入申请人')

const innerValue = computed(() => {
  if (!props.modelValue) return []
  return props.modelValue
    .split(/[,，、]/)
    .map(s => s.trim())
    .filter(Boolean)
})

const fetchOptions = async () => {
  try {
    const api = props.type === 'agent' ? getAgentAll : getApplicantAll
    const res = await api()
    if (res.code === 200) {
      const list = res.data || []
      options.value = list.map(item => ({ label: item.name, value: item.name }))
    }
  } catch {
    options.value = []
  }
}

const onChange = (val) => {
  emit('update:modelValue', val ? val.join('、') : '')
}

onMounted(() => fetchOptions())
</script>
