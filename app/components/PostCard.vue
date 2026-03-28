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
            :src="mediaUrl(item.imagePath, item.updatedAt)"
            alt="Instax fotografie"
            class="aspect-square w-full rounded-sm border border-stone-300 object-cover"
          />
        </button>
        <p class="gloria-hallelujah-bold mt-4 min-h-14 whitespace-pre-wrap text-xl leading-snug text-stone-800">
          {{ item.textContent }}
        </p>
      </template>

      <template v-else-if="isMesto">
        <div class="flex min-h-[9.5rem] items-center justify-center rounded-[0.9rem] border-[6.5px] border-black bg-white px-5 py-8 text-center">
          <p class="roboto-condensed-sign break-words text-5xl uppercase leading-tight tracking-[0.08em] text-black md:text-6xl">
            {{ mestoDisplayText }}
          </p>
        </div>
      </template>

      <template v-else-if="isAnnouncement">
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
        <div
          class="flex items-center gap-3 rounded-lg border px-4 py-3"
          :class="isImportantAnnouncement
            ? 'border-red-300 bg-red-50'
            : 'border-stone-300 bg-stone-50'"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
            :class="isImportantAnnouncement
              ? 'border-red-300 bg-red-100'
              : 'border-stone-300 bg-white'"
          >
            <span
              v-if="isImportantAnnouncement"
              class="text-xl font-black leading-none text-red-600"
              aria-hidden="true"
            >
              !
            </span>
            <MegaphoneIcon v-else class="h-5 w-5 text-stone-700" />
          </div>
          <p
            class="min-w-0 flex-1 whitespace-pre-wrap font-mono text-[1rem] leading-relaxed"
            :class="isImportantAnnouncement ? 'text-red-950' : 'text-stone-800'"
          >
            {{ item.textContent }}
          </p>
        </div>
      </template>

      <template v-else-if="isKdo">
        <div class="mb-3 flex items-center justify-between gap-3">
          <NuxtLink :to="`/profile/${item.authorId}`" class="flex items-center gap-2">
            <img
              :src="mediaUrl(item.authorPhotoPath)"
              alt="Profil autora"
              class="h-9 w-9 rounded-full border border-stone-300 object-cover"
            />
            <span class="font-semibold text-stone-800">{{ item.authorShortName }} se ptá:</span>
          </NuxtLink>
          <span class="text-xs text-stone-600">{{ formatDate(item.createdAt) }}</span>
        </div>

        <div class="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-400 bg-amber-200">
            <QuestionMarkCircleIcon class="h-7 w-7 text-amber-700" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <p class="min-w-0 flex-1 whitespace-pre-wrap text-base font-semibold leading-snug text-stone-900">
                {{ item.textContent }}
              </p>
              <button
                type="button"
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-2xl transition-colors"
                :class="viewerJoinedKdoState
                  ? 'border-amber-500 bg-amber-200'
                  : 'border-stone-300 bg-white hover:bg-stone-100'"
                :disabled="pendingKdoToggle"
                aria-label="Zvednout ruku"
                @click="toggleKdoHand"
              >
                🙋‍♀️
              </button>
            </div>

            <p v-if="kdoParticipantsState.length === 0" class="mt-3 text-sm text-stone-600">
              Zatím nikdo.
            </p>
            <ul v-else class="mt-3 space-y-1">
              <li
                v-for="participant in kdoParticipantsState"
                :key="participant.userId"
                class="text-sm font-medium text-stone-800"
              >
                {{ participant.shortName }}
              </li>
            </ul>
          </div>
        </div>
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

      <div class="mt-4 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            v-for="reaction in reactionButtons"
            :key="reaction.type"
            class="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-65"
            :class="reactionButtonClass(reaction.key)"
            :disabled="pendingByReaction[reaction.key]"
            :aria-label="`Reagovat ${reaction.emoji}`"
            type="button"
            @click="toggleReaction(reaction.type, reaction.key)"
          >
            <span aria-hidden="true" class="text-2xl leading-none">{{ reaction.emoji }}</span>
            <span>{{ reactionState.reactions[reaction.key] }}</span>
          </button>
        </div>

        <div v-if="editable" class="flex gap-2">
          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-stone-700 transition-colors hover:bg-stone-200"
            type="button"
            aria-label="Upravit příspěvek"
            @click="$emit('edit', item)"
          >
            <PencilSquareIcon class="h-4 w-4" />
          </button>
          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 bg-red-50 text-red-700 transition-colors hover:bg-red-100"
            type="button"
            aria-label="Smazat příspěvek"
            @click="$emit('remove', item)"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
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
          :src="mediaUrl(item.imagePath, item.updatedAt)"
          alt="Instax fotografie - detail"
          class="max-h-[92vh] w-full rounded object-contain"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  MegaphoneIcon,
  PencilSquareIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
  XMarkIcon
} from "@heroicons/vue/24/outline";
import type { FeedItem } from "~/types/models";
import type { KdoParticipant } from "~~/shared/kdo";
import {
  createEmptyReactionCounts,
  createEmptyViewerReactions,
  type ReactionCounts,
  type ReactionKey,
  type ReactionType,
  type ViewerReactions
} from "~~/shared/reactions";

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
const isAnnouncement = computed(() => props.item.type === "DISPECINK");
const isKdo = computed(() => props.item.type === "KDO");
const isMesto = computed(() => props.item.type === "MESTO");
const isImportantAnnouncement = computed(
  () => isAnnouncement.value && props.item.noticeLevel === "IMPORTANT"
);
const isImageModalOpen = ref(false);
const pendingKdoToggle = ref(false);
const reactionButtons: Array<{ type: ReactionType; key: ReactionKey; emoji: string }> = [
  { type: "HEART", key: "heart", emoji: "❤️" },
  { type: "LAUGH", key: "laugh", emoji: "😄" },
  { type: "ROCKET", key: "rocket", emoji: "🚀" }
];
const pendingByReaction = reactive<Record<ReactionKey, boolean>>({
  heart: false,
  laugh: false,
  rocket: false
});
const reactionState = ref<{
  reactions: ReactionCounts;
  viewerReactions: ViewerReactions;
}>({
  reactions: createEmptyReactionCounts(),
  viewerReactions: createEmptyViewerReactions()
});
const kdoParticipantsState = ref<KdoParticipant[]>([]);
const viewerJoinedKdoState = ref(false);

