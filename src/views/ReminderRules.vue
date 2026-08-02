<template>
  <div class="rules-container">
    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="时间偏移规则" name="offset">
          <RuleList type="offset" :rules="reminderStore.offsetRules" @edit="openEdit" @delete="handleDelete" />
          <div style="margin-top:16px;">
            <el-button type="primary" @click="openEdit(null)">新增偏移规则</el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="百分比规则" name="percent">
          <RuleList type="percent" :rules="reminderStore.percentRules" @edit="openEdit" @delete="handleDelete" />
          <PercentBatchForm @saved="reminderStore.fetchRules()" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
    <RuleForm ref="ruleFormRef" @saved="reminderStore.fetchRules()" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useReminderStore } from '@/stores/reminder'
import RuleList from '@/components/reminder/RuleList.vue'
import RuleForm from '@/components/reminder/RuleForm.vue'
import PercentBatchForm from '@/components/reminder/PercentBatchForm.vue'

const reminderStore = useReminderStore()
const activeTab = ref('offset')
const ruleFormRef = ref(null)

onMounted(() => {
  reminderStore.fetchRules()
})

function openEdit(rule) {
  ruleFormRef.value?.open(rule)
}

async function handleDelete(id) {
  try {
    await reminderStore.remove(id)
  } catch (e) {
    // 已处理
  }
}
</script>

<style scoped>
.rules-container {
  max-width: 1200px;
}
</style>
