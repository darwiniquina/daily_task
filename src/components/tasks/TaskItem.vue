<script setup lang="ts">
import { type Task } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Trash2, Play } from 'lucide-vue-next'
import { useTaskStore } from '@/stores/tasks'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits(['start-timer'])

const taskStore = useTaskStore()

const toggleComplete = (checked: boolean) => {
  taskStore.updateTask(props.task.id, { completed: checked })
}
</script>

<template>
  <div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border mb-2 group hover:border-blue-200 transition-colors">
    <div class="flex items-center space-x-4">
      <Checkbox :checked="task.completed" @update:checked="toggleComplete" />
      <div :class="{ 'line-through text-gray-500': task.completed }">
        <h3 class="font-medium text-gray-900">{{ task.title }}</h3>
        <p v-if="task.description" class="text-xs text-gray-500">{{ task.description }}</p>
      </div>
    </div>
    <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button v-if="!task.completed" variant="outline" size="sm" @click="$emit('start-timer', task)">
         <Play class="h-3 w-3 mr-1" /> Focus
      </Button>
      <Button variant="ghost" size="icon" class="text-red-500 hover:text-red-700 hover:bg-red-50" @click="taskStore.deleteTask(task.id)">
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
