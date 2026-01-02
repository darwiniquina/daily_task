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
import { Trash } from 'lucide-vue-next'
import type { Task } from '@/types'
import { useTaskStore } from '@/stores/tasks'
import { toast } from 'vue-sonner'
import ToolTipWrapper from '../ui/tooltip/TooltipWrapper.vue'

const taskStore = useTaskStore()
const open = ref(false)
const loading = ref(false)

const props = defineProps<{
  task: Task
  asMenuItem?: boolean
}>()

const onSubmit = async () => {
  loading.value = true
  try {
    taskStore.deleteTask(props.task.id)
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
      <Button variant="ghost" size="sm" class="justify-start text-sm font-normal hover:bg-red-50 hover:text-red-700">
        <Trash class="w-4 h-4 mr-2" />
        Delete Task
      </Button>
    </DialogTrigger>

    <ToolTipWrapper v-else text="Delete Task">
      <DialogTrigger as-child>
        <Button variant="destructive" size="sm">
          <Trash class="h-4 w-4" />
        </Button>
      </DialogTrigger>
    </ToolTipWrapper>

    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this task?
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit" class="space-y-4 py-4">
        <DialogFooter>
          <Button type="button" variant="ghost" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="loading">Delete Task</Button>
        </DialogFooter>
      </form>
    </DialogContent>

  </Dialog>
</template>
