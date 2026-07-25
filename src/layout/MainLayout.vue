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
import { ref, computed, markRaw, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import {
  Setting, User, Avatar, Document, DocumentChecked,
  FolderOpened, DocumentAdd, CirclePlus, Link,
  Edit, Warning, Fold, Expand, UserFilled, ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const { state, logout, fetchUserInfo } = useUserStore()

const isCollapse = ref(false)

const userName = computed(() => state.userInfo?.loginName || state.userInfo?.userName || '未登录')
const permissions = computed(() => state.permissions)

const hasPermission = (perm) => permissions.value.includes(perm)

const fullMenus = [
  {
    id: 1, label: '系统管理', icon: markRaw(Setting), perm: null,
    children: [
      { id: 11, label: '用户管理', icon: markRaw(User), path: '/system/user', perm: 'system:user:list' },
      { id: 12, label: '用户角色管理', icon: markRaw(Avatar), path: '/system/user-role', perm: 'system:userRole:list' }
    ]
  },
  {
    id: 2, label: '专利交底管理', icon: markRaw(Document), perm: null,
    children: [
      { id: 21, label: '专利交底', icon: markRaw(DocumentChecked), path: '/patent/disclosure', perm: 'patent:disclosure:list' }
    ]
  },
  {
    id: 3, label: '专利业务管理', icon: markRaw(FolderOpened), perm: null,
    children: [
      { id: 31, label: '新申请', icon: markRaw(DocumentAdd), path: '/patent/new-application', perm: 'patent:newApplication:list' },
      { id: 32, label: '补漏', icon: markRaw(CirclePlus), path: '/patent/supplementary', perm: 'patent:supplementary:list' },
      { id: 33, label: 'PCT', icon: markRaw(Link), path: '/patent/pct', perm: 'patent:pct:list' },
      { id: 34, label: '中间著变', icon: markRaw(Edit), path: '/patent/intermediate-change', perm: 'patent:intermediateChange:list' },
      { id: 35, label: '复审无效', icon: markRaw(Warning), path: '/patent/reexamination', perm: 'patent:reexamination:list' }
    ]
  }
]

const visibleMenus = computed(() => {
  return fullMenus
    .map(menu => {
      if (!menu.children) return menu
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
  } else if (cmd === 'password') {
    router.push('/profile?tab=password')
  }
}

onMounted(() => {
  if (!state.userInfo) fetchUserInfo()
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
