import request from '../utils/request'

const BASE = '/api/ttable'
const PKG_BASE = '/api/application-package'

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

export function create(data) {
  return request.post(BASE, data)
}

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

// ==================== Packages ====================
export function getPackages(id) {
  return request.get(`${BASE}/${id}/packages`)
}

export function uploadPackage(id, formData) {
  return request.post(`${BASE}/${id}/packages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function getPackageList(params) {
  return request.get(`${PKG_BASE}/list`, { params })
}

export function confirmPackage(packageId, params) {
  return request.put(`${PKG_BASE}/${packageId}/confirm`, null, { params })
}

// ==================== Mail ====================
export function sendMail(formData) {
  return request.post('/api/mail/sendMaill', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
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
