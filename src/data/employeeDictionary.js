/**
 * 员工信息字典 —— 静态数据
 * 除员工编号外各字段可编辑，支持新增和删除
 */

// 表格中显示的列（主要信息）
export const employeeTableColumns = [
  { prop: 'code', label: '员工编号', width: 100 },
  { prop: 'status', label: '状态', width: 110 },
  { prop: 'name', label: '姓名', width: 80 },
  { prop: 'gender', label: '性别', width: 60 },
  { prop: 'company', label: '就职单位', minWidth: 180 },
  { prop: 'postCode', label: '岗位编号', width: 100 },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'email', label: '工作邮箱', minWidth: 180 },
  { prop: 'entryDate', label: '入职时间', width: 110 },
  { prop: 'isOrgAgent', label: '本机构执业代理师', width: 140 },
  { prop: 'verificationStatus', label: '实名核验状态', width: 110 }
]

// 弹窗中所有可编辑的列
export const employeeFormFields = [
  { prop: 'code', label: '员工编号', type: 'text', required: true, disabledOnEdit: true },
  { prop: 'status', label: '状态', type: 'select', required: true, options: ['1-试用', '2-在职', '3-休假/停薪留职', '4-待离职', '5-已离职'] },
  { prop: 'name', label: '姓名', type: 'text', required: true },
  { prop: 'gender', label: '性别', type: 'select', options: ['男', '女'] },
  { prop: 'birthDate', label: '出生日期', type: 'date' },
  { prop: 'address', label: '快递地址', type: 'text' },
  { prop: 'idCard', label: '身份证号', type: 'text' },
  { prop: 'nativePlace', label: '籍贯', type: 'text' },
  { prop: 'residence', label: '居住地', type: 'text' },
  { prop: 'phone', label: '手机号', type: 'text', required: true },
  { prop: 'company', label: '就职单位', type: 'text' },
  { prop: 'postCode', label: '岗位编号', type: 'text' },
  { prop: 'entryDate', label: '入职时间', type: 'date' },
  { prop: 'leaveDate', label: '离职时间', type: 'date' },
  { prop: 'email', label: '工作邮箱', type: 'text' },
  { prop: 'education', label: '最高学历', type: 'select', options: ['高中', '大专', '本科', '硕士', '博士'] },
  { prop: 'major', label: '专业', type: 'text' },
  { prop: 'graduationDate', label: '毕业时间', type: 'date' },
  { prop: 'certNo', label: '代理师资格证编号', type: 'text' },
  { prop: 'certDate', label: '代理师资格证获取时间', type: 'date' },
  { prop: 'practiceNo', label: '代理师执业证号', type: 'text' },
  { prop: 'firstPracticeDate', label: '首次执业时间', type: 'date' },
  { prop: 'practiceField', label: '执业专业', type: 'text' },
  { prop: 'isOrgAgent', label: '是否为本机构执业代理师', type: 'select', options: ['是', '否'] },
  { prop: 'lawCertNo', label: '法律职业资格证号', type: 'text' },
  { prop: 'lawCertDate', label: '法律职业资格证时间', type: 'date' },
  { prop: 'verificationStatus', label: '实名核验状态', type: 'select', options: ['未核验', '已核验', '核验中'] },
  { prop: 'documents', label: '证件', type: 'text' },
  { prop: 'remark', label: '备注', type: 'textarea' }
]

