import { reactive } from 'vue'
import { login as loginApi, getMe, logout as logoutApi } from '../api/acount'
import { ElMessage } from 'element-plus'

const state = reactive({
  userInfo: null,
  token: localStorage.getItem('token') || '',
  userId: localStorage.getItem('userId') || '',
  permissions: JSON.parse(localStorage.getItem('permissions') || '[]'),
  authCode: localStorage.getItem('authCode') === 'true', // true/false
  email: localStorage.getItem('email') || '',
  menuVersion: 0
})

export function useUserStore() {
  const setAuthCode = (authCode) => {
    // authCode 是 boolean: true 或 false
    state.authCode = authCode
    localStorage.setItem('authCode', String(authCode)) // 存储为 'true' 或 'false'
  }

  const setToken = (token) => {
    state.token = token
    localStorage.setItem('token', token)
  }

  const setPermissions = (permissions) => {
    state.permissions = permissions
    localStorage.setItem('permissions', JSON.stringify(permissions))
  }

  const login = async (data) => {
    const res = await loginApi(data)
    setToken(res.data.token)
    setPermissions(res.data.permissions)
    if (res.data.userId) {
      state.userId = res.data.userId
      localStorage.setItem('userId', res.data.userId)
    }
    if (res.data.email) {
      state.email = res.data.email
      localStorage.setItem('email', res.data.email)
    }
    // 直接存储，就是 boolean
    if (res.data.authCode !== undefined) {
      setAuthCode(res.data.authCode)
    }

    ElMessage.success('登录成功')
    return res
  }

  const fetchUserInfo = async () => {
    const res = await getMe()
    if (res.code === 200) {
      state.userInfo = res.data
      setPermissions(res.data.permissions)

      // 直接存储 boolean
      if (res.data.authCode !== undefined) {
        setAuthCode(res.data.authCode)
      }

      if (res.data.email) {
        state.email = res.data.email
        localStorage.setItem('email', res.data.email)
      }
    }
    return res
  }

  const logout = async () => {
    await logoutApi()
    state.token = ''
    state.userId = ''
    state.userInfo = null
    state.permissions = []
    state.email = ''
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('permissions')
    localStorage.removeItem('email')
    ElMessage.success('已安全退出')
  }

  const bumpMenuVersion = () => {
    state.menuVersion++
  }

  return {
    state,
    login,
    setToken,
    setPermissions,
    fetchUserInfo,
    logout,
    bumpMenuVersion
  }
}
