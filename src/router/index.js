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
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'system/user',
        name: 'UserList',
        component: () => import('../views/system/UserList.vue'),
        meta: { permission: 'system:user:list' }
      },
      {
        path: 'system/user-role',
        name: 'UserRole',
        component: () => import('../views/system/UserRole.vue'),
        meta: { permission: 'system:userRole:list' }
      },
      {
        path: 'patent/disclosure',
        name: 'Disclosure',
        component: () => import('../views/patent/DisclosureWorkflow.vue'),
        meta: { permission: 'patent:disclosure:list' }
      },
      {
        path: 'patent/disclosure/add',
        name: 'DisclosureAdd',
        component: () => import('../views/patent/disclosure/AddDisclosure.vue'),
        meta: { permission: ['patent:disclosure:add', 'patent:disclosure:copy'] }
      },
      {
        path: 'patent/new-application',
        name: 'NewApplication',
        component: () => import('../views/patent/NewApplication.vue'),
        meta: { permission: 'patent:newApplication:list' }
      },
      {
        path: 'patent/supplementary',
        name: 'Supplementary',
        component: () => import('../views/patent/Supplementary.vue'),
        meta: { permission: 'patent:supplementary:list' }
      },
      {
        path: 'patent/pct',
        name: 'Pct',
        component: () => import('../views/patent/Pct.vue'),
        meta: { permission: 'patent:pct:list' }
      },
      {
        path: 'patent/intermediate-change',
        name: 'IntermediateChange',
        component: () => import('../views/patent/IntermediateChange.vue'),
        meta: { permission: 'patent:intermediateChange:list' }
      },
      {
        path: 'patent/reexamination',
        name: 'Reexamination',
        component: () => import('../views/patent/Reexamination.vue'),
        meta: { permission: 'patent:reexamination:list' }
      },
      {
        path: 'patent/agent',
        name: 'Agent',
        component: () => import('../views/patent/Agent.vue'),
        meta: { permission: 'patent:agent:list' }
      },
      {
        path: 'patent/applicant',
        name: 'Applicant',
        component: () => import('../views/patent/Applicant.vue'),
        meta: { permission: 'patent:applicant:list' }
      },
      {
        path: 'patent/application-package',
        name: 'ApplicationPackage',
        component: () => import('../views/patent/ApplicationPackage.vue'),
        meta: { permission: 'patent:applicationPackage:list' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      },
      {
        path: 'sys-role',
        name: 'Role',
        component: () => import('../views/system/Role.vue'),
        meta: { permission: 'system:role:list' }
      },
      {
        path: 'sys-menu',
        name: 'Menu',
        component: () => import('../views/system/Menu.vue'),
        meta: { permission: 'system:menu:list' }
      },
      {
        path: 'sys-role-menu',
        name: 'RoleMenu',
        component: () => import('../views/system/RoleMenu.vue'),
        meta: { permission: 'system:roleMenu:list' }
      },
      {
        path: 'api/mail-template',
        name: 'MailTemplate',
        component: () => import('../views/system/MailTemplate.vue'),
        meta: { permission: 'system:mailTemplate:list' }
      },
      {
        path: 'system/dictionary',
        name: 'DataDictionary',
        component: () => import('../views/system/DataDictionary.vue'),
        meta: { permission: 'system:dictionary:list' }
      },
      {
        path: 'performance',
        name: 'Performance',
        component: () => import('../views/Performance.vue')
      },
      {
        path: 'mail',
        name: 'Mail',
        component: () => import('../views/mail/Mail.vue')
      },
      {
        path: 'mail-records',
        name: 'MailRecords',
        component: () => import('../views/mail/MailRecords.vue')
      },
      {
        path: 'rules',
        name: 'ReminderRules',
        component: () => import('../views/ReminderRules.vue')
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('../views/Notifications.vue')
      },
      {
        path: 'system/dict/position',
        name: 'PositionDictionary',
        component: () => import('../views/system/PositionDictionary.vue')
      },
      {
        path: 'system/dict/employee',
        name: 'EmployeeDictionary',
        component: () => import('../views/system/EmployeeDictionary.vue')
      },
      {
        path: 'permission/data/org',
        name: 'OrganizationDictionary',
        component: () => import('../views/system/OrganizationDictionary.vue')
      },
      {
        path: 'permission/data/customer',
        name: 'CustomerDictionary',
        component: () => import('../views/system/CustomerDictionary.vue')
      },
      {
        path: 'permission/data/config',
        name: 'ScopeDictionary',
        component: () => import('../views/system/ScopeDictionary.vue')
      },
      {
        path: ':pathMatch(.*)*',
        name: 'Placeholder',
        component: () => import('../views/Placeholder.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.matched.some(r => r.meta.requiresAuth) && !token) {
    next('/login')
    return
  }

  if (to.meta.permission) {
    const permStr = localStorage.getItem('permissions')
    const permissionList = permStr ? JSON.parse(permStr) : []
    const required = Array.isArray(to.meta.permission) ? to.meta.permission : [to.meta.permission]
    if (!required.some(p => permissionList.includes(p))) {
      next('/home')
      return
    }
  }

  next()
})

export default router
