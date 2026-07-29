import { ElMessage } from 'element-plus'
import { BASE_URL } from './request'

const pad = (n) => String(n).padStart(2, '0')

export function formatDateTime(val) {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function formatDate(val) {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseFileName(path) {
  if (!path) return ''
  const match = path.match(/[?&]name=([^&]*)/)
  if (match) return decodeURIComponent(match[1])
  const segments = path.split('/')
  return segments[segments.length - 1] || path
}

export function isFilePath(value) {
  return value && typeof value === 'string' && value.startsWith('/files/')
}

export async function fetchFileBlob(path) {
  if (!path) return
  const token = localStorage.getItem('token')
  const requestUrl = /^https?:\/\//i.test(path) ? path : `${BASE_URL}${path}`
  const res = await fetch(requestUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (!res.ok) throw new Error('文件读取失败')
  return res.blob()
}

async function readErrorMessage(response, fallback) {
  try {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await response.json()
      return body?.message || fallback
    }
    const text = await response.text()
    return text || fallback
  } catch {
    return fallback
  }
}

/** 将旧版 .doc 发送给后端 LibreOffice 服务，返回只用于当前页面预览的 PDF Blob。 */
export async function convertLegacyWordToPdf(fileBlob, fileName) {
  if (!fileBlob) throw new Error('没有可转换的 DOC 文件')
  const token = localStorage.getItem('token')
  const formData = new FormData()
  const originalName = String(fileName || 'preview.doc')
  const safeName = originalName.toLowerCase().endsWith('.doc')
    ? originalName
    : `${originalName}.doc`
  formData.append('file', fileBlob, safeName)
  const response = await fetch(`${BASE_URL}/api/file-preview/legacy-word`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  })
  const contentType = response.headers.get('content-type') || ''
  if (!response.ok || !contentType.includes('application/pdf')) {
    throw new Error(await readErrorMessage(response, 'DOC 在线预览转换失败'))
  }
  return response.blob()
}

export async function downloadFile(path) {
  if (!path) return
  try {
    const blob = await fetchFileBlob(path)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = parseFileName(path)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    ElMessage.error('文件下载失败')
  }
}
