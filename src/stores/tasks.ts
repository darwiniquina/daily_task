import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { Task } from '@/types'
import { toast } from 'vue-sonner'

export const useTaskStore = defineStore('tasks', () => {
    const tasks = ref<Task[]>([])
    const loading = ref(false)

    const fetchTasks = async () => {
        try {
            loading.value = true
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            tasks.value = data as Task[]
        } catch (error: any) {
            toast.error('Error fetching tasks: ' + error.message)
        } finally {
            loading.value = false
        }
    }

    const addTask = async (task: Partial<Task>) => {
        try {
            console.log(task)

            const { data, error } = await supabase
                .from('tasks')
                .insert([task])
                .select()
                .single()

            if (error) throw error
            tasks.value.unshift(data as Task)
            toast.success('Task added')
        } catch (error: any) {
            toast.error('Error adding task: ' + error.message)
            throw error // Re-throw to handle in UI
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
        loading,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask
    }
})
