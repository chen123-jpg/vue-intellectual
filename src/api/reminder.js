import request from '@/utils/request'

// 获取当前用户所有规则
export function getRules() {
    return request.get('/api/reminder-rules')
}

// 新增/更新单条规则
export function saveRule(ruleData) {
    return request.post('/api/reminder-rules', ruleData)
}

// 删除规则
export function deleteRule(id) {
    return request.delete(`/api/reminder-rules/${id}`)
}

// 批量保存百分比规则
export function batchSavePercent(data) {
    return request.put('/api/reminder-rules/percent-batch', data)
}