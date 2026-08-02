<template>
  <div class="notifications-container">
    <el-card>
      <template #header>
        <div class="notifications-header">
          <span class="notifications-title">我的消息</span>
          <div class="notifications-header__right">
            <el-badge :value="notificationStore.totalUnread" :hidden="notificationStore.totalUnread === 0">
              <span class="unread-count">未读 {{ notificationStore.totalUnread }}</span>
            </el-badge>
            <el-button
              v-if="notificationStore.totalUnread > 0"
              type="primary"
              size="small"
              @click="handleMarkAllRead"
              :loading="markingAll"
            >全部已读</el-button>
          </div>
        </div>
      </template>

      <el-table :data="notificationStore.unreadList" style="width:100%" v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="plannedSendTime" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.plannedSendTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isRead ? 'info' : 'danger'" size="small">
              {{ row.isRead ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button v-if="!row.isRead" type="primary" size="small" @click="markRead(row.id)">标记已读</el-button>
            <el-button link size="small" @click="goToDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="notificationStore.unreadList.length === 0" description="暂无消息" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { resolveLink } from '@/utils/linkHelper'
import { formatDateTime } from '@/utils/format'

const notificationStore = useNotificationStore()
const router = useRouter()
const loading = ref(false)
const markingAll = ref(false)

onMounted(() => {
  notificationStore.fetchUnread()
})

async function markRead(id) {
  loading.value = true
  try {
    await notificationStore.markRead(id)
  } finally {
    loading.value = false
  }
}

async function handleMarkAllRead() {
  markingAll.value = true
  try {
    await notificationStore.markAllRead()
  } finally {
    markingAll.value = false
  }
}

function goToDetail(row) {
  if (!row.isRead) {
    notificationStore.markRead(row.id)
  }
  const path = resolveLink(row.link)
  if (path && path !== '#') {
    router.push(path)
  }
}
</script>

<style scoped>
.notifications-container {
  max-width: 1200px;
}
.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.notifications-title {
  font-weight: 600;
  font-size: 16px;
}
.notifications-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.unread-count {
  font-size: 14px;
  color: #999;
}
</style>
