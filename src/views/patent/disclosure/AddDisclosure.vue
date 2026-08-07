<template>
  <div class="add-disclosure-page">
    <!-- 返回 -->
    <el-button class="back-link" @click="goBack" text>
      <el-icon><ArrowLeft /></el-icon>
      返回
    </el-button>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header__icon">
        <el-icon :size="30"><DocumentAdd /></el-icon>
      </div>
      <div class="page-header__text">
        <h2 class="page-header__title">新增交底</h2>
        <p class="page-header__subtitle">填写交底基本信息并上传附件</p>
      </div>
    </div>

    <!-- 表单 -->
    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form ref="formRef" :model="form" label-width="80px" class="basic-form">
            <!-- ========== 专利信息 ========== -->
            <h4 class="sec-head">交底信息</h4>
            <el-form-item label="交底名称" required>
              <el-input v-model="form.disclosureName" placeholder="请输入交底名称" />
            </el-form-item>
            <el-form-item label="日期" required>
              <el-date-picker v-model="form.disclosureDate" type="date" style="width:100%" value-format="YYYY-MM-DD" placeholder="选择日期" @change="onDateChange" />
            </el-form-item>
            <el-form-item label="临时编号">
              <el-input v-model="form.tempNo" disabled placeholder="根据日期自动生成" />
            </el-form-item>

            <!-- ========== 审查选项 ========== -->
            <h4 class="sec-head">审查选项</h4>
            <div class="check-row">
              <el-checkbox v-model="preExam">预审</el-checkbox>
              <el-checkbox v-model="excellentExam">优审</el-checkbox>
            </div>

            <!-- ========== 人员信息 ========== -->
            <h4 class="sec-head">人员信息</h4>

            <!-- 主办人（必填） -->
            <div class="sub-block">
              <span class="sub-label">主办人 <el-tag size="small" type="danger">必填</el-tag></span>
              <el-select
                v-model="form.sponsorUserId"
                filterable
                :loading="sponsorLoading"
                placeholder="搜索选择主办人"
                no-data-text="暂无启用的主办人"
                style="width:100%"
                @change="onSponsorChange"
              >
                <el-option
                  v-for="u in userList"
                  :key="u.userId"
                  :label="`${u.userName || u.loginName} (ID:${u.userId})`"
                  :value="u.userId"
                />
              </el-select>
            </div>

            <!-- 申请人（选填） -->
            <div class="sub-block">
              <span class="sub-label">申请人 <el-tag size="small" type="info">选填</el-tag></span>
              <div v-for="(ap, idx) in applicants" :key="idx" class="person-row">
                <el-row :gutter="12">
                  <el-col :span="8">
                    <el-input v-model="ap.name" placeholder="姓名" />
                  </el-col>
                  <el-col :span="8">
                    <el-input v-model="ap.email" placeholder="邮箱" />
                  </el-col>
                  <el-col :span="8">
                    <el-input v-model="ap.phone" placeholder="电话" />
                  </el-col>
                </el-row>
                <el-button v-if="applicants.length > 1" class="person-del" type="danger" :icon="Delete" circle size="small" @click="removeApplicant(idx)" />
              </div>
              <el-button type="primary" text size="small" @click="addApplicant">
                <el-icon><Plus /></el-icon> 添加申请人
              </el-button>
            </div>

            <!-- 联系人（必填） -->
            <div class="sub-block">
              <span class="sub-label">联系人 <el-tag size="small" type="danger">必填</el-tag></span>
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-input v-model="form.contactPerson" placeholder="姓名" />
                </el-col>
                <el-col :span="8">
                  <el-input v-model="form.contactEmail" placeholder="邮箱" />
                </el-col>
                <el-col :span="8">
                  <el-input v-model="form.contactPhone" placeholder="电话" />
                </el-col>
              </el-row>
            </div>

            <!-- 指导人（选填） -->
            <div class="sub-block">
              <span class="sub-label">指导人 <el-tag size="small" type="info">选填</el-tag></span>
              <div v-for="(mentor, idx) in mentors" :key="idx" class="person-row">
                <el-row :gutter="12">
                  <el-col :span="8">
                    <el-input v-model="mentor.name" placeholder="姓名" />
                  </el-col>
                  <el-col :span="8">
                    <el-input v-model="mentor.email" placeholder="邮箱" />
                  </el-col>
                  <el-col :span="8">
                    <el-input v-model="mentor.phone" placeholder="电话" />
                  </el-col>
                </el-row>
                <el-button v-if="mentors.length > 1" class="person-del" type="danger" :icon="Delete" circle size="small" @click="removeMentor(idx)" />
              </div>
              <el-button type="primary" text size="small" @click="addMentor">
                <el-icon><Plus /></el-icon> 添加指导人
              </el-button>
            </div>

            <!-- 业务人员（选填） -->
            <div class="sub-block">
              <span class="sub-label">业务人员 <el-tag size="small" type="info">选填</el-tag></span>
              <div v-for="(person, idx) in businessPersonnelList" :key="idx" class="person-row">
                <el-row :gutter="12">
                  <el-col :span="8">
                    <el-input v-model="person.name" placeholder="姓名" />
                  </el-col>
                  <el-col :span="8">
                    <el-input v-model="person.email" placeholder="邮箱" />
                  </el-col>
                  <el-col :span="8">
                    <el-input v-model="person.phone" placeholder="电话" />
                  </el-col>
                </el-row>
                <el-button v-if="businessPersonnelList.length > 1" class="person-del" type="danger" :icon="Delete" circle size="small" @click="removeBusinessPersonnel(idx)" />
              </div>
              <el-button type="primary" text size="small" @click="addBusinessPersonnel">
                <el-icon><Plus /></el-icon> 添加业务人员
              </el-button>
            </div>

            <!-- ========== 客户要求 ========== -->
            <h4 class="sec-head">客户要求</h4>
            <el-input v-model="form.requirement" type="textarea" :rows="3" placeholder="客户的特殊要求" />
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="附件" name="attachments">
          <DisclosureAttachmentEditor
            :disclosure-id="null"
            v-model:document-file="pendingDocument"
            v-model:other-files="pendingOthers"
          />
        </el-tab-pane>
      </el-tabs>

      <!-- 底部操作 -->
      <div class="form-footer">
        <el-button class="footer-btn" @click="goBack">取消</el-button>
        <el-button v-if="activeTab === 'basic'" class="footer-btn" type="primary" @click="goNext">
          下一步
        </el-button>
        <el-button v-else class="footer-btn" type="primary" @click="handleSave" :loading="saving">
          创建交底
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DocumentAdd, ArrowLeft, Plus, Delete } from '@element-plus/icons-vue'
import { getSponsorOptions, createWithAttachments } from '../../../api/disclosureWorkflow'
import DisclosureAttachmentEditor from '../../../components/DisclosureAttachmentEditor.vue'
import { useDialogAddDraft } from '../../../composables/useFormDraft'
import { emptyForm } from './shared'

