<template>
  <section class="mx-auto max-w-md rounded-xl border border-stone-300 bg-white p-6 shadow-pin">
    <h1 class="mb-4 text-xl font-black text-stone-900">Nastoupení do Kyberbusu</h1>
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
      <button
        class="inline-flex w-full items-center justify-center rounded-full bg-accent-500 px-6 py-3 text-base font-semibold text-white shadow-[0_10px_20px_rgba(45,108,223,0.35)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="loading"
      >
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
