<template>
  <section class="mx-auto max-w-xl rounded-xl border border-stone-300 bg-white p-6 shadow-pin">
    <h1 class="mb-4 text-xl font-black text-stone-900">
      {{ isEditingOwnProfile ? "Upravit profil" : "Upravit profil uživatele" }}
    </h1>
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
        <input type="file" accept="image/*" class="w-full rounded border border-stone-300 p-2" @change="onFileChange" />
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
import {
  ArrowUturnLeftIcon,
  PaperAirplaneIcon
} from "@heroicons/vue/24/outline";

definePageMeta({
  middleware: "auth"
});

const auth = useAuth();
const route = useRoute();
const authHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
const shortName = ref("");
const bio = ref("");
const contact = ref("");
const photoFile = ref<File | null>(null);
const loading = ref(false);
const error = ref("");
const success = ref(false);
const requestedUserId = computed(() => {
  const queryId = route.query.userId;
  return typeof queryId === "string" && queryId.trim().length > 0 ? queryId : null;
});
const editingUserId = computed(() => {
  if (!auth.user.value) {
    return null;
  }
  if (auth.user.value.role === "ADMIN" && requestedUserId.value) {
    return requestedUserId.value;
  }
  return auth.user.value.id;
});
const isEditingOwnProfile = computed(
  () => Boolean(auth.user.value && editingUserId.value && auth.user.value.id === editingUserId.value)
);
const backTo = computed(() => (editingUserId.value ? `/profile/${editingUserId.value}` : "/"));

await auth.refresh();
if (!auth.user.value) {
  await navigateTo("/login");
}

if (auth.user.value && editingUserId.value === auth.user.value.id) {
  shortName.value = auth.user.value.shortName;
  bio.value = auth.user.value.bio;
  contact.value = auth.user.value.contact;
} else if (editingUserId.value) {
  try {
    const result = await $fetch<{
      profile: { shortName: string; bio: string; contact: string };
    }>(`/api/profile/${editingUserId.value}`, {
      headers: authHeaders
    });
    shortName.value = result.profile.shortName;
    bio.value = result.profile.bio;
    contact.value = result.profile.contact;
  } catch {
    error.value = "Profil se nepodařilo načíst.";
  }
}

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  photoFile.value = input.files?.[0] || null;
  input.value = "";
};

const submit = async () => {
  loading.value = true;
  error.value = "";
  success.value = false;

  try {
    if (!editingUserId.value) {
      throw new Error("Chybí cílový profil.");
    }
    const form = new FormData();
    form.append("shortName", shortName.value);
    form.append("bio", bio.value);
    form.append("contact", contact.value);
    if (photoFile.value) {
      form.append("profilePhoto", photoFile.value);
    }

    const endpoint =
      isEditingOwnProfile.value || !auth.user.value
        ? "/api/profile/me"
        : `/api/profile/${editingUserId.value}`;

    await $fetch(endpoint, {
      method: "PATCH",
      body: form
    });

    if (isEditingOwnProfile.value) {
      await auth.refresh();
    }
    success.value = true;
  } catch (err: any) {
    error.value = err?.data?.statusMessage || "Nepodařilo se uložit profil.";
  } finally {
    loading.value = false;
  }
};
</script>
