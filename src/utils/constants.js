// ========== 提醒系统常量 ==========
export const DEADLINE_TYPES = ['PAY_FEE', 'SUPPLEMENT', 'REPLY_OFFICE_ACTION']
export const RULE_TYPES = ['OFFSET', 'PERCENT']
export const OFFSET_UNITS = ['DAY', 'HOUR', 'MINUTE']

// 链接路由映射（用于解析 link JSON 字段）
export const ROUTE_MAP = {
    CASE_DEADLINE: (params) => `/case/${params.caseId}/deadline/${params.deadlineId}`,
    // 可扩展其他类型
}