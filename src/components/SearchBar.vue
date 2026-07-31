<template>
  <el-form :inline="true" class="search-bar" @submit.prevent="emitSearch">
    <!-- 始终可见的字段（最后一个是操作按钮行） -->
    <template v-for="(field, idx) in visibleFields" :key="field.key">
      <el-form-item :label="field.label" class="search-field">
        <!-- input 类型 -->
        <el-input
          v-if="field.type === 'input'"
          v-model="localQuery[field.key]"
          :size="size"
          :placeholder="field.placeholder || (field.matchType === 'fuzzy' ? '支持拼音首字母、模糊搜索' : '精确搜索')"
          :style="{ width: (field.width || 180) + 'px' }"
          clearable
          @keyup.enter="emitSearch"
          @update:model-value="onFieldInput(field.key)"
        />
        <!-- select 类型 -->
        <el-select
          v-else-if="field.type === 'select'"
          v-model="localQuery[field.key]"
          :size="size"
          :placeholder="field.placeholder || '全部'"
          :style="{ width: (field.width || 160) + 'px' }"
          clearable
          @change="emitSearch"
        >
          <el-option
            v-for="opt in field.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <!-- date 类型 -->
        <el-date-picker
          v-else-if="field.type === 'date'"
          v-model="localQuery[field.key]"
          :size="size"
          type="date"
          :placeholder="field.placeholder || '选择日期'"
          :style="{ width: (field.width || 180) + 'px' }"
          value-format="YYYY-MM-DD"
          @change="emitSearch"
        />
        <!-- daterange 类型 -->
        <el-date-picker
          v-else-if="field.type === 'daterange'"
          v-model="localQuery[field.key]"
          type="daterange"
          :start-placeholder="field.placeholder || '开始日期'"
          end-placeholder="结束日期"
          :style="{ width: (field.width || 260) + 'px' }"
          value-format="YYYY-MM-DD"
          @change="emitSearch"
        />
      </el-form-item>
    </template>

    <!-- 操作按钮 -->
    <el-form-item class="search-actions">
      <el-button :size="size" type="primary" :loading="loading" @click="emitSearch">
        <el-icon v-if="!loading"><Search /></el-icon>
        查询
      </el-button>
      <el-button :size="size" @click="handleReset">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
      <!-- 展开/收起切换 -->
      <el-button
        v-if="collapsible"
        type="primary"
        link
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? '展开' : '收起' }}
        <el-icon>
          <ArrowDown v-if="collapsed" />
          <ArrowUp v-else />
        </el-icon>
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import { Search, Refresh, ArrowDown, ArrowUp } from '@element-plus/icons-vue'

const props = defineProps({
  /** 查询字段配置 */
  fields: {
    type: Array,
    required: true
    // FieldConfig: { key, label, type, placeholder?, matchType?, options?, width? }
  },
  /** v-model: 查询参数 */
  modelValue: {
    type: Object,
    required: true
  },
  /** 是否加载中 */
  loading: {
    type: Boolean,
    default: false
  },
  /** 超出该数量时折叠，默认 0 表示不折叠 */
  collapsedThreshold: {
    type: Number,
    default: 0
  },
  /** 控件尺寸 */
  size: {
    type: String,
    default: 'default'
  }
})

const emit = defineEmits(['search', 'reset', 'update:modelValue'])

// --- 本地查询副本，用于防抖 ---
const localQuery = reactive({})
// 记录哪些字段是 daterange（值是数组）
const daterangeKeys = new Set()

// 初始化并同步
const initLocal = () => {
  Object.keys(localQuery).forEach(k => delete localQuery[k])
  props.fields.forEach(f => {
    if (f.type === 'daterange') {
      daterangeKeys.add(f.key)
      localQuery[f.key] = props.modelValue[f.key] ? [...props.modelValue[f.key]] : null
    } else {
      localQuery[f.key] = props.modelValue[f.key] ?? ''
    }
  })
}
initLocal()

// props.modelValue 外部变化时同步到 localQuery（如程序化修改）
watch(() => props.modelValue, () => {
  props.fields.forEach(f => {
    if (f.type === 'daterange') {
      const mv = props.modelValue[f.key]
      localQuery[f.key] = mv ? [...mv] : null
    } else {
      if (localQuery[f.key] !== props.modelValue[f.key]) {
        localQuery[f.key] = props.modelValue[f.key] ?? ''
      }
    }
  })
}, { deep: true })

// --- 防抖 ---
const debounceTimers = {}
const onFieldInput = (key) => {
  if (debounceTimers[key]) clearTimeout(debounceTimers[key])
  debounceTimers[key] = setTimeout(() => {
    debounceTimers[key] = null
    emitSearch()
  }, 300)
}

onBeforeUnmount(() => {
  Object.values(debounceTimers).forEach(t => clearTimeout(t))
})

// --- 折叠 ---
const collapsed = ref(true)
const collapsible = computed(() => {
  return props.collapsedThreshold > 0 && props.fields.length > props.collapsedThreshold
})
const visibleFields = computed(() => {
  if (!collapsible.value || !collapsed.value) return props.fields
  // 折叠时显示前 collapsedThreshold - 1 个字段
  const limit = Math.max(1, props.collapsedThreshold - 1)
  return props.fields.slice(0, limit)
})

// --- 同步到外部 query ---
const syncToModel = () => {
  const out = {}
  props.fields.forEach(f => {
    const val = localQuery[f.key]
    // 数组类型（daterange）
    if (Array.isArray(val)) {
      out[f.key] = val.length > 0 ? [...val] : null
    } else {
      out[f.key] = typeof val === 'string' ? val.trim() : (val ?? '')
    }
  })
  emit('update:modelValue', out)
}

// --- 事件 ---
const emitSearch = () => {
  // 清除所有待执行的防抖
  Object.keys(debounceTimers).forEach(k => {
    if (debounceTimers[k]) {
      clearTimeout(debounceTimers[k])
      debounceTimers[k] = null
    }
  })
  syncToModel()
  emit('search')
}

const handleReset = () => {
  // 清空 localQuery
  props.fields.forEach(f => {
    if (f.type === 'daterange') {
      localQuery[f.key] = null
    } else {
      localQuery[f.key] = ''
    }
  })
  syncToModel()
  emit('reset')
}
</script>

<style scoped>
.search-bar {
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}
.search-field {
  margin-right: 16px;
}
.search-actions {
  margin-right: 0;
}
</style>
