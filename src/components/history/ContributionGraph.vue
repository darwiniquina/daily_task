<script setup lang="ts">
import { computed } from 'vue'
import {
  format,
  subDays,
  eachDayOfInterval,
  startOfToday
} from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const props = defineProps<{
  activityData: Record<string, number>
  selectedDate?: string
  startDate?: string
  endDate?: string
}>()

const emit = defineEmits<{
  (e: 'select-date', date: string): void
}>()

// Generate days based on props or default (last 365)
const dateRange = computed(() => {
  const today = startOfToday()
  const start = props.startDate ? new Date(props.startDate) : subDays(today, 364)
  const end = props.endDate ? new Date(props.endDate) : today
  return { start, end }
})

const days = computed(() => {
  const { start, end } = dateRange.value
  const interval = eachDayOfInterval({ start, end })

  if (interval.length === 0) return []

  // Calculate padding to align days with SMTWTFS rows
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  const firstDay = interval[0]!
  const paddingCount = firstDay.getDay()

  const paddedDays: Array<{
    date: Date | null
    dateStr: string
    count: number
    isEmpty: boolean
  }> = []

  // Add empty slots for days before the start date in the first week
  for (let i = 0; i < paddingCount; i++) {
    paddedDays.push({
      date: null,
      dateStr: '',
      count: 0,
      isEmpty: true
    })
  }

  // Add actual days
  interval.forEach(date => {
    const dateStr = format(date, 'yyyy-MM-dd')
    paddedDays.push({
      date,
      dateStr,
      count: props.activityData[dateStr] || 0,
      isEmpty: false
    })
  })

  return paddedDays
})

const getColorClass = (count: number) => {
  if (count === 0) return 'bg-gray-100/50 hover:bg-gray-200'
  if (count <= 2) return 'bg-blue-100/80 shadow-[0_0_8px_-2px_rgba(59,130,246,0.3)]'
  if (count <= 5) return 'bg-blue-300 shadow-[0_0_10px_-1px_rgba(59,130,246,0.4)]'
  if (count <= 8) return 'bg-indigo-500 shadow-[0_0_12px_0px_rgba(99,102,241,0.5)]'
  return 'bg-violet-600 shadow-[0_0_15px_1px_rgba(139,92,246,0.6)] animate-pulse-slow'
}

const handleDateClick = (dateStr: string) => {
  emit('select-date', dateStr)
}

const months = computed(() => {
  const allDays = days.value
  if (allDays.length === 0) return []

  return allDays.reduce<{ name: string; col: number }[]>((labels, day, i) => {
    if (day.isEmpty) return labels

    const date = day.date!
    const month = date.getMonth()

    // Find previous day's month to detect month change
    const prevDay = i > 0 ? allDays[i - 1] : null
    const prevMonth = (prevDay && !prevDay.isEmpty) ? prevDay.date!.getMonth() : -1

    if (month === prevMonth) return labels

    const col = Math.floor(i / 7)
    const last = labels[labels.length - 1]

    // Only add month label if it's far enough from the last one to avoid overlap
    if (!last || col - last.col >= 3) {
      labels.push({
        name: format(date, 'MMM'),
        col
      })
    }

    return labels
  }, [])
})

</script>

<template>
  <div class="w-full pb-6 pt-2 outline-none ">
    <div
      class="dark:border-white/10 dark:bg-zinc-900/50 w-full p-4 sm:p-8  backdrop-blur-xl rounded-[32px] sm:rounded-[40px] border border-white shadow-xl shadow-blue-900/5 overflow-hidden">
      <div class="flex flex-col gap-4">

        <!-- Headers -->
        <div class="flex items-end justify-between px-2 mb-2 overflow-hidden">
          <div class="flex gap-1 items-baseline shrink-0">
            <span class="text-2xl sm:text-3xl font-black  tracking-tighter">Energy Map</span>
            <span
              class="hidden sm:inline text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Momentum</span>
          </div>
        </div>

        <div class="flex flex-col gap-1 sm:gap-2">
          <!-- Month Labels Grid -->
          <div class="grid grid-cols-[20px_repeat(53,minmax(0,1fr))] gap-1 px-1 sm:px-2">
            <div class="w-full h-4"></div> <!-- Spacer for day labels column -->
            <div v-for="i in 53" :key="i" class="relative h-4">
              <span v-if="months.find(m => m.col === i - 1)"
                class="absolute left-0 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter text-gray-400 whitespace-nowrap">
                {{months.find(m => m.col === i - 1)?.name}}
              </span>
            </div>
          </div>

          <!-- Activity Grid with Labels as First Column -->
          <div
            class="grid grid-rows-7 grid-flow-col grid-cols-[20px_repeat(53,minmax(0,1fr))] gap-1 sm:gap-1.5 px-1 sm:px-2">
            <!-- Column 0: Day Labels -->
            <div class="text-[8px] sm:text-[9px] text-gray-300 font-black uppercase flex items-center justify-center">S
            </div>
            <div class="text-[8px] sm:text-[9px] text-gray-300 font-black uppercase flex items-center justify-center">M
            </div>
            <div class="text-[8px] sm:text-[9px] text-gray-300 font-black uppercase flex items-center justify-center">T
            </div>
            <div class="text-[8px] sm:text-[9px] text-gray-300 font-black uppercase flex items-center justify-center">W
            </div>
            <div class="text-[8px] sm:text-[9px] text-gray-300 font-black uppercase flex items-center justify-center">T
            </div>
            <div class="text-[8px] sm:text-[9px] text-gray-300 font-black uppercase flex items-center justify-center">F
            </div>
            <div class="text-[8px] sm:text-[9px] text-gray-300 font-black uppercase flex items-center justify-center">S
            </div>

            <!-- Columns 1-53: Activity Nodes -->
            <template v-for="(day, index) in days" :key="day.isEmpty ? `empty-${index}` : day.dateStr">
              <div v-if="day.isEmpty" class="aspect-square"></div>
              <TooltipProvider v-else>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <div @click="handleDateClick(day.dateStr)"
                      class="aspect-square rounded-full cursor-pointer transition-all duration-300 transform hover:scale-150 hover:z-20 active:scale-95"
                      :class="[
                        getColorClass(day.count),
                        selectedDate === day.dateStr ? 'ring-4 ring-blue-500/20 scale-125 z-10 !bg-blue-600 shadow-blue-500/50' : ''
                      ]"></div>
                  </TooltipTrigger>
                  <TooltipContent class="rounded-xl border-none shadow-2xl bg-gray-900 text-white p-3">
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-xs font-black text-blue-400 uppercase tracking-tighter">{{ day.date ?
                        format(day.date, 'MMM d, yyyy') : '' }}</span>
                      <span class="text-lg font-black tracking-tight leading-none">{{ day.count }} Tasks</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </template>
          </div>
        </div>
      </div>

      <!-- Legend (Responsive) -->
      <div class="flex flex-wrap items-center gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center">
        <span
          class="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">Growth
          Scale</span>
        <div class="flex gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 rounded-full border border-gray-100">
          <div class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-gray-200"></div>
          <div class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-blue-100"></div>
          <div class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-blue-300"></div>
          <div class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-indigo-500"></div>
          <div class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-violet-600 shadow-lg shadow-violet-500/30"></div>
        </div>
        <span
          class="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">Peak</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse-slow {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 3s infinite ease-in-out;
}
</style>
