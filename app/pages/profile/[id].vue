<template>
  <section class="space-y-6">
    <div v-if="loading" class="text-sm text-stone-700">Načítám profil…</div>

    <template v-else-if="profile">
      <div class="rounded-xl border border-stone-300 bg-white p-5 shadow-pin">
        <div class="mb-4">
          <NuxtLink
            to="/"
            class="inline-flex rounded border border-stone-300 bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-800"
          >
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
            <NuxtLink
              v-if="isOwnProfile"
              to="/profile/edit"
              class="mt-3 inline-flex rounded bg-accent-500 px-3 py-1.5 text-sm font-semibold text-white"
            >
              Upravit profil
            </NuxtLink>
          </div>
        </div>
      </div>

      <div>
        <h2 class="mb-3 text-lg font-bold text-stone-900">Poslední příspěvky autora</h2>
        <PostCard
          v-for="post in mappedPosts"
          :key="post.id"
          :item="post"
          :editable="false"
        />
        <p v-if="mappedPosts.length === 0" class="text-sm text-stone-700">Autor zatím nic nepřidal.</p>
      </div>
    </template>

    <p v-else class="text-sm text-red-600">Profil nebyl nalezen.</p>
  </section>
</template>

<script setup lang="ts">
import type { FeedItem } from "~/types/models";

definePageMeta({
  middleware: "auth"
});

type ProfileResponse = {
  profile: {
    id: string;
    shortName: string;
    bio: string;
    contact: string;
    profilePhotoPath: string;
    createdAt: number;
  };
  posts: Array<{
    id: string;
    type: "INSTAX" | "LEPIK";
    textContent: string;
    imagePath: string | null;
    createdAt: number;
  }>;
};

const route = useRoute();
const auth = useAuth();
const loading = ref(true);
const profile = ref<ProfileResponse["profile"] | null>(null);
const posts = ref<ProfileResponse["posts"]>([]);

const isOwnProfile = computed(
  () => Boolean(auth.user.value && profile.value && auth.user.value.id === profile.value.id)
);

const mappedPosts = computed<FeedItem[]>(() =>
  posts.value.map((post) => ({
    ...post,
    updatedAt: post.createdAt,
    authorId: profile.value?.id || "",
    authorShortName: profile.value?.shortName || "",
    authorPhotoPath: profile.value?.profilePhotoPath || ""
  }))
);

const mediaUrl = (path: string) => `/api/media/${path}`;

try {
  const result = await $fetch<ProfileResponse>(`/api/profile/${route.params.id}`);
  profile.value = result.profile;
  posts.value = result.posts;
} catch {
  profile.value = null;
} finally {
  loading.value = false;
}
</script>
