<template>
  <!-- 有子节点：SubMenu -->
  <el-sub-menu v-if="hasChildren" :index="String(menu.id)">
    <template #title>
      <el-icon><component :is="menu.icon" /></el-icon>
      <span>{{ menu.label }}</span>
    </template>
    <RecursiveMenuItem
      v-for="child in menu.children"
      :key="child.id"
      :menu="child"
    />
  </el-sub-menu>

  <!-- 叶子节点 / 空目录 -->
  <el-menu-item v-else :index="String(menu.id)" @click="navigate">
    <el-icon><component :is="menu.icon" /></el-icon>
    <span>{{ menu.label }}</span>
  </el-menu-item>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  menu: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const hasChildren = computed(() => props.menu.children && props.menu.children.length > 0)

const navigate = () => {
  const path = props.menu.path
  if (path && path !== '#') {
    router.push(path)
  }
}
</script>
