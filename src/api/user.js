import request from '../utils/request'

export function getUserList(params) {
  return request.get('/api/user/list', { params })
}
