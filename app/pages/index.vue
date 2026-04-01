<template>
  <section
    v-if="!auth.loaded.value"
    class="mx-auto max-w-xl rounded-xl border border-stone-300 bg-white p-6 text-center shadow-pin"
  >
    <p class="text-sm text-stone-700">Načítám…</p>
  </section>

  <section
    v-else-if="!auth.user.value"
    class="mx-auto max-w-xl rounded-xl border border-stone-300 bg-white p-6 text-center shadow-pin"
  >
    <h1 class="mb-2 text-2xl font-black text-stone-900">Jen pro účastníky zájezdu</h1>
    <p class="mb-6 text-sm text-stone-700">
      Web je určený pro komunitu kurzu. Registrace je otevřená, ale obsah je dostupný až po přihlášení.
    </p>
    <div class="flex justify-center gap-3">
      <NuxtLink to="/register" class="rounded bg-accent-500 px-4 py-2 text-sm font-semibold text-white">
        Registrovat
      </NuxtLink>
      <NuxtLink to="/login" class="rounded border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800">
        Přihlásit
      </NuxtLink>
    </div>
  </section>

  <section v-else>
    <PostCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      :editable="canEditPost(item)"
      @edit="startEdit"
      @open-image="openImageModal"
      @remove="removePost"
    />

    <div v-if="loading" class="py-4 text-center text-sm text-stone-600">Načítám…</div>
    <div v-else-if="items.length === 0" class="rounded-xl border border-dashed border-stone-400 p-6 text-center text-stone-700">
      Zatím tu není žádný příspěvek.
    </div>

    <div v-if="nextCursor" class="mt-4 text-center">
      <button
        class="inline-flex items-center justify-center rounded-full border border-stone-300 bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-pin transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-65"
        :disabled="loading"
        @click="loadMore"
      >
        {{ loading ? "Načítám…" : "Načíst další" }}
      </button>
    </div>

    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-150"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <button
        v-if="showScrollTopBubble"
        type="button"
        class="fixed right-6 top-24 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-pin transition-transform hover:scale-105 lg:right-auto lg:left-[calc(50%+29rem)]"
        aria-label="Zpět na začátek feedu"
        @click="scrollToFeedTop"
      >
        <ArrowUpIcon class="h-6 w-6" />
      </button>
    </Transition>
  </section>

  <Teleport to="body">
    <div
      v-if="activeImage"
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
          :src="activeImageUrl"
          alt="Instax fotografie - detail"
          class="max-h-[92vh] w-full rounded object-contain"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ArrowUpIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import type { FeedItem } from "~/types/models";

const auth = useAuth();
const authHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
const items = ref<FeedItem[]>([]);
const nextCursor = ref<string | null>(null);
const loading = ref(false);
const realtimeRefreshing = ref(false);
const showScrollTopBubble = ref(false);
const activeImage = ref<{ path: string; updatedAt: number } | null>(null);
const realtimePollMs = 5000;
const scrollTopThresholdPx = 320;
let feedStream: EventSource | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const activeImageUrl = computed(() =>
  activeImage.value
    ? `/api/media/${activeImage.value.path}?v=${activeImage.value.updatedAt}`
    : ""
);

type FetchFeedOptions = {
  silent?: boolean;
  mergeWithExisting?: boolean;
  preserveCursor?: boolean;
};

const updateScrollTopBubbleVisibility = () => {
  if (!import.meta.client) {
    return;
  }
  showScrollTopBubble.value = window.scrollY > scrollTopThresholdPx;
};

const handleWindowScroll = () => {
  updateScrollTopBubbleVisibility();
};

const mergeFeedItems = (head: FeedItem[], tail: FeedItem[]) => {
  const seen = new Set<string>();
  const merged: FeedItem[] = [];
  for (const item of head) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    merged.push(item);
  }
  for (const item of tail) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
};

