<template>
  <section class="mx-auto max-w-xl rounded-xl border border-stone-300 bg-white p-6 shadow-pin">
    <h1 class="mb-4 text-xl font-black text-stone-900">Upravit profil</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Jméno</span>
        <input v-model="shortName" class="w-full rounded border border-stone-300 p-2" maxlength="30" required />
        <span class="mt-1 block text-xs text-stone-600">{{ shortName.length }} / 30</span>
      </label>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">O mně</span>
        <textarea v-model="bio" class="min-h-20 w-full rounded border border-stone-300 p-2" maxlength="250" required />
        <span class="mt-1 block text-xs text-stone-600">{{ bio.length }} / 250</span>
      </label>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Kontakt</span>
        <textarea v-model="contact" class="min-h-20 w-full rounded border border-stone-300 p-2" maxlength="100" required />
        <span class="mt-1 block text-xs text-stone-600">{{ contact.length }} / 100</span>
      </label>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Nová profilová fotka (volitelné)</span>
        <input type="file" accept="image/*" capture="environment" class="w-full rounded border border-stone-300 p-2" @change="onFileChange" />
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="success" class="text-sm text-emerald-700">Profil uložen.</p>

      <div class="flex items-stretch gap-3 pt-1">
        <button
          type="submit"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-base font-semibold text-white shadow-[0_10px_20px_rgba(45,108,223,0.35)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="loading"
        >
          <PaperAirplaneIcon class="h-5 w-5 -rotate-45" />
          {{ loading ? "Ukládám…" : "Uložit změny" }}
        </button>

        <NuxtLink
          :to="backTo"
          class="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-800 shadow-pin transition-colors hover:bg-stone-200"
        >
          <ArrowUturnLeftIcon class="h-4 w-4" />
          Zpět
        </NuxtLink>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ArrowUturnLeftIcon, PaperAirplaneIcon } from "@heroicons/vue/24/outline";

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
const backTo = computed(() => auth.user.value ? `/profile/${auth.user.value.id}` : "/");

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
