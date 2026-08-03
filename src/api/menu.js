import request from '../utils/request'

const BASE = '/api/sys-menu'

export function getMenuList() {
  return request.get(`${BASE}/all`)
}

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
