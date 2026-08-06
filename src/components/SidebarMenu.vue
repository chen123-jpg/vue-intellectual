<template>
  <!-- ==================== 移动端汉堡按钮 ==================== -->
  <div v-if="isMobile" class="hamburger-btn" @click="drawerOpen = true">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  </div>

  <!-- ==================== 移动端遮罩层 ==================== -->
  <teleport to="body">
    <div
      v-if="isMobile && drawerOpen"
      class="sidebar-overlay"
      @click="drawerOpen = false"
    ></div>
  </teleport>

  <!-- ==================== 侧边栏主体 ==================== -->
  <aside
    ref="sidebarRef"
    :class="[
      'sidebar',
      { 'sidebar--collapsed': isCollapse && !isMobile },
      { 'sidebar--drawer': isMobile },
      { 'sidebar--drawer-open': isMobile && drawerOpen }
    ]"
    :style="{ width: sidebarWidth + 'px' }"
  >
    <!-- 标题 -->
    <div class="sidebar__header">
      <span class="sidebar__title">知识产权<br>管理系统</span>
    </div>

    <!-- 分割线 -->
    <div class="sidebar__divider"></div>

    <!-- 二/三级菜单列表 -->
    <div class="sidebar__menu-scroll">
      <template v-for="l2 in menus" :key="l2.id">
        <!-- 二级菜单项 -->
        <div
          :class="[
            'l2-item',
            { 'l2-item--active': isL2Active(l2) },
            { 'l2-item--expanded': expandedL2Ids.has(l2.id) }
          ]"
          @click="handleL2Click(l2)"
        >
          <span class="l2-item__dot"></span>
          <span class="l2-item__label">{{ l2.label }}</span>
          <span v-if="hasChildren(l2)" class="l2-item__arrow">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </div>

        <!-- 三级菜单项 -->
        <div
          v-if="hasChildren(l2) && expandedL2Ids.has(l2.id)"
          class="l3-list"
        >
          <div
            v-for="l3 in l2.children"
            :key="l3.id"
            :class="['l3-item', { 'l3-item--active': isL3Active(l3) }]"
            @click="handleL3Click(l3)"
          >
            <span class="l3-item__dot"></span>
            <span class="l3-item__label">{{ l3.label }}</span>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-if="!menus.length" class="sidebar__empty">
        请选择顶部菜单
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  menus: { type: Array, default: () => [] },
  activePath: { type: String, default: '' },
  isCollapse: { type: Boolean, default: false },
  userName: { type: String, default: '' },
  userDept: { type: String, default: '' }
})

const emit = defineEmits(['navigate', 'toggle-collapse', 'width-change'])

// ========== 响应式状态 ==========
const isMobile = ref(false)
const drawerOpen = ref(false)
const expandedL2Ids = ref(new Set())
const sidebarRef = ref(null)

// ========== 面板宽度计算 ==========
const PANEL_WIDTH = 120
const PANEL_COLLAPSED = 56

const sidebarWidth = computed(() => {
  if (isMobile.value) return PANEL_WIDTH
  return props.isCollapse ? PANEL_COLLAPSED : PANEL_WIDTH
})

// ========== 工具方法 ==========
const hasChildren = (item) => item?.children && item.children.length > 0

const isL2Active = (l2) => {
  if (!props.activePath) return false
  if (l2.path && props.activePath === l2.path) return true
  if (l2.children) {
    return l2.children.some(l3 => l3.path && props.activePath === l3.path)
  }
  return false
}

// ========== L3 激活判断 ==========
const isL3Active = (l3) => {
  return props.activePath && l3.path && props.activePath === l3.path
}

// ========== 点击处理 ==========
const handleL2Click = (item) => {
  if (hasChildren(item)) {
    // 有三级：展开/折叠
    const newSet = new Set(expandedL2Ids.value)
    if (newSet.has(item.id)) {
      newSet.delete(item.id)
    } else {
      newSet.add(item.id)
    }
    expandedL2Ids.value = newSet
  } else {
    // 无三级：直接导航
    navigateTo(item)
  }
}

