import { defineStore } from 'pinia'
import * as notificationApi from '@/api/notification'
import { connectWebSocket, disconnectWebSocket, fetchUnread } from '@/utils/websocket'

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        unreadList: [],
        totalUnread: 0,
        wsConnected: false,
    }),
    actions: {
        /** WS 回包用：直接替换列表 */
        replaceUnread(serverList) {
            const merged = new Map()
            for (const item of serverList) {
                merged.set(item.id, item)
            }
            for (const item of this.unreadList) {
                if (!merged.has(item.id)) {
                    merged.set(item.id, item)
                }
            }
            this.unreadList = Array.from(merged.values())
            this.totalUnread = this.unreadList.filter((n) => !n.isRead).length
        },

        /** 实时推送用：收到单条消息时追加 */
        addUnread(notification) {
            const exists = this.unreadList.some((n) => n.id == notification.id)
            if (!exists) {
                this.unreadList.unshift(notification)
                if (!notification.isRead) {
                    this.totalUnread += 1
                }
            }
        },

        /** 铃铛打开或连接后主动拉取 */
        fetchUnread() {
            fetchUnread()
        },

        async markRead(id) {
            await notificationApi.markAsRead(id)
            const item = this.unreadList.find((n) => n.id == id)
            if (item) {
                item.isRead = 1
                this.totalUnread = this.unreadList.filter((n) => !n.isRead).length
            }
        },

        async markAllRead() {
            await notificationApi.markAllRead()
            for (const item of this.unreadList) {
                item.isRead = 1
            }
            this.totalUnread = 0
        },

        initWebSocket() {
            connectWebSocket()
        },

        closeWebSocket() {
            disconnectWebSocket()
        },
    },
})
