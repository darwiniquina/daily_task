<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tasks: any[]
}>()

const today = new Date().toLocaleDateString('en-CA')

const todayTasks = computed(() => {
  return props.tasks.filter(t => t.date === today)
})

const completedToday = computed(() => {
  return todayTasks.value.filter(t => t.completed).length
})

const totalToday = computed(() => {
  return todayTasks.value.length
})

const progressPercentage = computed(() => {
  if (totalToday.value === 0) return 0
  return Math.round((completedToday.value / totalToday.value) * 100)
})
</script>

<template>
  <div class="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold uppercase tracking-widest text-indigo-100/80">Daily Progress</h3>
      </div>
      
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <span class="block text-4xl font-black leading-none tracking-tighter">{{ progressPercentage }}%</span>
          <span class="block text-[10px] font-bold uppercase tracking-wider text-indigo-200">Task Completion</span>
        </div>
        
        <div class="h-16 w-16 relative">
          <svg class="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="6" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="white" stroke-width="6" 
                    stroke-linecap="round" 
                    :stroke-dasharray="175.9" 
                    :stroke-dashoffset="175.9 - (175.9 * progressPercentage / 100)" 
                    class="transition-all duration-1000 ease-out" />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="h-1 w-1 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      <p class="mt-4 text-xs text-indigo-100/60 font-medium">
        {{ completedToday === totalToday && totalToday > 0 ? "All caught up! Dynamic work today." : `${completedToday} of ${totalToday} tasks finished` }}
      </p>
    </div>

    <!-- Background Accents -->
    <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
    <div class="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl"></div>
  </div>
</template>

<style scoped>
svg {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
}
</style>
