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
    <!-- ========== 左面板：一级菜单 (#304156) ========== -->
    <div class="panel-left" :style="{ width: panelLeftWidth + 'px' }">
      <!-- 用户信息区域（留空） -->
      <div class="panel-left__user"></div>

      <!-- 分割线 -->
      <div class="panel-left__divider"></div>

      <!-- 一级菜单列表 -->
      <div class="panel-left__menu-scroll">
        <div
          v-for="item in menus"
          :key="item.id"
          :class="[
            'l1-item',
            { 'l1-item--active': isL1Active(item) },
            { 'l1-item--selected': selectedL1?.id === item.id }
          ]"
          @click="handleL1Click(item)"
        >
          <span class="l1-item__icon">
            <component :is="item.icon" />
          </span>
          <span v-show="!isCollapse || isMobile" class="l1-item__label">{{ item.label }}</span>
        </div>
      </div>

    </div>

    <!-- ========== 右面板：二/三级菜单 (#ACB3BB) ========== -->
    <div
      v-if="showRightPanel && (!isCollapse || isMobile)"
      class="panel-right"
    >
      <!-- 右面板标题 -->
      <div class="panel-right__header">
        <span class="panel-right__title">知识产权管理系统</span>
      </div>

      <!-- 分割线 -->
      <div class="panel-right__divider"></div>

      <!-- 二/三级菜单列表 -->
      <div class="panel-right__menu-scroll">
        <template v-for="l2 in selectedL1?.children || []" :key="l2.id">
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

        <!-- 空状态：未选中或选中项无子菜单 -->
        <div v-if="!selectedL1" class="panel-right__empty">
          请选择左侧菜单
        </div>
        <div v-else-if="!selectedL1.children?.length" class="panel-right__empty">
          暂无子菜单
        </div>
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
const selectedL1 = ref(null)
const expandedL2Ids = ref(new Set())
const sidebarRef = ref(null)

// ========== 面板宽度计算 ==========
const PANEL_WIDTH = 160
const PANEL_LEFT_WIDTH = 72
const PANEL_COLLAPSED = 56

const panelLeftWidth = computed(() => {
  if (isMobile.value) return PANEL_WIDTH
  return props.isCollapse ? PANEL_COLLAPSED : PANEL_LEFT_WIDTH
})

const sidebarWidth = computed(() => {
  if (isMobile.value) return PANEL_WIDTH // 移动端由 CSS width:80% 控制，这里做 fallback
  let w = panelLeftWidth.value
  if (showRightPanel.value && !props.isCollapse) w += PANEL_WIDTH
  return w
})

const showRightPanel = computed(() => {
  return !props.isCollapse || isMobile.value
})

// ========== 工具方法 ==========
const hasChildren = (item) => item?.children && item.children.length > 0

const findMenuInTree = (items, predicate) => {
  for (const item of items) {
    if (predicate(item)) return item
    if (item.children) {
      const found = findMenuInTree(item.children, predicate)
      if (found) return found
    }
  }
  return null
}

// ========== L1 激活判断：当前路径是否属于该 L1 子树 ==========
const isL1Active = (l1) => {
  if (!props.activePath) return false
  if (l1.path && props.activePath === l1.path) return true
  if (l1.children) {
    return !!findMenuInTree(l1.children, c => c.path && props.activePath === c.path)
  }
  return false
}

// ========== L2 激活判断 ==========
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
const handleL1Click = (item) => {
  if (hasChildren(item)) {
    // 有子菜单：切换选中（右面板切换内容）
    if (selectedL1.value?.id === item.id) {
      // 再次点击同一项：取消选中，右面板留空
      selectedL1.value = null
      expandedL2Ids.value = new Set()
    } else {
      selectedL1.value = item
      expandedL2Ids.value = new Set()
    }
  } else {
    // 无子菜单：直接导航，右面板留空
    selectedL1.value = null
    expandedL2Ids.value = new Set()
    navigateTo(item)
  }
}

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

  for (const l1 of props.menus) {
    if (l1.path === props.activePath) {
      // 命中 L1 叶子节点
      selectedL1.value = null
      expandedL2Ids.value = new Set()
      return
    }
    if (l1.children) {
      for (const l2 of l1.children) {
        if (l2.path === props.activePath) {
          // 命中 L2 节点
          selectedL1.value = l1
          expandedL2Ids.value = new Set()
          return
        }
        if (l2.children) {
          for (const l3 of l2.children) {
            if (l3.path === props.activePath) {
              // 命中 L3 节点
              selectedL1.value = l1
              expandedL2Ids.value = new Set([l2.id])
              return
            }
          }
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

/* ==================== 侧边栏主体 ==================== */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
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

/* ================================================================ */
/*  左面板：#304156                                                   */
/* ================================================================ */
.panel-left {
  display: flex;
  flex-direction: column;
  background: #304156;
  height: 100%;
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.3s ease;
}

/* 用户信息 */
.panel-left__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  min-height: 60px;
}

.sidebar--collapsed .panel-left__user {
  justify-content: center;
  padding: 20px 0;
}

.panel-left__user-text {
  overflow: hidden;
  min-width: 0;
}

.panel-left__user-name {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-left__user-dept {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 分割线 */
.panel-left__divider {
  height: 1px;
  margin: 0 24px;
  background: rgba(255, 255, 255, 0.1);
}

.sidebar--collapsed .panel-left__divider {
  margin: 0 12px;
}

/* 一级菜单滚动区 */
.panel-left__menu-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

.panel-left__menu-scroll::-webkit-scrollbar {
  width: 4px;
}

.panel-left__menu-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.panel-left__menu-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}

/* 底部折叠按钮 */
.panel-left__collapse {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.45);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  transition: color 0.2s;
  flex-shrink: 0;
}

.panel-left__collapse:hover {
  color: rgba(255, 255, 255, 0.85);
}

/* ================================================================ */
/*  一级菜单项（正方形卡片）                                           */
/* ================================================================ */
.l1-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  margin: 5px auto;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.2s ease;
  position: relative;
  gap: 6px;
  background: #435B77;
}

.l1-item:hover {
  background: #4E6A8A;
  color: #fff;
}

.l1-item--active {
  color: #fff;
  background: #435B77;
}

.l1-item--selected {
  color: #fff;
  background: #435B77;
  border-left: 2px solid #409EFF;
}

.l1-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  width: 18px;
  height: 18px;
}

.l1-item__label {
  font-size: 11px;
  text-align: center;
  line-height: 1.2;
  max-width: 64px;
  word-break: keep-all;
}

/* 折叠态 */
.sidebar--collapsed .l1-item {
  width: 44px;
  height: 44px;
  margin: 4px auto;
  gap: 0;
}

.sidebar--collapsed .l1-item__label {
  display: none;
}

/* ================================================================ */
/*  右面板：#ACB3BB                                                   */
/* ================================================================ */
.panel-right {
  width: 160px;
  height: 100%;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.panel-right__header {
  display: flex;
  align-items: center;
  min-height: 60px;
  padding: 20px 24px;
}

.panel-right__title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-right__divider {
  height: 1px;
  margin: 0 24px;
  background: rgba(0, 0, 0, 0.08);
}

.panel-right__menu-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

.panel-right__menu-scroll::-webkit-scrollbar {
  width: 4px;
}

.panel-right__menu-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.panel-right__menu-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 2px;
}

.panel-right__empty {
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
  height: 40px;
  padding: 0 24px 0 32px;
  cursor: pointer;
  user-select: none;
  color: rgba(0, 0, 0, 0.7);
  font-size: 13px;
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
  font-weight: 500;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  height: 36px;
  padding: 0 24px 0 44px;
  cursor: pointer;
  user-select: none;
  color: rgba(0, 0, 0, 0.6);
  font-size: 12px;
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
  font-weight: 500;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ================================================================ */
/*  移动端：右面板在抽屉内也需要显示                                    */
/* ================================================================ */
.sidebar--drawer .panel-right {
  width: 50%;
  min-width: 120px;
}
</style>
