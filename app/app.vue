<template>
  <div class="relative min-h-screen bg-gradient-to-b from-stone-100 via-stone-200 to-stone-100">
    <header
      class="fixed left-0 right-0 top-0 z-50 border-b border-stone-300 bg-stone-100 transition-transform duration-300 ease-out md:translate-y-0"
      :class="isHeaderHidden ? '-translate-y-full' : 'translate-y-0'"
    >
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div class="min-w-0">
          <NuxtLink
            v-if="auth.loaded.value && auth.user.value"
            :to="`/profile/${auth.user.value.id}`"
            class="flex items-center gap-2"
          >
            <img
              :src="mediaUrl(auth.user.value.profilePhotoPath)"
              alt="Můj profil"
              class="h-10 w-10 rounded-full border border-stone-300 object-cover"
            />
            <span class="truncate text-sm font-semibold text-stone-800">
              {{ auth.user.value.shortName }}
            </span>
          </NuxtLink>

          <div v-else class="h-10 w-10 rounded-full border border-stone-300 bg-stone-200" />
        </div>

        <nav class="flex items-center gap-3 text-sm">
          <template v-if="!auth.loaded.value">
            <span class="text-stone-500">…</span>
          </template>
          <template v-else-if="auth.user.value">
            <NuxtLink
              v-if="auth.user.value.role === 'ADMIN'"
              to="/busadmin"
              class="rounded-full p-2 text-stone-700 transition-colors hover:bg-stone-200 hover:text-stone-900"
              aria-label="Admin"
            >
              <UsersIcon class="h-6 w-6" />
            </NuxtLink>
            <button
              class="rounded-full p-2 text-stone-700 transition-colors hover:bg-stone-200 hover:text-stone-900"
              type="button"
              aria-label="Odhlášení"
              @click="handleLogout"
            >
              <ArrowRightEndOnRectangleIcon class="h-6 w-6" />
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="font-medium text-stone-700 hover:text-stone-900">
              Přihlášení
            </NuxtLink>
            <NuxtLink to="/register" class="rounded bg-accent-500 px-3 py-1.5 font-semibold text-white">
              Registrace
            </NuxtLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="relative mx-auto max-w-4xl px-4 pb-6 pt-24">
      <div
        class="pointer-events-none absolute left-1/2 top-0 z-0 w-[min(72vw,26rem)] -translate-x-1/2 overflow-hidden"
        style="height: max(100%, 1600px);"
        aria-hidden="true"
      >
        <svg class="h-full w-full" viewBox="0 0 360 2400" preserveAspectRatio="none">
          <path
            d="M180 0 C 134 220, 236 430, 180 650 C 126 870, 232 1080, 180 1300 C 132 1510, 236 1730, 180 1945 C 138 2125, 220 2280, 180 2400"
            fill="none"
            stroke="#0b0b0d"
            stroke-linecap="round"
            stroke-width="62"
            opacity="0.82"
          />
          <path
            d="M180 0 C 134 220, 236 430, 180 650 C 126 870, 232 1080, 180 1300 C 132 1510, 236 1730, 180 1945 C 138 2125, 220 2280, 180 2400"
            fill="none"
            stroke="white"
            stroke-dasharray="9 10.5"
            stroke-linecap="round"
            stroke-width="4"
            vector-effect="non-scaling-stroke"
            opacity="0.8"
          />
        </svg>
      </div>

      <div class="relative z-10">
        <NuxtPage />
      </div>
    </main>

    <CreateBubbleMenu />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRightEndOnRectangleIcon,
  UsersIcon
} from "@heroicons/vue/24/outline";

const auth = useAuth();
const runtimeConfig = useRuntimeConfig();
const umamiWebsiteId = String(runtimeConfig.public.umamiWebsiteId || "").trim();
const isHeaderHidden = ref(false);
const headerHideThreshold = 80;
const headerDeltaThreshold = 8;
let lastScrollY = 0;

if (umamiWebsiteId) {
  useHead({
    script: [
      {
        defer: true,
        src: "https://umami.hippou.cz/script.js",
        "data-website-id": umamiWebsiteId
      }
    ]
  });
}

const mediaUrl = (path: string) => `/api/media/${path}`;

const handleLogout = async () => {
  await auth.logout();
  await navigateTo("/login");
};

const handleScroll = () => {
  const currentScrollY = window.scrollY;
  if (currentScrollY <= headerHideThreshold) {
    isHeaderHidden.value = false;
    lastScrollY = currentScrollY;
    return;
  }

  const delta = currentScrollY - lastScrollY;
  if (delta > headerDeltaThreshold) {
    isHeaderHidden.value = true;
  } else if (delta < -headerDeltaThreshold) {
    isHeaderHidden.value = false;
  }

  lastScrollY = currentScrollY;
};

if (import.meta.client) {
  onMounted(() => {
    lastScrollY = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", handleScroll);
  });
}
</script>
