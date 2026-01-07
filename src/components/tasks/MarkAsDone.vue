<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Check, Trophy, Star, ListTodo } from 'lucide-vue-next'
import type { Task } from '@/types'
import { useTaskStore } from '@/stores/tasks'
import { useGamificationStore } from '@/stores/gamification'
import confetti from 'canvas-confetti'
import ToolTipWrapper from '../ui/tooltip/TooltipWrapper.vue'

const taskStore = useTaskStore()
const gamificationStore = useGamificationStore()

const open = ref(false)
const taskReward = ref(0) // XP awarded specifically at completion (Base + Focus)

const props = defineProps<{
    task: Task
    asMenuItem?: boolean
    totalDuration: number
}>()

const subtaskXP = computed(() => {
    if (!props.task.subtasks) return 0
    return props.task.subtasks.filter(s => s.completed).length * 3
})

const totalTaskWorth = computed(() => {
    const focusXP = Math.floor(props.totalDuration / 60)
    return 5 + focusXP + subtaskXP.value
})


const markAsComplete = async () => {
    // XP calculation: 5 XP base + 1 XP per minute of total focus
    const focusXP = Math.floor(props.totalDuration / 60)
    taskReward.value = 5 + focusXP

    await taskStore.updateTask(props.task.id, { completed: true })
    await gamificationStore.addXP(taskReward.value, 'task_completion', props.task.id)

    open.value = true

    confetti({
        particleCount: 150,
        spread: 300,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
    })
}
</script>

<template>
    <div :class="{ 'w-full': asMenuItem }">
        <template v-if="!task.completed">
            <Button v-if="asMenuItem" variant="ghost" size="sm"
                class="w-full justify-start text-sm font-normal hover:bg-green-50 hover:text-green-700 h-9 px-2"
                @click="markAsComplete">
                <Check class="w-4 h-4 mr-2" />
                Mark as Done
            </Button>
            <ToolTipWrapper v-else text="Mark as Done">
                <Button variant="outline" size="sm"
                    class="rounded-lg text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all font-bold"
                    @click="markAsComplete">
                    <Check class="w-4 h-4 mr-1" />
                    Done
                </Button>
            </ToolTipWrapper>
        </template>

        <Dialog v-model:open="open">
            <DialogContent class="sm:max-w-[400px] border-none bg-gradient-to-b from-white to-green-50 p-0 overflow-hidden">
                <div class="relative pt-12 pb-8 px-6 text-center">
                    <!-- Background Decoration -->
                    <div class="absolute top-0 left-0 w-full h-32 bg-green-500/10 -skew-y-6 -translate-y-16"></div>
                    
                    <!-- Icon Celebration -->
                    <div class="relative mb-6">
                        <div class="mx-auto w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-200 animate-bounce">
                            <Trophy class="w-12 h-12 text-white" />
                        </div>
                    </div>

                    <DialogHeader class="space-y-2">
                        <DialogTitle class="text-3xl font-black text-gray-900 tracking-tight">
                            Task Conquered!
                        </DialogTitle>
                        <DialogDescription class="sr-only">
                            Congratulations on completing your task and earning XP.
                        </DialogDescription>
                        <p class="text-gray-500 font-medium italic text-lg">"{{ task.title }}"</p>
                    </DialogHeader>

                    <div class="mt-8 space-y-4">
                        <div class="bg-white rounded-2xl p-6 shadow-sm border border-green-100 flex flex-col items-center gap-2">
                            <p class="text-xs font-black uppercase tracking-[0.2em] text-green-500">Total Task Reward</p>
                            <div class="flex items-center gap-3">
                                <span class="text-5xl font-black text-gray-900">+{{ totalTaskWorth }}</span>
                                <span class="text-xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full uppercase tracking-tighter">XP</span>
                            </div>
                        </div>

                        <div class="flex flex-wrap gap-2 text-sm text-gray-500 justify-center px-4">
                            <div class="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                <Check class="w-3.5 h-3.5 text-green-500" />
                                <span class="font-bold text-gray-700">5 XP</span> Base
                            </div>
                            <div class="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm font-bold">
                                <Star class="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                <span class="text-gray-700">{{ Math.floor(totalDuration / 60) }} XP</span> Focus
                            </div>
                            <div v-if="subtaskXP > 0" class="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-blue-100 shadow-sm font-bold">
                                <ListTodo class="w-3.5 h-3.5 text-blue-500" />
                                <span class="text-gray-700">{{ subtaskXP }} XP</span> Subtasks
                            </div>
                        </div>
                    </div>

                    <div class="mt-8">
                        <Button 
                            class="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-lg transition-all active:scale-95 shadow-xl shadow-gray-200"
                            @click="open = false"
                        >
                            AWESOME!
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>
