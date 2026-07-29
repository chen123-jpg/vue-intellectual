import request from '../utils/request'

export function login(data) {
  return request.post('/api/acount/login', data)
}

export function register(data) {
  return request.post('/api/acount/register', data)
}

export function getCheckCode(oldCheckCodeKey) {
  return request.get('/api/acount/checkCode', {
    params: { oldCheckCodeKey: oldCheckCodeKey || null }
  })
}

export function getSmsCode(mobile) {
  return request.get('/api/acount/getSmsCode', {
    params: { mobile: mobile }
  })
}

export function getMe() {
  return request.get('/api/acount/me')
}

export function logout() {
  return request.post('/api/acount/logout')
}

export function saveAuthCode(data) {
  return request.post('/api/acount/authCode', null, { params: data })
}

export function changePassword(data) {
  return request.post('/api/acount/password', null, { params: data })
}
