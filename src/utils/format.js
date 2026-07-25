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

export async function downloadFile(path) {
  if (!path) return
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('下载失败')
    const blob = await res.blob()
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
