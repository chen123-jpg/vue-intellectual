import request from '../utils/request'

export function sendMail(data) {
  if (data instanceof FormData) {
    return request.post('/api/mail/sendMaill', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
  // JSON 对象走 sendMailWithTemplate，支持 attachmentUrls，不强制要求模板
  return request.post('/api/mail/sendMailWithTemplate', data)
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
