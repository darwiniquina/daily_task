<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash, AlertTriangle } from 'lucide-vue-next'
import type { Task } from '@/types'
import { useTaskStore } from '@/stores/tasks'
import { useGamificationStore } from '@/stores/gamification'
import { useTimerStore } from '@/stores/timer'
import { toast } from 'vue-sonner'
import ToolTipWrapper from '../ui/tooltip/TooltipWrapper.vue'

const taskStore = useTaskStore()
const gamificationStore = useGamificationStore()
const timerStore = useTimerStore()

const open = ref(false)
const loading = ref(false)

const props = defineProps<{
  task: Task
  asMenuItem?: boolean
}>()

const onSubmit = async () => {
  loading.value = true
  try {
    // 1. Revoke completion XP if the task was completed
    if (props.task.completed) {
      await gamificationStore.revokeXP('task_completion', props.task.id)
    }

    // 2. Revoke XP for all focus sessions associated with this task
    await timerStore.fetchTaskTimers(props.task.id)
    const timers = timerStore.taskTimers[props.task.id] || []

    for (const timer of timers) {
      await gamificationStore.revokeXP('focus_session', timer.id)
    }

    // 3. Delete the task
    await taskStore.deleteTask(props.task.id)

    open.value = false
    toast.success('Task deleted successfully. Earned XP has been revoked.')
  } catch (error: any) {
    toast.error('Error deleting task: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">

    <DialogTrigger v-if="asMenuItem" as-child>
      <Button variant="ghost" size="sm"
        class="justify-start text-sm font-normal text-red-600 hover:bg-red-50 hover:text-red-700 w-full">
        <Trash class="w-4 h-4 mr-2" />
        Delete Task
      </Button>
    </DialogTrigger>

    <ToolTipWrapper v-else text="Delete Task">
      <DialogTrigger as-child>
        <Button variant="destructive" size="sm" class="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200">
          <Trash class="h-4 w-4" />
        </Button>
      </DialogTrigger>
    </ToolTipWrapper>

    <DialogContent class="sm:max-w-[450px] border-red-100">
      <DialogHeader class="items-center text-center space-y-4">
        <div class="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
          <AlertTriangle class="h-8 w-8 text-red-600" />
        </div>
        <div class="space-y-2">
          <DialogTitle class="text-2xl font-black text-gray-900">Delete Permanently?</DialogTitle>
          <DialogDescription class="text-base text-gray-500 font-medium px-4">
            This action <span class="text-red-600 font-bold uppercase tracking-tight">cannot be undone</span>.
            All task data and <span class="text-red-600 font-bold underline">all XP earned</span> from this task will be
            permanently lost.
          </DialogDescription>
        </div>
      </DialogHeader>

      <div class="bg-red-50/50 rounded-2xl p-4 border border-red-100 my-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-white rounded-xl shadow-sm border border-red-100">
            <Trash class="h-5 w-5 text-red-500" />
          </div>
          <div class="flex-1">
            <p class="text-xs font-black uppercase tracking-wider text-red-400 mb-0.5">Task to delete</p>
            <p class="text-sm font-bold text-gray-700 line-clamp-1">{{ task.title }}</p>
          </div>
        </div>
      </div>

      <DialogFooter class="sm:flex-col gap-2">
        <Button type="button" variant="outline"
          class="w-full rounded-xl h-12 font-bold text-gray-600 border-gray-200 hover:bg-gray-50" @click="open = false">
          Nevermind, keep it
        </Button>
        <Button variant="destructive"
          class="w-full rounded-xl h-12 font-black text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100 transition-all active:scale-[0.98]"
          :disabled="loading" @click="onSubmit">
          <template v-if="loading">De-powering...</template>
          <template v-else>Confirm & Delete</template>
        </Button>
      </DialogFooter>
    </DialogContent>

  </Dialog>
</template>
