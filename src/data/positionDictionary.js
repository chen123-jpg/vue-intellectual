/**
 * 岗位字典 —— 静态数据
 * 除岗位编号外各字段可编辑，支持新增和删除
 */
export const positionColumns = [
  { prop: 'code', label: '岗位编号', width: 110 },
  { prop: 'fullName', label: '岗位标准全称', minWidth: 160 },
  { prop: 'shortName', label: '岗位简称', minWidth: 120 },
  { prop: 'department', label: '所属部门', width: 150 },
  { prop: 'category', label: '岗位大类', width: 110 },
  { prop: 'responsibilities', label: '核心岗位职责', minWidth: 280 },
  { prop: 'superiorPost', label: '直接上级岗位', width: 130 },
  { prop: 'headcount', label: '岗位编制数', width: 100 },
  { prop: 'needCert', label: '需代理师资格证', width: 130 },
  { prop: 'isManager', label: '是否为管理岗', width: 120 },
  { prop: 'effectiveDate', label: '岗位生效日期', width: 120 },
  { prop: 'remark', label: '备注', minWidth: 140 }
]

export const positionData = [
  { code: 'POST001', fullName: '总经理', shortName: '总经理', department: '总公司', category: '决策层', responsibilities: '全面负责公司经营管理、战略决策、重大事项审批', superiorPost: null, headcount: 1, needCert: '否', isManager: '是', effectiveDate: '2026-01-01', remark: '公司最高负责人' },
  { code: 'POST002', fullName: '副总经理', shortName: '副总经理', department: '总公司', category: '决策层', responsibilities: '协助总经理分管业务板块，负责对应板块的管理与审批', superiorPost: '总经理', headcount: 2, needCert: '否', isManager: '是', effectiveDate: '2026-01-01', remark: '分管业务线负责人' },
  { code: 'POST003', fullName: '专利代理部主管', shortName: '代理部主管', department: '总公司-专利代理部', category: '管理层', responsibilities: '负责专利代理部日常管理、案件分配、人员管理、业务审批', superiorPost: '副总经理', headcount: 3, needCert: '是', isManager: '是', effectiveDate: '2026-01-01', remark: '专利业务负责人' },
  { code: 'POST004', fullName: '行政财务部主管', shortName: '行政财务主管', department: '总公司-行政财务部', category: '管理层', responsibilities: '负责行政、财务、人事、立项管理工作', superiorPost: '副总经理', headcount: 2, needCert: '否', isManager: '是', effectiveDate: '2026-01-01', remark: '职能部门负责人' },
  { code: 'POST005', fullName: '质控部主管', shortName: '质控主管', department: '总公司-质控部', category: '管理层', responsibilities: '负责案件质量管控、质检标准制定、质检复核', superiorPost: '副总经理', headcount: 2, needCert: '否', isManager: '是', effectiveDate: '2026-01-01', remark: '质量管控负责人' },
  { code: 'POST006', fullName: '专利代理人', shortName: '专利代理人', department: '总公司-专利代理部', category: '专业技术岗', responsibilities: '负责专利案件的申请文件撰写、答复审查意见、案件跟进，需持代理师资格证执业', superiorPost: '专利代理部主管', headcount: 20, needCert: '是', isManager: '否', effectiveDate: '2026-01-01', remark: '持证执业人员' },
  { code: 'POST007', fullName: '专利工程师', shortName: '专利工程师', department: '总公司-专利代理部', category: '专业技术岗', responsibilities: '负责专利技术方案梳理、申请文件初稿撰写、技术支持，无代理师资格证', superiorPost: '专利代理部主管', headcount: 15, needCert: '否', isManager: '否', effectiveDate: '2026-01-01', remark: '技术辅助人员' },
  { code: 'POST008', fullName: '专利工程师（试用岗）', shortName: '试用工程师', department: '总公司-专利代理部', category: '试用岗', responsibilities: '协助完成专利技术方案梳理、文档整理，学习业务流程', superiorPost: '专利代理部主管', headcount: 5, needCert: '否', isManager: '否', effectiveDate: '2026-01-01', remark: '试用期岗位' },
  { code: 'POST009', fullName: '质控专员', shortName: '质控专员', department: '总公司-质控部', category: '专业技术岗', responsibilities: '负责专利案件质检、问题记录、质检报告出具', superiorPost: '质控部主管', headcount: 6, needCert: '否', isManager: '否', effectiveDate: '2026-01-01', remark: '质量管控执行岗' },
  { code: 'POST010', fullName: '流程专员', shortName: '流程专员', department: '总公司-专利代理部', category: '专业技术岗', responsibilities: '负责专利案件流程监控、期限管理、官文转达、手续办理', superiorPost: '专利代理部主管', headcount: 8, needCert: '否', isManager: '否', effectiveDate: '2026-01-01', remark: '案件流程管理岗' },
  { code: 'POST011', fullName: '立项专员', shortName: '立项专员', department: '总公司-行政财务部', category: '职能支持岗', responsibilities: '负责项目立项管理、立项材料审核、立项进度跟进、台账管理', superiorPost: '行政财务部主管', headcount: 2, needCert: '否', isManager: '否', effectiveDate: '2026-01-01', remark: '立项管理执行岗' },
  { code: 'POST012', fullName: '财务专员', shortName: '财务专员', department: '总公司-行政财务部', category: '职能支持岗', responsibilities: '负责账务处理、费用核算、发票管理、财务报表编制', superiorPost: '行政财务部主管', headcount: 3, needCert: '否', isManager: '否', effectiveDate: '2026-01-01', remark: '财务执行岗' },
  { code: 'POST013', fullName: '出纳', shortName: '出纳', department: '总公司-行政财务部', category: '职能支持岗', responsibilities: '负责现金管理、银行收付、票据管理、资金台账登记', superiorPost: '行政财务部主管', headcount: 2, needCert: '否', isManager: '否', effectiveDate: '2026-01-01', remark: '资金管理岗' },
  { code: 'POST014', fullName: '行政专员', shortName: '行政专员', department: '总公司-行政财务部', category: '职能支持岗', responsibilities: '负责行政后勤、办公管理、人事辅助、档案管理', superiorPost: '行政财务部主管', headcount: 4, needCert: '否', isManager: '否', effectiveDate: '2026-01-01', remark: '行政执行岗' }
]
