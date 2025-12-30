<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/tasks'
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import TaskItem from '@/components/tasks/TaskItem.vue'
import AddTask from '@/components/tasks/AddTask.vue'
import type { Task } from '@/types'

const authStore = useAuthStore()
const taskStore = useTaskStore()
const router = useRouter()

onMounted(() => {
  taskStore.fetchTasks()
})

const handleLogout = async () => {
  await authStore.signOut()
  toast.success('Logged out successfully')
  router.push('/auth')
}

const startTimer = (task: Task) => {
  toast.info(`Starting timer for: ${task.title}`)
  // TODO: Implement timer
}
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
          <div v-if="taskStore.tasks.length === 0" class="text-center py-12 bg-white rounded-lg border border-dashed">
            <p class="text-gray-500">No tasks yet. Add one to get started!</p>
          </div>
          
          <TaskItem 
            v-for="task in taskStore.tasks" 
            :key="task.id" 
            :task="task" 
            @start-timer="startTimer"
          />
        </div>
      </div>
    </main>
  </div>
</template>
