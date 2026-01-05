import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/auth',
            name: 'auth',
            component: () => import('../views/AuthView.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/',
            name: 'dashboard',
            component: () => import('../views/DashboardView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/history',
            name: 'history',
            component: () => import('../views/HistoryView.vue'),
            meta: { requiresAuth: true }
        }
    ]
})

router.beforeEach(async (to, _, next) => {
    const authStore = useAuthStore()

    if (authStore.loading) {
        await authStore.initialize()
    }

    const isAuthenticated = !!authStore.session

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/auth')
    } else if (to.meta.requiresGuest && isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router