export const employeeData = [
  {
    code: 'EMP001', status: '1-试用', name: '张建国', gender: '男', birthDate: '1975-05-10',
    address: '重庆市南岸区风临路 26 号 4 楼 411 室', idCard: '110101197505101234',
    nativePlace: '北京朝阳', residence: '北京市朝阳区', phone: '13800138000',
    company: 'XX知识产权代理有限公司（总公司）', postCode: 'POST001', entryDate: '2020-01-01',
    leaveDate: null, email: 'zhang.jg@xxip.com', education: '本科', major: '法学',
    graduationDate: '1998-07-01', certNo: '5010185', certDate: '2010-05-01',
    practiceNo: '123456', firstPracticeDate: null, practiceField: null,
    isOrgAgent: '是', lawCertNo: 'A20035001070534', lawCertDate: '2003-03-01',
    verificationStatus: '已核验', documents: '已归档', remark: '总经理'
  },
  {
    code: 'EMP002', status: '2-在职', name: '李慧敏', gender: '女', birthDate: '1982-11-20',
    address: '重庆市南岸区风临路 26 号 4 楼 411 室', idCard: '310101198211201234',
    nativePlace: '上海浦东', residence: '上海市浦东新区', phone: '13800138001',
    company: 'XX知识产权代理有限公司（总公司）', postCode: 'POST002', entryDate: '2021-03-15',
    leaveDate: null, email: 'li.hm@xxip.com', education: '硕士', major: '知识产权法',
    graduationDate: '2005-07-01', certNo: '5017702T', certDate: '2010-05-01',
    practiceNo: null, firstPracticeDate: null, practiceField: null,
    isOrgAgent: '是', lawCertNo: 'A20205001070534', lawCertDate: '2020-02-01',
    verificationStatus: '已核验', documents: null, remark: '副总经理'
  },
  {
    code: 'EMP003', status: '3-休假/停薪留职', name: '赵伟', gender: '男', birthDate: '1988-03-15',
    address: '重庆市南岸区风临路 26 号 4 楼 411 室', idCard: '440101198803151234',
    nativePlace: '广东广州', residence: '广州市天河区', phone: '13800138002',
    company: 'XX知识产权代理有限公司（总公司）', postCode: 'POST003', entryDate: '2018-07-01',
    leaveDate: null, email: 'zhao.w@xxip.com', education: '硕士', major: '机械工程',
    graduationDate: '2010-07-01', certNo: '5010206', certDate: '2012-05-01',
    practiceNo: '123457', firstPracticeDate: '2012-05-01', practiceField: '机械领域',
    isOrgAgent: '否', lawCertNo: 'A20205001070512', lawCertDate: '2020-04-01',
    verificationStatus: '已核验', documents: null, remark: '专利代理部主管'
  },
  {
    code: 'EMP004', status: '4-待离职', name: '刘芳', gender: '女', birthDate: '1990-07-22',
    address: '重庆市南岸区风临路 26 号 4 楼 411 室', idCard: '510101199007221234',
    nativePlace: '四川成都', residence: '成都市武侯区', phone: '13800138003',
    company: 'XX知识产权代理有限公司（总公司）', postCode: 'POST004', entryDate: '2019-02-01',
    leaveDate: null, email: 'liu.f@xxip.com', education: '本科', major: '会计学',
    graduationDate: '2012-07-01', certNo: null, certDate: null,
    practiceNo: null, firstPracticeDate: null, practiceField: null,
    isOrgAgent: '否', lawCertNo: 'A20205001070548', lawCertDate: '2017-03-01',
    verificationStatus: '已核验', documents: null, remark: '行政财务部主管'
  },
  {
    code: 'EMP005', status: '5-已离职', name: '陈涛', gender: '男', birthDate: '1985-09-10',
    address: '重庆市南岸区风临路 26 号 4 楼 411 室', idCard: '330101198509101234',
    nativePlace: '浙江杭州', residence: '杭州市滨江区', phone: '13800138004',
    company: 'XX知识产权代理有限公司（总公司）', postCode: 'POST006', entryDate: '2017-04-01',
    leaveDate: '2023-04-01', email: 'chen.t@xxip.com', education: '硕士', major: '电子信息工程',
    graduationDate: '2008-07-01', certNo: null, certDate: null,
    practiceNo: null, firstPracticeDate: '2010-05-01', practiceField: null,
    isOrgAgent: '否', lawCertNo: null, lawCertDate: null,
    verificationStatus: '已核验', documents: null, remark: '专利代理人'
  },
  {
    code: 'EMP006', status: '2-在职', name: '周明', gender: '男', birthDate: '1992-12-05',
    address: '重庆市南岸区风临路 26 号 4 楼 411 室', idCard: '320101199212051234',
    nativePlace: '江苏南京', residence: '南京市江宁区', phone: '13800138005',
    company: 'XX知识产权代理有限公司（总公司）', postCode: 'POST007', entryDate: '2020-07-01',
    leaveDate: null, email: 'zhou.m@xxip.com', education: '本科', major: '计算机科学与技术',
    graduationDate: '2014-07-01', certNo: '5010123T', certDate: '2010-05-01',
    practiceNo: null, firstPracticeDate: null, practiceField: '电子领域',
    isOrgAgent: '是', lawCertNo: null, lawCertDate: null,
    verificationStatus: '已核验', documents: null, remark: '专利工程师'
  },
  {
    code: 'EMP007', status: '2-在职', name: '吴敏', gender: '女', birthDate: '1995-03-18',
    address: '重庆市南岸区风临路 26 号 4 楼 411 室', idCard: '420101199503181234',
    nativePlace: '湖北武汉', residence: '武汉市洪山区', phone: '13800138006',
    company: 'XX知识产权代理有限公司（总公司）', postCode: 'POST011', entryDate: '2021-09-01',
    leaveDate: null, email: 'wu.m@xxip.com', education: '本科', major: '项目管理',
    graduationDate: '2017-07-01', certNo: '5010185', certDate: '2010-05-01',
    practiceNo: null, firstPracticeDate: null, practiceField: null,
    isOrgAgent: '是', lawCertNo: null, lawCertDate: null,
    verificationStatus: '已核验', documents: null, remark: '立项专员'
  }
]
