import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue')
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/system/user',
        name: 'UserList',
        component: () => import('../views/system/UserList.vue'),
        meta: {
            requiresAuth: true,
            permission: 'system:user:list'
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')

    if (to.meta.requiresAuth && !token) {
        next('/login')
        return
    }

    if (to.meta.permission) {
        const permStr = localStorage.getItem('permissions')
        let permissionList = []
        if (permStr) {
            permissionList = JSON.parse(permStr)
        }
        if (!permissionList.includes(to.meta.permission)) {
            // 删除 window.$message，防止报错！守卫内不要弹窗
            console.log('权限不足，禁止访问页面：', to.path)
            next('/home')
            return
        }
    }

    next()
})

export default router