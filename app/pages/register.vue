<template>
  <section class="mx-auto max-w-xl rounded-xl border border-stone-300 bg-white p-6 shadow-pin">
    <h1 class="mb-4 text-xl font-black text-stone-900">Palubní lístek</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block text-sm">
        <span class="mb-1 flex items-center gap-2 font-semibold text-stone-800">
          <UserIcon class="h-4 w-4 text-stone-500" />
          Přihlašovací jméno (login)
        </span>
        <input v-model="login" class="w-full rounded border border-stone-300 p-2" required />
      </label>

      <label class="block text-sm">
        <span class="mb-1 flex items-center gap-2 font-semibold text-stone-800">
          <KeyIcon class="h-4 w-4 text-stone-500" />
          Heslo
        </span>
        <input v-model="password" type="password" class="w-full rounded border border-stone-300 p-2" required />
      </label>

      <div class="relative py-1" aria-hidden="true">
        <div class="h-0.5 w-full rounded-full bg-gradient-to-r from-accent-200 via-accent-500 to-accent-200" />
      </div>

      <label class="block text-sm">
        <span class="mb-1 flex items-center gap-2 font-semibold text-stone-800">
          <IdentificationIcon class="h-4 w-4 text-stone-500" />
          Jméno
        </span>
        <span class="mb-1 block text-xs text-stone-600">Jak vás ostatní uvidí v aplikaci (povinné pole)</span>
        <input
          v-model="shortName"
          class="w-full rounded border border-stone-300 p-2"
          maxlength="30"
          placeholder="Jana Novotná"
          required
        />
        <span class="mt-1 block text-xs text-stone-600">{{ shortName.length }} / 30</span>
      </label>

      <label class="block text-sm">
        <span class="mb-1 flex items-center gap-2 font-semibold text-stone-800">
          <ChatBubbleLeftRightIcon class="h-4 w-4 text-stone-500" />
          O mně
        </span>
        <span class="mb-1 block text-xs text-stone-600">
          Čemu se věnujete, proč jste vyrazili na expedici Kyberbusem? (nepovinné pole)
        </span>
        <textarea
          v-model="bio"
          class="min-h-20 w-full rounded border border-stone-300 p-2"
          maxlength="250"
          placeholder="Jsem studentka KISKu, věnuji se informačnímu designu služeb. Na CyberImpact Roadshow povedu workshop o bezpečném ukládání hesel. Ráda čtu absyntovky a mám kocoura Jonáše."
        />
        <span class="mt-1 block text-xs text-stone-600">{{ bio.length }} / 250</span>
      </label>

      <label class="block text-sm">
        <span class="mb-1 flex items-center gap-2 font-semibold text-stone-800">
          <AtSymbolIcon class="h-4 w-4 text-stone-500" />
          Kontakt
        </span>
        <span class="mb-1 block text-xs text-stone-600">
          Jak vás můžou ostatní účastníci kontaktovat? (nepovinné pole)
        </span>
        <textarea
          v-model="contact"
          class="min-h-20 w-full rounded border border-stone-300 p-2"
          maxlength="100"
          placeholder="Klidně mě oslovte přímo v autobusu anebo mi napište na Instagramu @ta.z.KISKu"
        />
        <span class="mt-1 block text-xs text-stone-600">{{ contact.length }} / 100</span>
      </label>

      <label class="block text-sm">
        <span class="mb-1 flex items-center gap-2 font-semibold text-stone-800">
          <CameraIcon class="h-4 w-4 text-stone-500" />
          Profilová fotka
        </span>
        <span class="mb-1 block text-xs text-stone-600">Povinný prvek</span>
        <input
          type="file"
          accept="image/*"
          class="w-full rounded border border-stone-300 p-2"
          required
          @change="onFileChange"
        />
      </label>
      <div v-if="photoPreviewUrl" class="rounded border border-stone-300 bg-stone-50 p-2">
        <img
          :src="photoPreviewUrl"
          alt="Náhled profilové fotky"
          class="mx-auto max-h-72 w-full rounded object-contain"
        />
      </div>
      <p v-else-if="profilePhoto" class="text-xs text-stone-600">
        Vybráno: {{ profilePhoto.name }}
      </p>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex items-stretch gap-3 pt-1">
        <button
          type="submit"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-base font-semibold text-white shadow-[0_10px_20px_rgba(45,108,223,0.35)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="loading"
        >
          <PaperAirplaneIcon class="h-5 w-5 -rotate-45" />
          {{ loading ? "Vytvářím účet…" : "Registrovat se" }}
        </button>

        <NuxtLink
          to="/login"
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
  AtSymbolIcon,
  ArrowUturnLeftIcon,
  CameraIcon,
  ChatBubbleLeftRightIcon,
  IdentificationIcon,
  KeyIcon,
  PaperAirplaneIcon,
  UserIcon
} from "@heroicons/vue/24/outline";

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
const photoPreviewUrl = ref<string | null>(null);
const loading = ref(false);
const error = ref("");
let previewRequestId = 0;

const HEIC_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence"
]);

const resetPreviewUrl = () => {
  if (!photoPreviewUrl.value) {
    return;
  }
  URL.revokeObjectURL(photoPreviewUrl.value);
  photoPreviewUrl.value = null;
};

const isHeicFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  const lowerType = file.type.toLowerCase();
  return (
    HEIC_MIME_TYPES.has(lowerType) ||
    lowerName.endsWith(".heic") ||
    lowerName.endsWith(".heif")
  );
};

const toPreviewBlob = async (file: File): Promise<Blob> => {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const heic2any = await import("heic2any");
    const converted = await heic2any.default({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9
    });

    if (Array.isArray(converted)) {
      return converted[0] || file;
    }

    return converted;
  } catch (cause) {
    console.warn("HEIC preview conversion failed during registration.", cause);
    return file;
  }
};

const onFileChange = async (event: Event) => {
  const requestId = ++previewRequestId;
  const input = event.target as HTMLInputElement;
  const nextFile = input.files?.[0] || null;
  profilePhoto.value = nextFile;
  resetPreviewUrl();
  if (nextFile) {
    const previewBlob = await toPreviewBlob(nextFile);
    if (requestId !== previewRequestId) {
      return;
    }
    photoPreviewUrl.value = URL.createObjectURL(previewBlob);
  }
};

onBeforeUnmount(() => {
  resetPreviewUrl();
});

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
