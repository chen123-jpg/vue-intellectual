<template>
  <div class="login-wrap">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="tab-header">
          <span
              class="tab-item"
              :class="{ active: activeTab === 'login' }"
              @click="activeTab = 'login'"
          >账号登录</span>
          <span
              class="tab-item"
              :class="{ active: activeTab === 'register' }"
              @click="activeTab = 'register'"
          >用户注册</span>
        </div>
      </template>

      <!-- 登录表单 -->
      <el-form
          v-if="activeTab === 'login'"
          ref="loginRef"
          :model="loginForm"
          label-width="90px"
      >
        <el-form-item label="登录账号">
          <el-input v-model="loginForm.loginName" placeholder="请输入账号"></el-input>
        </el-form-item>
<!--        <el-form-item label="手机号">-->
<!--          <el-input v-model="loginForm.phoneNumber" placeholder="请输入手机号"></el-input>-->
<!--        </el-form-item>-->
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
      <el-form
          v-if="activeTab === 'register'"
          ref="regRef"
          :model="regForm"
          label-width="90px"
      >
        <el-form-item label="登录账号">
          <el-input v-model="regForm.loginName" placeholder="3~30位账号"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="regForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="regForm.phoneNumber" placeholder="请输入手机号"></el-input>
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
import { getCheckCode, register as registerApi } from '../api/acount'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const { login } = useUserStore()

const activeTab = ref('login')
const loginLoading = ref(false)
const regLoading = ref(false)

const captchaImg = ref('')
const checkCodeKey = ref('')

const loginForm = ref({
  loginName: '',
  phoneNumber: '',
  password: '',
  checkCodeKey: '',
  checkCode: ''
})

const regForm = ref({
  loginName: '',
  email: '',
  phoneNumber: '',
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
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  width: 440px;
}
.tab-header {
  display: flex;
  gap: 24px;
  font-size: 18px;
}
.tab-item {
  cursor: pointer;
  padding: 6px 4px;
  color: #666;
}
.tab-item.active {
  border-bottom: 2px solid #409eff;
  color: #409eff;
}
.code-row {
  display: flex;
  gap: 10px;
}
.captcha-img {
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #dcdcdc;
}
.submit-btn {
  width: 100%;
}
</style>
