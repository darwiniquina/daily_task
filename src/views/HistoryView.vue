<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useHistoryStore } from '@/stores/history'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import ContributionGraph from '@/components/history/ContributionGraph.vue'
import TaskItem from '@/components/tasks/TaskItem.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { Clock, CheckCircle2, Trophy, Flame, Filter, Calendar as CalendarIcon } from 'lucide-vue-next'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns'
import { formatTotalDuration } from '@/utils/formatters'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { CalendarDate } from '@internationalized/date'

const authStore = useAuthStore()
const historyStore = useHistoryStore()
const router = useRouter()

const selectedDate = ref(new Date().toLocaleDateString('en-CA'))

// Range Filter Status
const activeRangeType = ref<'week' | 'month' | 'year' | 'full' | 'custom'>('month')
const todayDate = new Date()
const calendarRange = ref({
  start: new CalendarDate(todayDate.getFullYear(), todayDate.getMonth() + 1, 1),
  end: new CalendarDate(todayDate.getFullYear(), todayDate.getMonth() + 1, todayDate.getDate())
})

const updateStoreRange = () => {
  if (calendarRange.value.start) {
    historyStore.startDate = calendarRange.value.start.toString()
  }
  if (calendarRange.value.end) {
    historyStore.endDate = calendarRange.value.end.toString()
  }
}

const setQuickRange = (type: 'week' | 'month' | 'year' | 'full') => {
  activeRangeType.value = type
  const now = new Date()
  let start: Date
  let end: Date = now

  if (type === 'week') {
    start = startOfWeek(now, { weekStartsOn: 0 })
    end = endOfWeek(now, { weekStartsOn: 0 })
  } else if (type === 'month') {
    start = startOfMonth(now)
    end = endOfMonth(now)
  } else if (type === 'year') {
    start = startOfYear(now)
    end = endOfYear(now)
  } else {
    start = subDays(now, 364)
  }

  calendarRange.value = {
    start: new CalendarDate(start.getFullYear(), start.getMonth() + 1, start.getDate()),
    end: new CalendarDate(end.getFullYear(), end.getMonth() + 1, end.getDate())
  }
}

onMounted(async () => {
  // Sync initial range to store
  updateStoreRange()

  await historyStore.fetchActivityLog()
  await Promise.all([
    historyStore.fetchTasksForDate(selectedDate.value),
    historyStore.fetchFocusTimeForDate(selectedDate.value)
  ])
})

watch(calendarRange, async () => {
  updateStoreRange()
  await historyStore.fetchActivityLog()
}, { deep: true })

const rangeLabel = computed(() => {
  if (calendarRange.value.start && calendarRange.value.end) {
    return `${format(new Date(calendarRange.value.start.toString()), 'MMM d')} - ${format(new Date(calendarRange.value.end.toString()), 'MMM d, yyyy')}`
  }
  return 'Select Range'
})

const handleDateSelect = async (date: string) => {
  selectedDate.value = date
  await Promise.all([
    historyStore.fetchTasksForDate(date),
    historyStore.fetchFocusTimeForDate(date)
  ])
}

const formattedSelectedDate = computed(() => {
  return format(new Date(selectedDate.value), 'PPPP')
})

const completionStats = computed(() => {
  const total = historyStore.selectedDateTasks.length
  if (total === 0) return { percent: 0, completed: 0, total: 0 }
  const completed = historyStore.selectedDateTasks.filter(t => t.completed).length
  return {
    percent: Math.round((completed / total) * 100),
    completed,
    total
  }
})