const router = useRouter()
const formRef = ref(null)
const activeTab = ref('basic')
const saving = ref(false)
const form = reactive(emptyForm())
const pendingDocument = ref(null)
const pendingOthers = ref([])
const userList = ref([])
const sponsorLoading = ref(false)
let allowRouteLeave = false

// 审查选项
const preExam = ref(false)
const excellentExam = ref(false)

// 申请人列表
const applicants = ref([{ name: '', email: '', phone: '' }])

// 指导人和业务人员均支持多人录入。
const mentors = ref([{ name: '', email: '', phone: '' }])
const businessPersonnelList = ref([{ name: '', email: '', phone: '' }])

const emptyDraftData = () => ({
  form: emptyForm(),
  applicants: [{ name: '', email: '', phone: '' }],
  mentors: [{ name: '', email: '', phone: '' }],
  businessPersonnelList: [{ name: '', email: '', phone: '' }],
  preExam: false,
  excellentExam: false,
  activeTab: 'basic',
  hasPendingDocument: false,
  pendingOtherCount: 0
})

const resetAddForm = () => {
  Object.assign(form, emptyForm())
  applicants.value = [{ name: '', email: '', phone: '' }]
  mentors.value = [{ name: '', email: '', phone: '' }]
  businessPersonnelList.value = [{ name: '', email: '', phone: '' }]
  preExam.value = false
  excellentExam.value = false
  activeTab.value = 'basic'
  pendingDocument.value = null
  pendingOthers.value = []
}

