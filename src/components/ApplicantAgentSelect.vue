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
import { useUserStore } from '../stores/user'

const props = defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String, required: true, validator: (v) => ['agent', 'applicant'].includes(v) }
})

const emit = defineEmits(['update:modelValue'])
const { state } = useUserStore()

const options = ref([])
const requiredPermission = computed(() =>
  props.type === 'agent' ? 'patent:agent:list' : 'patent:applicant:list'
)

const placeholder = computed(() => props.type === 'agent' ? '选择或输入代理人' : '选择或输入申请人')

const innerValue = computed(() => {
  if (!props.modelValue) return []
  return props.modelValue
    .split(/[,，、]/)
    .map(s => s.trim())
    .filter(Boolean)
})

const fetchOptions = async () => {
  // 低权限角色仍可手工录入名称，不发起必然返回 403 的候选项请求。
  if (!state.permissions.includes(requiredPermission.value)) {
    options.value = []
    return
  }
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