const achievementLabel = computed(() => {
  const hours = historyStore.selectedDateFocusSeconds / 3600
  if (hours === 0) return { title: "Quiet Day", desc: "No focus recorded", icon: Clock, color: 'text-gray-400', bg: 'bg-gray-50' }
  if (hours < 1) return { title: "Steady Start", desc: "Building the habit", icon: Flame, color: 'text-blue-500', bg: 'bg-blue-50' }
  if (hours < 3) return { title: "Productive", desc: "Solid deep work", icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-50' }
  return { title: "Elite Focus", desc: "Peak performance day", icon: Trophy, color: 'text-violet-600', bg: 'bg-violet-50' }
})
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans">
    <AppHeader />

    <main class="flex-1 container mx-auto px-6 py-10">
      <div class="max-w-6xl mx-auto space-y-10">

        <!-- Header Section -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 class="text-3xl font-black  mb-2">Your Journey</h2>
            <p class="text-gray-500 font-medium">Relive your productivity and see how far you've come.</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Quick Select Chips -->
            <div class="flex items-center dark:border-white/10 dark:bg-zinc-900/50   p-1 rounded-2xl border shadow-sm">
              <Button variant="ghost" size="sm"
                class="rounded-xl px-4 text-xs font-bold uppercase tracking-widest transition-all duration-300"
                :class="activeRangeType === 'week' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'"
                @click="setQuickRange('week')">Week</Button>
              <Button variant="ghost" size="sm"
                class="rounded-xl px-4 text-xs font-bold uppercase tracking-widest transition-all duration-300"
                :class="activeRangeType === 'month' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'"
                @click="setQuickRange('month')">Month</Button>
              <Button variant="ghost" size="sm"
                class="rounded-xl px-4 text-xs font-bold uppercase tracking-widest transition-all duration-300"
                :class="activeRangeType === 'year' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'"
                @click="setQuickRange('year')">Year</Button>
              <Button variant="ghost" size="sm"
                class="rounded-xl px-4 text-xs font-bold uppercase tracking-widest transition-all duration-300"
                :class="activeRangeType === 'full' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'"
                @click="setQuickRange('full')">Full</Button>
            </div>

            <div class="hidden sm:block h-6 w-px bg-gray-200"></div>

            <!-- Shadcn Date Range Filter -->
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="outline"
                  class="justify-start text-left font-normal rounded-2xl h-12 dark:border-white/10 dark:bg-zinc-900/50   border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group">
                  <CalendarIcon class="mr-2 h-4 w-4 text-blue-600 transition-transform group-hover:scale-110" />
                  <span class="font-bold text-gray-700 whitespace-nowrap">{{ rangeLabel }}</span>
                  <Filter class="ml-4 h-4 w-4 text-gray-400 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0 rounded-2xl border-none shadow-2xl overflow-hidden" align="end">
                <RangeCalendar v-model="calendarRange" initial-focus :number-of-months="2" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <!-- Contribution Graph -->
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold uppercase tracking-widest text-gray-400">Momentum Visualization</h3>
            <span class="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {{ historyStore.startDate ? format(new Date(historyStore.startDate), 'MMM d') : '' }} —
              {{ historyStore.endDate ? format(new Date(historyStore.endDate), 'MMM d, yyyy') : '' }}
            </span>
          </div>
          <ContributionGraph :activity-data="historyStore.activityData" :selected-date="selectedDate"
            :start-date="historyStore.startDate" :end-date="historyStore.endDate" @select-date="handleDateSelect" />
        </section>

        <!-- Selected Day Stats & Achievements -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div :class="['md:col-span-1 p-6 rounded-[32px] border transition-all duration-500 shadow-sm flex flex-col items-center text-center justify-center dark:border-white/10 dark:bg-zinc-900/50 ',
            historyStore.focusLoading ? 'opacity-50' : '']">
            <div
              :class="['h-16 w-16 rounded-2xl mb-4 flex items-center justify-center transition-colors duration-500', achievementLabel.bg]">
              <component :is="achievementLabel.icon" :class="['h-8 w-8', achievementLabel.color]" />
            </div>
            <h4 class="text-xl font-black  leading-tight">{{ achievementLabel.title }}</h4>
            <p class="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{{ achievementLabel.desc }}</p>
          </div>

          <div
            class="dark:border-white/10 dark:bg-zinc-900/50  p-6 rounded-[32px] border shadow-sm flex flex-col justify-center">
            <div class="flex items-center gap-3 mb-4">
              <div class="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Clock class="h-5 w-5 text-blue-600" />
              </div>
              <span class="text-sm font-bold text-gray-400 uppercase tracking-widest">Focus Session</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-5xl font-black  tracking-tighter">{{
                formatTotalDuration(historyStore.selectedDateFocusSeconds) }}</span>
            </div>
            <p class="text-xs font-bold text-gray-400 mt-2">Total time focused on tasks</p>
          </div>

          <div
            class="dark:border-white/10 dark:bg-zinc-900/50  p-6 rounded-[32px] border shadow-sm flex flex-col justify-center">
            <div class="flex items-center gap-3 mb-4">
              <div class="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 class="h-5 w-5 text-emerald-600" />
              </div>
              <span class="text-sm font-bold text-gray-400 uppercase tracking-widest">Task Success</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-5xl font-black  tracking-tighter">{{ completionStats.percent }}%</span>
              <span class="text-sm font-black text-emerald-600">{{ completionStats.completed }}/{{ completionStats.total
              }}</span>
            </div>
            <div class="w-full h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                :style="{ width: `${completionStats.percent}%` }"></div>
            </div>
          </div>
        </section>

        <!-- Selected Day Tasks -->
        <section class="space-y-6">
          <div class="flex items-center gap-3 border-t pt-10">
            <div
              class="h-10 w-10 dark:border-white/10 dark:bg-zinc-900/50  rounded-2xl flex items-center justify-center shadow-sm border">
              <CalendarIcon class="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 class="text-xl font-bold ">{{ formattedSelectedDate }}</h3>
              <p class="text-sm text-gray-500 font-bold uppercase tracking-wider">Historical Archive</p>
            </div>
          </div>

          <div v-if="historyStore.tasksLoading"
            class="flex flex-col items-center justify-center py-20 dark:border-white/10 dark:bg-zinc-900/50  rounded-3xl border border-dashed">
            <div class="h-10 w-10 border-4 border-blue-100 border-t-blue-600 animate-spin rounded-full mb-4"></div>
            <p class="text-sm font-bold text-gray-400 uppercase tracking-widest">Retrieving logs...</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-if="historyStore.selectedDateTasks.length === 0"
              class="col-span-full py-20 text-center dark:border-white/10 dark:bg-zinc-900/50  rounded-3xl border shadow-sm border-dashed">
              <div class="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon class="h-8 w-8 text-gray-300" />
              </div>
              <h4 class="font-black ">No activity recorded</h4>
              <p class="text-gray-500 text-sm">You didn't have any tasks scheduled for this date.</p>
            </div>

            <TaskItem v-for="task in historyStore.selectedDateTasks" :key="task.id" :task="task" view-only />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
