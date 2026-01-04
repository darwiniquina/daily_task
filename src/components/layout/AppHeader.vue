<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGamificationStore } from '@/stores/gamification'
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Zap, LogOut, Calendar, LayoutDashboard, Flame } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Progress } from '@/components/ui/progress'

const authStore = useAuthStore()
const gamificationStore = useGamificationStore()
const router = useRouter()
const route = useRoute()

onMounted(async () => {
  if (authStore.user) {
    await gamificationStore.fetchProfile()
    await gamificationStore.updateStreak()
  }
})

const handleLogout = async () => {
  await authStore.signOut()
  toast.success('Logged out successfully')
  router.push('/auth')
}
</script>

<template>
  <header class="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30">
    <div class="container mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center gap-8">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <div class="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
            <Zap class="h-5 w-5 text-white" />
          </div>
          <h1 class="text-xl font-black tracking-tight text-gray-900">Tasko</h1>
        </div>
        
        <nav class="hidden md:flex items-center gap-2">
          <Button 
            :variant="route.path === '/' ? 'secondary' : 'ghost'" 
            size="sm" 
            class="gap-2 rounded-xl h-9 px-4"
            :class="route.path === '/' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : ''"
            @click="router.push('/')"
          >
            <LayoutDashboard class="h-4 w-4" />
            Dashboard
          </Button>
          <Button 
            :variant="route.path === '/history' ? 'secondary' : 'ghost'" 
            size="sm" 
            class="gap-2 rounded-xl h-9 px-4"
            :class="route.path === '/history' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : ''"
            @click="router.push('/history')"
          >
            <Calendar class="h-4 w-4" />
            History
          </Button>
        </nav>
      </div>

      <div class="flex items-center gap-6">
        <!-- Gamification Stats -->
        <div v-if="gamificationStore.profile" class="hidden sm:flex items-center gap-4">
          <!-- Streak -->
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 transition-all hover:scale-105">
            <Flame class="h-4 w-4 fill-orange-500" />
            <span class="text-xs font-black">{{ gamificationStore.profile.streak_count }}</span>
          </div>

          <!-- Level & XP -->
          <div class="flex flex-col gap-1 w-32 md:w-44">
            <div class="flex justify-between items-end">
              <span class="text-[10px] font-black uppercase tracking-widest text-blue-600">Level {{ gamificationStore.profile.level }}</span>
              <span class="text-[9px] font-bold text-gray-400">{{ Math.floor(gamificationStore.profile.xp) }} / {{ gamificationStore.xpToNextLevel }} XP</span>
            </div>
            <Progress :value="gamificationStore.progressToNextLevel" class="h-1.5 bg-blue-100" />
          </div>
        </div>

        <div class="flex items-center gap-3 pl-4 border-l border-gray-100">
          <div class="hidden lg:flex flex-col items-end">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Authenticated</span>
            <span class="text-xs font-medium text-gray-700 leading-none max-w-[120px] truncate">{{ authStore.user?.email }}</span>
          </div>
          <Button variant="ghost" size="icon" class="rounded-full hover:bg-gray-100 h-10 w-10 transition-colors" @click="handleLogout">
            <LogOut class="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </div>
    </div>
  </header>
</template>
