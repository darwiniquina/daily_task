import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { Task } from '@/types'
import { toast } from 'vue-sonner'

export const useTaskStore = defineStore('tasks', () => {
    const tasks = ref<Task[]>([])
    const loading = ref(false)

    // Persistence helper
    const getSaved = (key: string, def: any) => {
        const val = localStorage.getItem(key)
        return val ? JSON.parse(val) : def
    }

    const searchQuery = ref(getSaved('task_search_query', ''))

    // Persist changes
    watch(searchQuery, (val) => localStorage.setItem('task_search_query', JSON.stringify(val)))

    const fetchTasks = async () => {
        try {
            loading.value = true
            const today = new Date().toLocaleDateString('en-CA')

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('date', today)
                .order('created_at', { ascending: false })

            if (error) throw error
            tasks.value = data as Task[]
        } catch (error: any) {
            toast.error('Error fetching tasks: ' + error.message)
        } finally {
            loading.value = false
        }
    }

    // Front-end filtering
    const filteredTasks = computed(() => {
        if (!searchQuery.value) return tasks.value
        const q = searchQuery.value.toLowerCase()
        return tasks.value.filter(t =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q))
        )
    })

    const addTask = async (task: Partial<Task>) => {
        try {
            const today = new Date().toLocaleDateString('en-CA')
            const taskWithDate = { ...task, date: task.date || today }

            const { data, error } = await supabase
                .from('tasks')
                .insert([taskWithDate])
                .select()
                .single()

            if (error) throw error
            tasks.value.unshift(data as Task)
            toast.success('Task added')
        } catch (error: any) {
            toast.error('Error adding task: ' + error.message)
            throw error
        }
    }

    const updateTask = async (id: string, updates: Partial<Task>) => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            const index = tasks.value.findIndex(t => t.id === id)
            if (index !== -1) {
                tasks.value[index] = data as Task
            }
        } catch (error: any) {
            toast.error('Error updating task: ' + error.message)
        }
    }

    const deleteTask = async (id: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id)

            if (error) throw error
            tasks.value = tasks.value.filter(t => t.id !== id)
            toast.success('Task deleted')
        } catch (error: any) {
            toast.error('Error deleting task: ' + error.message)
        }
    }

    return {
        tasks,
        filteredTasks,
        loading,
        searchQuery,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask
    }
})

