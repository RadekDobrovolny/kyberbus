<template>
  <section class="mx-auto max-w-xl rounded-xl border border-stone-300 bg-white p-6 shadow-pin">
    <h1 class="mb-4 text-xl font-black text-stone-900">Registrace</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Přihlašovací jméno</span>
        <input v-model="login" class="w-full rounded border border-stone-300 p-2" required />
      </label>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Heslo</span>
        <input v-model="password" type="password" class="w-full rounded border border-stone-300 p-2" required />
      </label>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Krátké jméno</span>
        <input v-model="shortName" class="w-full rounded border border-stone-300 p-2" maxlength="250" required />
        <span class="mt-1 block text-xs text-stone-600">{{ shortName.length }} / 250</span>
      </label>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Bio</span>
        <textarea v-model="bio" class="min-h-20 w-full rounded border border-stone-300 p-2" maxlength="250" required />
        <span class="mt-1 block text-xs text-stone-600">{{ bio.length }} / 250</span>
      </label>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Kontakt</span>
        <textarea
          v-model="contact"
          class="min-h-20 w-full rounded border border-stone-300 p-2"
          maxlength="250"
          required
        />
        <span class="mt-1 block text-xs text-stone-600">{{ contact.length }} / 250</span>
      </label>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Profilová fotka</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          class="w-full rounded border border-stone-300 p-2"
          required
          @change="onFileChange"
        />
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button class="w-full rounded bg-accent-500 px-4 py-2 font-semibold text-white" :disabled="loading">
        {{ loading ? "Vytvářím účet…" : "Registrovat se" }}
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
const shortName = ref("");
const bio = ref("");
const contact = ref("");
const profilePhoto = ref<File | null>(null);
const loading = ref(false);
const error = ref("");

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  profilePhoto.value = input.files?.[0] || null;
};

const submit = async () => {
  if (!profilePhoto.value) {
    error.value = "Profilová fotka je povinná.";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    const form = new FormData();
    form.append("login", login.value);
    form.append("password", password.value);
    form.append("shortName", shortName.value);
    form.append("bio", bio.value);
    form.append("contact", contact.value);
    form.append("profilePhoto", profilePhoto.value);

    await $fetch("/api/auth/register", {
      method: "POST",
      body: form
    });

    await auth.refresh();
    await navigateTo("/");
  } catch (err: any) {
    error.value = err?.data?.statusMessage || "Registrace se nezdařila.";
  } finally {
    loading.value = false;
  }
};
</script>