const addDraft = useDialogAddDraft('patent-disclosure-page-add', {
  getEmptyData: emptyDraftData,
  getCurrentData: () => ({
    form: { ...form },
    applicants: applicants.value.map(item => ({ ...item })),
    mentors: mentors.value.map(item => ({ ...item })),
    businessPersonnelList: businessPersonnelList.value.map(item => ({ ...item })),
    preExam: preExam.value,
    excellentExam: excellentExam.value,
    activeTab: activeTab.value,
    hasPendingDocument: !!pendingDocument.value,
    pendingOtherCount: pendingOthers.value.length
  }),
  reset: resetAddForm,
  applyData: (data) => {
    Object.assign(form, emptyForm(), data.form || {})
    applicants.value = Array.isArray(data.applicants) && data.applicants.length
      ? data.applicants.map(item => ({ ...item }))
      : [{ name: '', email: '', phone: '' }]
    mentors.value = Array.isArray(data.mentors) && data.mentors.length
      ? data.mentors.map(item => ({ ...item }))
      : [{ name: '', email: '', phone: '' }]
    businessPersonnelList.value = Array.isArray(data.businessPersonnelList) && data.businessPersonnelList.length
      ? data.businessPersonnelList.map(item => ({ ...item }))
      : [{ name: '', email: '', phone: '' }]
    preExam.value = !!data.preExam
    excellentExam.value = !!data.excellentExam
    activeTab.value = data.activeTab || 'basic'
    pendingDocument.value = null
    pendingOthers.value = []
  },
  onRestored: (data) => {
    if (data.hasPendingDocument || data.pendingOtherCount) {
      ElMessage.warning('暂存只恢复了表单内容，本地附件需要重新选择')
    }
  },
  closeSavedMessage: '已暂存，下次可继续填写；本地附件需要重新选择'
})

const addApplicant = () => {
  applicants.value.push({ name: '', email: '', phone: '' })
}

const removeApplicant = (idx) => {
  applicants.value.splice(idx, 1)
}

const addMentor = () => {
  mentors.value.push({ name: '', email: '', phone: '' })
}

const removeMentor = (idx) => {
  mentors.value.splice(idx, 1)
}

const addBusinessPersonnel = () => {
  businessPersonnelList.value.push({ name: '', email: '', phone: '' })
}

const removeBusinessPersonnel = (idx) => {
  businessPersonnelList.value.splice(idx, 1)
}

/** 将多人表单转换为后端保存的分号分隔文本。 */
const peopleToText = (people) => people
  .filter(person => person.name || person.email || person.phone)
  .map(person => [person.name, person.email, person.phone].filter(Boolean).join(' '))
  .join('; ')

// 日期变化时自动生成临时编号
const onDateChange = (val) => {
  form.tempNo = val ? `P${val.replace(/-/g, '')}` : ''
}

const onSponsorChange = (uid) => {
  const u = userList.value.find(u => u.userId === uid)
  form.sponsor = u ? (u.userName || u.loginName) : ''
}

const loadUsers = async () => {
  sponsorLoading.value = true
  try {
    const r = await getSponsorOptions()
    if (r.code === 200 && r.data) {
      userList.value = Array.isArray(r.data) ? r.data : []
    }
  } catch {
    ElMessage.error('主办人列表加载失败，请稍后重试')
  } finally {
    sponsorLoading.value = false
  }
}

