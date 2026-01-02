
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { Timer } from '@/types'
import { useAuthStore } from './auth'
import { toast } from 'vue-sonner'

export const useTimerStore = defineStore('timer', () => {
    const activeTimer = ref<Timer | null>(null)
    const taskTimers = ref<Record<string, Timer[]>>({})
    const loading = ref(false)
    const intervalId = ref<number | null>(null)
    const elapsedTime = ref(0) // in seconds

    const authStore = useAuthStore()

    const calculateElapsed = () => {
        if (!activeTimer.value) {
            elapsedTime.value = 0
            return
        }
        const start = new Date(activeTimer.value.start_time).getTime()
        const now = new Date().getTime()
        elapsedTime.value = Math.floor((now - start) / 1000)
    }

    const startTicker = () => {
        if (intervalId.value) clearInterval(intervalId.value)
        calculateElapsed()
        intervalId.value = window.setInterval(calculateElapsed, 1000)
    }

    const stopTicker = () => {
        if (intervalId.value) {
            clearInterval(intervalId.value)
            intervalId.value = null
        }
    }

    const fetchActiveTimer = async () => {
        if (!authStore.user) return

        try {
            loading.value = true
            const { data, error } = await supabase
                .from('timers')
                .select('*')
                .is('end_time', null)
                .maybeSingle()

            if (error) throw error

            if (data) {
                activeTimer.value = data as Timer
                startTicker()
            } else {
                activeTimer.value = null
                stopTicker()
                elapsedTime.value = 0
            }
        } catch (error: any) {
            console.error('Error fetching active timer:', error.message)
        } finally {
            loading.value = false
        }
    }

    const fetchTaskTimers = async (taskId: string) => {
        if (!authStore.user) return

        try {
            const { data, error } = await supabase
                .from('timers')
                .select('*')
                .eq('task_id', taskId)
                .not('end_time', 'is', null)
                .order('start_time', { ascending: false })

            if (error) throw error
            taskTimers.value[taskId] = data as Timer[]
        } catch (error: any) {
            console.error('Error fetching task timers:', error.message)
        }
    }

    const todaysFocusSeconds = ref(0)

    const fetchTodaysFocusTime = async () => {
        if (!authStore.user) return

        try {
            const now = new Date()

            const startOfDay = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            )

            const endOfDay = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1
            )

            const { data, error } = await supabase
                .from('timers')
                .select('duration, start_time')
                .gte('start_time', startOfDay.toISOString())
                .lt('start_time', endOfDay.toISOString())

            console.log("Fetch today's focus time:", data)

            if (error) throw error

            const total = (data as Timer[]).reduce((sum, timer) => sum + (timer.duration || 0), 0)
            todaysFocusSeconds.value = total
        } catch (error: any) {
            console.error('Error fetching today\'s focus time:', error.message)
        }
    }

    const startTimer = async (taskId: string) => {
        if (!authStore.user) return

        // If there's already an active timer, stop it first
        if (activeTimer.value) {
            await stopTimer()
        }

        try {
            const { data, error } = await supabase
                .from('timers')
                .insert({
                    task_id: taskId,
                    user_id: authStore.user.id,
                    start_time: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            activeTimer.value = data as Timer
            startTicker()
            toast.success('Timer started')
        } catch (error: any) {
            toast.error('Error starting timer: ' + error.message)
        }
    }

    const stopTimer = async () => {
        if (!activeTimer.value) return

        try {
            const endTime = new Date().toISOString()
            const duration = elapsedTime.value
            const taskId = activeTimer.value.task_id

            const { error } = await supabase
                .from('timers')
                .update({
                    end_time: endTime,
                    duration: duration
                })
                .eq('id', activeTimer.value.id)

            if (error) throw error

            activeTimer.value = null
            stopTicker()
            elapsedTime.value = 0

            // Refresh timers for this task
            await fetchTaskTimers(taskId)

            // Refresh today's total focus time
            await fetchTodaysFocusTime()

            toast.success('Timer stopped')
        } catch (error: any) {
            toast.error('Error stopping timer: ' + error.message)
        }
    }

    return {
        activeTimer,
        taskTimers,
        loading,
        elapsedTime,
        todaysFocusSeconds,
        fetchActiveTimer,
        fetchTaskTimers,
        fetchTodaysFocusTime,
        startTimer,
        stopTimer
    }
})
