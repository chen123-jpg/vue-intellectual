<template>
  <div class="app-shell">
    <!-- ==================== 顶部一级导航栏（全宽，横跨侧边栏和主内容） ==================== -->
    <header class="top-header">
      <!-- 左侧：系统名（宽度和侧边栏对齐，文字和二级菜单对齐） -->
      <div class="top-header__brand">
        <span class="brand-dot"></span>
        <span class="brand-text">知识产权<br>管理系统</span>
      </div>

      <!-- 中间：一级菜单 -->
      <nav class="top-header__nav">
        <button
          v-for="m in headerMenus"
          :key="m.id"
          :class="['top-l1-btn', { 'top-l1-btn--active': activeL1?.id === m.id }]"
          @click="handleL1Click(m)"
        >
          <span class="l1-btn-icon">
            <component :is="m.icon" />
          </span>
          <span class="l1-btn-label">{{ m.label }}</span>
        </button>
      </nav>

      <!-- 右侧：通知 + 用户 -->
      <div class="top-header__right">
        <NotificationBell />
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
              <el-dropdown-item command="reminder">提醒规则</el-dropdown-item>
              <el-dropdown-item command="mailCenter">邮件中心</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- ==================== 下方区域：侧边栏 + 主体 ==================== -->
    <div class="body-area">
      <SidebarMenu
        :menus="visibleMenus"
        :active-path="activeMenu"
        :is-collapse="isCollapse"
        :user-name="userName"
        :user-dept="userDept"
        :current-l1-label="activeL1?.label || ''"
        @navigate="handleMenuNavigate"
        @toggle-collapse="isCollapse = !isCollapse"
        @width-change="sidebarWidth = $event"
      />

      <div :class="['main-area', { 'main-area--mobile': isMobile }]">
        <!-- 标签栏 -->
        <div class="tab-bar" v-if="tabs.length">
          <div
            v-for="tab in tabs"
            :key="tab.path"
            :class="['tab-item', { 'tab-item--active': route.path === tab.path }]"
            @click="switchTab(tab)"
          >
            <span class="tab-item__label">{{ tab.label }}</span>
            <span class="tab-item__close" @click.stop="closeTab(tab)">×</span>
          </div>
        </div>

        <main class="main-content">
          <router-view />
        </main>
      </div>
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
  Edit, Warning, UserFilled, ArrowDown,
  Collection, Grid, Stamp, Briefcase, DataAnalysis,
  OfficeBuilding, Notebook, DocumentCopy, AlarmClock,
  Folder, TrendCharts, Lock, Money, Ticket,
  Menu,
} from '@element-plus/icons-vue'

// ========== 图标映射表 ==========
const iconMap = {
  Setting, User, Avatar, Document, DocumentChecked,
  FolderOpened, DocumentAdd, CirclePlus, Link,
  Edit, Warning, Collection, Grid, Stamp, Briefcase, DataAnalysis,
  OfficeBuilding, Notebook, DocumentCopy, AlarmClock,
  Folder, TrendCharts, Lock, Money, Ticket,
  Menu,
}

const router = useRouter()
const route = useRoute()
const { state, logout, fetchUserInfo } = useUserStore()

const isCollapse = ref(false)
const isMobile = ref(false)
const fullMenus = ref([])
const sidebarWidth = ref(120)
const brandWidth = computed(() => sidebarWidth.value + 'px')

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
    .filter(item => (item.parentId || 0) === parentId && item.menuType !== 'F' && item.visible === '0')
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

