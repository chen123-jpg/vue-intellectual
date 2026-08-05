import { computed } from 'vue'
import { useUserStore } from '../../../stores/user'

const { state } = useUserStore()

export const roles = computed(() => state.userInfo?.roles || [])
export const isEntryClerk = computed(() =>
  (roles.value.includes('businessEntryClerk') || roles.value.includes('projectInitiator'))
  && !roles.value.includes('admin')
)
export const isOrganizer = computed(() => roles.value.includes('organizer') && !roles.value.includes('admin'))
export const isProcessOp = computed(() => roles.value.includes('processOperator') && !roles.value.includes('admin'))
export const isAdmin = computed(() => roles.value.includes('admin'))
export const userId = computed(() => state.userInfo?.userId || 0)
export const userName = computed(() => state.userInfo?.userName || state.userInfo?.loginName || '')

export const hasPerm = (perm) => state.permissions.includes(perm)

export const statusTag = (s) => {
  if (!s) return 'info'
  if (s === '定稿' || s === '定稿待报') return 'success'
  if (s === '驳回') return 'danger'
  if (s === '审核中') return 'warning'
  if (s === '受理') return 'primary'
  return 'info'
}

export const fmtSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export const mergeDisclosureAttachments = (records = [], grouped = {}) =>
  records.map(record => ({
    ...record,
    attachments: grouped?.[record.id] || grouped?.[String(record.id)] || []
  }))

export const emptyForm = () => ({
  id: null, tempNo: '', internalNo: '', patentStatus: '草稿', disclosureName: '', patentType: '',
  applicant: '', inventor: '', contactPerson: '', sponsor: '', sponsorUserId: null, agent: '',
  disclosureDate: '', requirement: '', remark: '',
  contactEmail: '', contactPhone: '', contactInfo: '', noGenerateMode: 'AUTO'
})
