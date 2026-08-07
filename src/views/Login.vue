<template>
  <div class="login-wrap">
    <!-- 品牌标语 -->
    <div class="login-brand">
      <div class="login-brand__title">知识产权管理系统</div>
      <div class="login-brand__sub">INTELLECTUAL PROPERTY MANAGEMENT</div>
    </div>

    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="tab-header">
          <span class="tab-item" :class="{ active: activeTab === 'login' }" @click="activeTab = 'login'">
            账号登录</span>
          <span class="tab-item" :class="{ active: activeTab === 'register' }" @click="activeTab = 'register'">
            用户注册</span>
        </div>
      </template>

      <!-- 登录表单 -->
      <el-form v-if="activeTab === 'login'" ref="loginRef" :model="loginForm" label-width="90px">
        <el-form-item label="登录账号">
          <el-input v-model="loginForm.loginName" placeholder="请输入账号"></el-input>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="loginForm.phoneNumber" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="手机验证码">
          <el-input v-model="loginForm.smsCode" placeholder="请输入验证码">
            <template #append>
              <el-button @click="sendSmsCode" :disabled="isSending">
                {{ isSending ? `${remainTime}s后重试` : '获取验证码' }}
              </el-button>
            </template>

          </el-input>

        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="验证码">
          <div class="code-row">
            <el-input v-model="loginForm.checkCode" placeholder="算术验证码"></el-input>
            <img
                v-if="captchaImg"
                :src="captchaImg"
                class="captcha-img"
                @click="refreshCaptcha"
                title="点击刷新验证码"
            />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loginLoading" class="submit-btn">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 注册表单 -->
      <el-form v-if="activeTab === 'register'" ref="regRef" :model="regForm" label-width="90px">
        <el-form-item label="登录账号">
          <el-input v-model="regForm.loginName" placeholder="3~30位账号"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="regForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="regForm.phoneNumber" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="手机验证码">
          <el-input v-model="regForm.smsCode" placeholder="请输入手机验证码">
            <template #append>
              <el-button @click="sendSmsCode" :disabled="isSending">
                {{ isSending ? `${remainTime}s后重试` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="regForm.password" type="password" placeholder="6~20位密码"></el-input>
        </el-form-item>
        <el-form-item label="验证码">
          <div class="code-row">
            <el-input v-model="regForm.checkCode"></el-input>
            <img
                v-if="captchaImg"
                :src="captchaImg"
                class="captcha-img"
                @click="refreshCaptcha"
                title="点击刷新验证码"
            />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" :loading="regLoading" class="submit-btn">
            注册
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {getCheckCode, getSmsCode, register as registerApi} from '../api/acount'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const { login } = useUserStore()

const activeTab = ref('login')
const isSending = ref(false);
const loginLoading = ref(false)
const regLoading = ref(false)

const captchaImg = ref('')
const checkCodeKey = ref('')
const remainTime = ref(60)

const loginForm = ref({
  loginName: '',
  phoneNumber: '',
  smsCode: '',
  password: '',
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
  regForm.value.checkCodeKey = checkCodeKey.value
}

//后端生成手机验证码
const sendSmsCode = async () => {
  const phone = activeTab.value === 'register'?regForm.value.phoneNumber:loginForm.value.phoneNumber
  if (!phone) {
    ElMessage.warning("请输入手机号")
    return
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
    ElMessage.warning("验证码发送失败，请稍后再试！")
    isSending.value = false
  }

}

const handleLogin = async () => {
  loginLoading.value = true
  try {
    await login(loginForm.value)
    router.push('/home')
  } catch {
    // 错误信息已在拦截器中展示
  } finally {
    loginLoading.value = false
    refreshCaptcha()
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
  } finally {
    regLoading.value = false
    refreshCaptcha()
  }
}

onMounted(() => refreshCaptcha())
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #132036 30%, #1a2f4a 60%, #1e3348 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.login-wrap::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at 30% 20%, rgba(30,136,229,0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 80%, rgba(66,165,245,0.06) 0%, transparent 60%);
  pointer-events: none;
}

/* 品牌标语 */
.login-brand {
  text-align: center;
  margin-bottom: 28px;
}
.login-brand__title {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 4px;
  text-shadow: 0 0 30px rgba(255,255,255,0.15);
}
.login-brand__sub {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 2px;
  margin-top: 6px;
}

.login-card {
  width: 440px;
  border-radius: 12px !important;
  box-shadow: 0 8px 40px rgba(0,0,0,0.3) !important;
}

.tab-header {
  display: flex;
  gap: 24px;
  font-size: 17px;
  font-weight: 600;
}
.tab-item {
  cursor: pointer;
  padding: 6px 4px;
  color: #999;
  transition: all 0.2s;
}
.tab-item:hover {
  color: var(--brand-blue);
}
.tab-item.active {
  border-bottom: 2px solid var(--brand-blue);
  color: var(--brand-blue);
}
.code-row {
  display: flex;
  gap: 10px;
}
.captcha-img {
  height: 40px;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #dcdcdc;
}
.submit-btn {
  width: 100%;
  height: 42px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
}
</style>
