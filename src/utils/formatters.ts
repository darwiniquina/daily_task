export const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    }).format(date)
}

export const formatTimeOnly = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
    }).format(date)
}

export const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
}

export const formatTotalDuration = (seconds: number): string => {
    if (!seconds) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const formatTimerDisplay = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

import { formatDistanceToNow, isPast } from 'date-fns'

export const getDeadlineStatus = (deadline: string) => {
    const date = new Date(deadline)
    const overdue = isPast(date)
    const distance = formatDistanceToNow(date, { addSuffix: true })

    return {
        overdue,
        label: overdue ? `Overdue ${distance}` : `Due ${distance}`,
        isClose: !overdue && (date.getTime() - Date.now()) < 3600000 * 24 // Close if within 24 hours
    }
}