const fetchFeed = async (cursor?: string, options?: FetchFeedOptions) => {
  const silent = Boolean(options?.silent);
  if (!silent) {
    loading.value = true;
  }
  try {
    const params = new URLSearchParams({ limit: "30" });
    if (cursor) {
      params.set("cursor", cursor);
    }
    const result = await $fetch<{ items: FeedItem[]; nextCursor: string | null }>(
      `/api/feed?${params.toString()}`,
      { headers: authHeaders }
    );

    if (!cursor) {
      if (options?.mergeWithExisting && items.value.length > 0) {
        items.value = mergeFeedItems(result.items, items.value);
      } else {
        items.value = result.items;
      }
      if (!options?.preserveCursor) {
        nextCursor.value = result.nextCursor;
      }
    } else {
      items.value = mergeFeedItems(items.value, result.items);
      nextCursor.value = result.nextCursor;
    }
  } finally {
    if (!silent) {
      loading.value = false;
    }
  }
};

const refreshFromRealtime = async () => {
  if (loading.value || realtimeRefreshing.value) {
    return;
  }
  realtimeRefreshing.value = true;
  try {
    await fetchFeed(undefined, {
      silent: true,
      mergeWithExisting: true,
      preserveCursor: true
    });
  } finally {
    realtimeRefreshing.value = false;
  }
};

const closeFeedStream = () => {
  if (!feedStream) {
    return;
  }
  feedStream.close();
  feedStream = null;
};

const stopRealtimePolling = () => {
  if (!pollTimer) {
    return;
  }
  clearInterval(pollTimer);
  pollTimer = null;
};

const startRealtimePolling = () => {
  if (!import.meta.client || pollTimer) {
    return;
  }
  pollTimer = setInterval(() => {
    void refreshFromRealtime();
  }, realtimePollMs);
};

const startFeedStream = () => {
  if (!import.meta.client || feedStream) {
    return;
  }

  feedStream = new EventSource("/api/feed/stream");
  feedStream.addEventListener("feed-update", (event) => {
    const data = event instanceof MessageEvent ? String(event.data || "") : "";
    if (data.length > 0) {
      try {
        const parsed = JSON.parse(data) as { kind?: string; postId?: string };
        if (parsed.kind === "deleted" && parsed.postId) {
          items.value = items.value.filter((item) => item.id !== parsed.postId);
        }
      } catch {
        // Ignoruj neplatný payload a proveď refresh.
      }
    }
    void refreshFromRealtime();
  });
  feedStream.onerror = () => {
    // Browser se pokusí o reconnect automaticky.
  };
};

const loadMore = async () => {
  if (!nextCursor.value) {
    return;
  }
  await fetchFeed(nextCursor.value);
};

const scrollToFeedTop = (smooth = true) => {
  if (!import.meta.client) {
    return;
  }
  window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
};

const openImageModal = (post: FeedItem) => {
  if (!post.imagePath) {
    return;
  }
  activeImage.value = { path: post.imagePath, updatedAt: post.updatedAt };
};

const closeImageModal = () => {
  activeImage.value = null;
};

const startEdit = (post: FeedItem) => {
  void navigateTo(`/posts/${post.id}/edit`);
};

const removePost = async (post: FeedItem) => {
  if (!window.confirm("Opravdu smazat příspěvek?")) {
    return;
  }
  await $fetch(`/api/posts/${post.id}`, { method: "DELETE" });
  await fetchFeed();
};

const canEditPost = (post: FeedItem) =>
  post.authorId === auth.user.value?.id || auth.user.value?.role === "ADMIN";

if (!auth.loaded.value) {
  await auth.refresh();
}
if (auth.user.value) {
  await fetchFeed();
}

if (import.meta.client) {
  onMounted(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    scrollToFeedTop(false);
    updateScrollTopBubbleVisibility();
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
  });

  watch(
    () => auth.user.value?.id,
    (id) => {
      if (id) {
        startFeedStream();
        startRealtimePolling();
      } else {
        closeFeedStream();
        stopRealtimePolling();
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "auto";
    }
    window.removeEventListener("scroll", handleWindowScroll);
    closeFeedStream();
    stopRealtimePolling();
  });
}
</script>
