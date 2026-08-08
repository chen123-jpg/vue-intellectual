<template>
  <div class="profile">
    <el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="info">
          <el-descriptions v-if="state.userInfo" :column="2" border>
            <el-descriptions-item label="用户ID">{{ state.userInfo.userId }}</el-descriptions-item>
            <el-descriptions-item label="登录账号">{{ state.userInfo.loginName }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ state.userInfo.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ state.userInfo.phoneNumber || '-' }}</el-descriptions-item>
            <el-descriptions-item label="角色" :span="2">
              <el-space wrap>
                <el-tag v-for="r in state.userInfo.roles" :key="r" type="primary" size="small">{{ r }}</el-tag>
              </el-space>
            </el-descriptions-item>
          </el-descriptions>
          <el-skeleton v-else :rows="4" animated />
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px" style="max-width:460px">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="6~20位新密码" />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePwd" :loading="pwdLoading">确认修改</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="邮箱授权码" name="authCode">
          <!-- 显示授权码状态 -->
          <div style="margin-bottom: 20px;">
            <el-alert
                :type="state.authCode ? 'success' : 'warning'"
                :closable="false"
                show-icon
            >
              <template #title>
                <span style="font-weight: bold;">
                  {{ state.authCode ? '✅ 已设置邮箱授权码' : '⚠️ 未设置邮箱授权码' }}
                </span>
              </template>
              <span v-if="state.authCode" style="font-size: 14px;">
                您的邮箱已配置授权码，邮件发送功能可用
              </span>
              <span v-else style="font-size: 14px;">
                请配置邮箱授权码以启用邮件发送功能
              </span>
            </el-alert>
          </div>

          <el-form ref="authFormRef" :model="authForm" :rules="authRules" label-width="100px" style="max-width:460px">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="authForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="授权码" prop="authCode">
              <el-input v-model="authForm.authCode" type="password" show-password placeholder="请输入邮箱SMTP授权码" />
              <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                {{ state.authCode ? '如需更新授权码，请输入新的授权码' : '请输入邮箱的SMTP授权码' }}
              </div>
              <AuthCodeGuide />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveAuthCode" :loading="authLoading">
                {{ state.authCode ? '更新授权码' : '保存授权码' }}
              </el-button>
              <el-button
                  v-if="state.authCode"
                  type="danger"
                  @click="handleDeleteAuthCode"
                  :loading="authLoading"
                  plain
              >
                删除授权码
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import AuthCodeGuide from '../components/AuthCodeGuide.vue'
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { saveAuthCode, changePassword } from '../api/acount'
import { useUserStore } from '../stores/user'

const route = useRoute()
const userStore = useUserStore()
const { state } = userStore

const activeTab = ref('info')

const pwdLoading = ref(false)
const pwdFormRef = ref(null)
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '6~20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_, val, cb) => val === pwdForm.newPassword ? cb() : cb(new Error('两次密码不一致')),
      trigger: 'blur'
    }
  ]
}

const authLoading = ref(false)
const authFormRef = ref(null)
const authForm = reactive({ email: '', authCode: '' })
const authRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  authCode: [{ required: true, message: '请输入授权码', trigger: 'blur' }]
}

const handleChangePwd = async () => {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return

  pwdLoading.value = true
  try {
    const res = await changePassword({
      userId: state.userInfo.userId,
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      pwdFormRef.value.resetFields()
    } else {
      ElMessage.error(res.message || '密码修改失败')
    }
  } catch (error) {
    ElMessage.error('密码修改失败')
  } finally {
    pwdLoading.value = false
  }
}

const initEmail = () => {
  authForm.email = state.email || state.userInfo?.email || ''
}

const handleSaveAuthCode = async () => {
  const valid = await authFormRef.value.validate().catch(() => false)
  if (!valid) return

  authLoading.value = true
  try {
    const res = await saveAuthCode({
      userId: state.userInfo.userId,
      email: authForm.email,
      authCode: authForm.authCode
    })
    if (res.code === 200) {
      ElMessage.success('授权码保存成功')
      authForm.authCode = ''
      // 重新获取用户信息更新状态
      await userStore.fetchUserInfo()
      initEmail()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存授权码失败')
  } finally {
    authLoading.value = false
  }
}

const handleDeleteAuthCode = async () => {
  try {
    await ElMessageBox.confirm(
        '删除授权码后，邮件发送功能将不可用，确认删除？',
        '提示',
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

    authLoading.value = true
    // 删除授权码：保存空字符串
    const res = await saveAuthCode({
      userId: state.userInfo.userId,
      email: authForm.email,
      authCode: '' // 传空字符串表示删除
    })
    if (res.code === 200) {
      ElMessage.success('授权码已删除')
      authForm.authCode = ''
      // 重新获取用户信息更新状态
      await userStore.fetchUserInfo()
      initEmail()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  } finally {
    authLoading.value = false
  }
}

onMounted(async () => {
  // 如果用户信息为空，先获取
  if (!state.userInfo) {
    await userStore.fetchUserInfo()
  }
  initEmail()
  if (route.query.tab === 'password') activeTab.value = 'password'
})

watch(activeTab, (val) => {
  if (val === 'authCode') initEmail()
})

watch(() => state.userInfo?.email, () => {
  initEmail()
})
</script>

<style scoped>
.profile {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
</style>