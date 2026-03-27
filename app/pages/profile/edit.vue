<template>
  <section class="mx-auto max-w-xl rounded-xl border border-stone-300 bg-white p-6 shadow-pin">
    <h1 class="mb-4 text-xl font-black text-stone-900">Upravit profil</h1>
    <form class="space-y-4" @submit.prevent="submit">
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
        <textarea v-model="contact" class="min-h-20 w-full rounded border border-stone-300 p-2" maxlength="250" required />
        <span class="mt-1 block text-xs text-stone-600">{{ contact.length }} / 250</span>
      </label>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Nová profilová fotka (volitelné)</span>
        <input type="file" accept="image/*" capture="environment" class="w-full rounded border border-stone-300 p-2" @change="onFileChange" />
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="success" class="text-sm text-emerald-700">Profil uložen.</p>

      <button class="w-full rounded bg-accent-500 px-4 py-2 font-semibold text-white" :disabled="loading">
        {{ loading ? "Ukládám…" : "Uložit změny" }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth"
});

const auth = useAuth();
const shortName = ref("");
const bio = ref("");
const contact = ref("");
const photoFile = ref<File | null>(null);
const loading = ref(false);
const error = ref("");
const success = ref(false);

await auth.refresh();
if (auth.user.value) {
  shortName.value = auth.user.value.shortName;
  bio.value = auth.user.value.bio;
  contact.value = auth.user.value.contact;
}

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  photoFile.value = input.files?.[0] || null;
};

const submit = async () => {
  loading.value = true;
  error.value = "";
  success.value = false;

  try {
    const form = new FormData();
    form.append("shortName", shortName.value);
    form.append("bio", bio.value);
    form.append("contact", contact.value);
    if (photoFile.value) {
      form.append("profilePhoto", photoFile.value);
    }

    await $fetch("/api/profile/me", {
      method: "PATCH",
      body: form
    });

    await auth.refresh();
    success.value = true;
  } catch (err: any) {
    error.value = err?.data?.statusMessage || "Nepodařilo se uložit profil.";
  } finally {
    loading.value = false;
  }
};
</script>
