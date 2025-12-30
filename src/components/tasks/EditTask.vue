<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Task } from '@/types'
import ToolTipWrapper from '../ui/tooltip/TooltipWrapper.vue'

const props = defineProps<{
  task: Task
}>()

const taskStore = useTaskStore()
const open = ref(false)
const loading = ref(false)

const form = ref({
  title: '',
  description: '',
  deadline: ''
})

// Initialize form when dialog opens
watch(open, (newValue) => {
    if (newValue) {
        form.value = {
            title: props.task.title,
            description: props.task.description || '',
            deadline: props.task.deadline ? new Date(props.task.deadline).toISOString().slice(0, 16) : ''
        }
    }
})

const onSubmit = async () => {
    if (!form.value.title.trim()) {
        toast.error('Title is required')
        return
    }

    loading.value = true
    try {
        await taskStore.updateTask(props.task.id, {
            title: form.value.title,
            description: form.value.description,
            deadline: form.value.deadline ? new Date(form.value.deadline).toISOString() : undefined // Handle clearing deadline if needed? The input gives string. null/undefined logic might need update store.
        })
        open.value = false
        toast.success('Task updated successfully')
    } catch (e: any) {
        toast.error('Error updating task: ' + e.message)
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <Dialog v-model:open="open">
    <ToolTipWrapper text="Edit Task">
        <DialogTrigger as-child>
            <Button variant="ghost" size="sm">
                <Pencil class="h-4 w-4" />
            </Button>
        </DialogTrigger>
    </ToolTipWrapper>

    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogDescription>
          Make changes to your task here. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit" class="space-y-4 py-4">
        <div class="space-y-2">
            <Label for="edit-title">Title <span class="text-red-500">*</span></Label>
            <Input id="edit-title" v-model="form.title" placeholder="Task title" :disabled="loading" />
        </div>
        <div class="space-y-2">
            <Label for="edit-description">Description</Label>
            <textarea
                id="edit-description"
                v-model="form.description"
                class="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Task description"
                :disabled="loading"
            ></textarea>
        </div>
        <div class="space-y-2">
            <Label for="edit-deadline">Deadline</Label>
            <Input id="edit-deadline" type="datetime-local" v-model="form.deadline" :disabled="loading" />
        </div>
        <DialogFooter>
            <Button type="button" variant="ghost" @click="open = false">Cancel</Button>
            <Button type="submit" :disabled="loading">Save Changes</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
