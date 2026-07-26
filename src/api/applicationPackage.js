import request from '../utils/request'

const BASE = '/api/application-package'

export function getList(params) {
  return request.get(`${BASE}/list`, { params })
}

export function getAll() {
  return request.get(`${BASE}/all`)
}

export function getById(id) {
  return request.get(`${BASE}/${id}`)
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

export function getByDisclosure(disclosureId) {
  return request.get(`${BASE}/by-disclosure/${disclosureId}`)
}

export function confirmPackage(id, params) {
  return request.put(`${BASE}/${id}/confirm`, null, { params })
}
