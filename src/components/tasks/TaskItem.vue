<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { type Task } from '@/types'
import { Button } from '@/components/ui/button'
import { Play, Check, Undo2, Clock, MoreVertical, ListTodo } from 'lucide-vue-next'
import { useTaskStore } from '@/stores/tasks'
import { useTimerStore } from '@/stores/timer'
import { useGamificationStore } from '@/stores/gamification'
import DeleteTask from './DeleteTask.vue'
import EditTask from './EditTask.vue'
import ToolTipWrapper from '../ui/tooltip/TooltipWrapper.vue'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDate, formatTimeOnly, formatDuration, formatTotalDuration, getDeadlineStatus } from '@/utils/formatters'
import { Badge } from '@/components/ui/badge'
import MarkAsDone from './MarkAsDone.vue'
import { useProductivityTheme } from '@/composables/useProductivityTheme'


const props = defineProps<{
    task: Task
    isActive?: boolean
    viewOnly?: boolean
}>()

const emit = defineEmits(['start-timer', 'stop-timer'])

const taskStore = useTaskStore()
const timerStore = useTimerStore()
const gamificationStore = useGamificationStore()
const { theme } = useProductivityTheme()

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

const markAsIncomplete = async () => {
    await taskStore.updateTask(props.task.id, { completed: false })
    await gamificationStore.revokeXP('task_completion', props.task.id)
}

const toggleSubtask = async (subtask: any) => {
    const newState = !subtask.completed
    await taskStore.toggleSubtask(props.task.id, subtask.id, newState)
    if (newState) {
        await gamificationStore.addXP(3, 'subtask_completion', subtask.id)
    } else {
        await gamificationStore.revokeXP('subtask_completion', subtask.id)
    }
}
</script>

<template>
    <div class="rounded-2xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden transition-all duration-700 hover:shadow-lg dark:hover:shadow-white/5 group bg-white dark:bg-zinc-900/50 backdrop-blur-sm"
        :class="[
            isActive ? `ring-2 ring-${theme.primary}/50 border-${theme.primary} bg-${theme.light}/30 dark:bg-${theme.primary}/10 shadow-xl shadow-${theme.primary}/10` : '',
            task.completed ? 'bg-green-50/30 dark:bg-green-900/10 border-green-200/50 dark:border-green-800/50' : ''
        ]">
        <div class="p-5">
            <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0 space-y-2.5">
                    <!-- Title & Status Row -->
                    <div class="flex items-start gap-3 flex-wrap">
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight flex-1 min-w-0"
                            :class="[
                                isActive ? `text-${theme.primary}` : '',
                                task.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''
                            ]">
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
                                class="text-xs font-mono px-2.5 py-1 rounded-full border border-current font-medium transition-all duration-700"
                                :class="[`bg-${theme.light}/50 dark:bg-${theme.primary}/20`, `text-${theme.secondary} dark:text-${theme.primary}`]">
                                {{ formatTotalDuration(totalDuration) }}
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <p v-if="task.description"
                        class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2"
                        :title="task.description">
                        {{ task.description }}
                    </p>

                    <!-- Metadata -->
                    <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span v-if="task.deadline"
                            class="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md">
                            <Clock class="w-3.5 h-3.5" />
                            <span class="font-medium">Due {{ formatDate(task.deadline) }}</span>
                        </span>
                    </div>

                    <!-- Subtasks Section -->
                    <div v-if="task.subtasks && task.subtasks.length > 0" class="pt-2 space-y-2">
                        <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            <div class="flex items-center gap-1.5">
                                <ListTodo class="w-3 h-3" />
                                <span>Subtasks ({{ task.subtasks.filter(s => s.completed).length }}/{{ task.subtasks.length }})</span>
                            </div>
                            <div class="h-1.5 w-24 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div class="h-full bg-green-500 transition-all duration-500"
                                    :style="{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }">
                                </div>
                            </div>
                        </div>
                        <div class="grid gap-1.5">
                            <div v-for="subtask in task.subtasks" :key="subtask.id"
                                class="flex items-center gap-2 group/subtask cursor-pointer select-none"
                                @click.stop="toggleSubtask(subtask)">
                                <div class="w-4 h-4 rounded border flex items-center justify-center transition-all duration-300"
                                    :class="[
                                        subtask.completed 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 dark:border-white/10 group-hover/subtask:border-green-400'
                                    ]">
                                    <Check v-if="subtask.completed" class="w-2.5 h-2.5" />
                                </div>
                                <span class="text-sm transition-all duration-300"
                                    :class="subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'">
                                    {{ subtask.title }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div v-if="!viewOnly" class="flex items-start gap-1.5 shrink-0">
                    <!-- Focus/Stop Button -->
                    <ToolTipWrapper v-if="isActive" text="Stop Focus">
                        <Button variant="default" size="sm" class="rounded-lg transition-all duration-700"
                            :class="`bg-${theme.primary} hover:bg-${theme.secondary} shadow-lg shadow-${theme.primary}/30`"
                            @click="$emit('stop-timer', task)">
                            <span class="w-2 h-2 bg-white rounded-sm animate-pulse mr-1.5"></span>
                            Stop
                        </Button>
                    </ToolTipWrapper>

                    <ToolTipWrapper v-else-if="!task.completed"
                        :text="timerStore.activeTimer ? 'Complete or stop your current focus session first' : 'Start Focus Session'">
                        <Button variant="outline" size="sm"
                            class="rounded-lg transition-all duration-700 disabled:opacity-50"
                            :class="`hover:bg-${theme.light} hover:border-${theme.accent}/50 hover:text-${theme.secondary}`"
                            @click="$emit('start-timer', task)" :disabled="!!timerStore.activeTimer">
                            <Play class="w-3.5 h-3.5 mr-1" />
                            Focus
                        </Button>
                    </ToolTipWrapper>

                    <!-- Undo Button (for completed tasks) -->
                    <ToolTipWrapper v-if="task.completed" text="Undo Completion">
                        <Button variant="ghost" size="sm"
                            class="rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                            @click="markAsIncomplete">
                            <Undo2 class="w-4 h-4" />
                        </Button>
                    </ToolTipWrapper>

                    <!-- More Actions Popover -->
                    <Popover>
                        <PopoverTrigger as-child>
                            <Button variant="ghost" size="sm"
                                class="rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                                <MoreVertical class="w-4 h-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-48 p-2" align="end">
                            <div class="flex flex-col gap-1">

                                <MarkAsDone :task="task" as-menu-item :totalDuration="totalDuration" />

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
                    class="px-5 py-3 hover:no-underline hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium transition-colors">
                    <div class="flex items-center gap-2">
                        <Clock class="w-3.5 h-3.5" />
                        Session History ({{ taskTimers.length }})
                    </div>
                </AccordionTrigger>
                <AccordionContent class="px-5 pb-4 pt-2 bg-gray-50/50 dark:bg-black/20">
                    <div class="space-y-2">
                        <div v-for="timer in taskTimers" :key="timer.id"
                            class="flex justify-between items-center text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 border border-black/5 dark:border-white/5">
                            <span class="font-medium">{{ formatDate(timer.start_time) }} - {{ timer.end_time ?
                                formatTimeOnly(timer.end_time) : 'Now' }}</span>
                            <span class="font-mono font-semibold px-2 py-0.5 rounded transition-all duration-700"
                                :class="[`text-${theme.secondary} dark:text-${theme.primary}`, `bg-${theme.light} dark:bg-${theme.primary}/20`]">
                                {{ formatDuration(timer.duration) }}
                            </span>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
</template>
