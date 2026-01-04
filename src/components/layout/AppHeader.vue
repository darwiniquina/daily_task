<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Zap, LogOut, Calendar, LayoutDashboard } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const handleLogout = async () => {
  await authStore.signOut()
  toast.success('Logged out successfully')
  router.push('/auth')
}
</script>

<template>
  <header class="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30">
    <div class="container mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <div class="bg-blue-600 p-1.5 rounded-lg">
            <Zap class="h-5 w-5 text-white" />
          </div>
          <h1 class="text-xl font-black tracking-tight text-gray-900">DayTracker</h1>
        </div>
        
        <nav class="hidden md:flex items-center gap-2">
          <Button 
            :variant="route.path === '/' ? 'secondary' : 'ghost'" 
            size="sm" 
            class="gap-2 rounded-xl"
            :class="route.path === '/' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : ''"
            @click="router.push('/')"
          >
            <LayoutDashboard class="h-4 w-4" />
            Dashboard
          </Button>
          <Button 
            :variant="route.path === '/history' ? 'secondary' : 'ghost'" 
            size="sm" 
            class="gap-2 rounded-xl"
            :class="route.path === '/history' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : ''"
            @click="router.push('/history')"
          >
            <Calendar class="h-4 w-4" />
            History
          </Button>
        </nav>
      </div>

      <div class="flex items-center gap-4">
        <div class="hidden md:flex flex-col items-end mr-2">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Authenticated</span>
          <span class="text-sm font-medium text-gray-700 leading-none">{{ authStore.user?.email }}</span>
        </div>
        <Button variant="ghost" size="icon" class="rounded-full hover:bg-gray-100" @click="handleLogout">
          <LogOut class="h-5 w-5 text-gray-500" />
        </Button>
      </div>
    </div>
  </header>
</template>