// ========== 侧边栏菜单：当前选中 L1 的子菜单 ==========
const visibleMenus = computed(() => {
  if (!activeL1.value) return []
  const children = activeL1.value.children || []
  const filterByPermission = (menus) => {
    return menus
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
  return filterByPermission(children)
})

// ========== 当前激活路径 ==========
// ========== 一级菜单（全部 L1，从侧边栏移到顶部） ==========
const activeL1 = ref(null)
const headerMenus = computed(() => {
  return fullMenus.value.filter(m => m.menuType !== 'F' && !m.perm)
})

const activeMenu = computed(() => route.path)

// ========== 根据当前路径同步 activeL1 ==========
const syncActiveL1 = () => {
  const path = route.path
  if (!path || !fullMenus.value.length) return
  for (const l1 of fullMenus.value) {
    if (l1.menuType === 'F' || l1.perm) continue
    if (l1.path === path) { activeL1.value = l1; return }
    if (l1.children) {
      for (const l2 of l1.children) {
        if (l2.path === path) { activeL1.value = l1; return }
        if (l2.children) {
          if (l2.children.some(l3 => l3.path === path)) { activeL1.value = l1; return }
        }
      }
    }
  }
}

watch(() => route.path, syncActiveL1)
watch(fullMenus, () => { syncActiveL1() })

// ========== 标签页管理 ==========
const tabs = ref([])

const findMenuLabel = (path) => {
  const find = (items) => {
    for (const item of items) {
      if (item.path === path) return item.label
      if (item.children) {
        const found = find(item.children)
        if (found) return found
      }
    }
    return null
  }
  return find(fullMenus.value) || path
}

const addTab = (path) => {
  if (!path || path === '#') return
  if (!tabs.value.find(t => t.path === path)) {
    tabs.value.push({ path, label: findMenuLabel(path) })
  }
}

const switchTab = (tab) => {
  router.push(tab.path)
}

const closeTab = (tab) => {
  const idx = tabs.value.findIndex(t => t.path === tab.path)
  if (idx === -1) return
  tabs.value.splice(idx, 1)
  // 如果关闭的是当前页，切换到相邻标签
  if (route.path === tab.path && tabs.value.length) {
    const next = tabs.value[Math.min(idx, tabs.value.length - 1)]
    router.push(next.path)
  }
}

// ========== 导航处理 ==========
const handleMenuNavigate = (path) => {
  if (path && path !== '#') {
    addTab(path)
    router.push(path)
  }
}

// ========== 一级菜单点击 ==========
const handleL1Click = (item) => {
  if (activeL1.value?.id === item.id) {
    activeL1.value = null
  } else {
    activeL1.value = item
  }
}

const handleCommand = async (cmd) => {
  if (cmd === 'logout') {
    notificationStore.closeWebSocket()   // 先断开连接
    await logout()
    router.push('/login')
  } else if (cmd === 'profile') {
    router.push('/profile')
  } else if (cmd === 'reminder') {
    router.push('/rules')
  } else if (cmd === 'mailCenter') {
    router.push('/mail')
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
    console.log('菜单树加载完成:', fullMenus.value.length, '个一级菜单', fullMenus.value)
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
  display: flex;
  flex-direction: column;
}

/* ==================== 下方区域（侧边栏 + 主体）==================== */
.body-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ==================== 主体区域 ==================== */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.main-area--mobile {
  margin-left: 0 !important;
}

/* ==================== 顶部导航栏（全宽，横跨整个视口）==================== */
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 16px 0 0;
  background: linear-gradient(135deg, #0a1628 0%, #132036 40%, #1a2f4a 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  z-index: 1000;
  position: relative;
  overflow: visible;
}


/* ==================== 品牌区（宽度和侧边栏对齐，文字和二级菜单对齐）==================== */
.top-header__brand {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: v-bind(brandWidth);
  flex-shrink: 0;
  box-sizing: border-box;
  padding-left: 22px;
}

.brand-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #42a5f5;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(66, 165, 245, 0.6);
}

.brand-text {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1.5px;
  line-height: 1.3;
  text-align: left;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

/* ==================== 一级菜单导航区（右区，按钮居中）==================== */
.top-header__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow: visible;
}

/* ==================== 右侧区 ==================== */
.top-header__right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

/* ==================== 一级菜单按钮 ==================== */
.top-l1-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 3px 0;
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  background: transparent;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  flex-shrink: 0;
}

.l1-btn-icon {
  display: flex;
  align-items: center;
  font-size: 20px;
  opacity: 0.75;
  transition: all 0.25s;
}

.top-l1-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.top-l1-btn:hover .l1-btn-icon {
  opacity: 1;
  color: #64b5f6;
}

.top-l1-btn--active {
  color: #fff;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.5) 0%, rgba(30, 136, 229, 0.35) 100%);
  box-shadow:
    0 0 20px rgba(30, 136, 229, 0.35),
    inset 0 0 0 1px rgba(100, 181, 246, 0.4);
  position: relative;
}

/* 向下小三角，指向侧边栏 */
.top-l1-btn--active::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(30, 136, 229, 0.6);
  z-index: 1001;
}

.top-l1-btn--active .l1-btn-icon {
  opacity: 1;
  color: #64b5f6;
  filter: drop-shadow(0 0 4px rgba(100, 181, 246, 0.6));
}

.l1-btn-label {
  line-height: 1;
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
  color: #fff;
}

.user-dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.08);
}

.user-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.user-dropdown-name {
  font-size: 13px;
  color: #fff;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 标签栏 ==================== */
.tab-bar {
  display: flex;
  align-items: flex-end;
  height: 33px;
  padding: 0 8px;
  background: #f0f2f5;
  flex-shrink: 0;
  overflow-x: auto;
  gap: 2px;
}

.tab-bar::-webkit-scrollbar {
  height: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px 5px;
  font-size: 12px;
  color: #999;
  background: transparent;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: all 0.15s;
}

.tab-item:hover {
  color: #666;
  background: rgba(0,0,0,0.04);
}

.tab-item--active {
  color: #1a1a1a;
  background: #fff;
  font-weight: 600;
}

/* ==================== 主内容区 ==================== */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: #fff;
  padding: 16px 20px 20px;
}

.tab-item__label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-item__close {
  font-size: 13px;
  line-height: 1;
  color: #bbb;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.tab-item--active .tab-item__close {
  color: #999;
}

.tab-item__close:hover {
  color: #fff;
  background: #d0d0d0;
}

/* ==================== 主内容区 ==================== */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: #eef1f5;
  padding: 20px;
}
</style>
