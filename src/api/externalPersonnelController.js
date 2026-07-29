import request from '../utils/request'

const BASE = '/api'

const AGENT_BASE = `${BASE}/agent`

export function getList(params) {
  return request.get(`${AGENT_BASE}/list`, { params })
}

export function getAll() {
  return request.get(`${AGENT_BASE}/all`)
}

export function getById(id) {
  return request.get(`${AGENT_BASE}/${id}`)
}

export function create(data) {
  return request.post(AGENT_BASE, data)
}

export function update(data) {
  return request.put(AGENT_BASE, data)
}

export function remove(id) {
  return request.delete(`${AGENT_BASE}/${id}`)
}

export function batchRemove(ids) {
  return request.delete(`${AGENT_BASE}/batch`, { data: ids })
}

// ========== 申请人 ==========
const APPLICANT_BASE = `${BASE}/applicant`

export function getApplicantAll() {
  return request.get(`${APPLICANT_BASE}/all`)
}

export function getApplicantList(params) {
  return request.get(`${APPLICANT_BASE}/list`, { params })
}

export function getApplicantById(id) {
  return request.get(`${APPLICANT_BASE}/${id}`)
}

export function createApplicant(data) {
  return request.post(APPLICANT_BASE, data)
}

export function updateApplicant(data) {
  return request.put(APPLICANT_BASE, data)
}

export function removeApplicant(id) {
  return request.delete(`${APPLICANT_BASE}/${id}`)
}

export function batchRemoveApplicant(ids) {
  return request.delete(`${APPLICANT_BASE}/batch`, { data: ids })
}
