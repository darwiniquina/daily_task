<script setup lang="ts">
import { ref } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { supabase } from '../../lib/supabaseClient'
import { toast } from 'vue-sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const isLoading = ref(false)
const errorMessage = ref('')

const loginSchema = toTypedSchema(z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}))

const { handleSubmit } = useForm({
  validationSchema: loginSchema,
})

const onLogin = handleSubmit(async (values) => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) throw error
    toast.success('Logged in successfully')
  } catch (error: any) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription>
        Enter your credentials to access your account.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-2">
      <form @submit="onLogin" class="space-y-4">
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="m@example.com" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <div v-if="errorMessage" class="text-red-500 text-sm">{{ errorMessage }}</div>
        <Button type="submit" class="w-full" :disabled="isLoading">
          {{ isLoading ? 'Loading...' : 'Sign In' }}
        </Button>
      </form>
    </CardContent>
    <CardFooter>
  
    </CardFooter>
  </Card>
</template>
