<template>
  <section class="space-y-6">
    <div v-if="loading" class="text-sm text-stone-700">Načítám profil…</div>

    <template v-else-if="profile">
      <div class="rounded-xl border border-stone-300 bg-white p-5 shadow-pin">
        <div class="mb-4 flex items-stretch gap-3">
          <NuxtLink
            v-if="canEditProfile"
            :to="editProfileTo"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(45,108,223,0.35)] transition-transform hover:scale-[1.01]"
          >
            <PencilSquareIcon class="h-4 w-4" />
            Upravit profil
          </NuxtLink>
          <button
            v-if="canManageRole"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800 shadow-pin transition-colors hover:bg-stone-200 disabled:opacity-70"
            :disabled="actionLoading"
            @click="toggleRole"
          >
            <ShieldCheckIcon class="h-4 w-4" />
            {{ profile.role === "ADMIN" ? "Odebrat admina" : "Přidat admina" }}
          </button>
          <button
            v-if="canDeleteProfile"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-pin transition-colors hover:bg-red-100 disabled:opacity-70"
            :disabled="actionLoading"
            @click="deleteProfile"
          >
            <TrashIcon class="h-4 w-4" />
            Smazat profil
          </button>
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800 shadow-pin transition-colors hover:bg-stone-200"
          >
            <ArrowUturnLeftIcon class="h-4 w-4" />
            Zpět na feed
          </NuxtLink>
        </div>
        <div class="flex items-start gap-4">
          <img
            :src="mediaUrl(profile.profilePhotoPath)"
            alt="Profilová fotka"
            class="h-20 w-20 rounded-full border border-stone-300 object-cover"
          />
          <div class="min-w-0">
            <h1 class="text-2xl font-black text-stone-900">{{ profile.shortName }}</h1>
            <p class="mt-2 whitespace-pre-wrap text-sm text-stone-700">{{ profile.bio }}</p>
            <p class="mt-2 text-sm font-medium text-stone-800">Kontakt: {{ profile.contact }}</p>
            <p v-if="profile.role === 'ADMIN'" class="mt-2 text-xs font-semibold uppercase tracking-wide text-accent-700">
              Admin
            </p>
          </div>
        </div>
        <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>
      </div>

      <div>
        <PostCard
          v-for="post in mappedPosts"
          :key="post.id"
          :item="post"
          :editable="false"
          @open-image="openImageModal"
        />
        <p v-if="mappedPosts.length === 0" class="text-sm text-stone-700">Autor zatím nic nepřidal.</p>
      </div>
    </template>

    <p v-else class="text-sm text-red-600">Profil nebyl nalezen.</p>
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
import {
  ArrowUturnLeftIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  TrashIcon,
  XMarkIcon
} from "@heroicons/vue/24/outline";
import type { FeedItem } from "~/types/models";
import type { KdoParticipant } from "~~/shared/kdo";
import type { ReactionCounts, ViewerReactions } from "~~/shared/reactions";

definePageMeta({
  middleware: "auth"
});

type ProfileResponse = {
  profile: {
    id: string;
    role: "USER" | "ADMIN";
    shortName: string;
    bio: string;
    contact: string;
    profilePhotoPath: string;
    createdAt: number;
  };
  posts: Array<{
    id: string;
    type: "INSTAX" | "LEPIK" | "DISPECINK" | "KDO" | "MESTO";
    noticeLevel: "INFO" | "IMPORTANT";
    textContent: string;
    imagePath: string | null;
    createdAt: number;
    updatedAt: number;
    reactions: ReactionCounts;
    viewerReactions: ViewerReactions;
    kdoParticipants: KdoParticipant[];
    viewerJoinedKdo: boolean;
  }>;
};

const route = useRoute();
const auth = useAuth();
const authHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
const loading = ref(true);
const profile = ref<ProfileResponse["profile"] | null>(null);
const posts = ref<ProfileResponse["posts"]>([]);
const actionLoading = ref(false);
const actionError = ref("");
const activeImage = ref<{ path: string; updatedAt: number } | null>(null);
const activeImageUrl = computed(() =>
  activeImage.value
    ? `/api/media/${activeImage.value.path}?v=${activeImage.value.updatedAt}`
    : ""
);

const isOwnProfile = computed(
  () => Boolean(auth.user.value && profile.value && auth.user.value.id === profile.value.id)
);
const isAdmin = computed(() => auth.user.value?.role === "ADMIN");
const canEditProfile = computed(() => Boolean(profile.value && (isOwnProfile.value || isAdmin.value)));
const canManageRole = computed(() => Boolean(profile.value && isAdmin.value && !isOwnProfile.value));
const canDeleteProfile = computed(() => Boolean(profile.value && isAdmin.value && !isOwnProfile.value));
const editProfileTo = computed(() => {
  if (!profile.value) {
    return "/profile/edit";
  }
  if (isOwnProfile.value) {
    return "/profile/edit";
  }
  return { path: "/profile/edit", query: { userId: profile.value.id } };
});

const mappedPosts = computed<FeedItem[]>(() =>
  posts.value.map((post) => ({
    ...post,
    authorId: profile.value?.id || "",
    authorShortName: profile.value?.shortName || "",
    authorPhotoPath: profile.value?.profilePhotoPath || ""
  }))
);

const mediaUrl = (path: string) => `/api/media/${path}`;

const openImageModal = (post: FeedItem) => {
  if (!post.imagePath) {
    return;
  }
  activeImage.value = { path: post.imagePath, updatedAt: post.updatedAt };
};

const closeImageModal = () => {
  activeImage.value = null;
};

const fetchProfile = async () => {
  loading.value = true;
  try {
    const result = await $fetch<ProfileResponse>(`/api/profile/${route.params.id}`, {
      headers: authHeaders
    });
    profile.value = result.profile;
    posts.value = result.posts;
  } catch {
    profile.value = null;
  } finally {
    loading.value = false;
  }
};

const toggleRole = async () => {
  if (!profile.value || !canManageRole.value) {
    return;
  }
  actionLoading.value = true;
  actionError.value = "";
  try {
    const nextRole = profile.value.role === "ADMIN" ? "USER" : "ADMIN";
    await $fetch(`/api/admin/users/${profile.value.id}/role`, {
      method: "PATCH",
      body: { role: nextRole }
    });
    profile.value.role = nextRole;
  } catch (err: any) {
    actionError.value = err?.data?.statusMessage || err?.message || "Nepodařilo se změnit roli.";
  } finally {
    actionLoading.value = false;
  }
};

const deleteProfile = async () => {
  if (!profile.value || !canDeleteProfile.value) {
    return;
  }
  if (!window.confirm("Opravdu smazat tento profil včetně jeho příspěvků?")) {
    return;
  }
  actionLoading.value = true;
  actionError.value = "";
  try {
    await $fetch(`/api/profile/${profile.value.id}`, { method: "DELETE" as any });
    await navigateTo("/");
  } catch (err: any) {
    actionError.value = err?.data?.statusMessage || err?.message || "Profil se nepodařilo smazat.";
  } finally {
    actionLoading.value = false;
  }
};

await auth.refresh();
await fetchProfile();
</script>
