import request from '@/utils/request'

// 标记单条消息已读
export function markAsRead(msgId) {
    return request.post(`/api/notification/read/${msgId}`)
}

// 一键全部已读
export function markAllRead() {
    return request.post('/api/notification/readAll')
}