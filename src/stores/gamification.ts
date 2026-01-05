import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './auth'

export interface Profile {
    id: string
    display_name: string | null
    avatar_url: string | null
    xp: number
    level: number
    streak_count: number
    last_activity_date: string | null
}

export const useGamificationStore = defineStore('gamification', () => {
    const profile = ref<Profile | null>(null)
    const loading = ref(false)
    const authStore = useAuthStore()

    const xpToNextLevel = computed(() => {
        if (!profile.value) return 100
        return profile.value.level * 100
    })

    const progressToNextLevel = computed(() => {
        if (!profile.value) return 0
        return (profile.value.xp / xpToNextLevel.value) * 100
    })

    const fetchProfile = async () => {
        if (!authStore.user) return

        loading.value = true
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authStore.user.id)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    await createProfile()
                } else {
                    console.error('Error fetching profile:', error)
                }
            } else {
                profile.value = data as Profile
            }
        } finally {
            loading.value = false
        }
    }

    const createProfile = async () => {
        if (!authStore.user) return
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: authStore.user.id,
                display_name: authStore.user.user_metadata?.full_name || authStore.user.email?.split('@')[0],
                avatar_url: authStore.user.user_metadata?.avatar_url || null,
                xp: 0,
                level: 1,
                streak_count: 0
            })
            .select()
            .single()

        if (!error && data) {
            profile.value = data as Profile
        }
    }

    const addXP = async (amount: number, sourceType: string, sourceId: string) => {
        if (!profile.value || !authStore.user) return

        // 1. Check if transaction already exists (to prevent double-dipping)
        const { data: existing } = await supabase
            .from('xp_transactions')
            .select('id')
            .eq('user_id', authStore.user.id)
            .eq('source_type', sourceType)
            .eq('source_id', sourceId)
            .maybeSingle()

        if (existing) return

        // 2. Create transaction
        const { error: txError } = await supabase
            .from('xp_transactions')
            .insert({
                user_id: authStore.user.id,
                amount,
                source_type: sourceType,
                source_id: sourceId
            })

        if (txError) {
            console.error('Error recording XP transaction:', txError)
            return
        }

        // 3. Update profile XP
        await updateProfileXP(amount)
    }

    const revokeXP = async (sourceType: string, sourceId: string) => {
        if (!profile.value || !authStore.user) return

        // 1. Find the transaction
        const { data: tx, error: fetchError } = await supabase
            .from('xp_transactions')
            .select('*')
            .eq('user_id', authStore.user.id)
            .eq('source_type', sourceType)
            .eq('source_id', sourceId)
            .maybeSingle()

        if (!tx || fetchError) return

        // 2. Delete transaction
        const { error: delError } = await supabase
            .from('xp_transactions')
            .delete()
            .eq('id', tx.id)

        if (delError) {
            console.error('Error revoking XP transaction:', delError)
            return
        }

        // 3. Deduct XP from profile
        await updateProfileXP(-tx.amount)
    }

    const updateProfileXP = async (delta: number) => {
        if (!profile.value) return

        let newXP = profile.value.xp + delta
        let newLevel = profile.value.level
        // Handle level up
        while (newXP >= newLevel * 100) {
            newXP -= newLevel * 100
            newLevel++
        }

        // Handle level down (if delta is negative)
        while (newXP < 0 && newLevel > 1) {
            newLevel--
            newXP += newLevel * 100
        }

        if (newXP < 0) newXP = 0

        const { error } = await supabase
            .from('profiles')
            .update({ xp: newXP, level: newLevel })
            .eq('id', profile.value.id)

        if (!error) {
            profile.value.xp = newXP
            profile.value.level = newLevel
        }
    }

    const updateStreak = async () => {
        if (!profile.value) return

        const now = new Date()
        const today = now.toISOString().split('T')[0] as string
        const lastActivity = profile.value.last_activity_date

        if (lastActivity === today) return

        let newStreak = profile.value.streak_count
        const yesterday = new Date()
        yesterday.setDate(now.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (lastActivity === yesterdayStr) {
            newStreak++
        } else if (lastActivity !== null) {
            newStreak = 1
        } else {
            newStreak = 1
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                streak_count: newStreak,
                last_activity_date: today
            })
            .eq('id', profile.value.id)

        if (!error) {
            profile.value.streak_count = newStreak
            profile.value.last_activity_date = today
        }
    }

    return {
        profile,
        loading,
        xpToNextLevel,
        progressToNextLevel,
        fetchProfile,
        addXP,
        revokeXP,
        updateStreak
    }
})
