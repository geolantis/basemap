<template>
  <Dialog 
    v-model:visible="visible" 
    :style="{width: '460px'}" 
    header="Create Account"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <div class="register-form">
      <Message v-if="error" severity="error" :closable="false" class="mb-4">
        {{ error }}
      </Message>

      <Message severity="info" :closable="false" class="mb-4">
        Create a free account to save and manage your custom map styles.
      </Message>

      <form @submit.prevent="handleRegister">
        <!-- Name -->
        <div class="field">
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <InputText
            id="name"
            v-model="userData.name"
            :class="{ 'p-invalid': fieldErrors.name }"
            placeholder="Enter your full name"
            class="w-full"
            autocomplete="name"
          />
          <small v-if="fieldErrors.name" class="p-error">{{ fieldErrors.name }}</small>
        </div>

        <!-- Email -->
        <div class="field">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <InputText
            id="email"
            v-model="userData.email"
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
            v-model="userData.password"
            :class="{ 'p-invalid': fieldErrors.password }"
            placeholder="Choose a secure password"
            class="w-full"
            :feedback="true"
            promptLabel="Choose a password"
            weakLabel="Weak"
            mediumLabel="Medium" 
            strongLabel="Strong"
            toggleMask
            autocomplete="new-password"
          />
          <small v-if="fieldErrors.password" class="p-error">{{ fieldErrors.password }}</small>
        </div>

        <!-- Confirm Password -->
        <div class="field">
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password *
          </label>
          <Password
            id="confirmPassword"
            v-model="userData.confirmPassword"
            :class="{ 'p-invalid': fieldErrors.confirmPassword }"
            placeholder="Confirm your password"
            class="w-full"
            :feedback="false"
            toggleMask
            autocomplete="new-password"
          />
          <small v-if="fieldErrors.confirmPassword" class="p-error">{{ fieldErrors.confirmPassword }}</small>
        </div>

        <!-- Terms and Privacy -->
        <div class="field">
          <div class="flex align-items-start">
            <Checkbox
              id="agreeToTerms"
              v-model="userData.agreeToTerms"
              :binary="true"
              :class="{ 'p-invalid': fieldErrors.agreeToTerms }"
            />
            <label for="agreeToTerms" class="ml-2 text-sm text-gray-700">
              I agree to the 
              <Button
                label="Terms of Service"
                link
                class="p-0 text-blue-600 underline"
                @click="showTerms"
              />
              and 
              <Button
                label="Privacy Policy"
                link
                class="p-0 text-blue-600 underline"
                @click="showPrivacy"
              />
            </label>
          </div>
          <small v-if="fieldErrors.agreeToTerms" class="p-error">{{ fieldErrors.agreeToTerms }}</small>
        </div>

        <!-- Marketing Consent -->
        <div class="field">
          <div class="flex align-items-center">
            <Checkbox
              id="marketingConsent"
              v-model="userData.marketingConsent"
              :binary="true"
            />
            <label for="marketingConsent" class="ml-2 text-sm text-gray-700">
              Send me updates about new features and improvements (optional)
            </label>
          </div>
        </div>

        <!-- Submit Button (hidden, form submission handled by footer buttons) -->
        <button type="submit" style="display: none;" />
      </form>

      <div class="auth-links">
        <div class="text-center">
          <span class="text-sm text-gray-600">Already have an account? </span>
          <Button
            label="Sign in"
            link
            class="p-0"
            @click="switchToLogin"
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
          :disabled="isLoading"
        />
        <Button 
          label="Create Account"
          icon="pi pi-user-plus"
          @click="handleRegister"
          :loading="isLoading"
          :disabled="!isFormValid"
        />
      </div>
    </template>
  </Dialog>
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
import { useAuthService } from '../services/authService';

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:visible', 'register-success', 'register-error', 'switch-to-login']);

const authService = useAuthService();
const toast = useToast();

// Form data
const userData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
  marketingConsent: false
});

// State
const error = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});
const isLoading = ref(false);

// Computed
const isFormValid = computed(() => {
  return userData.value.email.trim() && 
         userData.value.password.trim() && 
         userData.value.confirmPassword.trim() &&
         userData.value.agreeToTerms &&
         Object.keys(fieldErrors.value).length === 0;
});

// Methods
function validateForm(): boolean {
  fieldErrors.value = {};

  // Name validation (optional but if provided, must be valid)
  if (userData.value.name && userData.value.name.trim().length < 2) {
    fieldErrors.value.name = 'Name must be at least 2 characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!userData.value.email.trim()) {
    fieldErrors.value.email = 'Email is required';
  } else if (!emailRegex.test(userData.value.email)) {
    fieldErrors.value.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!userData.value.password.trim()) {
    fieldErrors.value.password = 'Password is required';
  } else if (userData.value.password.length < 8) {
    fieldErrors.value.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(userData.value.password)) {
    fieldErrors.value.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }

  // Confirm password validation
  if (!userData.value.confirmPassword.trim()) {
    fieldErrors.value.confirmPassword = 'Please confirm your password';
  } else if (userData.value.password !== userData.value.confirmPassword) {
    fieldErrors.value.confirmPassword = 'Passwords do not match';
  }

  // Terms agreement validation
  if (!userData.value.agreeToTerms) {
    fieldErrors.value.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
  }

  return Object.keys(fieldErrors.value).length === 0;
}

async function handleRegister(): Promise<void> {
  if (!validateForm()) return;

  error.value = null;
  isLoading.value = true;

  try {
    const result = await authService.register({
      email: userData.value.email.trim(),
      password: userData.value.password,
      name: userData.value.name.trim() || undefined
    });

    toast.add({
      severity: 'success',
      summary: 'Account Created',
      detail: 'Your account has been created successfully!',
      life: 3000
    });

    emit('register-success', {
      user: result.user,
      token: result.token
    });

  } catch (err) {
    console.error('Registration error:', err);
    error.value = err instanceof Error ? err.message : 'Registration failed';
    emit('register-error', error.value);
  } finally {
    isLoading.value = false;
  }
}

function switchToLogin(): void {
  emit('switch-to-login');
}

function showTerms(): void {
  // In a real app, this would open the terms of service
  toast.add({
    severity: 'info',
    summary: 'Terms of Service',
    detail: 'Terms of Service document will be available soon.',
    life: 3000
  });
}

function showPrivacy(): void {
  // In a real app, this would open the privacy policy
  toast.add({
    severity: 'info',
    summary: 'Privacy Policy',
    detail: 'Privacy Policy document will be available soon.',
    life: 3000
  });
}

function onClose(): void {
  error.value = null;
  fieldErrors.value = {};
  userData.value = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    marketingConsent: false
  };
  emit('update:visible', false);
}

function resetForm(): void {
  userData.value = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    marketingConsent: false
  };
  error.value = null;
  fieldErrors.value = {};
  isLoading.value = false;
}

// Watch for dialog visibility
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    resetForm();
  }
});
</script>

<style scoped>
.register-form {
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

:deep(.p-checkbox.p-invalid) {
  border-color: #ef4444;
}
</style>