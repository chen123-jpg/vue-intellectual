import { ref, reactive } from 'vue'

/**
 * 通用的分页查询组合式函数
 *
 * 封装了 query、pagination、loading、fetchData、resetQuery 等重复逻辑，
 * 适用于项目中所有带查询+分页列表的业务页面。
 *
 * @param {Object} options
 * @param {Function} options.fetchFn   必需。API 调用函数，接收组装好的 params 对象，返回 Promise
 * @param {Object}   options.defaultQuery  可选。查询字段默认值
 * @param {Object}   options.defaultPage   可选。分页默认值
 * @param {Function} options.buildParams   可选。自定义参数组装函数 (query, page) => params
 *                                        默认：合并 page + query，清理掉空字符串值
 *
 * @returns {{ query, page, loading, fetchData, resetQuery }}
 *
 * @example
 * // 标准用法（GET 请求，query 作为 query params）
 * const { query, page, loading, fetchData, resetQuery } = useSearch({
 *   fetchFn: (params) => getList(params),
 *   defaultQuery: { roleName: '', roleKey: '', status: '' }
 * })
 *
 * @example
 * // 自定义参数组装
 * const { query, page, loading, fetchData, resetQuery } = useSearch({
 *   fetchFn: (params) => getList(params),
 *   defaultQuery: { disclosureName: '', patentStatus: '' },
 *   buildParams: (query, page) => {
 *     const body = { sponsorUserId: userId.value }
 *     Object.keys(query).forEach(k => { if (query[k]) body[k] = query[k] })
 *     return { params: { pageNum: page.pageNum, pageSize: page.pageSize }, body }
 *   }
 * })
 */
export function useSearch(options) {
  const { fetchFn, defaultQuery = {}, defaultPage = {}, buildParams } = options

  // --- 状态 ---
  const query = reactive({ ...defaultQuery })
  const page = reactive({
    pageNum: defaultPage.pageNum || 1,
    pageSize: defaultPage.pageSize || 10,
    total: defaultPage.total || 0
  })
  const loading = ref(false)

  // --- 默认参数组装 ---
  const defaultBuildParams = () => {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize }
    Object.keys(query).forEach(k => {
      const v = query[k]
      // 保留有效值：非空字符串、非 null/undefined、数字 0 也保留
      if (v === 0 || (v !== '' && v !== null && v !== undefined)) {
        params[k] = typeof v === 'string' ? v.trim() : v
      }
    })
    return params
  }

  // --- 重置 ---
  const resetQuery = () => {
    Object.keys(query).forEach(k => {
      const def = defaultQuery[k]
      query[k] = def !== undefined ? def : ''
    })
    page.pageNum = 1
    fetchData()
  }

  // --- 查询 ---
  const fetchData = async () => {
    loading.value = true
    try {
      const params = buildParams ? buildParams(query, page) : defaultBuildParams()
      const res = await fetchFn(params)
      if (res && res.code === 200) {
        const data = res.data
        // 兼容分页格式 { records, total } 和数组格式
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          page.total = data.total || 0
          return data.records || data || []
        }
        return data || []
      }
      return []
    } catch {
      // 错误已在 axios 拦截器中统一处理
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    query,
    page,
    loading,
    fetchData,
    resetQuery
  }
}
