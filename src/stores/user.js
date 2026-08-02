import { reactive } from 'vue'
import { login as loginApi, getMe, logout as logoutApi } from '../api/acount'
import { ElMessage } from 'element-plus'

const state = reactive({
  userInfo: null,
  token: localStorage.getItem('token') || '',
  userId: localStorage.getItem('userId') || '',
  permissions: JSON.parse(localStorage.getItem('permissions') || '[]'),
  email: localStorage.getItem('email') || '',
  menuVersion: 0
})

export function useUserStore() {
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
    ElMessage.success('登录成功')
    return res
  }

  const fetchUserInfo = async () => {
    const res = await getMe()
    state.userInfo = res.data
    setPermissions(res.data.permissions)
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
