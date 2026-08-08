<template>
  <span class="auth-code-link">
    <!-- 小型文字链接 -->
    <el-link type="primary" :underline="false" @click="dialogVisible = true">
      <el-icon><QuestionFilled /></el-icon>
      如何获取授权码？
    </el-link>

    <!-- 授权码引导弹窗 -->
    <el-dialog
        v-model="dialogVisible"
        title="📧 获取邮箱授权码指南"
        width="560px"
        :close-on-click-modal="true"
        destroy-on-close
    >
      <div class="guide-content">
        <el-steps direction="vertical" :active="2" finish-status="success" space="60px">
          <el-step title="步骤一：登录邮箱" description="进入邮箱网页版，点击『设置』或『账户安全』。" />
          <el-step title="步骤二：开启服务" description="找到『POP3/IMAP/SMTP』服务，点击『开启』。" />
          <el-step title="步骤三：生成授权码" description="根据指引，验证身份后复制生成的授权码。" />
        </el-steps>

        <el-divider content-position="left">常见邮箱入口</el-divider>

        <div class="provider-list">
          <el-card
              v-for="provider in providers"
              :key="provider.name"
              shadow="hover"
              class="provider-card"
              @click="openGuide(provider.url)"
          >
            <div class="provider-item">
              <img :src="provider.icon" :alt="provider.name" class="provider-icon" />
              <span class="provider-name">{{ provider.name }}</span>
              <el-icon class="external-link"><Right /></el-icon>
            </div>
          </el-card>
        </div>

        <el-alert
            title="安全提示"
            type="info"
            description="授权码相当于专用密码，请妥善保管，切勿泄露给他人。"
            :closable="false"
            show-icon
            class="safety-tip"
        />
      </div>

      <template #footer>
        <el-button size="small" @click="dialogVisible = false">关闭</el-button>
        <el-button size="small" type="primary" @click="copyTips">
          <el-icon><DocumentCopy /></el-icon> 复制安全提示
        </el-button>
      </template>
    </el-dialog>
  </span>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy, Right, QuestionFilled } from '@element-plus/icons-vue'

// 控制弹窗显示
const dialogVisible = ref(false)

// 邮箱服务商列表（含图标和官方指引链接）
const providers = [
  {
    name: 'QQ邮箱',
    icon: 'https://mail.qq.com/favicon.ico',
    url: 'https://service.mail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256',
  },
  {
    name: '163邮箱',
    icon: 'https://mail.163.com/favicon.ico',
    url: 'https://help.mail.163.com/faq.do?m=list&d=165&pid=4',
  },
  {
    name: 'Gmail',
    icon: 'https://mail.google.com/favicon.ico',
    url: 'https://support.google.com/accounts/answer/185833?hl=zh-Hans',
  },
  {
    name: 'Outlook/Hotmail',
    icon: 'https://outlook.live.com/favicon.ico',
    url: 'https://support.microsoft.com/zh-cn/account-billing/',
  },
]

// 打开对应官方帮助页面
const openGuide = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 复制安全提示到剪贴板
const copyTips = async () => {
  const tipText = '授权码相当于专用密码，请妥善保管，切勿泄露给他人。'
  try {
    await navigator.clipboard.writeText(tipText)
    ElMessage.success('已复制安全提示')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = tipText
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('已复制安全提示')
  }
}
</script>

<style scoped>
.auth-code-link {
  display: inline-flex;
  align-items: center;
}

.guide-content {
  padding: 8px 4px;
}

.provider-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 12px 0 16px;
}

.provider-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.provider-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
}

.provider-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  padding: 2px 0;
}

.provider-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}

.provider-name {
  flex: 1;
  font-weight: 500;
  color: #2c3e50;
  font-size: 13px;
}

.external-link {
  font-size: 14px;
  color: #909399;
  transition: color 0.2s;
}

.provider-card:hover .external-link {
  color: #409eff;
}

.safety-tip {
  margin-top: 12px;
  background-color: #f4f9ff;
  border-left-color: #409eff;
}

/* 移动端适配 */
@media (max-width: 500px) {
  .provider-list {
    grid-template-columns: 1fr;
  }
  :deep(.el-dialog) {
    width: 92% !important;
  }
}

/* 链接样式优化 */
:deep(.el-link) {
  font-size: 13px;
}

:deep(.el-link .el-icon) {
  margin-right: 4px;
  font-size: 14px;
}
</style>