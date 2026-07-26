import request from '../utils/request'

export function sendMail(data) {
  return request.post('/api/mail/sendMaill', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function sendMailWithTemplate(data) {
  return request.post('/api/mail/sendMailWithTemplate', data)
}

export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function getTemplateList() {
  return request.get('/api/mail-template/all')
}
