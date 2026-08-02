<template>
  <div class="app-shell">
    <!-- ==================== 侧边栏菜单（双栏布局） ==================== -->
    <SidebarMenu
      :menus="visibleMenus"
      :active-path="activeMenu"
      :is-collapse="isCollapse"
      :user-name="userName"
      :user-dept="userDept"
      @navigate="handleMenuNavigate"
      @toggle-collapse="isCollapse = !isCollapse"
      @width-change="sidebarWidth = $event"
    />

    <!-- ==================== 右侧主体区域 ==================== -->
    <div :class="['main-area', { 'main-area--mobile': isMobile }]">
      <!-- 顶部导航栏 -->
      <header class="top-header">
        <div class="top-header__left">
          <!-- 桌面端折叠按钮 -->
          <button v-if="!isMobile" class="collapse-btn" @click="isCollapse = !isCollapse">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        <div class="top-header__right">
          <!-- 动态顶部菜单按钮 -->
          <button
            v-for="m in headerMenus"
            :key="m.id"
            class="top-menu-btn"
            @click="handleMenuNavigate(m.path || '#')"
          >{{ m.label }}</button>

          <!-- 提醒规则 -->
          <button class="top-menu-btn" @click="handleMenuNavigate('/rules')">提醒规则</button>

          <!-- 邮件中心入口 -->
          <button class="mail-btn" @click="goMail">
            <el-icon :size="18"><Message /></el-icon>
            <span class="mail-btn__text">邮件中心</span>
          </button>

          <!-- 通知铃铛 -->
          <NotificationBell />

          <!-- 用户信息下拉 -->
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-dropdown-trigger">
              <span class="user-avatar-sm">
                <el-icon :size="16"><UserFilled /></el-icon>
              </span>
              <span class="user-dropdown-name">{{ userName }}</span>
              <el-icon :size="14"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 主内容区 -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, markRaw, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { getMenuList } from '../api/menu'
import NotificationBell from '@/components/common/NotificationBell.vue'
import { useNotificationStore } from '@/stores/notification'
import SidebarMenu from '../components/SidebarMenu.vue'
import {
  Setting, User, Avatar, Document, DocumentChecked,
  FolderOpened, DocumentAdd, CirclePlus, Link,
  Edit, Warning, UserFilled, ArrowDown, Message,
  Collection, Grid, Stamp, Briefcase, DataAnalysis,
} from '@element-plus/icons-vue'

// ========== 图标映射表 ==========
const iconMap = {
  Setting, User, Avatar, Document, DocumentChecked,
  FolderOpened, DocumentAdd, CirclePlus, Link,
  Edit, Warning, Collection, Grid, Stamp, Briefcase, DataAnalysis,
}

const router = useRouter()
const route = useRoute()
const { state, logout, fetchUserInfo } = useUserStore()

const isCollapse = ref(false)
const isMobile = ref(false)
const fullMenus = ref([])
const sidebarWidth = ref(80)

// ========== 用户信息 ==========
const userName = computed(() => state.userInfo?.loginName || state.userInfo?.userName || '未登录')
const userDept = computed(() => state.userInfo?.deptName || state.userInfo?.dept || '')

// ========== 权限 ==========
const permissions = computed(() => state.permissions || [])
const hasPermission = (perm) => {
  if (!perm) return true
  return permissions.value.includes(perm)
}

// ========== 图标解析 ==========
const resolveIcon = (iconName) => {
  const component = iconMap[iconName]
  return component ? markRaw(component) : markRaw(Document)
}

// ========== 递归构建菜单树 ==========
const buildMenuTree = (list, parentId = 0) => {
  return list
    .filter(item => item.parentId === parentId && item.menuType !== 'F' && item.visible === '0')
    .sort((a, b) => (a.orderNum || 0) - (b.orderNum || 0))
    .map(item => {
      const menu = {
        id: item.menuId,
        label: item.menuName,
        icon: resolveIcon(item.icon),
        path: item.url || '',
        perm: item.perms || null,
        menuType: item.menuType,
        target: item.target || ''
      }
      const children = buildMenuTree(list, item.menuId)
      if (children.length) menu.children = children
      return menu
    })
}

// ========== 递归过滤权限（排除顶部按钮菜单） ==========
const visibleMenus = computed(() => {
  const filterByPermission = (menus) => {
    return menus
      .filter(menu => menu.target !== 'header')
      .map(menu => {
        if (menu.perm && !hasPermission(menu.perm)) return null
        if (menu.children) {
          const filtered = filterByPermission(menu.children)
          if (filtered.length === 0) return null
          return { ...menu, children: filtered }
        }
        return menu
      })
      .filter(Boolean)
  }
  return filterByPermission(fullMenus.value)
})

// ========== 当前激活路径 ==========
// ========== 顶部按钮：target='header' 的一级菜单 ==========
const headerMenus = computed(() => {
  return fullMenus.value.filter(m => m.target === 'header' && m.menuType !== 'F')
})

const activeMenu = computed(() => route.path)

// ========== 导航处理 ==========
const handleMenuNavigate = (path) => {
  if (path && path !== '#') {
    router.push(path)
  }
}

const goMail = () => router.push('/mail')

const handleCommand = async (cmd) => {
  if (cmd === 'logout') {
    notificationStore.closeWebSocket()   // 先断开连接
    await logout()
    router.push('/login')
  } else if (cmd === 'profile') {
    router.push('/profile')
  }
}

// ========== 响应式检测 ==========
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// ========== 菜单数据获取 ==========
const fetchMenus = async () => {
  try {
    const res = await getMenuList()
    fullMenus.value = buildMenuTree(res.data || [])
  } catch {
    fullMenus.value = []
  }
}

const notificationStore = useNotificationStore()

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  if (!state.userInfo) fetchUserInfo()
  fetchMenus()
  notificationStore.initWebSocket()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  notificationStore.closeWebSocket()
})

watch(() => state.menuVersion, () => {
  fetchMenus()
})
</script>

<style scoped>
/* ==================== 整体布局 ==================== */
.app-shell {
  height: 100vh;
  overflow: hidden;
}

/* ==================== 右侧主体区域 ==================== */
.main-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: margin-left 0.3s ease;
  margin-left: v-bind(sidebarWidth + 'px');
}

.main-area--mobile {
  margin-left: 0 !important;
}

/* ==================== 顶部导航栏 ==================== */
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
  z-index: 10;
}

.top-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* ==================== 折叠按钮 ==================== */
.collapse-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #595959;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #1890FF;
}

/* ==================== 顶部动态菜单按钮 ==================== */
.top-menu-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #fff;
  background: #409EFF;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.top-menu-btn:hover {
  background: #337ecc;
}

/* ==================== 邮件中心按钮 ==================== */
.mail-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #1890FF;
  background: rgba(24, 144, 255, 0.08);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.mail-btn:hover {
  background: rgba(24, 144, 255, 0.15);
}

.mail-btn__text {
  white-space: nowrap;
}

/* ==================== 用户下拉触发器 ==================== */
.user-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  user-select: none;
}

.user-dropdown-trigger:hover {
  background: rgba(0, 0, 0, 0.04);
}

.user-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #595959;
}

.user-dropdown-name {
  font-size: 13px;
  color: #333;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 主内容区 ==================== */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f0f2f5;
  padding: 20px;
}
</style>
