import { ROUTE_MAP } from './constants'

/**
 * 解析后端返回的 link 字段，生成前端路由路径。
 * 支持两种格式：
 *   1. 纯字符串路径（如 "/case/detail/123"）—— 直接返回
 *   2. JSON 字符串（如 '{"code":"CASE_DEADLINE","params":{...}}'）—— 解析后映射
 * @param {string} link - 后端返回的 link 字段
 * @returns {string} 路由路径，若无法解析则返回 '#'
 */
export function resolveLink(link) {
    if (!link) return '#'
    if (link.startsWith('/')) return link
    try {
        const { code, params } = JSON.parse(link)
        const routeFn = ROUTE_MAP[code]
        if (routeFn && params) {
            return routeFn(params)
        }
        return '#'
    } catch {
        return '#'
    }
}
