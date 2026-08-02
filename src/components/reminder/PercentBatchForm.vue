<template>
  <el-divider content-position="left">批量管理百分比规则</el-divider>
  <el-form ref="batchFormRef" :model="batchForm" label-width="120px" style="max-width:800px;">
    <el-form-item label="期限类型" prop="deadlineType" required>
      <el-select v-model="batchForm.deadlineType" placeholder="请选择">
        <el-option v-for="t in DEADLINE_TYPES" :key="t" :label="t" :value="t" />
      </el-select>
    </el-form-item>
    <el-form-item label="案件ID" prop="caseId">
      <el-input v-model.number="batchForm.caseId" placeholder="留空表示全局规则" clearable />
    </el-form-item>
    <el-form-item label="百分比规则" required>
      <div v-for="(item, index) in batchForm.percentRules" :key="index" class="percent-row">
        <el-input-number v-model="item.percentValue" :min="1" :max="99" placeholder="1-99" style="width:140px;" />
        <el-switch v-model="item.isActive" active-value="true" inactive-value="false" style="margin:0 12px;" />
        <el-button type="danger" circle size="small" @click="removePercentRow(index)">
          <el-icon><Minus /></el-icon>
        </el-button>
        <span v-if="item.id" style="color:#999;font-size:12px;margin-left:8px;">ID: {{ item.id }}</span>
      </div>
      <el-button link @click="addPercentRow" :disabled="batchForm.percentRules.length >= 5">
        <el-icon><Plus /></el-icon> 添加百分比（最多5条）
      </el-button>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitBatch" :loading="loading">保存批量</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { DEADLINE_TYPES } from '@/utils/constants'
import { useReminderStore } from '@/stores/reminder'
import { Plus, Minus } from '@element-plus/icons-vue'

const reminderStore = useReminderStore()
const loading = ref(false)
const batchFormRef = ref(null)

const batchForm = reactive({
  deadlineType: 'PAY_FEE',
  caseId: null,
  percentRules: [
    { id: null, percentValue: 75, isActive: 'true' },
    { id: null, percentValue: 50, isActive: 'false' },
    { id: null, percentValue: 10, isActive: 'true' },
  ],
})

function addPercentRow() {
  if (batchForm.percentRules.length < 5) {
    batchForm.percentRules.push({ id: null, percentValue: null, isActive: 'true' })
  }
}

function removePercentRow(index) {
  if (batchForm.percentRules.length > 1) {
    batchForm.percentRules.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一条规则')
  }
}

async function submitBatch() {
  // 简单验证：每个规则必须有百分比值
  const invalid = batchForm.percentRules.some((r) => !r.percentValue)
  if (invalid) {
    ElMessage.warning('请填写所有百分比值')
    return
  }
  if (!batchForm.deadlineType) {
    ElMessage.warning('请选择期限类型')
    return
  }

  loading.value = true
  try {
    const payload = {
      deadlineType: batchForm.deadlineType,
      caseId: batchForm.caseId || null,
      percentRules: batchForm.percentRules.map((r) => ({
        id: r.id,
        percentValue: r.percentValue,
        isActive: r.isActive === 'true',
      })),
    }
    await reminderStore.batchPercent(payload)
    ElMessage.success('批量保存成功')
    emit('saved')
  } catch (error) {
    // 已拦截
  } finally {
    loading.value = false
  }
}

const emit = defineEmits(['saved'])
</script>

<style scoped>
.percent-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
</style>