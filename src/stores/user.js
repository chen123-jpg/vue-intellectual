import { reactive } from 'vue'
import { login as loginApi, getMe, logout as logoutApi } from '../api/acount'
import { ElMessage } from 'element-plus'

const state = reactive({
  userInfo: null,
  token: localStorage.getItem('token') || '',
  permissions: JSON.parse(localStorage.getItem('permissions') || '[]')
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
    if (res.code === 200) {
      setToken(res.data.token)
      setPermissions(res.data.permissions)
      ElMessage.success('登录成功')
    }
    return res
  }

  const fetchUserInfo = async () => {
    const res = await getMe()
    if (res.code === 200) {
      state.userInfo = res.data
      setPermissions(res.data.permissions)
    }
    return res
  }

  const logout = async () => {
    await logoutApi()
    state.token = ''
    state.userInfo = null
    state.permissions = []
    localStorage.removeItem('token')
    localStorage.removeItem('permissions')
    ElMessage.success('已安全退出')
  }

  return {
    state,
    login,
    setToken,
    setPermissions,
    fetchUserInfo,
    logout
  }
}
