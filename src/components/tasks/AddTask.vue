<script setup lang="ts">
import { ref } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-vue-next'

const taskStore = useTaskStore()
const title = ref('')
const loading = ref(false)

const onSubmit = async () => {
  if (!title.value.trim()) return
  loading.value = true
  try {
    await taskStore.addTask({ title: title.value, completed: false })
    title.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="flex gap-2 mb-6">
    <Input v-model="title" placeholder="What keeps you busy today?" class="flex-1" :disabled="loading" />
    <Button type="submit" :disabled="loading">
      <Plus class="mr-2 h-4 w-4" /> Add Task
    </Button>
  </form>
</template>
