/**
 * 数据权限配置字典 —— 静态数据
 */
export const scopeColumns = [
  { prop: 'code', label: '权限ID', width: 110 },
  { prop: 'roleId', label: '角色ID', width: 100 },
  { prop: 'scope', label: '数据权限范围', width: 120 },
  { prop: 'description', label: '范围说明', minWidth: 300 },
  { prop: 'createTime', label: '创建时间', width: 120 },
  { prop: 'remark', label: '备注', minWidth: 180 }
]

export const scopeData = [
  { code: 'SCOPE001', roleId: 'ROLE001', scope: '全部数据', description: '可查看总公司、所有分公司的全部业务数据', createTime: '2026-01-01', remark: '总经理角色数据权限' },
  { code: 'SCOPE002', roleId: 'ROLE002', scope: '全部数据', description: '可查看总公司、所有分公司的全部业务数据', createTime: '2026-01-01', remark: '副总经理角色数据权限' },
  { code: 'SCOPE003', roleId: 'ROLE003', scope: '本组织数据', description: '仅可查看所属专利代理部的业务数据', createTime: '2026-01-01', remark: '代理部主管角色数据权限' },
  { code: 'SCOPE004', roleId: 'ROLE004', scope: '本组织数据', description: '仅可查看所属行政财务部的业务数据', createTime: '2026-01-01', remark: '行政财务主管角色数据权限' },
  { code: 'SCOPE005', roleId: 'ROLE005', scope: '本人数据', description: '仅可查看本人负责的案件数据', createTime: '2026-01-01', remark: '专利代理人角色数据权限' },
  { code: 'SCOPE006', roleId: 'ROLE006', scope: '本人数据', description: '仅可查看本人负责的案件数据', createTime: '2026-01-01', remark: '专利工程师角色数据权限' },
  { code: 'SCOPE007', roleId: 'ROLE007', scope: '本组织数据', description: '仅可查看所属行政财务部的立项数据', createTime: '2026-01-01', remark: '立项专员角色数据权限' },
  { code: 'SCOPE008', roleId: 'ROLE008', scope: '客户专属数据', description: '仅可查看所属客户主体的案件数据', createTime: '2026-01-01', remark: '客户管理员角色数据权限' },
  { code: 'SCOPE009', roleId: 'ROLE009', scope: '客户专属数据', description: '仅可查看所属客户主体的案件数据', createTime: '2026-01-01', remark: '客户普通员工角色数据权限' }
]
