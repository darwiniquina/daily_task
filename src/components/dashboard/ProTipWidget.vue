<script setup lang="ts">
import { Lightbulb } from 'lucide-vue-next'

const tips = [
  "Take a 5-minute break every 25 minutes to stay sharp.",
  "Start with your most challenging task while your energy is high.",
  "Clear your workspace to clear your mind.",
  "Hydration is key to cognitive performance!",
  "Single-tasking is the secret to deep work.",
  "Define your top 3 goals before starting the day."
]

const randomTip = tips[new Date().getDate() % tips.length]
</script>

<template>
  <div class="bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-3xl p-5 text-white shadow-lg shadow-amber-100/50 relative overflow-hidden group hover:scale-[1.01] transition-all">
    <div class="relative z-10">
      <div class="flex items-center gap-2 mb-3">
        <div class="p-1 px-3 bg-white/20 rounded-full text-white font-black text-[10px] uppercase tracking-tighter backdrop-blur-md border border-white/20">Pro Tip</div>
        <Lightbulb class="w-4 h-4 text-white" />
      </div>
      <p class="text-sm text-white leading-relaxed font-bold">
        {{ randomTip }}
      </p>
    </div>
    
    <!-- Large background icon -->
    <div class="absolute -right-4 -bottom-4 opacity-20 transform rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-all duration-500">
      <Lightbulb class="w-24 h-24 text-white" />
    </div>

    <!-- Background Accents -->
    <div class="absolute -left-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
  </div>
</template>
