/**
 * 客户档案字典 —— 静态数据
 */
export const customerColumns = [
  { prop: 'code', label: '客户ID', width: 100 },
  { prop: 'type', label: '客户类型', width: 100 },
  { prop: 'name', label: '客户名称', minWidth: 180 },
  { prop: 'identityCode', label: '身份识别代码', minWidth: 180 },
  { prop: 'nature', label: '客户性质', width: 130 },
  { prop: 'legalRep', label: '法定代表人', width: 100 },
  { prop: 'managers', label: '管理人员', minWidth: 200 },
  { prop: 'managerCount', label: '管理人员数量', width: 120 },
  { prop: 'allowNonManagerReg', label: '允许非管理员注册', width: 150 },
  { prop: 'contact', label: '联系人', width: 100 },
  { prop: 'phone', label: '联系电话', width: 130 },
  { prop: 'address', label: '客户地址', minWidth: 180 },
  { prop: 'status', label: '客户状态', width: 90 },
  { prop: 'firstCoopDate', label: '首次合作时间', width: 120 },
  { prop: 'remark', label: '备注', minWidth: 140 }
]

export const customerData = [
  { code: 'CUS001', type: '单位客户', name: 'XX科技有限公司', identityCode: '91110108MA00000000', nature: '4-有限责任公司', legalRep: '王总', managers: '王总（CEO）、李经理（研发负责人）', managerCount: 2, allowNonManagerReg: '是', contact: '李经理', phone: '13900139001', address: '北京市海淀区中关村', status: '正常', firstCoopDate: '2023-01-01', remark: '核心大客户' },
  { code: 'CUS002', type: '单位客户', name: 'XX电子科技有限公司', identityCode: '91440101MA00000111', nature: '4-有限责任公司', legalRep: '张总', managers: '张总（创始人）、赵工（技术总监）', managerCount: 2, allowNonManagerReg: '是', contact: '赵工', phone: '13900139002', address: '广州市天河区', status: '正常', firstCoopDate: '2023-05-01', remark: '电子领域客户' },
  { code: 'CUS003', type: '自然人客户', name: '张三', identityCode: '310101198001011234', nature: '1-个人', legalRep: null, managers: null, managerCount: 0, allowNonManagerReg: '否', contact: '张三', phone: '13900139003', address: '上海市浦东新区', status: '正常', firstCoopDate: '2024-01-01', remark: '个人专利申请客户' },
  { code: 'CUS004', type: '单位客户', name: 'XX机械制造有限公司', identityCode: '91330106MA00000222', nature: '4-有限责任公司', legalRep: '刘总', managers: '刘总（总经理）', managerCount: 1, allowNonManagerReg: '否', contact: '刘总', phone: '13900139004', address: '杭州市滨江区', status: '正常', firstCoopDate: '2024-03-01', remark: '机械领域客户' }
]
