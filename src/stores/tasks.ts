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
    const startDate = ref(getSaved('task_start_date', new Date().toISOString().split('T')[0]))
    const endDate = ref(getSaved('task_end_date', new Date().toISOString().split('T')[0]))
    const filterFields = ref<string[]>(getSaved('task_filter_fields', ['date', 'created_at', 'deadline']))

    // Persist changes
    watch(searchQuery, (val) => localStorage.setItem('task_search_query', JSON.stringify(val)))
    watch(startDate, (val) => localStorage.setItem('task_start_date', JSON.stringify(val)))
    watch(endDate, (val) => localStorage.setItem('task_end_date', JSON.stringify(val)))
    watch(filterFields, (val) => localStorage.setItem('task_filter_fields', JSON.stringify(val)), { deep: true })

    const fetchTasks = async () => {
        try {
            loading.value = true

            let query = supabase
                .from('tasks')
                .select('*')

            if (filterFields.value.length > 0) {
                const orParts = filterFields.value.map(field => {
                    const s = startDate.value.includes('T') ? startDate.value : `${startDate.value}T00:00:00Z`
                    const e = endDate.value.includes('T') ? endDate.value : `${endDate.value}T23:59:59Z`

                    if (field === 'created_at') {
                        return `and(${field}.gte.${s},${field}.lte.${e})`
                    }
                    return `and(${field}.gte.${startDate.value},${field}.lte.${endDate.value})`
                })
                query = query.or(orParts.join(','))
            }

            const { data, error } = await query.order('created_at', { ascending: false })

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

            const dateToUse = startDate.value === endDate.value ? startDate.value : new Date().toISOString().split('T')[0]

            const taskWithDate = { ...task, date: task.date || dateToUse }

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
        startDate,
        endDate,
        filterFields,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask
    }
})

