<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Pencil, Calendar as CalendarIcon, Clock } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Task } from '@/types'
import ToolTipWrapper from '../ui/tooltip/TooltipWrapper.vue'
import { format } from 'date-fns'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

const props = defineProps<{
  task: Task
  asMenuItem?: boolean
}>()

const taskStore = useTaskStore()
const open = ref(false)
const loading = ref(false)

const form = ref({
  title: '',
  description: '',
  date: undefined as any,
  deadlineDate: undefined as any,
  deadlineTime: '',
  subtasks: [] as { id?: string, title: string, completed: boolean }[]
})

watch(open, (newValue) => {
  if (newValue) {
    let dateVal = undefined
    if (props.task.date) {
      const [y, m, d] = props.task.date.split('-').map(Number)
      if (y !== undefined && m !== undefined && d !== undefined) {
        dateVal = new CalendarDate(y, m, d)
      }
    } else if (props.task.created_at) { // Fallback if no specific date set, use created_at
      const d = new Date(props.task.created_at)
      dateVal = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
    }

    // Parse existing deadline
    let deadlineDateVal = undefined
    let deadlineTimeVal = ''
    if (props.task.deadline) {
      const d = new Date(props.task.deadline)
      deadlineDateVal = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
      // Extract HH:mm
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      deadlineTimeVal = `${hours}:${minutes}`
    }

    form.value = {
      title: props.task.title,
      description: props.task.description || '',
      date: dateVal,
      deadlineDate: deadlineDateVal,
      deadlineTime: deadlineTimeVal,
      subtasks: props.task.subtasks ? props.task.subtasks.map(s => ({ ...s })) : []
    }
  }
})

const dateDisplay = computed(() => {
  if (!form.value.date) return 'Pick a date'
  const d = form.value.date.toDate(getLocalTimeZone())
  return format(d, 'PPP')
})

const deadlineDisplay = computed(() => {
  if (!form.value.deadlineDate) return 'Pick a deadline'
  const d = form.value.deadlineDate.toDate(getLocalTimeZone())
  const dateStr = format(d, 'PPP')
  if (form.value.deadlineTime) {
    return `${dateStr} at ${form.value.deadlineTime}`
  }
  return dateStr
})

const addInlineSubtask = () => {
  form.value.subtasks.push({ title: '', completed: false })
}

const removeSubtask = async (index: number) => {
  const subtask = form.value.subtasks[index]
  if (subtask && subtask.id) {
    await taskStore.deleteSubtask(props.task.id, subtask.id)
  }
  form.value.subtasks.splice(index, 1)
}

const onSubmit = async () => {
  if (!form.value.title.trim()) {
    toast.error('Title is required')
    return
  }

  if (!form.value.date) {
    toast.error('Date is required')
    return
  }

  loading.value = true
  try {
    const taskDate = form.value.date.toDate(getLocalTimeZone())
    const dateStr = format(taskDate, 'yyyy-MM-dd')

    // Construct deadline ISO string if provided
    let deadlineISO = null
    if (form.value.deadlineDate) {
      const dDate = form.value.deadlineDate.toDate(getLocalTimeZone())
      if (form.value.deadlineTime) {
        const [h, min] = form.value.deadlineTime.split(':').map(Number)
        if (h !== undefined && min !== undefined) {
          dDate.setHours(h, min)
        }
      } else {
        dDate.setHours(23, 59, 59)
      }
      deadlineISO = dDate.toISOString()
    }

    await taskStore.updateTask(props.task.id, {
      title: form.value.title,
      description: form.value.description,
      date: dateStr,
      deadline: deadlineISO || undefined
    })

    // Handle new subtasks (those without an id)
    const newSubtasks = form.value.subtasks.filter(s => !s.id && s.title.trim() !== '')
    for (const s of newSubtasks) {
      await taskStore.addSubtask(props.task.id, s.title)
    }

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
    <!-- Menu Item Version -->
    <DialogTrigger v-if="asMenuItem" as-child>
      <Button variant="ghost" size="sm" class="justify-start text-sm font-normal hover:bg-blue-50 hover:text-blue-700">
        <Pencil class="w-4 h-4 mr-2" />
        Edit Task
      </Button>
    </DialogTrigger>

    <!-- Icon Button Version -->
    <ToolTipWrapper v-else text="Edit Task">
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

        <!-- Title -->
        <div class="space-y-2">
          <Label for="edit-title">Title <span class="text-red-500">*</span></Label>
          <Input id="edit-title" v-model="form.title" placeholder="Task title" :disabled="loading" />
        </div>

        <!-- Date Picker (Task Date) -->
        <div class="space-y-2">
          <Label>Date <span class="text-red-500">*</span></Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" :class="cn(
                'w-full justify-start text-left font-normal',
                !form.date && 'text-muted-foreground'
              )">
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ dateDisplay }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-model="form.date" />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="edit-description">Description</Label>
          <textarea id="edit-description" v-model="form.description"
            class="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Task description" :disabled="loading"></textarea>
        </div>

        <!-- Deadline Picker (Date + Time) -->
        <div class="space-y-2">
          <Label>Deadline</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" :class="cn(
                'w-full justify-start text-left font-normal',
                !form.deadlineDate && 'text-muted-foreground'
              )">
                <Clock class="mr-2 h-4 w-4" />
                {{ deadlineDisplay }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar v-model="form.deadlineDate" />
              <div class="p-3 border-t border-border">
                <Label class="mb-2 block text-xs">Time (optional)</Label>
                <Input type="time" v-model="form.deadlineTime" class="w-full" />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <!-- Subtasks Repeater -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between">
            <Label class="text-xs font-black uppercase tracking-widest text-gray-500">Subtasks</Label>
            <span class="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{{ form.subtasks.length }} items</span>
          </div>
          
          <div v-if="form.subtasks.length > 0" class="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
            <div v-for="(subtask, index) in form.subtasks" :key="index" class="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-300">
              <div class="flex-1 relative">
                <Input v-model="subtask.title" placeholder="What needs to be done?" 
                  class="h-9 pr-8"
                  :disabled="loading" />
                <div class="absolute left-[-15px] top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
              </div>
              <Button type="button" variant="ghost" size="sm" 
                class="h-9 w-9 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                @click="removeSubtask(index)">
                <Plus class="w-4 h-4 rotate-45" />
              </Button>
            </div>
          </div>

          <Button type="button" variant="outline" size="sm" 
            class="w-full border-dashed border-2 font-bold hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all h-10"
            @click="addInlineSubtask">
            <Plus class="w-4 h-4 mr-2" /> Add Step
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="loading">Save Changes</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