const handleSave = async () => {
  if (!validateBasicForm()) {
    activeTab.value = 'basic'
    return
  }
  if (!pendingDocument.value) {
    ElMessage.warning('请在附件页上传一份 Word 格式的交底书')
    activeTab.value = 'attachments'
    return
  }
  saving.value = true
  try {
    // 组装申请人：过滤空行，拼接为字符串
    const validApps = applicants.value.filter(a => a.name || a.email || a.phone)
    const applicantStr = validApps.map(a => [a.name, a.email, a.phone].filter(Boolean).join(' ')).join('; ')
    const mentor = peopleToText(mentors.value)
    const businessPersonnel = peopleToText(businessPersonnelList.value)
    const submitData = {
      ...form,
      applicant: applicantStr || form.applicant,
      mentor: mentor || undefined,
      businessPersonnel: businessPersonnel || undefined,
      requirement: [
        form.requirement || '',
        preExam.value ? '预审' : '',
        excellentExam.value ? '优审' : ''
      ].filter(Boolean).join('，') || undefined
    }
    delete submitData.patentType
    delete submitData.agent
    const res = await createWithAttachments(submitData, pendingDocument.value, pendingOthers.value, null)
    if (res.code === 200) {
      addDraft.clear()
      allowRouteLeave = true
      ElMessage.success('交底创建成功')
      router.push('/patent/disclosure')
    }
  } finally {
    saving.value = false
  }
}

const validateBasicForm = () => {
  if (!form.disclosureName) { ElMessage.warning('请输入交底名称'); return }
  if (!form.disclosureDate) { ElMessage.warning('请选择日期'); return }
  if (!form.sponsorUserId) { ElMessage.warning('请选择主办人'); return }
  if (!form.contactPerson) { ElMessage.warning('请输入联系人姓名'); return }
  if (!form.contactEmail) { ElMessage.warning('请输入联系人邮箱'); return }
  if (!form.contactPhone) { ElMessage.warning('请输入联系人电话'); return }
  return true
}

const goNext = () => {
  if (!validateBasicForm()) return
  activeTab.value = 'attachments'
}

const goBack = () => {
  addDraft.cancel(() => {
    allowRouteLeave = true
    router.push('/patent/disclosure')
  })
}

const handleBeforeUnload = (event) => {
  if (!addDraft.isDirty()) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave(async () => {
  if (allowRouteLeave || !addDraft.isDirty()) return true
  let canLeave = false
  await addDraft.cancel(() => { canLeave = true })
  return canLeave
})

onMounted(() => {
  loadUsers()
  addDraft.open(() => {})
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
.add-disclosure-page { max-width: 1200px; }

/* 返回 */
.back-link {
  margin-bottom: 12px;
  padding: 0;
  color: #606266;
}
.back-link:hover { color: #1677ff; }

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 50%, #f5f7fa 100%);
  border-radius: 8px;
  border: 1px solid #d6e4ff;
}
.page-header__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1677ff, #4096ff);
  border-radius: 10px;
  color: #fff;
  box-shadow: 0 3px 8px rgba(22, 119, 255, 0.3);
  flex-shrink: 0;
}
.page-header__icon .el-icon {
  font-size: 24px;
}
.page-header__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}
.page-header__subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: #909399;
}

/* 基本信息 */
:deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
:deep(.el-tabs__item.is-active) {
  color: #1677ff;
}

.basic-form { max-width: 900px; }
.sec-head {
  margin: 20px 0 12px;
  padding-left: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #7eb8f4;
  border-left: 3px solid #a0cfff;
  line-height: 1.2;
}
.check-row {
  padding-left: 10px;
  margin-bottom: 4px;
  display: flex;
  gap: 24px;
}
.sub-block {
  margin-bottom: 14px;
  padding-left: 10px;
}
.sub-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}
.person-row {
  position: relative;
  margin-bottom: 6px;
}
.person-del {
  position: absolute;
  right: -36px;
  top: 4px;
}

/* 表单底部 */
.form-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.footer-btn {
  width: 110px;
  height: 40px;
  font-size: 15px;
}
</style>