const snapshotReactionState = () => ({
  reactions: { ...reactionState.value.reactions },
  viewerReactions: { ...reactionState.value.viewerReactions }
});

const syncReactionStateFromItem = () => {
  reactionState.value = {
    reactions: {
      ...createEmptyReactionCounts(),
      ...props.item.reactions
    },
    viewerReactions: {
      ...createEmptyViewerReactions(),
      ...props.item.viewerReactions
    }
  };
};

const syncKdoStateFromItem = () => {
  kdoParticipantsState.value = Array.isArray(props.item.kdoParticipants)
    ? [...props.item.kdoParticipants]
    : [];
  viewerJoinedKdoState.value = Boolean(props.item.viewerJoinedKdo);
};

watch(
  () => [
    props.item.id,
    props.item.updatedAt,
    props.item.reactions.heart,
    props.item.reactions.laugh,
    props.item.reactions.rocket,
    props.item.viewerReactions.heart,
    props.item.viewerReactions.laugh,
    props.item.viewerReactions.rocket
  ],
  () => {
    syncReactionStateFromItem();
  },
  { immediate: true }
);

watch(
  () => [props.item.id, props.item.updatedAt, props.item.kdoParticipants, props.item.viewerJoinedKdo],
  () => {
    syncKdoStateFromItem();
  },
  { immediate: true, deep: true }
);

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
const mestoAngle = computed(() => {
  const angles = [-1, 0, 1];
  return angles[hashId(props.item.id) % angles.length];
});

const lepikColorClass = computed(
  () => lepikPalette[hashId(props.item.id) % lepikPalette.length]
);

const cardClass = computed(() => {
  if (isInstax.value) {
    return "relative mx-auto mb-20 w-full max-w-[26rem] overflow-hidden rounded-[0.2rem] border border-stone-300 bg-white p-6 pb-8 shadow-[0_18px_30px_rgba(0,0,0,0.16),0_4px_10px_rgba(0,0,0,0.12)]";
  }
  if (isMesto.value) {
    return "relative mx-auto mb-20 w-full max-w-[30rem] overflow-hidden rounded-xl border border-stone-300 bg-white p-2 shadow-[0_14px_24px_rgba(0,0,0,0.14),0_3px_10px_rgba(0,0,0,0.1)]";
  }
  if (isAnnouncement.value) {
    return "relative mx-auto mb-20 w-full max-w-[34rem] overflow-hidden rounded-xl border border-stone-300 bg-white p-4 shadow-[0_14px_24px_rgba(0,0,0,0.14),0_3px_10px_rgba(0,0,0,0.1)]";
  }
  if (isKdo.value) {
    return "relative mx-auto mb-20 w-full max-w-[34rem] overflow-hidden rounded-xl border border-stone-300 bg-white p-4 shadow-[0_14px_24px_rgba(0,0,0,0.14),0_3px_10px_rgba(0,0,0,0.1)]";
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
    : isMesto.value
      ? {
          transform: `rotate(${mestoAngle.value}deg)`
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

const mediaUrl = (path: string, version?: number) =>
  version ? `/api/media/${path}?v=${version}` : `/api/media/${path}`;
const mestoDisplayText = computed(() => props.item.textContent.trim().toLocaleUpperCase("cs-CZ"));

const reactionButtonClass = (key: ReactionKey) =>
  reactionState.value.viewerReactions[key]
    ? "border-accent-500 bg-accent-100 text-accent-900"
    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100";

const toggleReaction = async (reactionType: ReactionType, key: ReactionKey) => {
  if (pendingByReaction[key]) {
    return;
  }

  const previous = snapshotReactionState();
  const alreadyReacted = reactionState.value.viewerReactions[key];
  reactionState.value.viewerReactions[key] = !alreadyReacted;
  reactionState.value.reactions[key] = Math.max(
    0,
    reactionState.value.reactions[key] + (alreadyReacted ? -1 : 1)
  );

  pendingByReaction[key] = true;
  try {
    const result = await $fetch<{
      reactions: ReactionCounts;
      viewerReactions: ViewerReactions;
    }>(`/api/posts/${props.item.id}/reactions`, {
      method: "POST",
      body: {
        reactionType
      }
    });
    reactionState.value = {
      reactions: result.reactions,
      viewerReactions: result.viewerReactions
    };
  } catch {
    reactionState.value = previous;
  } finally {
    pendingByReaction[key] = false;
  }
};

const toggleKdoHand = async () => {
  if (!isKdo.value || pendingKdoToggle.value) {
    return;
  }

  pendingKdoToggle.value = true;
  try {
    const result = await $fetch<{
      participants: KdoParticipant[];
      viewerJoinedKdo: boolean;
    }>(`/api/posts/${props.item.id}/kdo-hand`, {
      method: "POST"
    });

    kdoParticipantsState.value = result.participants;
    viewerJoinedKdoState.value = result.viewerJoinedKdo;
  } finally {
    pendingKdoToggle.value = false;
  }
};

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
