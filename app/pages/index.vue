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
    <div v-if="editingPost" class="mb-6 rounded-xl border border-stone-300 bg-white p-4 shadow-pin">
      <h2 class="mb-3 font-bold text-stone-900">Upravit příspěvek</h2>
      <textarea
        v-model="editText"
        class="min-h-24 w-full rounded border border-stone-300 bg-stone-50 p-2 text-sm"
        :maxlength="getEditMaxLen(editingPost.type)"
      />
      <div class="mt-2 text-xs text-stone-600">
        {{ editText.length }} / {{ getEditMaxLen(editingPost.type) }}
      </div>
      <div class="mt-3 flex gap-2">
        <button class="rounded bg-accent-500 px-3 py-1.5 text-sm font-semibold text-white" @click="saveEdit">
          Uložit
        </button>
        <button class="rounded border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-700" @click="cancelEdit">
          Zrušit
        </button>
      </div>
    </div>

    <PostCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      :editable="canEditPost(item)"
      @edit="startEdit"
      @remove="removePost"
    />

    <div v-if="loading" class="py-4 text-center text-sm text-stone-600">Načítám…</div>
    <div v-else-if="items.length === 0" class="rounded-xl border border-dashed border-stone-400 p-6 text-center text-stone-700">
      Zatím tu není žádný příspěvek.
    </div>

    <div v-if="nextCursor" class="mt-4 text-center">
      <button class="rounded border border-stone-400 px-4 py-2 text-sm font-medium text-stone-800" @click="loadMore">
        Načíst další
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FeedItem } from "~/types/models";
import { getPostMaxLength } from "~~/shared/content";

const auth = useAuth();
const authHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
const items = ref<FeedItem[]>([]);
const nextCursor = ref<string | null>(null);
const loading = ref(false);
const realtimeRefreshing = ref(false);
const realtimePollMs = 5000;

const editingPost = ref<FeedItem | null>(null);
const editText = ref("");
let feedStream: EventSource | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const fetchFeed = async (cursor?: string) => {
  loading.value = true;
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
      items.value = result.items;
    } else {
      items.value = [...items.value, ...result.items];
    }
    nextCursor.value = result.nextCursor;
  } finally {
    loading.value = false;
  }
};

const refreshFromRealtime = async () => {
  if (loading.value || realtimeRefreshing.value || editingPost.value) {
    return;
  }
  realtimeRefreshing.value = true;
  try {
    await fetchFeed();
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
  feedStream.addEventListener("feed-update", () => {
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

const startEdit = (post: FeedItem) => {
  editingPost.value = post;
  editText.value = post.textContent;
};

const cancelEdit = () => {
  editingPost.value = null;
  editText.value = "";
};

const saveEdit = async () => {
  if (!editingPost.value) {
    return;
  }
  await $fetch(`/api/posts/${editingPost.value.id}`, {
    method: "PATCH",
    body: { textContent: editText.value }
  });
  cancelEdit();
  await fetchFeed();
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

const getEditMaxLen = (type: FeedItem["type"]) => getPostMaxLength(type);

if (!auth.loaded.value) {
  await auth.refresh();
}
if (auth.user.value) {
  await fetchFeed();
}

if (import.meta.client) {
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
    closeFeedStream();
    stopRealtimePolling();
  });
}
</script>
