<template>
  <section class="mx-auto max-w-xl rounded-xl border border-stone-300 bg-white p-6 shadow-pin">
    <h1 class="mb-4 text-xl font-black text-stone-900">Nový příspěvek</h1>

    <form class="space-y-4" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-pin transition-colors"
          :class="type === 'INSTAX'
            ? 'bg-accent-500 text-white shadow-[0_10px_20px_rgba(45,108,223,0.35)]'
            : 'border border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200'"
          @click="type = 'INSTAX'"
        >
          <CameraIcon class="h-4 w-4" />
          Instax
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-pin transition-colors"
          :class="type === 'LEPIK'
            ? 'bg-accent-500 text-white shadow-[0_10px_20px_rgba(45,108,223,0.35)]'
            : 'border border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200'"
          @click="type = 'LEPIK'"
        >
          <DocumentTextIcon class="h-4 w-4" />
          Lepík
        </button>
      </div>

      <template v-if="type === 'INSTAX'">
        <label class="block text-sm">
          <span class="mb-1 block font-medium text-stone-700">Fotka</span>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-200"
              @click="openCameraPicker"
            >
              <CameraIcon class="h-4 w-4" />
              Pořídit snímek
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-200"
              @click="openGalleryPicker"
            >
              <ArrowUpTrayIcon class="h-4 w-4" />
              Nahrát z knihovny
            </button>
          </div>
          <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" class="hidden" @change="onFileChange" />
          <input ref="galleryInputRef" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        </label>

        <div v-if="imagePreviewUrl" class="rounded border border-stone-300 bg-stone-50 p-2">
          <img
            :src="imagePreviewUrl"
            alt="Náhled vybrané fotky"
            class="mx-auto max-h-80 w-full rounded object-contain"
          />
        </div>
      </template>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Text</span>
        <textarea
          v-model="textContent"
          class="min-h-24 w-full rounded border border-stone-300 p-2"
          :maxlength="maxLen"
        />
        <span class="mt-1 block text-xs text-stone-600">{{ textContent.length }} / {{ maxLen }}</span>
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex items-stretch gap-3 pt-1">
        <button
          type="submit"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-base font-semibold text-white shadow-[0_10px_20px_rgba(45,108,223,0.35)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="loading"
        >
          <PaperAirplaneIcon class="h-5 w-5 -rotate-45" />
          {{ loading ? "Ukládám…" : "Publikovat" }}
        </button>

        <NuxtLink
          to="/"
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
  ArrowUpTrayIcon,
  ArrowUturnLeftIcon,
  CameraIcon,
  DocumentTextIcon,
  PaperAirplaneIcon
} from "@heroicons/vue/24/outline";

definePageMeta({
  middleware: "auth"
});

const type = ref<"INSTAX" | "LEPIK">("INSTAX");
const textContent = ref("");
const imageFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const HEIC_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence"
]);
const loading = ref(false);
const error = ref("");
const route = useRoute();
const cameraInputRef = ref<HTMLInputElement | null>(null);
const galleryInputRef = ref<HTMLInputElement | null>(null);
let previewRequestId = 0;

const maxLen = computed(() => (type.value === "INSTAX" ? 50 : 200));

const normalizeType = (value: unknown): "INSTAX" | "LEPIK" => {
  const maybe = String(value || "").toUpperCase();
  return maybe === "LEPIK" ? "LEPIK" : "INSTAX";
};

watch(type, () => {
  textContent.value = textContent.value.slice(0, maxLen.value);
});

watch(
  () => route.query.type,
  (value) => {
    type.value = normalizeType(value);
  }
);

type.value = normalizeType(route.query.type);

const resetPreviewUrl = () => {
  if (!imagePreviewUrl.value) {
    return;
  }
  URL.revokeObjectURL(imagePreviewUrl.value);
  imagePreviewUrl.value = null;
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
    console.warn("HEIC preview conversion failed.", cause);
    return file;
  }
};

const onFileChange = async (event: Event) => {
  const requestId = ++previewRequestId;
  const input = event.target as HTMLInputElement;
  const nextFile = input.files?.[0] || null;
  imageFile.value = nextFile;
  resetPreviewUrl();
  if (nextFile) {
    const previewBlob = await toPreviewBlob(nextFile);
    if (requestId !== previewRequestId) {
      return;
    }
    imagePreviewUrl.value = URL.createObjectURL(previewBlob);
  }
  input.value = "";
};

const openCameraPicker = () => {
  cameraInputRef.value?.click();
};

const openGalleryPicker = () => {
  galleryInputRef.value?.click();
};

onBeforeUnmount(() => {
  resetPreviewUrl();
});

const submit = async () => {
  loading.value = true;
  error.value = "";
  try {
    if (type.value === "INSTAX" && !imageFile.value) {
      throw new Error("Instax vyžaduje fotku.");
    }

    const form = new FormData();
    form.append("type", type.value);
    form.append("textContent", textContent.value);
    if (type.value === "INSTAX" && imageFile.value) {
      form.append("image", imageFile.value);
    }

    await $fetch("/api/posts", { method: "POST", body: form });
    await navigateTo("/");
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.message || "Nepodařilo se publikovat příspěvek.";
  } finally {
    loading.value = false;
  }
};
</script>