const handleL3Click = (item) => {
  navigateTo(item)
  if (isMobile.value) drawerOpen.value = false
}

const navigateTo = (item) => {
  if (item.path && item.path !== '#') {
    emit('navigate', item.path)
  }
}

// ========== 根据当前路径自动展开对应菜单 ==========
const syncActiveState = () => {
  if (!props.activePath || !props.menus.length) return

  for (const l2 of props.menus) {
    if (l2.path === props.activePath) {
      expandedL2Ids.value = new Set()
      return
    }
    if (l2.children) {
      for (const l3 of l2.children) {
        if (l3.path === props.activePath) {
          expandedL2Ids.value = new Set([l2.id])
          return
        }
      }
    }
  }
}

watch(() => props.activePath, syncActiveState, { immediate: true })
watch(() => props.menus, syncActiveState)

// ========== 通知父级宽度变化 ==========
watch(sidebarWidth, (w) => {
  emit('width-change', w)
}, { immediate: true })

// ========== 响应式检测 ==========
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) drawerOpen.value = false
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
/* ==================== 移动端汉堡按钮 ==================== */
.hamburger-btn {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1000;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #304156;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

/* ==================== 遮罩层 ==================== */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: rgba(0, 0, 0, 0.45);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ================================================================ */
/*  侧边栏（单面板白色背景）                                          */
/* ================================================================ */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  z-index: 999;
  transition: width 0.3s ease;
  overflow: hidden;
}

/* 移动端抽屉模式 */
.sidebar--drawer {
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  width: 80% !important;
  max-width: 280px;
}

.sidebar--drawer-open {
  transform: translateX(0);
}

/* 标题 */
.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  padding: 20px 12px;
}

.sidebar__title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  text-align: center;
  line-height: 1.4;
}

/* 分割线 */
.sidebar__divider {
  height: 1px;
  margin: 0 24px;
  background: rgba(0, 0, 0, 0.08);
}

/* 菜单滚动区 */
.sidebar__menu-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

.sidebar__menu-scroll::-webkit-scrollbar {
  width: 4px;
}

.sidebar__menu-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar__menu-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 2px;
}

.sidebar__empty {
  padding: 40px 24px;
  text-align: center;
  color: rgba(0, 0, 0, 0.35);
  font-size: 12px;
}

/* ================================================================ */
/*  二级菜单项                                                       */
/* ================================================================ */
.l2-item {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 2px 16px;
  cursor: pointer;
  user-select: none;
  color: rgba(0, 0, 0, 0.7);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  gap: 8px;
  position: relative;
}

.l2-item:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1a1a1a;
}

.l2-item--active {
  background: rgba(0, 0, 0, 0.09);
  color: #1a1a1a;
}

.l2-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #1890FF;
}

.l2-item__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.l2-item--active .l2-item__dot {
  background: #1890FF;
}

.l2-item__label {
  flex: 1;
  word-break: break-all;
  line-height: 1.2;
  font-size: 12px;
}

.l2-item__arrow {
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.l2-item--expanded .l2-item__arrow {
  transform: rotate(90deg);
}

/* ================================================================ */
/*  三级菜单项                                                       */
/* ================================================================ */
.l3-list {
  overflow: hidden;
}

.l3-item {
  display: flex;
  align-items: center;
  min-height: 30px;
  padding: 2px 16px 2px 28px;
  cursor: pointer;
  user-select: none;
  color: rgba(0, 0, 0, 0.6);
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
  gap: 8px;
  position: relative;
}

.l3-item:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a1a;
}

.l3-item--active {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1a1a;
}

.l3-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #1890FF;
}

.l3-item__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.l3-item--active .l3-item__dot {
  background: #1890FF;
}

.l3-item__label {
  flex: 1;
  word-break: break-all;
  line-height: 1.2;
  font-size: 11px;
}
</style>
