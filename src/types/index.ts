export interface Task {
    id: string
    user_id: string
    title: string
    description?: string
    deadline?: string
    completed: boolean
    created_at: string
    updated_at: string
}

export interface Timer {
    id: string
    task_id: string
    user_id: string
    start_time: string
    end_time?: string
    duration?: number
    created_at?: string
}
