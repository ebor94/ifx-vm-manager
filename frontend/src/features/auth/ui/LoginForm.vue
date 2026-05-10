<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../model/auth.store'
import { useToast } from '@shared/lib/useToast'
import BaseInput from '@shared/ui/BaseInput.vue'
import BaseButton from '@shared/ui/BaseButton.vue'

const authStore = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const emit = defineEmits(['success'])

async function submit() {
  if (!email.value || !password.value) {
    error.value = 'Email y contraseña son requeridos'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const user = await authStore.login(email.value, password.value)
    toast.success(`Bienvenido, ${user.name}`)
    emit('success', user)
  } catch (err) {
    // El backend retorna el mismo "Credenciales inválidas" para password
    // incorrecto o email inexistente (anti user-enumeration).
    error.value = err.response?.data?.error || 'No se pudo iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-4 w-full max-w-sm" @submit.prevent="submit">
    <BaseInput
      v-model="email"
      label="Email"
      type="email"
      autocomplete="email"
      required
      placeholder="admin@ifx.com"
    />
    <BaseInput
      v-model="password"
      label="Contraseña"
      type="password"
      autocomplete="current-password"
      required
      placeholder="••••••••"
    />
    <p v-if="error" class="text-sm text-red-600 dark:text-red-400" role="alert">
      {{ error }}
    </p>
    <BaseButton type="submit" :loading="loading" full-width>
      Ingresar
    </BaseButton>
  </form>
</template>
