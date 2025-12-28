<script setup lang="ts">
import { ref } from 'vue'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import LoginForm from './auth/LoginForm.vue'
import RegisterForm from './auth/RegisterForm.vue'
import { toast } from 'vue-sonner'

const activeTab = ref('login')

const onRegisterSuccess = () => {
  activeTab.value = 'login'
  toast.success('Registration successful! Please check your email to confirm.')
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50 p-4">
    <Tabs v-model="activeTab" class="w-full max-w-[400px]">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="login">
          Login
        </TabsTrigger>
        <TabsTrigger value="register">
          Register
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="login">
        <LoginForm />
      </TabsContent>
      
      <TabsContent value="register">
        <RegisterForm @success="onRegisterSuccess" />
      </TabsContent>
    </Tabs>
  </div>
</template>
