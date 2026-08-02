<template>
  <div>
    <el-table :data="rules" border style="width:100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="deadlineType" label="期限类型" />
      <el-table-column v-if="type === 'offset'" prop="offsetValue" label="偏移量" />
      <el-table-column v-if="type === 'offset'" prop="offsetUnit" label="单位" />
      <el-table-column v-if="type === 'percent'" prop="percentValue" label="百分比(%)" />
      <el-table-column prop="isActive" label="启用" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="$emit('edit', row)">编辑</el-button>
          <el-button type="danger" size="small" @click="$emit('delete', row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
defineProps({
  rules: { type: Array, default: () => [] },
  type: { type: String, required: true }, // 'offset' | 'percent'
})
defineEmits(['edit', 'delete'])
</script>