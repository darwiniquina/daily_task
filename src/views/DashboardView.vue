<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/tasks'
import { useTimerStore } from '@/stores/timer'
import { Button } from '@/components/ui/button'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import TaskItem from '@/components/tasks/TaskItem.vue'
import AddTask from '@/components/tasks/AddTask.vue'
import FocusModal from '@/components/tasks/FocusModal.vue'
import type { Task } from '@/types'
import { formatTimerDisplay } from '@/utils/formatters'
import { CalendarDate } from '@internationalized/date'
import { Search, Filter } from 'lucide-vue-next'

const authStore = useAuthStore()
const taskStore = useTaskStore()
const timerStore = useTimerStore()
const router = useRouter()

const showFocusModal = ref(false)

const parseISO = (iso: string) => {
  const parts = iso.split('-').map(Number)
  if (parts.length < 3) return new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
  return new CalendarDate(parts[0] as number, parts[1] as number, parts[2] as number)
}

const calendarRange = ref<any>({
  start: parseISO(taskStore.startDate),
  end: parseISO(taskStore.endDate)
})

onMounted(async () => {
  await Promise.all([
    taskStore.fetchTasks(),
    timerStore.fetchActiveTimer()
  ])
})

watch(calendarRange, async (newVal) => {
  if (newVal?.start && newVal?.end) {
    taskStore.startDate = newVal.start.toString()
    taskStore.endDate = newVal.end.toString()
    await taskStore.fetchTasks()
  }
}, { deep: true })

const toggleField = async (field: string) => {
  const index = taskStore.filterFields.indexOf(field)
  if (index > -1) {
    taskStore.filterFields.splice(index, 1)
  } else {
    taskStore.filterFields.push(field)
  }
  await taskStore.fetchTasks()
}

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

const rangeLabel = computed(() => {
  if (taskStore.startDate === taskStore.endDate) return taskStore.startDate
  return `${taskStore.startDate} to ${taskStore.endDate}`
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <header class="bg-white border-b sticky top-0 z-20">
      <div class="container mx-auto px-4 h-16 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">DayTracker</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500 hidden md:inline">{{ authStore.user?.email }}</span>
          <Button variant="outline" size="sm" @click="handleLogout">Logout</Button>
        </div>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-8">
      <div class="max-w-3xl mx-auto space-y-6">

        <!-- Search & Filter Bar -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input v-model="taskStore.searchQuery" placeholder="Search tasks by title or description..."
              class="pl-10 bg-white" />
          </div>

          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="gap-2 bg-white">
                <Filter class="h-4 w-4" />
                Filters
                <span v-if="taskStore.filterFields.length < 3"
                  class="bg-blue-100 text-blue-600 text-[10px] px-1.5 rounded-full font-bold">
                  {{ taskStore.filterFields.length }}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-4 space-y-4" align="end">
              <div class="space-y-2">
                <h4 class="font-medium text-sm">Date Range</h4>
                <RangeCalendar v-model="calendarRange" class="rounded-md border shadow-sm" />
                <div class="text-xs text-gray-500 text-center">
                  {{ rangeLabel }}
                </div>
              </div>

              <div class="space-y-3 pt-2 border-t">
                <h4 class="font-medium text-sm">Include Fields</h4>
                <div class="grid grid-cols-1 gap-2">
                  <div v-for="field in ['date', 'deadline', 'created_at']" :key="field"
                    class="flex items-center space-x-2">
                    <Checkbox :id="'field-' + field" :checked="taskStore.filterFields.includes(field)"
                      @update:checked="toggleField(field)" />
                    <Label :for="'field-' + field" class="text-xs capitalize">{{ field.replace('_', ' ') }}</Label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <AddTask />

        <div v-if="taskStore.loading" class="flex flex-col items-center justify-center py-12 space-y-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p class="text-sm text-gray-500">Syncing tasks...</p>
        </div>

        <div v-else class="space-y-2">
          <div v-if="taskStore.filteredTasks.length === 0"
            class="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center shadow-sm">
            <div class="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Search class="h-10 w-10 text-gray-300" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-1">No matches found</h3>
            <p class="text-sm text-gray-500 max-w-xs mx-auto mb-6">Adjust your search or filters to find what you're
              looking for.</p>
            <Button variant="ghost" size="sm" class="text-blue-600"
              @click="taskStore.searchQuery = ''; taskStore.filterFields = ['date', 'created_at', 'deadline']">
              Reset Filters
            </Button>
          </div>

          <TaskItem v-for="task in taskStore.filteredTasks" :key="task.id" :task="task"
            :is-active="timerStore.activeTimer?.task_id === task.id" @start-timer="startTimer"
            @stop-timer="stopTimer" />
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
