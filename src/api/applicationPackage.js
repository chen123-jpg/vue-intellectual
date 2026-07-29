import request from '../utils/request'

const BASE = '/api/application-package'
const uploadConfig = {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 120000
}

export function getBatches(params) {
  return request.get(`${BASE}/batches`, { params })
}

export function getBatch(packageToken) {
  return request.get(`${BASE}/batches/${encodeURIComponent(packageToken)}`)
}

export function getBatchByDisclosure(disclosureId) {
  return request.get(`${BASE}/batches/by-disclosure/${encodeURIComponent(disclosureId)}`)
}

export function createDraft(disclosureId) {
  return request.post(`${BASE}/drafts`, { disclosureId })
}

export function uploadBatchFile(packageToken, documentCode, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.put(
    `${BASE}/batches/${encodeURIComponent(packageToken)}/files/${encodeURIComponent(documentCode)}`,
    formData,
    uploadConfig
  )
}

export function removeBatchFile(packageToken, documentCode) {
  return request.delete(
    `${BASE}/batches/${encodeURIComponent(packageToken)}/files/${encodeURIComponent(documentCode)}`
  )
}

export function sendBatch(packageToken, processUserId) {
  return request.post(`${BASE}/batches/${encodeURIComponent(packageToken)}/send`, { processUserId })
}

export function receiveBatch(packageToken) {
  return request.post(`${BASE}/batches/${encodeURIComponent(packageToken)}/receive`)
}

export function rejectBatch(packageToken, data) {
  return request.post(`${BASE}/batches/${encodeURIComponent(packageToken)}/reject`, data)
}

export function approveBatch(packageToken) {
  return request.post(`${BASE}/batches/${encodeURIComponent(packageToken)}/approve`)
}

export function unlockBatch(packageToken, reason) {
  return request.post(`${BASE}/batches/${encodeURIComponent(packageToken)}/unlock`, { reason })
}

export function submitCnipa(packageToken, { submissionNo, submittedAt, receipt }) {
  const formData = new FormData()
  formData.append('submissionNo', submissionNo)
  formData.append('submittedAt', submittedAt)
  formData.append('receipt', receipt)
  return request.post(
    `${BASE}/batches/${encodeURIComponent(packageToken)}/submit-cnipa`,
    formData,
    uploadConfig
  )
}

export function getProcessOperators() {
  return request.get(`${BASE}/process-operators`)
}

export function createDownloadTicket(fileToken) {
  return request.post(`${BASE}/files/${encodeURIComponent(fileToken)}/download-ticket`)
}
