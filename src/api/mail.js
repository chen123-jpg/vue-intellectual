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

export function renderMailPreview(data) {
  return request.post('/api/mail/renderPreview', data)
}

export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 删除已上传文件（fileUrl 形如 /files/uuid.ext?name=原始名）
export function deleteFile(fileUrl) {
  const fileId = fileUrl.split('?')[0].split('/').filter(Boolean).pop()
  return request.delete(`/api/files/${fileId}`, { _mute: true })
}

export function getTemplateList() {
  return request.get('/api/mail-template/all')
}
