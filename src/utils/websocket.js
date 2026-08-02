import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { ElNotification } from 'element-plus'
import { BASE_URL } from './request'

let ws = null
let reconnectTimer = null
let heartbeatTimer = null
let reconnectAttempts = 0
let hasEverConnected = false
let intentionalClose = false

const MAX_RECONNECT_ATTEMPTS = 10
const MAX_INITIAL_ATTEMPTS = 2
const INITIAL_RECONNECT_DELAY = 2000
const MAX_RECONNECT_DELAY = 60000
const HEARTBEAT_INTERVAL = 10000

function getWsUrl() {
  const u = new URL(BASE_URL)
  return `ws://${u.hostname}:5051/ws`
}

function getReconnectDelay() {
  const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts)
  return Math.min(delay, MAX_RECONNECT_DELAY)
}

function send(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function dispatchMessage(raw) {
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return
  }

  if (data.type === 'pong') return

  if (data.type === 'notification') {
    const store = useNotificationStore()
    store.addUnread(data)
    ElNotification({
      title: data.title,
      message: data.content,
      type: 'info',
      duration: 5000,
    })
    return
  }

  if (data.type === 'unreadList') {
    const store = useNotificationStore()
    store.replaceUnread(data.data || [])
    return
  }
}

function startHeartbeat() {
  stopHeartbeat()
  heartbeatTimer = setInterval(() => send({ type: 'ping' }), HEARTBEAT_INTERVAL)
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

/** 公开：铃铛打开时主动拉取 */
export function fetchUnread() {
  send({ type: 'fetchUnread' })
}

export function connectWebSocket() {
  const { state } = useUserStore()
  if (!state.token) return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  const store = useNotificationStore()
  ws = new WebSocket(`${getWsUrl()}?token=${encodeURIComponent(state.token)}`)

  ws.onopen = () => {
    console.log('WebSocket 已连接')
    store.wsConnected = true
    hasEverConnected = true
    reconnectAttempts = 0
    startHeartbeat()
    fetchUnread()
  }

  ws.onmessage = (event) => dispatchMessage(event.data)

  ws.onclose = () => {
    store.wsConnected = false
    stopHeartbeat()
    if (!intentionalClose) scheduleReconnect()
  }

  ws.onerror = () => {
    store.wsConnected = false
  }
}

function scheduleReconnect() {
  if (intentionalClose) return
  const maxAttempts = hasEverConnected ? MAX_RECONNECT_ATTEMPTS : MAX_INITIAL_ATTEMPTS
  if (reconnectAttempts >= maxAttempts) return

  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectAttempts++
  reconnectTimer = setTimeout(() => connectWebSocket(), getReconnectDelay())
}

export function disconnectWebSocket() {
  intentionalClose = true
  stopHeartbeat()
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  if (ws) { ws.close(); ws = null }
  reconnectAttempts = 0
  hasEverConnected = false
  const store = useNotificationStore()
  store.wsConnected = false
}
