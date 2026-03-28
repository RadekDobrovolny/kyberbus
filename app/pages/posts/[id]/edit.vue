<template>
  <section class="mx-auto max-w-xl rounded-xl border border-stone-300 bg-white p-6 shadow-pin">
    <h1 class="mb-4 text-xl font-black text-stone-900">Upravit příspěvek</h1>

    <div v-if="loading" class="text-sm text-stone-700">Načítám…</div>
    <p v-else-if="!post" class="text-sm text-red-600">Příspěvek nebyl nalezen.</p>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <p class="text-xs font-semibold uppercase tracking-wide text-stone-600">
        Typ: {{ typeLabel }}
      </p>

      <template v-if="isInstax && post.imagePath">
        <div class="rounded border border-stone-300 bg-stone-50 p-2">
          <div class="mx-auto aspect-square w-full max-w-md overflow-hidden rounded bg-stone-100">
            <img
              :src="imageUrl(post.imagePath)"
              alt="Instax fotografie"
              class="h-full w-full object-contain transition-transform duration-150"
              :style="{ transform: `rotate(${imageRotationDegrees}deg)` }"
            />
          </div>
        </div>

        <div class="flex">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-stone-800 transition-colors hover:bg-stone-200 disabled:opacity-70"
            :disabled="saving"
            aria-label="Otočit fotku o 90 stupňů"
            @click="rotateNow"
          >
            <ArrowPathIcon class="h-5 w-5" />
          </button>
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
          :disabled="saving"
        >
          <PaperAirplaneIcon class="h-5 w-5 -rotate-45" />
          {{ saving ? "Ukládám…" : "Publikovat" }}
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
import { ArrowPathIcon, ArrowUturnLeftIcon, PaperAirplaneIcon } from "@heroicons/vue/24/outline";
import type { FeedItem } from "~/types/models";
import { getPostMaxLength } from "~~/shared/content";

definePageMeta({
  middleware: "auth"
});

const route = useRoute();
const authHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;

const loading = ref(true);
const saving = ref(false);
const error = ref("");
const post = ref<FeedItem | null>(null);
const textContent = ref("");
const imageRotationQuarterTurns = ref(0);

const postId = computed(() => String(route.params.id || ""));
const isInstax = computed(() => post.value?.type === "INSTAX");
const maxLen = computed(() => (post.value ? getPostMaxLength(post.value.type) : 200));
const imageRotationDegrees = computed(() => imageRotationQuarterTurns.value * 90);
const typeLabel = computed(() => {
  if (!post.value) {
    return "";
  }
  if (post.value.type === "LEPIK") {
    return "Lepík";
  }
  if (post.value.type === "DISPECINK") {
    return "Dispečink";
  }
  if (post.value.type === "MESTO") {
    return "Město";
  }
  return "Instax";
});

const imageUrl = (path: string) => {
  const version = post.value?.updatedAt || 0;
  return `/api/media/${path}?v=${version}`;
};

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    const result = await $fetch<{ post: FeedItem }>(`/api/posts/${postId.value}`, {
      headers: authHeaders
    });
    post.value = result.post;
    textContent.value = result.post.textContent;
    imageRotationQuarterTurns.value = 0;
  } catch (err: any) {
    post.value = null;
    error.value = err?.data?.statusMessage || "Příspěvek se nepodařilo načíst.";
  } finally {
    loading.value = false;
  }
};

const rotateNow = () => {
  if (!post.value || !isInstax.value || !post.value.imagePath) {
    return;
  }
  imageRotationQuarterTurns.value = (imageRotationQuarterTurns.value + 1) % 4;
};

const submit = async () => {
  if (!post.value) {
    return;
  }
  saving.value = true;
  error.value = "";
  try {
    await $fetch(`/api/posts/${post.value.id}`, {
      method: "PATCH",
      body: {
        textContent: textContent.value,
        imageRotationSteps: isInstax.value ? imageRotationQuarterTurns.value : 0
      }
    });
    await navigateTo("/");
  } catch (err: any) {
    error.value = err?.data?.statusMessage || "Příspěvek se nepodařilo uložit.";
  } finally {
    saving.value = false;
  }
};

await load();
</script>
