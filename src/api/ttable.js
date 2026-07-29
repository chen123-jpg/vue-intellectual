import request from '../utils/request'

const BASE = '/api/ttable'

export function getList(params) {
  return request.get(`${BASE}/list`, { params })
}

export function getAll() {
  return request.get(`${BASE}/all`)
}

export function getById(id) {
  return request.get(`${BASE}/${id}`)
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

export function update(data) {
  return request.put(BASE, data)
}

export function remove(id) {
  return request.delete(`${BASE}/${id}`)
}

export function batchRemove(ids) {
  return request.delete(`${BASE}/batch`, { data: ids })
}
