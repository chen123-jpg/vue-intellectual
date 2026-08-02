<template>
  <el-popover
    v-model:visible="popoverVisible"
    placement="bottom-end"
    trigger="click"
    :width="380"
    @show="notificationStore.fetchUnread()"
  >
    <template #reference>
      <el-badge :value="notificationStore.totalUnread" :hidden="notificationStore.totalUnread === 0">
        <el-icon size="22" style="cursor:pointer;color:#606266;"><Bell /></el-icon>
      </el-badge>
    </template>
    <div class="notification-popover">
      <div class="popover-header">
        <span class="popover-title">消息提醒</span>
        <el-button link size="small" @click="goToAll">查看全部</el-button>
      </div>
      <div v-if="notificationStore.unreadList.length === 0" class="popover-empty">暂无未读消息</div>
      <div
        v-for="item in notificationStore.unreadList.slice(0, 5)"
        :key="item.id"
        class="popover-item"
        @click="handleItemClick(item)"
      >
        <div class="popover-item__header">
          <span class="popover-item__title">{{ item.title }}</span>
          <el-tag v-if="item.isEstimateCalc" type="warning" size="small">估算</el-tag>
        </div>
        <div class="popover-item__content">{{ item.content }}</div>
        <div class="popover-item__time">{{ formatDateTime(item.plannedSendTime) }}</div>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { resolveLink } from '@/utils/linkHelper'
import { Bell } from '@element-plus/icons-vue'

const notificationStore = useNotificationStore()
const router = useRouter()
const popoverVisible = ref(false)

function goToAll() {
  popoverVisible.value = false
  router.push('/notifications')
}

function handleItemClick(item) {
  popoverVisible.value = false
  if (!item.isRead) {
    notificationStore.markRead(item.id)
  }
  const path = resolveLink(item.link)
  if (path && path !== '#') {
    router.push(path)
  }
}

const pad = (n) => String(n).padStart(2, '0')
function formatDateTime(val) {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.notification-popover {
  max-height: 380px;
  overflow-y: auto;
}
.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  margin-bottom: 4px;
}
.popover-title {
  font-weight: 600;
  font-size: 15px;
}
.popover-empty {
  text-align: center;
  color: #999;
  padding: 32px 0;
  font-size: 13px;
}
.popover-item {
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s;
}
.popover-item:hover {
  background: #fafafa;
}
.popover-item__header {
  display: flex;
  align-items: center;
  gap: 6px;
}
.popover-item__title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.popover-item__content {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.popover-item__time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}
</style>
