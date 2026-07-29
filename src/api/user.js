import request from '../utils/request'

const BASE = '/api/user'

export function getUserList(params) {
  return request.get(`${BASE}/list`, { params })
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

export function importUsers(formData) {
  return request.post('/api/excel/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
