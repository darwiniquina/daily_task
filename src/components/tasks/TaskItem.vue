<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { type Task } from '@/types'
import { Button } from '@/components/ui/button'
import { Play, Check, Undo2, Clock, MoreVertical } from 'lucide-vue-next'
import { useTaskStore } from '@/stores/tasks'
import { useTimerStore } from '@/stores/timer'
import DeleteTask from './DeleteTask.vue'
import EditTask from './EditTask.vue'
import ToolTipWrapper from '../ui/tooltip/TooltipWrapper.vue'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDate, formatTimeOnly, formatDuration, formatTotalDuration, getDeadlineStatus } from '@/utils/formatters'
import { Badge } from '@/components/ui/badge'

import confetti from 'canvas-confetti'

const props = defineProps<{
    task: Task
    isActive?: boolean
    viewOnly?: boolean
}>()

const emit = defineEmits(['start-timer', 'stop-timer'])

const taskStore = useTaskStore()
const timerStore = useTimerStore()

const deadlineStatus = computed(() => {
    if (!props.task.deadline) return null
    return getDeadlineStatus(props.task.deadline)
})

onMounted(() => {
    timerStore.fetchTaskTimers(props.task.id)
})

const taskTimers = computed(() => {
    return timerStore.taskTimers[props.task.id] || []
})

const totalDuration = computed(() => {
    const timers = taskTimers.value
    return timers.reduce((acc, timer) => acc + (timer.duration || 0), 0)
})

const markAsComplete = () => {
    taskStore.updateTask(props.task.id, { completed: true })
    confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
    })
}

const markAsIncomplete = () => {
    taskStore.updateTask(props.task.id, { completed: false })
}
</script>

<template>
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-300 group"
        :class="{ 'ring-2 ring-blue-400 border-blue-400 shadow-blue-50': isActive, 'bg-green-50/30 border-green-200': task.completed }">
        <div class="p-5">
            <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0 space-y-2.5">
                    <!-- Title & Status Row -->
                    <div class="flex items-start gap-3 flex-wrap">
                        <h3 class="font-semibold text-gray-900 text-lg leading-tight flex-1 min-w-0"
                            :class="{ 'text-blue-700': isActive, 'line-through text-gray-500': task.completed }">
                            {{ task.title }}
                        </h3>
                        
                        <div class="flex items-center gap-2 flex-wrap">
                            <Badge v-if="deadlineStatus && !task.completed" 
                                :variant="deadlineStatus.overdue ? 'destructive' : (deadlineStatus.isClose ? 'default' : 'outline')" 
                                class="text-xs">
                                {{ deadlineStatus.label }}
                            </Badge>

                            <div v-if="task.completed"
                                class="bg-green-600 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                <Check class="w-3 h-3" />
                                Done
                            </div>
                            
                            <div v-if="totalDuration > 0"
                                class="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200 font-medium">
                                {{ formatTotalDuration(totalDuration) }}
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <p v-if="task.description" class="text-sm text-gray-600 leading-relaxed line-clamp-2" :title="task.description">
                        {{ task.description }}
                    </p>

                    <!-- Metadata -->
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                        <span v-if="task.deadline" class="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                            <Clock class="w-3 h-3" />
                            <span class="font-medium">Due {{ formatDate(task.deadline) }}</span>
                        </span>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div v-if="!viewOnly" class="flex items-start gap-1.5 shrink-0">
                    <!-- Focus/Stop Button -->
                    <ToolTipWrapper v-if="isActive" text="Stop Focus">
                        <Button variant="default" size="sm" class="rounded-lg" @click="$emit('stop-timer', task)">
                            <span class="w-2 h-2 bg-white rounded-sm animate-pulse mr-1.5"></span>
                            Stop
                        </Button>
                    </ToolTipWrapper>

                    <ToolTipWrapper v-else-if="!task.completed" text="Start Focus Session">
                        <Button variant="outline" size="sm" class="rounded-lg hover:bg-blue-50 hover:border-blue-300" @click="$emit('start-timer', task)">
                            <Play class="w-3.5 h-3.5 mr-1" />
                            Focus
                        </Button>
                    </ToolTipWrapper>

                    <!-- Undo Button (for completed tasks) -->
                    <ToolTipWrapper v-if="task.completed" text="Undo Completion">
                        <Button variant="ghost" size="sm" class="rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            @click="markAsIncomplete">
                            <Undo2 class="w-4 h-4" />
                        </Button>
                    </ToolTipWrapper>

                    <!-- More Actions Popover -->
                    <Popover>
                        <PopoverTrigger as-child>
                            <Button variant="ghost" size="sm" class="rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                                <MoreVertical class="w-4 h-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-48 p-2" align="end">
                            <div class="flex flex-col gap-1">
                                <!-- Mark as Complete/Incomplete -->
                                <Button v-if="!task.completed" variant="ghost" size="sm" 
                                    class="justify-start text-sm font-normal hover:bg-green-50 hover:text-green-700"
                                    @click="markAsComplete">
                                    <Check class="w-4 h-4 mr-2" />
                                    Mark as Done
                                </Button>

                                <!-- Edit Task -->
                                <EditTask :task="task" as-menu-item />

                                <!-- Delete Task -->
                                <DeleteTask :task="task" as-menu-item />
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>

        <!-- Timer History Accordion -->
        <Accordion v-if="taskTimers.length > 0" type="single" collapsible class="w-full border-t border-gray-200">
            <AccordionItem value="history" class="border-b-0">
                <AccordionTrigger
                    class="px-5 py-3 hover:no-underline hover:bg-gray-50 text-xs text-gray-500 uppercase tracking-wide font-medium transition-colors">
                    <div class="flex items-center gap-2">
                        <Clock class="w-3.5 h-3.5" />
                        Session History ({{ taskTimers.length }})
                    </div>
                </AccordionTrigger>
                <AccordionContent class="px-5 pb-4 pt-2 bg-gray-50/50">
                    <div class="space-y-2">
                        <div v-for="timer in taskTimers" :key="timer.id"
                            class="flex justify-between items-center text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-200">
                            <span class="font-medium">{{ formatDate(timer.start_time) }} - {{ timer.end_time ?
                                formatTimeOnly(timer.end_time) : 'Now' }}</span>
                            <span class="font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">{{ formatDuration(timer.duration) }}</span>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
</template>
