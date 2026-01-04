<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useTaskStore } from '@/stores/tasks'
import { formatTotalDuration } from '@/utils/formatters'
import {
  Flame,
  TrendingUp,
  Clock,
  Sparkles,
  Award
} from 'lucide-vue-next'

import { useProductivityTheme } from '@/composables/useProductivityTheme'

const timerStore = useTimerStore()
const taskStore = useTaskStore()
const { focusHours, totalFocusSecondsToday, theme } = useProductivityTheme()

const today = new Date().toLocaleDateString('en-CA')

// Get motivational message based on focus time
const motivationalMessage = computed(() => {
  const hours = focusHours.value

  if (hours === 0) {
    return {
      title: "Ready to Focus?",
      message: "Start your first session and build momentum!",
      emoji: "🚀"
    }
  } else if (hours < 1) {
    return {
      title: "Great Start!",
      message: "You're building the habit. Keep it up!",
      emoji: "🌱"
    }
  } else if (hours < 2) {
    return {
      title: "Nice Progress!",
      message: "You're in the zone. One more hour?",
      emoji: "⚡"
    }
  } else if (hours < 4) {
    return {
      title: "Crushing It!",
      message: "Your productivity is on fire today!",
      emoji: "🔥"
    }
  } else if (hours < 6) {
    return {
      title: "Phenomenal!",
      message: "You're a productivity powerhouse!",
      emoji: "💪"
    }
  } else {
    return {
      title: "Legendary!",
      message: "You're absolutely unstoppable today!",
      emoji: "🏆"
    }
  }
})

// Calculate streak intensity (for visual effects)
const streakIntensity = computed(() => {
  const hours = focusHours.value
  return Math.min(100, (hours / 8) * 100) // Max at 8 hours
})

// Fetch today's focus time on mount
onMounted(() => {
  timerStore.fetchTodaysFocusTime()
})

// Animation state
const showConfetti = ref(false)
const previousHours = ref(0)

// Watch for milestones
const checkMilestone = () => {
  const current = focusHours.value
  const milestones = [1, 2, 3, 4, 5, 6, 8]

  for (const milestone of milestones) {
    if (previousHours.value < milestone && current >= milestone) {
      showConfetti.value = true
      setTimeout(() => showConfetti.value = false, 3000)
      break
    }
  }

  previousHours.value = current
}

// Check milestones when focus time changes
computed(() => {
  checkMilestone()
  return totalFocusSecondsToday.value
})
</script>

<template>
  <div class="relative overflow-hidden">
    <!-- Main Card -->
    <div :class="[
      'bg-gradient-to-br rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-700',
      theme.gradient
    ]">
      <!-- Animated Background Elements -->
      <div class="absolute inset-0 opacity-20">
        <div
          class="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2">
        </div>
        <div
          class="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2">
        </div>
      </div>

      <!-- Confetti Effect -->
      <div v-if="showConfetti" class="absolute inset-0 pointer-events-none">
        <div v-for="i in 20" :key="i" class="absolute animate-confetti" :style="{
          left: `${Math.random() * 100}%`,
          top: '-10%',
          animationDelay: `${Math.random() * 0.5}s`,
          animationDuration: `${2 + Math.random()}s`
        }">
          <Sparkles class="w-4 h-4 text-yellow-300" />
        </div>
      </div>

      <!-- Content -->
      <div class="relative z-10">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Flame class="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 class="text-sm font-bold uppercase tracking-widest text-white/80">Today's Focus</h3>
              <p class="text-xs text-white/60 font-medium">{{ new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short', day: 'numeric'
              }) }}</p>
            </div>
          </div>

          <!-- Emoji Badge -->
          <div class="text-4xl animate-bounce-slow">
            {{ motivationalMessage.emoji }}
          </div>
        </div>

        <!-- Main Time Display -->
        <div class="mb-6">
          <div class="flex items-baseline gap-3 mb-2">
            <span class="text-7xl font-black tracking-tighter leading-none">
              {{ formatTotalDuration(totalFocusSecondsToday) }}
            </span>
          </div>
          <div class="flex items-center gap-2 text-white/80">
            <Clock class="w-4 h-4" />
            <span class="text-sm font-bold">{{ focusHours.toFixed(1) }}h of deep work</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-6">
          <div class="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div class="h-full bg-white rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              :style="{ width: `${Math.min(streakIntensity, 100)}%` }">
              <!-- Shimmer effect -->
              <div
                class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer">
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-xs font-bold text-white/60">
            <span>0h</span>
            <span>Goal: 8h</span>
          </div>
        </div>

        <!-- Motivational Message -->

        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex-[1] mt-6">
          <div class="flex items-start gap-3">
            <div class="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award class="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 class="font-bold text-white mb-1">{{ motivationalMessage.title }}</h4>
              <p class="text-sm text-white/80 leading-relaxed">{{ motivationalMessage.message }}</p>
            </div>
          </div>
        </div>
        <!-- Stats Row -->
        <div class="grid grid-cols-2 gap-3 mt-6">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div class="flex items-center gap-2 mb-1">
              <TrendingUp class="w-4 h-4 text-white/80" />
              <span class="text-xs font-bold text-white/60 uppercase tracking-wider">Sessions</span>
            </div>
            <span class="text-2xl font-black text-white">{{taskStore.filteredTasks.filter(t => t.date === today).length
            }}</span>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div class="flex items-center gap-2 mb-1">
              <Sparkles class="w-4 h-4 text-white/80" />
              <span class="text-xs font-bold text-white/60 uppercase tracking-wider">Streak</span>
            </div>
            <span class="text-2xl font-black text-white">{{ Math.floor(focusHours) }}h</span>
          </div>
        </div>
      </div>

      <!-- Glow Effect -->
      <div class="absolute inset-0 opacity-50 blur-2xl transition-opacity duration-700"
        :style="{ opacity: streakIntensity / 200 }">
        <div class="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }

  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.animate-confetti {
  animation: confetti 3s ease-in forwards;
}

@keyframes bounce-slow {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}
</style>
