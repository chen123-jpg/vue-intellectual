<template>
  <el-container class="layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo" @click="goHome">
        <span v-show="!isCollapse">知识产权管理系统</span>
        <span v-show="isCollapse">IP</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <template v-for="menu in visibleMenus" :key="menu.id">
          <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.id + ''">
            <template #title>
              <el-icon><component :is="menu.icon" /></el-icon>
              <span>{{ menu.label }}</span>
            </template>
            <el-menu-item
              v-for="child in menu.children"
              :key="child.id"
              :index="child.path"
            >
              <el-icon><component :is="child.icon" /></el-icon>
              <span>{{ child.label }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path">
            <el-icon><component :is="menu.icon" /></el-icon>
            <span>{{ menu.label }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse" :size="22">
            <Fold v-if="!isCollapse" /><Expand v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <span class="user-name">{{ userName }}</span>
          <el-dropdown @command="handleCommand">
            <span class="dropdown-trigger">
              <el-icon :size="20"><UserFilled /></el-icon>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, markRaw, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { getMenuList } from '../api/menu'
import {
  Setting, User, Avatar, Document, DocumentChecked,
  FolderOpened, DocumentAdd, CirclePlus, Link,
  Edit, Warning, Fold, Expand, UserFilled, ArrowDown
} from '@element-plus/icons-vue'

const iconMap = {
  Setting, User, Avatar, Document, DocumentChecked,
  FolderOpened, DocumentAdd, CirclePlus, Link,
  Edit, Warning
}

const router = useRouter()
const route = useRoute()
const { state, logout, fetchUserInfo } = useUserStore()

const isCollapse = ref(false)
const fullMenus = ref([])
const menuLoaded = ref(false)

const userName = computed(() => state.userInfo?.loginName || state.userInfo?.userName || '未登录')
const permissions = computed(() => state.permissions)

const hasPermission = (perm) => {
  if (!perm) return true
  return permissions.value.includes(perm)
}

const resolveIcon = (iconName) => {
  const component = iconMap[iconName]
  return component ? markRaw(component) : markRaw(Document)
}

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
        perm: item.perms || null
      }
      if (item.menuType === 'M') {
        const children = buildMenuTree(list, item.menuId)
        if (children.length) menu.children = children
      }
      return menu
    })
    .filter(item => item.menuType !== 'M' || item.children)
}

const visibleMenus = computed(() => {
  return fullMenus.value
    .map(menu => {
      if (!menu.children) {
        return hasPermission(menu.perm) ? menu : null
      }
      const visibleChildren = menu.children.filter(child => hasPermission(child.perm))
      if (visibleChildren.length === 0) return null
      return { ...menu, children: visibleChildren }
    })
    .filter(Boolean)
})

const activeMenu = computed(() => route.path)

const goHome = () => router.push('/home')

const handleCommand = async (cmd) => {
  if (cmd === 'logout') {
    await logout()
    router.push('/login')
  } else if (cmd === 'profile') {
    router.push('/profile')
  }
}

const fetchMenus = async () => {
  try {
    const res = await getMenuList()
    fullMenus.value = buildMenuTree(res.data || [])
  } catch {
    fullMenus.value = []
  } finally {
    menuLoaded.value = true
  }
}

onMounted(() => {
  if (!state.userInfo) fetchUserInfo()
  fetchMenus()
})

watch(() => state.menuVersion, () => {
  fetchMenus()
})
</script>

<style scoped>
.layout {
  height: 100vh;
}
.aside {
  background-color: #304156;
  overflow-y: auto;
  transition: width 0.3s;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.15);
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
}
.collapse-btn {
  cursor: pointer;
}
.collapse-btn:hover {
  color: #409eff;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-name {
  font-size: 14px;
  color: #333;
}
.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #666;
}
.dropdown-trigger:hover {
  color: #409eff;
}
.main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
