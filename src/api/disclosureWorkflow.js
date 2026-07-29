import request from '../utils/request'

const BASE = '/api/ttable'

// ==================== Basic CRUD ====================
export function getList(params) {
  return request.get(`${BASE}/list`, { params })
}

export function getAll() {
  return request.get(`${BASE}/all`)
}

export function getById(id) {
  return request.get(`${BASE}/${id}`)
}

export function getDetail(id) {
  return request.get(`${BASE}/${id}/detail`)
}

export function getSponsorOptions() {
  return request.get(`${BASE}/sponsor-options`)
}

export function create(data, disclosureDocument, otherAttachments = [], sourceId = null) {
  const formData = new FormData()
  formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  formData.append('disclosureDocument', disclosureDocument)
  otherAttachments.forEach(file => formData.append('otherAttachments', file))
  if (sourceId) formData.append('sourceId', sourceId)
  return request.post(`${BASE}/add`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const createWithAttachments = create

export function update(data) {
  return request.put(BASE, data)
}

export function remove(id) {
  return request.delete(`${BASE}/${id}`)
}

export function batchRemove(ids) {
  return request.delete(`${BASE}/batch`, { data: ids })
}

// ==================== Advanced Search ====================
export function search(params, body) {
  return request.post(`${BASE}/search`, body, { params })
}

// ==================== Copy ====================
export function copy(sourceId) {
  return request.post(`${BASE}/copy`, { sourceId })
}

// ==================== By Sponsor ====================
export function getBySponsor(sponsorUserId) {
  return request.get(`${BASE}/by-sponsor/${sponsorUserId}`)
}

// ==================== Status ====================
export function changeStatus(id, data) {
  return request.post(`${BASE}/${id}/status`, data)
}

export function getStatusLogs(id) {
  return request.get(`${BASE}/${id}/status-logs`)
}

// ==================== Attachments ====================
export function getAttachments(id) {
  return request.get(`${BASE}/${id}/attachments`)
}

export function uploadAttachment(id, formData) {
  return request.post(`${BASE}/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function replaceDisclosureDocument(id, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.put(`${BASE}/${id}/attachments/disclosure-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function deleteAttachment(attachmentId) {
  return request.delete(`${BASE}/attachments/${attachmentId}`)
}

// ==================== Fees & Invoices ====================
export function getFees(id) {
  return request.get(`${BASE}/${id}/fees`)
}

export function getInvoices(id) {
  return request.get(`${BASE}/${id}/invoices`)
}

// ==================== Mail ====================
export function sendMail(data) {
  const headers = data instanceof FormData
    ? { 'Content-Type': 'multipart/form-data' }
    : { 'Content-Type': 'application/json' }
  return request.post('/api/mail/sendMaill', data, { headers })
}

export function sendMailWithTemplate(data) {
  return request.post('/api/mail/sendMailWithTemplate', data)
}

export function getTemplateList() {
  return request.get('/api/mail-template/all')
}

// ==================== File Upload ====================
export function uploadFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  return request.post('/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ==================== Agent list ====================
export function getAgentAll() {
  return request.get('/api/agent/all')
}

// ==================== Application Package bridge (旧 packages API 已迁移) ====================
import { getBatchByDisclosure, approveBatch } from './applicationPackage'

export function getPackages(disclosureId) {
  return getBatchByDisclosure(disclosureId)
}

export function confirmPackage(packageToken) {
  return approveBatch(packageToken)
}
