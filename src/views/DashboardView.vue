<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/tasks'
import { useTimerStore } from '@/stores/timer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import TaskItem from '@/components/tasks/TaskItem.vue'
import AddTask from '@/components/tasks/AddTask.vue'
import FocusModal from '@/components/tasks/FocusModal.vue'
import TodayFocusWidget from '@/components/dashboard/TodayFocusWidget.vue'
import TaskProgressWidget from '@/components/dashboard/TaskProgressWidget.vue'
import ProTipWidget from '@/components/dashboard/ProTipWidget.vue'
import type { Task } from '@/types'
import { formatTimerDisplay } from '@/utils/formatters'
import { Search, Zap, LogOut } from 'lucide-vue-next'

const authStore = useAuthStore()
const taskStore = useTaskStore()
const timerStore = useTimerStore()
const router = useRouter()

const showFocusModal = ref(false)

onMounted(async () => {
  await Promise.all([
    taskStore.fetchTasks(),
    timerStore.fetchActiveTimer()
  ])
})

// Auto-open modal when a new timer starts
watch(() => timerStore.activeTimer, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    showFocusModal.value = true
  }
})

const handleLogout = async () => {
  await authStore.signOut()
  toast.success('Logged out successfully')
  router.push('/auth')
}

const startTimer = async (task: Task) => {
  await timerStore.startTimer(task.id)
}

const stopTimer = async () => {
  await timerStore.stopTimer()
  showFocusModal.value = false
}

const activeTask = computed(() => {
  if (!timerStore.activeTimer) return null
  return taskStore.tasks.find(t => t.id === timerStore.activeTimer?.task_id) || null
})

const formattedTime = computed(() => {
  return formatTimerDisplay(timerStore.elapsedTime)
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
    <header class="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30">
      <div class="container mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="bg-blue-600 p-1.5 rounded-lg">
            <Zap class="h-5 w-5 text-white" />
          </div>
          <h1 class="text-xl font-black tracking-tight text-gray-900">DayTracker</h1>
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

    <main class="flex-1 container mx-auto px-6 py-10">
      <div class="max-w-6xl mx-auto">
        <!-- Header with Search and Add Task -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Today's Tasks</h2>
            <p class="text-sm text-gray-500">Manage and track your focus sessions</p>
          </div>
          
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <!-- Search -->
            <div class="relative flex-1 sm:flex-initial sm:w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input v-model="taskStore.searchQuery" placeholder="Search tasks..."
                class="pl-10 bg-white h-10 rounded-xl" />
            </div>

            <!-- Add Task Button -->
            <AddTask />
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Left Column (Sidebar - Modular Widgets) -->
          <div class="lg:col-span-4 space-y-6 sticky top-24">
            <TodayFocusWidget />
            <TaskProgressWidget :tasks="taskStore.tasks" />
            <ProTipWidget />
          </div>

          <!-- Right Column (Tasks Feed) -->
          <div class="lg:col-span-8 space-y-6">
            <div v-if="taskStore.loading" class="flex flex-col items-center justify-center py-24 space-y-4 bg-white rounded-3xl border border-dashed shadow-sm">
              <div class="relative h-12 w-12">
                <div class="absolute inset-0 rounded-full border-4 border-blue-50 border-t-blue-600 animate-spin"></div>
              </div>
              <p class="text-sm font-medium text-gray-500 tracking-wide uppercase">Syncing your productivity...</p>
            </div>

            <div v-else class="space-y-4">
              <div v-if="taskStore.filteredTasks.length === 0"
                class="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center shadow-sm px-6">
                <div class="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Search class="h-8 w-8 text-blue-500" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">No tasks found</h3>
                <p class="text-gray-500 max-w-sm mx-auto mb-8 text-lg">
                  {{ taskStore.searchQuery ? "We couldn't find any tasks matching your search." : "You haven't added any tasks for today yet." }}
                </p>
                <Button v-if="taskStore.searchQuery" variant="outline" size="lg" class="rounded-full px-8"
                  @click="taskStore.searchQuery = ''">
                  Clear Search
                </Button>
              </div>

              <div class="grid grid-cols-1 gap-4">
                <TaskItem v-for="task in taskStore.filteredTasks" :key="task.id" :task="task"
                  :is-active="timerStore.activeTimer?.task_id === task.id" @start-timer="startTimer"
                  @stop-timer="stopTimer" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>

    <FocusModal v-model:open="showFocusModal" :task="activeTask" @stop="stopTimer" />

    <!-- Floating Trigger if modal is closed but timer is running -->
    <div v-if="timerStore.activeTimer && !showFocusModal"
      class="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Button size="lg" class="shadow-xl rounded-full px-6 h-14 bg-gray-900 hover:bg-gray-800 text-white"
        @click="showFocusModal = true">
        <span class="relative flex h-3 w-3 mr-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span class="font-mono text-lg font-bold">{{ formattedTime }}</span>
      </Button>
    </div>
  </div>
</template>
