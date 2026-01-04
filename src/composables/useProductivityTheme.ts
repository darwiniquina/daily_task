import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'

export function useProductivityTheme() {
    const timerStore = useTimerStore()
    const today = new Date().toLocaleDateString('en-CA')

    const totalFocusSecondsToday = computed(() => {
        let total = timerStore.todaysFocusSeconds

        const activeStart = timerStore.activeTimer?.start_time as string | undefined
        // check if start_time exists and is for today
        if (activeStart && activeStart.split('T')[0] === today) {
            total += timerStore.elapsedTime
        }

        return total
    })

    const focusHours = computed(() => {
        return totalFocusSecondsToday.value / 3600
    })

    const theme = computed(() => {
        const hours = focusHours.value

        if (hours === 0) return {
            gradient: 'from-gray-400 via-gray-500 to-gray-600',
            primary: 'gray-500',
            accent: 'gray-400',
            light: 'gray-100',
            glow: 'gray-400/20',
            secondary: 'gray-600',
            border: 'border-gray-300'
        }
        if (hours < 1) return {
            gradient: 'from-blue-400 via-blue-500 to-blue-600',
            primary: 'blue-500',
            accent: 'blue-400',
            light: 'blue-100',
            glow: 'blue-500/20',
            secondary: 'blue-600',
            border: 'border-blue-300'
        }
        if (hours < 2) return {
            gradient: 'from-purple-400 via-purple-500 to-purple-600',
            primary: 'purple-500',
            accent: 'purple-400',
            light: 'purple-100',
            glow: 'purple-500/20',
            secondary: 'purple-600',
            border: 'border-purple-300'
        }
        if (hours < 4) return {
            gradient: 'from-orange-400 via-orange-500 to-red-500',
            primary: 'orange-500',
            accent: 'orange-400',
            light: 'orange-100',
            glow: 'orange-500/20',
            secondary: 'red-600',
            border: 'border-orange-300'
        }
        if (hours < 6) return {
            gradient: 'from-red-400 via-pink-500 to-purple-600',
            primary: 'pink-500',
            accent: 'red-400',
            light: 'pink-100',
            glow: 'pink-500/20',
            secondary: 'purple-700',
            border: 'border-red-300'
        }
        return {
            gradient: 'from-yellow-400 via-orange-500 to-red-600',
            primary: 'orange-500',
            accent: 'yellow-400',
            light: 'yellow-100',
            glow: 'orange-500/20',
            secondary: 'red-700',
            border: 'border-yellow-300'
        }
    })

    return {
        focusHours,
        totalFocusSecondsToday,
        theme
    }
}
