<template>
  <article :class="cardClass" :style="cardStyle">
    <div
      v-if="isLepik"
      class="pointer-events-none absolute right-0 top-0 h-7 w-7 bg-black/5 [clip-path:polygon(0_0,100%_0,100%_100%)]"
    />

    <div
      v-if="isLepik"
      class="pointer-events-none absolute inset-0 rounded-sm"
      :style="paperTextureStyle"
    />

    <div class="relative z-10 flex h-full flex-col">
      <template v-if="isInstax">
        <div class="mb-3 flex items-center justify-between gap-3">
          <NuxtLink :to="`/profile/${item.authorId}`" class="flex items-center gap-2">
            <img
              :src="mediaUrl(item.authorPhotoPath)"
              alt="Profil autora"
              class="h-9 w-9 rounded-full border border-stone-300 object-cover"
            />
            <span class="font-semibold text-stone-800">{{ item.authorShortName }}</span>
          </NuxtLink>
          <span class="text-xs text-stone-600">{{ formatDate(item.createdAt) }}</span>
        </div>

        <button
          v-if="item.imagePath"
          type="button"
          class="block w-full"
          aria-label="Otevřít fotku"
          @click="openImageModal"
        >
          <img
            :src="mediaUrl(item.imagePath)"
            alt="Instax fotografie"
            class="aspect-square w-full rounded-sm border border-stone-300 object-cover"
          />
        </button>
        <p class="gloria-hallelujah-bold mt-4 min-h-14 whitespace-pre-wrap text-xl leading-snug text-stone-800">
          {{ item.textContent }}
        </p>
      </template>

      <template v-else>
        <div class="mb-3 flex items-center justify-between gap-3">
          <NuxtLink :to="`/profile/${item.authorId}`" class="flex items-center gap-2">
            <img
              :src="mediaUrl(item.authorPhotoPath)"
              alt="Profil autora"
              class="h-9 w-9 rounded-full border border-stone-300 object-cover"
            />
            <span class="font-semibold text-stone-800">{{ item.authorShortName }}</span>
          </NuxtLink>
          <span class="text-xs text-stone-600">{{ formatDate(item.createdAt) }}</span>
        </div>
        <p class="gloria-hallelujah-regular flex-1 whitespace-pre-wrap text-xl leading-snug text-stone-800/95">
          {{ item.textContent }}
        </p>
      </template>

      <div v-if="editable" class="mt-4 flex gap-2">
        <button
          class="rounded border border-stone-400 px-2 py-1 text-xs font-medium text-stone-700"
          type="button"
          @click="$emit('edit', item)"
        >
          Upravit
        </button>
        <button
          class="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700"
          type="button"
          @click="$emit('remove', item)"
        >
          Smazat
        </button>
      </div>
    </div>
  </article>

  <Teleport to="body">
    <div
      v-if="isImageModalOpen && item.imagePath"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
      @click="closeImageModal"
    >
      <div class="relative max-h-[92vh] w-full max-w-5xl" @click.stop>
        <button
          type="button"
          class="absolute right-2 top-2 rounded-full bg-black/55 p-2 text-white"
          aria-label="Zavřít fotku"
          @click="closeImageModal"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
        <img
          :src="mediaUrl(item.imagePath)"
          alt="Instax fotografie - detail"
          class="max-h-[92vh] w-full rounded object-contain"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline";
import type { FeedItem } from "~/types/models";

const props = defineProps<{
  item: FeedItem;
  editable: boolean;
}>();

defineEmits<{
  edit: [FeedItem];
  remove: [FeedItem];
}>();

const isLepik = computed(() => props.item.type === "LEPIK");
const isInstax = computed(() => props.item.type === "INSTAX");
const isImageModalOpen = ref(false);

const hashId = (id: string) =>
  Array.from(id).reduce((acc, ch) => ((acc * 31 + ch.charCodeAt(0)) >>> 0), 7);

const lepikPalette = [
  "bg-yellow-100",
  "bg-emerald-100",
  "bg-sky-100",
  "bg-rose-100",
  "bg-orange-100",
  "bg-lime-100"
];

const lepikAngle = computed(() => {
  const angles = [-4, -3, -2, -1, 1, 2, 3, 4];
  return angles[hashId(props.item.id) % angles.length];
});

const instaxAngle = computed(() => {
  const angles = [-2, -1, 1, 2];
  return angles[hashId(props.item.id) % angles.length];
});

const lepikColorClass = computed(
  () => lepikPalette[hashId(props.item.id) % lepikPalette.length]
);

const cardClass = computed(() => {
  if (isInstax.value) {
    return "relative mx-auto mb-20 w-full max-w-[26rem] overflow-hidden rounded-[0.2rem] border border-stone-300 bg-white p-6 pb-8 shadow-[0_18px_30px_rgba(0,0,0,0.16),0_4px_10px_rgba(0,0,0,0.12)]";
  }

  return `relative mx-auto mb-20 flex aspect-square w-full max-w-[22rem] flex-col overflow-hidden rounded-sm border border-stone-300/80 p-4 transition-transform duration-200 hover:scale-[1.01] ${lepikColorClass.value}`;
});

const cardStyle = computed(() =>
  isLepik.value
    ? {
        transform: `rotate(${lepikAngle.value}deg)`,
        boxShadow: "0 16px 28px rgba(0, 0, 0, 0.16), 0 3px 8px rgba(0, 0, 0, 0.12)"
      }
    : isInstax.value
      ? {
          transform: `rotate(${instaxAngle.value}deg)`
        }
    : undefined
);

const paperTextureStyle = computed(() =>
  isLepik.value
    ? {
        backgroundImage:
          "linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.02) 100%), radial-gradient(circle at 18% 20%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 44%)",
        opacity: "0.6"
      }
    : undefined
);

const mediaUrl = (path: string) => `/api/media/${path}`;

const openImageModal = () => {
  if (!props.item.imagePath) {
    return;
  }
  isImageModalOpen.value = true;
};

const closeImageModal = () => {
  isImageModalOpen.value = false;
};

const formatDate = (stamp: number) =>
  new Date(stamp).toLocaleString("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
</script>
