// ========== 模板变量与数据源字段映射 ==========

/**
 * 根据上下文数据自动填充模板变量
 * @param {string[]} varNames - 模板中的变量名列表，如 ['tempCaseNo', 'patentName', ...]
 * @param {object} context - 上下文数据 { disclosure: {...}, patent: {...}, user: {...} }
 * @returns {object} 变量名到值的映射，未匹配的变量值为空字符串
 */
export function autoFillTemplateVars(varNames, context = {}) {
  const { disclosure = {}, patent = {}, user = {} } = context || {}

  // 变量名 → [来源对象, 字段key] 映射
  const mapping = {
    // === T表字段（交底数据）===
    tempCaseNo:      [disclosure, 'internalNo'],
    patentName:      [disclosure, 'disclosureName'],
    patentType:      [disclosure, 'patentType'],
    applicant:       [disclosure, 'applicant'],
    inventorStr:     [disclosure, 'inventor'],
    contactName:     [disclosure, 'contactPerson'],

    // === 用户/代理人信息 ===
    handlerName:     [user, 'realName'],
    handlerPhone:    [user, 'phone'],
    handlerEmail:    [user, 'email'],
    handlerQq:       [user, 'qq'],

    // === P表字段（专利申请数据）===
    agentCaseNo:     [patent, 'agentCaseNo'],
    applyNo:         [patent, 'applyNo'],
    applyDate:       [patent, 'applyDate'],
    draftNo:         [patent, 'draftNo'],
    opinionTimes:    [patent, 'opinionTimes'],
    feedbackDeadline:[patent, 'feedbackDeadline'],
    pctDeadline:     [patent, 'pctDeadline'],
    pctNo:           [patent, 'pctNo'],
    priorityNo:      [patent, 'priorityNo'],
    usApplyNo:       [patent, 'usApplyNo'],
    usApplyDate:     [patent, 'usApplyDate'],
    usCaseNo:        [patent, 'usCaseNo'],
    refDocNum:       [patent, 'refDocNum'],
    rejectAnalyzeDesc:    [patent, 'rejectAnalyzeDesc'],
    rejectFeedbackDeadline:[patent, 'rejectFeedbackDeadline'],
    reviewResult:    [patent, 'reviewResult'],
    changeType:      [patent, 'changeType'],
    abnormalReason:  [patent, 'abnormalReason'],
    appealDeadline:  [patent, 'appealDeadline'],
  }

  const result = {}
  for (const name of varNames) {
    const entry = mapping[name]
    if (entry) {
      const [source, key] = entry
      const val = source?.[key]
      result[name] = val != null ? String(val) : ''
    } else {
      result[name] = ''
    }
  }
  return result
}

// ========== 变量名 → 中文标签映射 ==========
const VAR_LABELS = {
  tempCaseNo:       '临时案号',
  patentName:       '专利名称',
  patentType:       '专利类型',
  applicant:        '申请人',
  inventorStr:      '发明人',
  contactName:      '联系人',
  handlerName:      '代理人',
  handlerPhone:     '代理人电话',
  handlerEmail:     '代理人邮箱',
  handlerQq:        '代理人QQ',
  agentCaseNo:      '代理案号',
  applyNo:          '申请号',
  applyDate:        '申请日',
  draftNo:          '稿件版本',
  opinionTimes:     '审查意见次数',
  feedbackDeadline: '反馈截止时间',
  pctDeadline:      'PCT截止日期',
  pctNo:            'PCT号',
  priorityNo:       '优先权号',
  usApplyNo:        '美国申请号',
  usApplyDate:      '美国申请日',
  usCaseNo:         '美国案号',
  refDocNum:        '对比文件数量',
  rejectAnalyzeDesc:     '驳回分析说明',
  rejectFeedbackDeadline:'复审反馈截止日期',
  reviewResult:     '复审结论',
  changeType:       '变更类型',
  abnormalReason:   '非正常认定理由',
  appealDeadline:   '申诉截止日期',
  userName:  '用户姓名',
  payDate: '缴费日期',
  ticketUrl: '票据路径',
  qrImageUrl: '图片路径',
  ticketCode: '取票码',
  amount: '金额'
}



/** 获取变量中文标签，未匹配则返回原始变量名 */
export function templateVarLabel(varName) {
  return VAR_LABELS[varName] || varName
}

/** 将模板字符串中的 ${varName} 替换为实际值 */
export function renderTemplate(template, data) {
  if (!template) return ''
  return template.replace(/\$\{(\w+)\}/g, (match, name) => {
    const val = data[name]
    return val != null ? String(val) : match
  })
}
