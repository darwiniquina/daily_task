<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/tasks'
import { useTimerStore } from '@/stores/timer'
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import TaskItem from '@/components/tasks/TaskItem.vue'
import AddTask from '@/components/tasks/AddTask.vue'
import FocusModal from '@/components/tasks/FocusModal.vue'
import type { Task } from '@/types'
import { formatTimerDisplay } from '@/utils/formatters'

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
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <header class="bg-white border-b sticky top-0 z-10">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">DayTracker</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500 hidden md:inline">{{ authStore.user?.email }}</span>
          <Button variant="outline" size="sm" @click="handleLogout">Logout</Button>
        </div>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        <div class="mb-8">
          <h2 class="text-2xl font-bold mb-2">Today's Focus</h2>
          <p class="text-gray-500">Track your tasks and time efficiently.</p>
        </div>

        <AddTask />
        
        <div v-if="taskStore.loading" class="text-center py-8 text-gray-500">
          Loading tasks...
        </div>

        <div v-else class="space-y-2">
          <div v-if="taskStore.tasks.length === 0" class="text-center py-16 bg-white rounded-lg border border-dashed flex flex-col items-center justify-center">
            <div class="h-40 w-40 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                 <svg class="h-20 w-20 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                 </svg>
            </div>
            <h3 class="text-xl font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p class="text-gray-500 max-w-sm mx-auto mb-6">Get started by adding a task to track your daily focus and productivity.</p>
          </div>
          
          <TaskItem 
            v-for="task in taskStore.tasks" 
            :key="task.id" 
            :task="task" 
            :is-active="timerStore.activeTimer?.task_id === task.id"
            @start-timer="startTimer"
            @stop-timer="stopTimer"
          />
        </div>
      </div>
    </main>

    <FocusModal 
      v-model:open="showFocusModal" 
      :task="activeTask" 
      @stop="stopTimer" 
    />

    <!-- Floating Trigger if modal is closed but timer is running -->
    <div v-if="timerStore.activeTimer && !showFocusModal" class="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Button size="lg" class="shadow-xl rounded-full px-6 h-14 bg-gray-900 hover:bg-gray-800 text-white" @click="showFocusModal = true">
            <span class="relative flex h-3 w-3 mr-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span class="font-mono text-lg font-bold">{{ formattedTime }}</span>
        </Button>
    </div>
  </div>
</template>
