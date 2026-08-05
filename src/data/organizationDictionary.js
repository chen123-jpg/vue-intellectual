/**
 * 组织架构字典 —— 静态数据
 */
export const organizationColumns = [
  { prop: 'code', label: '组织ID', width: 100 },
  { prop: 'name', label: '组织名称', minWidth: 220 },
  { prop: 'parentCode', label: '上级组织ID', width: 120 },
  { prop: 'type', label: '组织类型', width: 110 },
  { prop: 'contact', label: '联系人', width: 100 },
  { prop: 'phone', label: '联系电话', width: 130 },
  { prop: 'status', label: '组织状态', width: 90 },
  { prop: 'remark', label: '备注', minWidth: 160 }
]

export const organizationData = [
  { code: 'ORG001', name: 'XX知识产权代理有限公司（总公司）', parentCode: null, type: '总公司', contact: '张总', phone: '13800138000', status: '正常', remark: '总部管理机构' },
  { code: 'ORG002', name: '成都分公司', parentCode: 'ORG001', type: '分公司', contact: '李经理', phone: '13800138001', status: '正常', remark: '西南区域分公司' },
  { code: 'ORG003', name: '深圳分公司', parentCode: 'ORG001', type: '分公司', contact: '王经理', phone: '13800138002', status: '正常', remark: '华南区域分公司' },
  { code: 'ORG004', name: '总公司-专利代理部', parentCode: 'ORG001', type: '内部部门', contact: '赵主管', phone: '13800138003', status: '正常', remark: '核心业务部门' },
  { code: 'ORG005', name: '总公司-行政财务部', parentCode: 'ORG001', type: '内部部门', contact: '刘主管', phone: '13800138004', status: '正常', remark: '职能支持部门' },
  { code: 'ORG006', name: '总公司-质控部', parentCode: 'ORG001', type: '内部部门', contact: '陈主管', phone: '13800138005', status: '正常', remark: '质量管控部门' }
]
