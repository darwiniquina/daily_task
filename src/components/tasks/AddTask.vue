<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
import { Plus, Calendar as CalendarIcon, Clock } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { format } from 'date-fns'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

const taskStore = useTaskStore()
const open = ref(false)
const loading = ref(false)

const form = ref({
  title: '',
  description: '',
  date: undefined as any,
  deadlineDate: undefined as any,
  deadlineTime: ''
})

watch(open, (isOpen) => {
  if (isOpen) {
    const dateStr = taskStore.startDate
    const parts = dateStr.split('-').map(Number)

    form.value.date = new CalendarDate(parts[0] as number, parts[1] as number, parts[2] as number)
    form.value.deadlineDate = undefined
    form.value.deadlineTime = ''
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

    let deadlineISO = undefined
    if (form.value.deadlineDate) {
      const dDate = form.value.deadlineDate.toDate(getLocalTimeZone())
      if (form.value.deadlineTime) {
        const [hours, minutes] = form.value.deadlineTime.split(':').map(Number)
        dDate.setHours(hours, minutes)
      } else {
        // Default to end of day if no time
        dDate.setHours(23, 59, 59)
      }
      deadlineISO = dDate.toISOString()
    }

    await taskStore.addTask({
      title: form.value.title,
      description: form.value.description,
      date: dateStr,
      deadline: deadlineISO,
      completed: false
    })
    form.value = { title: '', description: '', date: undefined, deadlineDate: undefined, deadlineTime: '' }
    open.value = false
  } catch (e) {
    // handled in store
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button class="rounded-2xl shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white px-6 h-11 font-bold">
        <Plus class="mr-2 h-5 w-5" /> Add New Task
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogDescription>
          Create a new task to track your progress.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit" class="space-y-4 py-4">

        <!-- Title -->
        <div class="space-y-2">
          <Label for="title">Title <span class="text-red-500">*</span></Label>
          <Input id="title" v-model="form.title" placeholder="What needs to be done?" :disabled="loading" autofocus />
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
              <Calendar v-model="form.date" initial-focus />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="description">Description</Label>
          <textarea id="description" v-model="form.description"
            class="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Add details about this task..." :disabled="loading"></textarea>
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
              <Calendar v-model="form.deadlineDate" initial-focus />
              <div class="p-3 border-t border-border">
                <Label class="mb-2 block text-xs">Time (optional)</Label>
                <Input type="time" v-model="form.deadlineTime" class="w-full" />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" @click="open = false">Cancel</Button>
          <Button type="submit" :disabled="loading">Create Task</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
