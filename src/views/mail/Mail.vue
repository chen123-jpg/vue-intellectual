<template>
  <div class="mail-page">
    <!-- ========== 顶部横幅 ========== -->
    <div class="page-hero">
      <div class="hero-content">
        <div class="hero-icon">
          <el-icon :size="36"><Message /></el-icon>
        </div>
        <div class="hero-text">
          <h1 class="hero-title">邮件中心</h1>
          <p class="hero-subtitle">高效撰写与发送邮件，统一管理发送记录</p>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-num">{{ sentCount }}</span>
            <span class="stat-label">已发送</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 主内容区 ========== -->
    <div class="page-body">
      <el-card class="main-card" shadow="never">
        <el-tabs v-model="activeTab" class="mail-tabs">
          <!-- ========== 写邮件 ========== -->
          <el-tab-pane name="compose">
            <template #label>
              <div class="tab-label">
                <el-icon :size="18"><Edit /></el-icon>
                <span>写邮件</span>
              </div>
            </template>
            <div class="compose-section">
              <MailComposer
                ref="composerRef"
                mode="inline"
                :show-header="false"
                shadow="never"
                @sent="onMailSent"
                @cancel="onMailCancel"
              />
            </div>
          </el-tab-pane>

          <!-- ========== 发送记录 ========== -->
          <el-tab-pane name="records">
            <template #label>
              <div class="tab-label">
                <el-icon :size="18"><Clock /></el-icon>
                <span>发送记录</span>
              </div>
            </template>
            <MailRecordsEmbed />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MailComposer from '../../components/MailComposer.vue'
import MailRecordsEmbed from './MailRecords.vue'
import { Message, Edit, Clock } from '@element-plus/icons-vue'

const activeTab = ref('compose')
const composerRef = ref(null)
const sentCount = ref(0)

const onMailSent = () => {
  sentCount.value++
}

const onMailCancel = () => {}
</script>

<style scoped>
/* ========== 整体 ========== */
.mail-page {
  max-width: 1300px;
  margin: -20px;
}

/* ========== 顶部横幅 ========== */
.page-hero {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  border-radius: 0 0 20px 20px;
  padding: 32px 40px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.25);
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.hero-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  backdrop-filter: blur(4px);
  flex-shrink: 0;
}

.hero-text {
  flex: 1;
}

.hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
}

.hero-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
}

.stat-item {
  text-align: center;
  min-width: 64px;
}

.stat-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 2px;
}

/* ========== 主内容 ========== */
.page-body {
  padding: 0 20px 20px;
}

.main-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.main-card :deep(.el-card__body) {
  padding: 0;
}

/* ========== Tab 样式 ========== */
.mail-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 24px;
  background: #fafbfc;
  border-bottom: 1px solid #ebeef5;
}

.mail-tabs :deep(.el-tabs__nav) {
  border: none;
}

.mail-tabs :deep(.el-tabs__item) {
  height: 52px;
  line-height: 52px;
  font-size: 15px;
  color: #606266;
  padding: 0 24px;
}

.mail-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
}

.mail-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 2px 2px 0 0;
}

.mail-tabs :deep(.el-tabs__content) {
  padding: 24px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ========== 写邮件区域 ========== */
.compose-section {
  max-width: 960px;
  margin: 0 auto;
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #c0c4cc;
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
}
</style>
