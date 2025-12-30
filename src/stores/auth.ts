import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
    const session = ref<Session | null>(null)
    const user = ref<User | null>(null)
    const loading = ref(true)

    const initialize = async () => {
        try {
            const { data } = await supabase.auth.getSession()
            session.value = data.session
            user.value = data.session?.user ?? null

            supabase.auth.onAuthStateChange((_event, _session) => {
                session.value = _session
                user.value = _session?.user ?? null
            })
        } finally {
            loading.value = false
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        session.value = null
        user.value = null
    }

    return {
        session,
        user,
        loading,
        initialize,
        signOut
    }
})
