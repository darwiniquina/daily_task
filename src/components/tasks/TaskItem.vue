<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { type Task } from '@/types'
import { Button } from '@/components/ui/button'
import { Play, Check, Undo2, Clock } from 'lucide-vue-next'
import { useTaskStore } from '@/stores/tasks'
import { useTimerStore } from '@/stores/timer'
import DeleteTask from './DeleteTask.vue'
import EditTask from './EditTask.vue'
import ToolTipWrapper from '../ui/tooltip/TooltipWrapper.vue'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { formatDate, formatTimeOnly, formatDuration, formatTotalDuration, getDeadlineStatus } from '@/utils/formatters'
import { Badge } from '@/components/ui/badge'

const props = defineProps<{
    task: Task
    isActive?: boolean
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
}

const markAsIncomplete = () => {
    taskStore.updateTask(props.task.id, { completed: false })
}
</script>

<template>
    <div class="bg-white rounded-lg shadow-sm border mb-3 overflow-hidden transition-all hover:shadow-md"
        :class="{ 'border-blue-500 ring-1 ring-blue-500': isActive, 'bg-green-50': task.completed }">
        <div :class="{ 'bg-green-50': task.completed }" class="p-4 flex items-start justify-between relative z-10">
            <div class="flex-1 mr-4 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 class="font-medium text-gray-900 text-lg truncate max-w-full"
                        :class="{ 'text-blue-700': isActive, 'line-through text-gray-400': task.completed }">
                        {{ task.title }}
                    </h3>

                    <Badge v-if="deadlineStatus && !task.completed" :variant="deadlineStatus.overdue ? 'secondary' : (deadlineStatus.isClose ? 'default' : 'outline')" class="ml-auto">
                        {{ deadlineStatus.label }}
                    </Badge>

                    <span v-if="task.completed"
                        class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center">
                        <Check class="w-3 h-3 mr-1" />
                        Completed
                    </span>
                    <span v-if="totalDuration > 0"
                        class="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border">
                        Total: {{ formatTotalDuration(totalDuration) }}
                    </span>
                </div>

                <p v-if="task.description" class="text-sm text-gray-600 mb-2 line-clamp-2" :title="task.description">{{
                    task.description }}</p>

                <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span v-if="task.deadline" class="flex items-center">
                        <Clock class="w-3 h-3 mr-1" />
                        Due: {{ formatDate(task.deadline) }}
                    </span>
                </div>
            </div>

            <div class="flex flex-row gap-1 shrink-0 items-start">
                <ToolTipWrapper v-if="isActive" text="Stop Focus">
                    <Button variant="default" size="sm" @click="$emit('stop-timer', task)">
                        <span class="w-2 h-2 bg-white rounded-sm animate-pulse"></span>
                    </Button>
                </ToolTipWrapper>


                <ToolTipWrapper v-else-if="!task.completed" text="Focus">
                    <Button variant="outline" size="sm" @click="$emit('start-timer', task)">
                        <Play class="w-3 h-3 mr-1" />
                    </Button>
                </ToolTipWrapper>


                <ToolTipWrapper v-if="!task.completed" text="Mark Done">
                    <Button variant="ghost" size="sm" class="text-gray-500 hover:text-green-700 hover:bg-green-50"
                        @click="markAsComplete">
                        <Check class="w-4 h-4 mr-1" />
                    </Button>
                </ToolTipWrapper>

                <ToolTipWrapper v-else text="Undo Completion">
                    <Button variant="ghost" size="sm" class="text-gray-400 hover:text-gray-600"
                        @click="markAsIncomplete">
                        <Undo2 class="w-4 h-4" />
                    </Button>
                </ToolTipWrapper>

                <EditTask :task="task" />
                <DeleteTask :task="task" />

            </div>
        </div>

        <!-- Timer History -->
        <!-- Timer History Accordion -->
        <Accordion v-if="taskTimers.length > 0" type="single" collapsible class="w-full border-t">
            <AccordionItem value="history" class="border-b-0">
                <AccordionTrigger
                    class="px-4 py-2 hover:no-underline hover:bg-gray-50 text-xs text-gray-500 uppercase tracking-wide font-medium">
                    Session History
                </AccordionTrigger>
                <AccordionContent class="px-4 pb-3 pt-0 bg-gray-50">
                    <div class="space-y-1">
                        <div v-for="timer in taskTimers" :key="timer.id"
                            class="flex justify-between text-xs text-gray-600 border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                            <span>{{ formatDate(timer.start_time) }} - {{ timer.end_time ?
                                formatTimeOnly(timer.end_time) : 'Now' }}</span>
                            <span class="font-mono text-gray-900 font-medium">{{ formatDuration(timer.duration)
                            }}</span>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
</template>
