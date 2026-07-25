import request from '../utils/request'

const MODULES = ['new-application', 'supplementary', 'pct', 'intermediate-change', 'reexamination']

const api = {}

MODULES.forEach(mod => {
  const BASE = `/api/ptable/${mod}`
  api[mod] = {
    getList(params) { return request.get(`${BASE}/list`, { params }) },
    getAll() { return request.get(`${BASE}/all`) },
    getById(id) { return request.get(`${BASE}/${id}`) },
    create(data) { return request.post(BASE, data) },
    update(data) { return request.put(BASE, data) },
    remove(id) { return request.delete(`${BASE}/${id}`) },
    batchRemove(ids) { return request.delete(`${BASE}/batch`, { data: ids }) }
  }
})

export default api
