<template>
  <Dialog 
    v-model:visible="visible" 
    :style="{width: '420px'}" 
    header="Login to Save Styles"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <div class="login-form">
      <Message v-if="error" severity="error" :closable="false" class="mb-4">
        {{ error }}
      </Message>

      <Message severity="info" :closable="false" class="mb-4">
        Please log in to save and manage your custom map styles.
      </Message>

      <form @submit.prevent="handleLogin">
        <!-- Email -->
        <div class="field">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <InputText
            id="email"
            v-model="credentials.email"
            type="email"
            :class="{ 'p-invalid': fieldErrors.email }"
            placeholder="Enter your email"
            class="w-full"
            required
            autocomplete="username"
          />
          <small v-if="fieldErrors.email" class="p-error">{{ fieldErrors.email }}</small>
        </div>

        <!-- Password -->
        <div class="field">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <Password
            id="password"
            v-model="credentials.password"
            :class="{ 'p-invalid': fieldErrors.password }"
            placeholder="Enter your password"
            class="w-full"
            :feedback="false"
            toggleMask
            autocomplete="current-password"
          />
          <small v-if="fieldErrors.password" class="p-error">{{ fieldErrors.password }}</small>
        </div>

        <!-- Remember Me -->
        <div class="field">
          <div class="flex align-items-center">
            <Checkbox
              id="rememberMe"
              v-model="credentials.rememberMe"
              :binary="true"
            />
            <label for="rememberMe" class="ml-2 text-sm text-gray-700">
              Keep me signed in
            </label>
          </div>
        </div>

        <!-- Submit Button (hidden, form submission handled by footer buttons) -->
        <button type="submit" style="display: none;" />
      </form>

      <div class="auth-links">
        <div class="text-center">
          <span class="text-sm text-gray-600">Don't have an account? </span>
          <Button
            label="Sign up"
            link
            class="p-0"
            @click="switchToRegister"
          />
        </div>
        <div class="text-center mt-2">
          <Button
            label="Forgot password?"
            link
            class="p-0 text-sm"
            @click="showForgotPassword"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Cancel" 
          severity="secondary"
          @click="onClose"
          :disabled="authStore.isLoading"
        />
        <Button 
          label="Sign In"
          icon="pi pi-sign-in"
          @click="handleLogin"
          :loading="authStore.isLoading"
          :disabled="!isFormValid"
        />
      </div>
    </template>
  </Dialog>

  <!-- Register Modal -->
  <RegisterModal
    v-model:visible="registerVisible"
    @register-success="onRegisterSuccess"
    @switch-to-login="switchToLogin"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useAuthStore } from '../stores/auth';
import { useAuthService } from '../services/authService';
import RegisterModal from './RegisterModal.vue';

interface Props {
  visible: boolean;
  message?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:visible', 'login-success', 'login-error']);

const authStore = useAuthStore();
const authService = useAuthService();
const toast = useToast();

// Form data
const credentials = ref({
  email: '',
  password: '',
  rememberMe: false
});

// State
const error = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});
const registerVisible = ref(false);

// Computed
const isFormValid = computed(() => {
  return credentials.value.email.trim() && 
         credentials.value.password.trim() && 
         Object.keys(fieldErrors.value).length === 0;
});

// Methods
function validateForm(): boolean {
  fieldErrors.value = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!credentials.value.email.trim()) {
    fieldErrors.value.email = 'Email is required';
  } else if (!emailRegex.test(credentials.value.email)) {
    fieldErrors.value.email = 'Please enter a valid email address';
  }

  if (!credentials.value.password.trim()) {
    fieldErrors.value.password = 'Password is required';
  } else if (credentials.value.password.length < 6) {
    fieldErrors.value.password = 'Password must be at least 6 characters';
  }

  return Object.keys(fieldErrors.value).length === 0;
}

async function handleLogin(): Promise<void> {
  if (!validateForm()) return;

  error.value = null;

  try {
    const result = await authStore.login(
      credentials.value.email.trim(),
      credentials.value.password
    );

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Login Successful',
        detail: 'Welcome back! You can now save your styles.',
        life: 3000
      });

      emit('login-success', {
        user: authStore.user,
        token: authService.getToken()
      });
      
      onClose();
    } else {
      error.value = result.error || 'Login failed';
      emit('login-error', error.value);
    }
  } catch (err) {
    console.error('Login error:', err);
    error.value = err instanceof Error ? err.message : 'Login failed';
    emit('login-error', error.value);
  }
}

function switchToRegister(): void {
  registerVisible.value = true;
}

function switchToLogin(): void {
  registerVisible.value = false;
}

function onRegisterSuccess(data: any): void {
  registerVisible.value = false;
  
  toast.add({
    severity: 'success',
    summary: 'Registration Successful',
    detail: 'Account created successfully! You are now logged in.',
    life: 4000
  });

  emit('login-success', data);
  onClose();
}

function showForgotPassword(): void {
  toast.add({
    severity: 'info',
    summary: 'Password Reset',
    detail: 'Password reset functionality will be available soon. Please contact support.',
    life: 5000
  });
}

function onClose(): void {
  error.value = null;
  fieldErrors.value = {};
  credentials.value = { email: '', password: '', rememberMe: false };
  emit('update:visible', false);
}

function resetForm(): void {
  credentials.value = { email: '', password: '', rememberMe: false };
  error.value = null;
  fieldErrors.value = {};
}

// Watch for dialog visibility
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    resetForm();
  }
});

// Watch for auth store errors
watch(() => authStore.error, (newError) => {
  if (newError && props.visible) {
    error.value = newError;
  }
});
</script>

<style scoped>
.login-form {
  padding: 1rem 0;
}

.field {
  margin-bottom: 1.5rem;
}

.field:last-child {
  margin-bottom: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
}

.auth-links {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

:deep(.p-dialog-content) {
  padding: 1.5rem;
}

:deep(.p-dialog-footer) {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-password .p-inputtext) {
  width: 100%;
}
</style>