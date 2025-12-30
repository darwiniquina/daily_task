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
import { Square, Loader2 } from 'lucide-vue-next'
import type { Task } from '@/types'
import { formatTimerDisplay } from '@/utils/formatters'

const props = defineProps<{
  open: boolean
  task: Task | null
}>()

const emit = defineEmits(['update:open', 'stop'])

const timerStore = useTimerStore()

const formattedTime = computed(() => {
  return formatTimerDisplay(timerStore.elapsedTime)
})

const handleStop = () => {
  emit('stop')
}
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

        <div class="flex justify-center pt-4">
             <Button size="lg" variant="destructive" @click="handleStop" class="px-10 h-12 text-lg hover:scale-105 transition-transform">
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
