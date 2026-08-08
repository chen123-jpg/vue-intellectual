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
    <!-- 当前一级菜单名 -->
    <div class="sidebar__header">
      <span class="sidebar__header-text">{{ currentL1Label }}</span>
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
  currentL1Label: { type: String, default: '' },
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
  background: linear-gradient(135deg, #1a2332, #304156);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* ==================== 遮罩层 ==================== */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ================================================================ */
/*  侧边栏                                                        */
/* ================================================================ */
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
  border-right: 1px solid #e8ecf1;
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.04);
  z-index: 99;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;
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

/* ================================================================ */
/*  标题（和顶部一级菜单同色系，产生视觉关联）                      */
/* ================================================================ */
.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 14px 12px;
  background: linear-gradient(180deg, #e8f0fe 0%, #fafbfc 100%);
  border-bottom: 1px solid #dce8f5;
  position: relative;
}

.sidebar__header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #1e88e5;
  border-radius: 0 2px 2px 0;
}

.sidebar__header-text {
  font-size: 14px;
  font-weight: 700;
  color: #1565c0;
  text-align: center;
  line-height: 1.2;
  letter-spacing: 0.5px;
}

/* ================================================================ */
/*  分割线                                                         */
/* ================================================================ */
.sidebar__divider {
  height: 1px;
  margin: 0 20px;
  background: linear-gradient(90deg, transparent, #dde3ea 20%, #dde3ea 80%, transparent);
}

/* ================================================================ */
/*  菜单滚动区                                                      */
/* ================================================================ */
.sidebar__menu-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 8px;
}

.sidebar__menu-scroll::-webkit-scrollbar {
  width: 4px;
}

.sidebar__menu-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar__menu-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.sidebar__empty {
  padding: 40px 24px;
  text-align: center;
  color: rgba(0, 0, 0, 0.3);
  font-size: 12px;
}

/* ================================================================ */
/*  二级菜单项                                                      */
/* ================================================================ */
.l2-item {
  display: flex;
  align-items: center;
  min-height: 36px;
  margin: 2px 4px;
  padding: 6px 12px 6px 10px;
  cursor: pointer;
  user-select: none;
  color: #455a64;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 8px;
  position: relative;
  border-radius: 8px;
}

.l2-item:hover {
  background: #eef2f7;
  color: #1a2332;
}

.l2-item--active {
  background: linear-gradient(135deg, #e8f0fe 0%, #e3ecf7 100%);
  color: #1565c0;
  box-shadow: inset 0 0 0 1px rgba(21, 101, 192, 0.12);
}

.l2-item--active .l2-item__dot {
  background: #1e88e5;
  box-shadow: 0 0 6px rgba(30, 136, 229, 0.4);
  width: 6px;
  height: 6px;
}

.l2-item__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #b0bec5;
  flex-shrink: 0;
  transition: all 0.22s ease;
}

.l2-item__label {
  flex: 1;
  word-break: break-all;
  line-height: 1.3;
  font-size: 13px;
}

.l2-item__arrow {
  display: flex;
  align-items: center;
  color: #90a4ae;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.l2-item--expanded .l2-item__arrow {
  transform: rotate(90deg);
}

/* ================================================================ */
/*  三级菜单项                                                      */
/* ================================================================ */
.l3-list {
  overflow: hidden;
  padding: 2px 0;
}

.l3-item {
  display: flex;
  align-items: center;
  min-height: 32px;
  margin: 1px 4px 1px 8px;
  padding: 4px 12px 4px 20px;
  cursor: pointer;
  user-select: none;
  color: #607d8b;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 8px;
  position: relative;
  border-radius: 6px;
}

.l3-item::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #cfd8dc;
  transition: all 0.2s ease;
}

.l3-item:hover {
  background: #eef2f7;
  color: #37474f;
}

.l3-item:hover::before {
  background: #90a4ae;
}

.l3-item--active {
  background: #e8f0fe;
  color: #1565c0;
  font-weight: 600;
}

.l3-item--active::before {
  background: #1e88e5;
  box-shadow: 0 0 4px rgba(30, 136, 229, 0.4);
  width: 6px;
  height: 6px;
}

.l3-item__dot {
  display: none;
}

.l3-item__label {
  flex: 1;
  word-break: break-all;
  line-height: 1.3;
  font-size: 12px;
}
</style>
