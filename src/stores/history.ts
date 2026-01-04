import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { Task } from '@/types'
import { toast } from 'vue-sonner'

export const useHistoryStore = defineStore('history', () => {
    const activityData = ref<Record<string, number>>({})
    const selectedDateTasks = ref<Task[]>([])
    const selectedDateFocusSeconds = ref(0)

    // Date Range Range filtering
    const startDate = ref<string>('')
    const endDate = ref<string>('')

    const loading = ref(false)
    const tasksLoading = ref(false)
    const focusLoading = ref(false)

    const fetchActivityLog = async () => {
        try {
            loading.value = true

            let query = supabase
                .from('tasks')
                .select('date')

            if (startDate.value) {
                query = query.gte('date', startDate.value)
            } else {
                // Default to last 365 days if no start date provided
                const oneYearAgo = new Date()
                oneYearAgo.setDate(oneYearAgo.getDate() - 365)
                query = query.gte('date', oneYearAgo.toLocaleDateString('en-CA'))
            }

            if (endDate.value) {
                query = query.lte('date', endDate.value)
            }

            const { data, error } = await query

            if (error) throw error

            const counts: Record<string, number> = {}
            data.forEach((item: any) => {
                if (item.date) {
                    counts[item.date] = (counts[item.date] || 0) + 1
                }
            })
            activityData.value = counts
        } catch (error: any) {
            console.error('Error fetching activity log:', error.message)
        } finally {
            loading.value = false
        }
    }

    const fetchFocusTimeForDate = async (date: string) => {
        try {
            focusLoading.value = true

            // Calculate start and end of that date
            const startOfDay = `${date}T00:00:00Z`
            const endOfDay = `${date}T23:59:59Z`

            const { data, error } = await supabase
                .from('timers')
                .select('duration')
                .gte('start_time', startOfDay)
                .lte('start_time', endOfDay)

            if (error) throw error

            const total = (data as { duration: number }[]).reduce((sum, timer) => sum + (timer.duration || 0), 0)
            selectedDateFocusSeconds.value = total
        } catch (error: any) {
            console.error('Error fetching focus time for date:', error.message)
        } finally {
            focusLoading.value = false
        }
    }

    const fetchTasksForDate = async (date: string) => {
        try {
            tasksLoading.value = true
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('date', date)
                .order('created_at', { ascending: false })

            if (error) throw error
            selectedDateTasks.value = data as Task[]
        } catch (error: any) {
            toast.error('Error fetching tasks for date: ' + error.message)
        } finally {
            tasksLoading.value = false
        }
    }

    return {
        activityData,
        selectedDateTasks,
        selectedDateFocusSeconds,
        startDate,
        endDate,
        loading,
        tasksLoading,
        focusLoading,
        fetchActivityLog,
        fetchTasksForDate,
        fetchFocusTimeForDate
    }
})
