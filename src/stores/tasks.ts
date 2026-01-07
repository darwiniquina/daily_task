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
                .select('*, subtasks(*)')
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

    const addTask = async (task: Partial<Task>, subtasks: string[] = []) => {
        try {
            const today = new Date().toLocaleDateString('en-CA')
            const taskWithDate = { ...task, date: task.date || today }

            const { data: newTask, error } = await supabase
                .from('tasks')
                .insert([taskWithDate])
                .select()
                .single()

            if (error) throw error

            if (subtasks.length > 0) {
                const subtasksToInsert = subtasks.map(title => ({
                    task_id: newTask.id,
                    title,
                    completed: false
                }))
                const { data: insertedSubtasks, error: subError } = await supabase
                    .from('subtasks')
                    .insert(subtasksToInsert)
                    .select()

                if (subError) throw subError
                newTask.subtasks = insertedSubtasks
            } else {
                newTask.subtasks = []
            }

            tasks.value.unshift(newTask as Task)
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
                .select('*, subtasks(*)')
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

    const toggleSubtask = async (taskId: string, subtaskId: string, completed: boolean) => {
        try {
            const { data, error } = await supabase
                .from('subtasks')
                .update({ completed })
                .eq('id', subtaskId)
                .select()
                .single()

            if (error) throw error

            const task = tasks.value.find(t => t.id === taskId)
            if (task && task.subtasks) {
                const subtaskIndex = task.subtasks.findIndex(s => s.id === subtaskId)
                if (subtaskIndex !== -1) {
                    task.subtasks[subtaskIndex] = data
                }
            }
            return data
        } catch (error: any) {
            toast.error('Error updating subtask: ' + error.message)
        }
    }

    const addSubtask = async (taskId: string, title: string) => {
        try {
            const { data, error } = await supabase
                .from('subtasks')
                .insert([{ task_id: taskId, title, completed: false }])
                .select()
                .single()

            if (error) throw error

            const task = tasks.value.find(t => t.id === taskId)
            if (task) {
                if (!task.subtasks) {
                    task.subtasks = []
                }
                task.subtasks.push(data)
            }
        } catch (error: any) {
            toast.error('Error adding subtask: ' + error.message)
        }
    }

    const deleteSubtask = async (taskId: string, subtaskId: string) => {
        try {
            const { error } = await supabase
                .from('subtasks')
                .delete()
                .eq('id', subtaskId)

            if (error) throw error

            const task = tasks.value.find(t => t.id === taskId)
            if (task && task.subtasks) {
                task.subtasks = task.subtasks.filter(s => s.id !== subtaskId)
            }
        } catch (error: any) {
            toast.error('Error deleting subtask: ' + error.message)
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
        deleteTask,
        toggleSubtask,
        addSubtask,
        deleteSubtask
    }
})

