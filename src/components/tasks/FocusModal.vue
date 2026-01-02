<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Square, Loader2, Volume2, VolumeX } from 'lucide-vue-next'
import type { Task } from '@/types'
import { formatTimerDisplay } from '@/utils/formatters'
import { ref, onUnmounted, watch } from 'vue'

const props = defineProps<{
  open: boolean
  task: Task | null
}>()

const emit = defineEmits(['update:open', 'stop'])

const timerStore = useTimerStore()

const sounds = [
  { id: 'none', label: 'Silence', icon: Square, url: '' },
  { id: 'rain', label: 'Rain', icon: Loader2, url: 'https://www.soundjay.com/nature/rain-01.mp3' },
  { id: 'waves', label: 'Waves', icon: Loader2, url: 'https://www.soundjay.com/nature/ocean-waves-1.mp3' },
  { id: 'forest', label: 'Forest', icon: Loader2, url: 'https://www.soundjay.com/nature/campfire-1.mp3' },
]

const currentSound = ref('none')
const audio = ref<HTMLAudioElement | null>(null)
const volume = ref(50)

const toggleSound = (soundId: string) => {
  if (currentSound.value === soundId) {
    stopSound()
    currentSound.value = 'none'
  } else {
    stopSound()
    currentSound.value = soundId
    const sound = sounds.find(s => s.id === soundId)
    if (sound && sound.url) {
      audio.value = new Audio(sound.url)
      audio.value.loop = true
      audio.value.volume = volume.value / 100
      audio.value.play().catch(e => console.error("Audio play failed", e))
    }
  }
}

const stopSound = () => {
  if (audio.value) {
    audio.value.pause()
    audio.value = null
  }
}

// Update volume when slider changes
watch(volume, (newVolume) => {
  if (audio.value) {
    audio.value.volume = newVolume / 100
  }
})

watch(() => props.open, (isOpen) => {
  if (!isOpen) stopSound()
})

onUnmounted(() => {
  stopSound()
})

const formattedTime = computed(() => {
  return formatTimerDisplay(timerStore.elapsedTime)
})

const handleStop = () => {
  stopSound()
  emit('stop')
}

const isMuted = computed(() => volume.value === 0)
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md text-center [&>button]:hidden">
      <DialogHeader>
        <DialogTitle class="text-center flex items-center justify-center gap-2 text-blue-600">
            <span class="relative flex h-3 w-3 mr-1">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Focus Mode
        </DialogTitle>
      </DialogHeader>
      
      <div v-if="task" class="py-10 space-y-8">
        <div class="space-y-2">
            <h2 class="text-3xl font-bold text-gray-900 leading-tight">{{ task.title }}</h2>
            <p v-if="task.description" class="text-lg text-gray-500 max-w-[80%] mx-auto">{{ task.description }}</p>
        </div>

        <div class="text-7xl font-mono font-bold text-slate-800 tab-nums tracking-tighter">
            {{ formattedTime }}
        </div>

        <div class="flex flex-col items-center gap-6 pt-4">
             <!-- Sound Selection -->
             <div class="w-full space-y-3">
               <div class="flex items-center gap-2 p-1 bg-gray-100 rounded-lg justify-center">
                  <Button 
                    v-for="s in sounds" 
                    :key="s.id"
                    variant="ghost" 
                    size="sm" 
                    class="h-8 px-3 rounded-md transition-all whitespace-nowrap"
                    :class="currentSound === s.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'"
                    @click="toggleSound(s.id)"
                  >
                    {{ s.label }}
                  </Button>
               </div>

               <!-- Volume Slider (only show when sound is active) -->
               <div v-if="currentSound !== 'none'" class="w-full max-w-xs mx-auto">
                 <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                   <VolumeX v-if="isMuted" class="w-4 h-4 text-gray-400 shrink-0" />
                   <Volume2 v-else class="w-4 h-4 text-gray-600 shrink-0" />
                   
                   <input 
                     v-model.number="volume"
                     type="range" 
                     min="0" 
                     max="100" 
                     step="1"
                     class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                   />
                   
                   <span class="text-xs font-mono text-gray-600 w-8 text-right">{{ volume }}%</span>
                 </div>
               </div>
             </div>

             <Button size="lg" variant="destructive" @click="handleStop" class="px-10 h-12 text-lg hover:scale-105 transition-transform w-full sm:w-auto">
                <Square class="w-5 h-5 mr-2 fill-current" /> Stop Session
             </Button>
        </div>
      </div>
      <div v-else class="py-10 flex flex-col items-center justify-center text-gray-500">
         <Loader2 class="w-8 h-8 animate-spin mb-4" />
         <p>Loading focus details...</p>
      </div>
    </DialogContent>
  </Dialog>
</template>
