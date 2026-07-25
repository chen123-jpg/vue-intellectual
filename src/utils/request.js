import axios from 'axios'
import { ElMessage } from 'element-plus'

const BASE_URL = 'http://localhost:5050'

const service = axios.create({
    baseURL: BASE_URL,
    timeout: 10000
})

// 请求拦截器 携带token
service.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 响应拦截器统一处理错误码
service.interceptors.response.use(res => {
    const body = res.data
    if (body && body.code !== 200) {
        ElMessage.error(body.message || '操作失败')
        return Promise.reject(new Error(body.message || '操作失败'))
    }
    return body
}, err => {
    const response = err.response
    let msg = '网络异常'
    if (response && response.data) {
        msg = response.data.message
        // 未登录，清除token跳转登录
        if (response.status === 401 || response.data.code === 401) {
            localStorage.removeItem('token')
            location.href = '/login'
            ElMessage.error('登录失效，请重新登录')
            return Promise.reject(err)
        }
        if (response.data.code === 403) {
            ElMessage.error('权限不足')
            return Promise.reject(err)
        }
    }
    ElMessage.error(msg)
    return Promise.reject(err)
})

export { BASE_URL }
export default service