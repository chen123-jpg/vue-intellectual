<template>
  <div class="login-wrap">
    <el-card class="login-card" shadow="never">
      <div class="login-header">
        <h2 class="login-title">{{ activeTab === 'login' ? '欢迎登录' : '用户注册' }}</h2>
        <p class="login-subtitle">知识产权管理系统</p>
      </div>

      <!-- 登录表单 -->
      <div v-if="activeTab === 'login'" class="login-content">
        <div class="login-type-switch">
          <span class="switch-item" :class="{ active: loginType === 'account' }" @click="loginType = 'account'">账号密码登录</span>
          <span class="switch-item" :class="{ active: loginType === 'phone' }" @click="loginType = 'phone'">手机号登录</span>
        </div>

        <!-- 账号密码登录 -->
        <el-form v-if="loginType === 'account'" ref="loginRef" :model="loginForm" size="large">
          <el-form-item>
            <el-input v-model="loginForm.loginName" placeholder="请输入账号" :prefix-icon="User"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" :prefix-icon="Lock"></el-input>
          </el-form-item>
          <el-form-item>
            <div class="code-row">
              <el-input v-model="loginForm.checkCode" placeholder="算术验证码" @keyup.enter="handleLogin" :prefix-icon="Key"></el-input>
              <img v-if="captchaImg" :src="captchaImg" class="captcha-img" @click="refreshCaptcha" title="点击刷新验证码" />
            </div>
          </el-form-item>
          <el-form-item style="margin-top: 30px;">
            <el-button type="primary" @click="handleLogin" :loading="loginLoading" class="submit-btn">登录</el-button>
          </el-form-item>
        </el-form>

        <!-- 手机号登录 -->
        <el-form v-if="loginType === 'phone'" ref="phoneLoginRef" :model="phoneLoginForm" size="large">
          <el-form-item>
            <el-input v-model="phoneLoginForm.phoneNumber" placeholder="请输入手机号" :prefix-icon="Iphone"></el-input>
          </el-form-item>
          <el-form-item>
            <div class="code-row">
              <el-input v-model="phoneLoginForm.smsCode" placeholder="请输入手机验证码" @keyup.enter="handleLogin" :prefix-icon="Message"></el-input>
              <el-button class="sms-btn" @click="sendSmsCode" :disabled="isSending" plain>
                {{ isSending ? `${remainTime}s后重试` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item>
            <div class="code-row">
              <el-input v-model="phoneLoginForm.checkCode" placeholder="算术验证码" :prefix-icon="Key"></el-input>
              <img v-if="captchaImg" :src="captchaImg" class="captcha-img" @click="refreshCaptcha" title="点击刷新验证码" />
            </div>
          </el-form-item>
          <el-form-item style="margin-top: 30px;">
            <el-button type="primary" @click="handleLogin" :loading="loginLoading" class="submit-btn">登录</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 注册表单 -->
      <div v-if="activeTab === 'register'" class="register-content">
        <el-form ref="regRef" :model="regForm" size="large">
          <el-form-item>
            <el-input v-model="regForm.loginName" placeholder="3~30位账号" :prefix-icon="User"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="regForm.email" placeholder="请输入邮箱" :prefix-icon="Message"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="regForm.phoneNumber" placeholder="请输入手机号" :prefix-icon="Iphone"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="regForm.password" type="password" placeholder="6~20位密码" :prefix-icon="Lock"></el-input>
          </el-form-item>
          <el-form-item>
            <div class="code-row">
              <el-input v-model="regForm.smsCode" placeholder="请输入手机验证码" :prefix-icon="Message"></el-input>
              <el-button class="sms-btn" @click="sendSmsCode" :disabled="isSending" plain>
                {{ isSending ? `${remainTime}s后重试` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item>
            <div class="code-row">
              <el-input v-model="regForm.checkCode" placeholder="算术验证码" :prefix-icon="Key"></el-input>
              <img v-if="captchaImg" :src="captchaImg" class="captcha-img" @click="refreshCaptcha" title="点击刷新验证码" />
            </div>
          </el-form-item>
          <el-form-item style="margin-top: 30px;">
            <el-button type="primary" @click="handleRegister" :loading="regLoading" class="submit-btn">注册</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 底部切换链接 -->
      <div class="bottom-link">
        <span v-if="activeTab === 'login'">没有账号？<a class="link-btn" @click="activeTab = 'register'">立即注册</a></span>
        <span v-else>已有账号？<a class="link-btn" @click="activeTab = 'login'">返回登录</a></span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCheckCode, getSmsCode, register as registerApi } from '../api/acount'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Iphone, Key } from '@element-plus/icons-vue'

const router = useRouter()
const { login } = useUserStore()

const activeTab = ref('login')
const loginType = ref('account')
const isSending = ref(false);
const loginLoading = ref(false)
const regLoading = ref(false)

const captchaImg = ref('')
const checkCodeKey = ref('')
const remainTime = ref(60)

const loginForm = ref({
  loginType: 'account',
  loginName: '',
  password: '',
  checkCodeKey: '',
  checkCode: ''
})

const phoneLoginForm = ref({
  loginType: 'phone',
  phoneNumber: '',
  smsCode: '',
  checkCodeKey: '',
  checkCode: ''
})

const regForm = ref({
  loginName: '',
  email: '',
  phoneNumber: '',
  smsCode: '',
  password: '',
  checkCodeKey: '',
  checkCode: ''
})

const refreshCaptcha = async () => {
  const res = await getCheckCode(checkCodeKey.value)
  captchaImg.value = res.data.checkCode
  checkCodeKey.value = res.data.checkCodeKey
  loginForm.value.checkCodeKey = checkCodeKey.value
  phoneLoginForm.value.checkCodeKey = checkCodeKey.value
  regForm.value.checkCodeKey = checkCodeKey.value
}

//后端生成手机验证码
const sendSmsCode = async () => {
  const phone = activeTab.value === 'register' ? regForm.value.phoneNumber : phoneLoginForm.value.phoneNumber
  if (!phone) {
    ElMessage.warning("请输入手机号")
    return
  }

  // 对于手机号登录，必须先填写人机验证码
  let currentCheckCode = ''
  let currentCheckCodeKey = ''
  if (activeTab.value === 'login') {
    currentCheckCode = phoneLoginForm.value.checkCode
    currentCheckCodeKey = phoneLoginForm.value.checkCodeKey
    if (!currentCheckCode) {
      ElMessage.warning("请先输入图形验证码")
      return
    }
  } else {
    currentCheckCode = regForm.value.checkCode
    currentCheckCodeKey = regForm.value.checkCodeKey
    if (!currentCheckCode) {
      ElMessage.warning("请先输入图形验证码")
      return
    }
  }

  try {
    const res = await getSmsCode(phone)
    isSending.value = true
    
    // 直接弹窗显示验证码（为了绕过阿里云短信资质审核）
    if (res.data && res.data.code) {
      ElMessage.success(`【测试环境】您的验证码是：${res.data.code}`);
    }
    
    //60秒倒计时
    remainTime.value = 60
    const timer = setInterval(() => {
      remainTime.value--
      if (remainTime.value <= 0) {
        clearInterval(timer)
        isSending.value = false
      }
    },1000)
  }catch (err){
    console.error("请求失败了:",err)
    // 错误信息已经在 axios 拦截器中处理，如果是验证码错误，刷新一下图形验证码
    refreshCaptcha()
    isSending.value = false
  }

}

const handleLogin = async () => {
  loginLoading.value = true
  try {
    const payload = loginType.value === 'account' ? loginForm.value : phoneLoginForm.value
    await login(payload)
    router.push('/home')
  } catch {
    // 错误信息已在拦截器中展示
    refreshCaptcha()
  } finally {
    loginLoading.value = false
  }
}

const handleRegister = async () => {
  regLoading.value = true
  try {
    await registerApi(regForm.value)
    ElMessage.success('注册成功，请登录')
    activeTab.value = 'login'
  } catch {
    // 错误信息已在拦截器中展示
    refreshCaptcha()
  } finally {
    regLoading.value = false
  }
}

onMounted(() => refreshCaptcha())
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 品牌色变量覆盖 */
  --el-color-primary: #1ebb85;
  --el-color-primary-light-3: #4bd0a1;
  --el-color-primary-light-5: #78e0bc;
  --el-color-primary-light-7: #a6f0d8;
  --el-color-primary-light-9: #d3f8f0;
  --el-color-primary-dark-2: #18966a;
}

.login-card {
  width: 420px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  border: none;
  padding: 10px 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.login-type-switch {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.switch-item {
  cursor: pointer;
  font-size: 16px;
  color: #666;
  padding: 0 4px 12px;
  position: relative;
  transition: all 0.3s;
}

.switch-item:hover {
  color: var(--el-color-primary);
}

.switch-item.active {
  color: var(--el-color-primary);
  font-weight: 600;
}

.switch-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--el-color-primary);
  border-radius: 2px;
}

.code-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.code-row .el-input {
  flex: 1;
}

.captcha-img {
  height: 40px;
  width: 120px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #dcdcdc;
  object-fit: cover;
}

.sms-btn {
  width: 120px;
  height: 40px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 6px;
}

.bottom-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.link-btn {
  color: var(--el-color-primary);
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.link-btn:hover {
  text-decoration: underline;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}
</style>
