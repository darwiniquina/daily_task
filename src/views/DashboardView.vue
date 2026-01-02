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
import TodayFocusWidget from '@/components/dashboard/TodayFocusWidget.vue'
import TaskProgressWidget from '@/components/dashboard/TaskProgressWidget.vue'
import ProTipWidget from '@/components/dashboard/ProTipWidget.vue'
import type { Task } from '@/types'
import { formatTimerDisplay } from '@/utils/formatters'
import { CalendarDate } from '@internationalized/date'
import { Search, Zap, LogOut, Filter } from 'lucide-vue-next'

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
        <!-- Header with Search, Filter, and Add Task -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Your Tasks</h2>
            <p class="text-sm text-gray-500">Manage and track your focus sessions</p>
          </div>
          
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <!-- Search -->
            <div class="relative flex-1 sm:flex-initial sm:w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input v-model="taskStore.searchQuery" placeholder="Search tasks..."
                class="pl-10 bg-white h-10" />
            </div>

            <!-- Filter Popover -->
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="outline" size="sm" class="gap-2 h-10">
                  <Filter class="h-4 w-4" />
                  Filters
                  <span v-if="taskStore.filterFields.length < 3"
                    class="bg-blue-100 text-blue-600 text-[10px] px-1.5 rounded-full font-bold">
                    {{ taskStore.filterFields.length }}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-80 p-4 space-y-4" align="end">
                <div class="space-y-2">
                  <h4 class="font-semibold text-sm">Date Range</h4>
                  <RangeCalendar v-model="calendarRange" class="rounded-xl border shadow-sm w-full" />
                  <div class="px-2 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold text-center">
                    {{ rangeLabel }}
                  </div>
                </div>

                <div class="space-y-3 pt-2 border-t">
                  <h4 class="font-semibold text-sm">Match Fields</h4>
                  <div class="grid grid-cols-1 gap-2">
                    <div v-for="field in ['date', 'deadline', 'created_at']" :key="field"
                      class="flex items-center justify-between group cursor-pointer" @click="toggleField(field)">
                      <div class="flex items-center gap-2">
                         <Checkbox :id="'field-' + field" :checked="taskStore.filterFields.includes(field)"
                          size="sm" class="pointer-events-none" />
                        <Label :for="'field-' + field" class="text-sm font-medium capitalize group-hover:text-blue-600 transition-colors pointer-events-none">
                          {{ field.replace('_', ' ') }}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

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
                <p class="text-gray-500 max-w-sm mx-auto mb-8 text-lg">We couldn't find any tasks matching your current filters. Try adjusting your search or date range.</p>
                <Button variant="default" size="lg" class="rounded-full px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                  @click="taskStore.searchQuery = ''; taskStore.filterFields = ['date', 'created_at', 'deadline']">
                  Clear All Filters
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
