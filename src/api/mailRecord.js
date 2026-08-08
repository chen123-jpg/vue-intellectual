import request from '../utils/request'

const BASE = '/api/mail-send-log'

// 分页查询发送记录
export function getSendLogs(params) {
  return request.get(`${BASE}/list`, { params })
}

// 按关联ID（交底ID或内部编号）查询发送记录
export function getSendLogsByReference(referenceId) {
  return request.get(BASE, { params: { referenceId } })
}

// 查询发送记录详情
export function getSendLogById(id) {
  return request.get(`${BASE}/${id}`)
}

// 删除发送记录
export function removeSendLog(id) {
  return request.delete(`${BASE}/${id}`)
}

// 批量删除发送记录
export function batchRemoveSendLog(ids) {
  return request.delete(`${BASE}/batch`, { data: ids })
}

// 重新发送失败的邮件
export function resendMail(id) {
  return request.post(`${BASE}/resend/${id}`)
}

// 查询收件记录（邮件接收日志）
export function getReceiveLogs(params) {
  return request.get('/api/mail-receive-log/list', { params })
}

// 查询收件记录详情
export function getReceiveLogById(id) {
  return request.get(`/api/mail-receive-log/${id}`)
}

// 删除收件记录
export function removeReceiveLog(id) {
  return request.delete(`/api/mail-receive-log/${id}`)
}

// 批量删除收件记录
export function batchRemoveReceiveLog(ids) {
  return request.delete('/api/mail-receive-log/batch', { data: ids })
}
