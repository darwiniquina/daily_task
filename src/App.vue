<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from './lib/supabaseClient'
import AuthForm from './components/AuthForm.vue'
import { Button } from '@/components/ui/button'
import type { Session } from '@supabase/supabase-js'
import { Toaster, toast } from 'vue-sonner'
import 'vue-sonner/style.css'

const session = ref<Session | null>(null)

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
  })
})

const handleLogout = async () => {
  await supabase.auth.signOut()
  toast.success('Logged out successfully')
}
</script>

<template>

  <div v-if="!session">
    <AuthForm />
  </div>
  
  <div v-else class="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 space-y-4">
    <h1 class="text-2xl font-bold">Welcome!</h1>
    <p>You are logged in as {{ session.user.email }}</p>
    <Button @click="handleLogout">Logout</Button>
  </div>

  <Toaster />

</template>
