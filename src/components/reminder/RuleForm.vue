<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑规则' : '新增规则'"
    width="600px"
    @close="resetForm"
    :before-close="handleDialogBeforeClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="期限类型" prop="deadlineType">
        <el-select v-model="form.deadlineType" placeholder="请选择">
          <el-option v-for="t in DEADLINE_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="规则类型" prop="ruleType">
        <el-radio-group v-model="form.ruleType" @change="onRuleTypeChange">
          <el-radio label="OFFSET">时间偏移</el-radio>
          <el-radio label="PERCENT">百分比</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="案件ID" prop="caseId">
        <el-input v-model.number="form.caseId" placeholder="留空表示全局规则" clearable />
      </el-form-item>

      <!-- OFFSET 字段 -->
      <template v-if="form.ruleType === 'OFFSET'">
        <el-form-item label="偏移量" prop="offsetValue" required>
          <el-input-number v-model="form.offsetValue" :min="1" placeholder="正数" />
        </el-form-item>
        <el-form-item label="偏移单位" prop="offsetUnit" required>
          <el-select v-model="form.offsetUnit" placeholder="请选择">
            <el-option v-for="u in OFFSET_UNITS" :key="u" :label="u" :value="u" />
          </el-select>
        </el-form-item>
        <!-- 清除百分比字段 -->
        <el-form-item v-if="form.percentValue !== null" label=" " class="hidden-field">
          <el-input v-model="form.percentValue" style="display:none;" />
        </el-form-item>
      </template>

      <!-- PERCENT 字段 -->
      <template v-if="form.ruleType === 'PERCENT'">
        <el-form-item label="百分比值" prop="percentValue" required>
          <el-input-number v-model="form.percentValue" :min="1" :max="99" placeholder="1-99" />
        </el-form-item>
        <el-form-item v-if="form.offsetValue !== null" label=" " class="hidden-field">
          <el-input v-model="form.offsetValue" style="display:none;" />
          <el-input v-model="form.offsetUnit" style="display:none;" />
        </el-form-item>
      </template>

      <el-form-item label="是否启用" prop="isActive">
        <el-switch v-model="form.isActive" :active-value="1" :inactive-value="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleDialogCancel">取消</el-button>
      <el-button v-if="!isEdit" @click="handleSaveDraft">暂存</el-button>
      <el-button type="primary" @click="submitForm" :loading="loading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { DEADLINE_TYPES, OFFSET_UNITS } from '@/utils/constants'
import { useDialogAddDraft } from '@/composables/useFormDraft'
import { useReminderStore } from '@/stores/reminder'

const reminderStore = useReminderStore()
const visible = ref(false)
const isEdit = ref(false)
const loading = ref(false)
const formRef = ref(null)

// 表单数据
const emptyForm = () => ({
  id: null,
  deadlineType: 'PAY_FEE',
  ruleType: 'OFFSET',
  caseId: null,
  offsetValue: null,
  offsetUnit: 'DAY',
  percentValue: null,
  isActive: 1,
})
const form = reactive(emptyForm())
const addDraft = useDialogAddDraft('reminder-rule-add', {
  getEmptyData: emptyForm,
  getCurrentData: () => ({ ...form }),
  reset: () => resetForm(),
  applyData: (data) => {
    Object.assign(form, { ...emptyForm(), ...data })
    nextTick(() => formRef.value?.clearValidate())
  }
})

// 表单校验规则
const rules = {
  deadlineType: [{ required: true, message: '请选择期限类型', trigger: 'change' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  offsetValue: [{ required: true, message: '请输入偏移量', trigger: 'blur' }],
  offsetUnit: [{ required: true, message: '请选择偏移单位', trigger: 'change' }],
  percentValue: [{ required: true, message: '请输入百分比值', trigger: 'blur' }],
}

// 规则类型切换时清空不相关字段（用于校验互斥）
function onRuleTypeChange(val) {
  if (val === 'OFFSET') {
    form.percentValue = null
  } else {
    form.offsetValue = null
    form.offsetUnit = null
  }
}

// 打开对话框（编辑或新增）
function open(rule = null) {
  if (rule) {
    isEdit.value = true
    Object.assign(form, {
      id: rule.id,
      deadlineType: rule.deadlineType,
      ruleType: rule.ruleType,
      caseId: rule.caseId,
      offsetValue: rule.offsetValue,
      offsetUnit: rule.offsetUnit,
      percentValue: rule.percentValue,
      isActive: rule.isActive,
    })
    visible.value = true
  } else {
    isEdit.value = false
    addDraft.open(() => { visible.value = true })
  }
}

// 重置表单
function resetForm() {
  Object.assign(form, emptyForm())
  nextTick(() => formRef.value?.clearValidate())
}

// 提交
async function submitForm() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    // 构造提交数据（只包含非空字段）
    const payload = {
      id: form.id,
      deadlineType: form.deadlineType,
      ruleType: form.ruleType,
      caseId: form.caseId || null,
      isActive: form.isActive,
    }
    if (form.ruleType === 'OFFSET') {
      payload.offsetValue = form.offsetValue
      payload.offsetUnit = form.offsetUnit
    } else {
      payload.percentValue = form.percentValue
    }
    await reminderStore.addOrUpdate(payload)
    if (!isEdit.value) addDraft.clear()
    ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
    visible.value = false
    emit('saved')
  } catch (error) {
    // 错误已由拦截器处理
  } finally {
    loading.value = false
  }
}

const handleSaveDraft = () => {
  addDraft.save()
}

const handleDialogCancel = async () => {
  if (isEdit.value) {
    visible.value = false
    return
  }
  await addDraft.cancel(() => { visible.value = false })
}

const handleDialogBeforeClose = async (done) => {
  if (isEdit.value) {
    done()
    return
  }
  await addDraft.cancel(done)
}

const emit = defineEmits(['saved'])

defineExpose({ open })
</script>

<style scoped>
.hidden-field :deep(.el-form-item__content) {
  display: none;
}
</style>
