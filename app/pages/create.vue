<template>
  <section class="mx-auto max-w-xl rounded-xl border border-stone-300 bg-white p-6 shadow-pin">
    <h1 class="mb-4 text-xl font-black text-stone-900">Nový příspěvek</h1>

    <form class="space-y-4" @submit.prevent="submit">
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded px-3 py-1.5 text-sm font-semibold"
          :class="type === 'INSTAX' ? 'bg-accent-500 text-white' : 'border border-stone-300 text-stone-700'"
          @click="type = 'INSTAX'"
        >
          Instax
        </button>
        <button
          type="button"
          class="rounded px-3 py-1.5 text-sm font-semibold"
          :class="type === 'LEPIK' ? 'bg-accent-500 text-white' : 'border border-stone-300 text-stone-700'"
          @click="type = 'LEPIK'"
        >
          Lepík
        </button>
      </div>

      <label class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Text</span>
        <textarea v-model="textContent" class="min-h-24 w-full rounded border border-stone-300 p-2" :maxlength="maxLen" />
        <span class="mt-1 block text-xs text-stone-600">{{ textContent.length }} / {{ maxLen }}</span>
      </label>

      <label v-if="type === 'INSTAX'" class="block text-sm">
        <span class="mb-1 block font-medium text-stone-700">Fotka</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          class="w-full rounded border border-stone-300 p-2"
          @change="onFileChange"
        />
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="w-full rounded bg-accent-500 px-4 py-2 font-semibold text-white" :disabled="loading">
        {{ loading ? "Ukládám…" : "Publikovat" }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth"
});

const type = ref<"INSTAX" | "LEPIK">("INSTAX");
const textContent = ref("");
const imageFile = ref<File | null>(null);
const loading = ref(false);
const error = ref("");
const route = useRoute();

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

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  imageFile.value = input.files?.[0] || null;
};

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
