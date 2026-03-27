<template>
  <section class="mx-auto max-w-md rounded-xl border border-stone-300 bg-white p-6 shadow-pin">
    <h1 class="mb-4 text-xl font-black text-stone-900">Přihlášení</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Přihlašovací jméno</span>
        <input v-model="login" class="w-full rounded border border-stone-300 p-2" required />
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Heslo</span>
        <input v-model="password" type="password" class="w-full rounded border border-stone-300 p-2" required />
      </label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="w-full rounded bg-accent-500 px-4 py-2 font-semibold text-white" :disabled="loading">
        {{ loading ? "Přihlašuji…" : "Přihlásit se" }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "guest"
});

const auth = useAuth();
const login = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const submit = async () => {
  loading.value = true;
  error.value = "";
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        login: login.value,
        password: password.value
      }
    });
    await auth.refresh();
    await navigateTo("/");
  } catch (err: any) {
    error.value = err?.data?.statusMessage || "Přihlášení se nezdařilo.";
  } finally {
    loading.value = false;
  }
};
</script>
