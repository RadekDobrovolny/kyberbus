<template>
  <div
    v-if="canShow"
    class="fixed bottom-6 right-6 z-40 lg:bottom-8 lg:right-auto lg:top-auto lg:left-[calc(50%+29rem)]"
  >
    <div class="relative flex h-14 w-14 items-end justify-end">
      <button
        class="absolute bottom-[4.3rem] right-1 flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-pin transition-all duration-200"
        :class="open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'"
        type="button"
        aria-label="Vytvořit Lepík"
        @click="create('LEPIK')"
      >
        <DocumentTextIcon class="h-6 w-6" />
      </button>

      <button
        class="absolute bottom-[8.1rem] right-1 flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-pin transition-all duration-200"
        :class="open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'"
        type="button"
        aria-label="Vytvořit Instax"
        @click="create('INSTAX')"
      >
        <CameraIcon class="h-6 w-6" />
      </button>

      <button
        v-if="isAdmin"
        class="absolute bottom-[11.9rem] right-1 flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-pin transition-all duration-200"
        :class="open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'"
        type="button"
        aria-label="Vytvořit Oznámení"
        @click="create('DISPECINK')"
      >
        <MegaphoneIcon class="h-6 w-6" />
      </button>
      <button
        v-if="isAdmin"
        class="absolute bottom-[15.7rem] right-1 flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-pin transition-all duration-200"
        :class="open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'"
        type="button"
        aria-label="Vytvořit Město"
        @click="create('MESTO')"
      >
        <MapPinIcon class="h-6 w-6" />
      </button>

      <button
        class="flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-white shadow-[0_12px_22px_rgba(45,108,223,0.45)] transition-transform hover:scale-105"
        type="button"
        :aria-label="open ? 'Zavřít menu' : 'Přidat nový příspěvek'"
        @click="toggle"
      >
        <XMarkIcon v-if="open" class="h-8 w-8" />
        <PlusIcon v-else class="h-8 w-8" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CameraIcon,
  DocumentTextIcon,
  MapPinIcon,
  MegaphoneIcon,
  PlusIcon,
  XMarkIcon
} from "@heroicons/vue/24/outline";
import type { PostType } from "~~/shared/content";

const auth = useAuth();
const route = useRoute();
const open = ref(false);
const isAdmin = computed(() => auth.user.value?.role === "ADMIN");

const canShow = computed(
  () => auth.loaded.value && Boolean(auth.user.value) && route.path !== "/create"
);

watch(
  () => route.fullPath,
  () => {
    open.value = false;
  }
);

const toggle = () => {
  open.value = !open.value;
};

const create = async (type: PostType) => {
  open.value = false;
  await navigateTo({ path: "/create", query: { type } });
};
</script>
