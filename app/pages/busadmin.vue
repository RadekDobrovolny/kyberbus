<template>
  <section class="space-y-4">
    <div class="rounded-xl border border-stone-300 bg-white p-5 shadow-pin">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="inline-flex items-center gap-2 text-xl font-black text-stone-900">
          <UsersIcon class="h-6 w-6" />
          Správa uživatelů
        </h1>

        <div class="flex items-center gap-2">
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800 shadow-pin transition-colors hover:bg-stone-200"
          >
            <ArrowUturnLeftIcon class="h-4 w-4" />
            Zpět
          </NuxtLink>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 disabled:opacity-60"
            :disabled="loading"
            @click="fetchUsers"
          >
            <ArrowPathIcon class="h-4 w-4" />
            Obnovit
          </button>
        </div>
      </div>
      <p class="mt-2 text-sm text-stone-600">
        Přehled uživatelů, změna role a rychlé akce.
      </p>
    </div>

    <div v-if="loading" class="rounded-xl border border-stone-300 bg-white p-5 text-sm text-stone-700 shadow-pin">
      Načítám uživatele…
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-pin"
    >
      {{ error }}
    </div>

    <div v-else class="space-y-3">
      <article
        v-for="item in users"
        :key="item.id"
        class="rounded-xl border border-stone-300 bg-white p-4 shadow-pin"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <img
              :src="mediaUrl(item.profilePhotoPath)"
              :alt="`Profilová fotka ${item.shortName}`"
              class="h-12 w-12 rounded-full border border-stone-300 object-cover"
            />
            <div class="min-w-0">
              <p class="truncate text-base font-semibold text-stone-900">{{ item.shortName }}</p>
              <p class="truncate text-sm text-stone-600">{{ item.login }}</p>
              <p class="text-xs text-stone-500">ID: {{ item.id }}</p>
              <p class="text-xs text-stone-500">Aktivita: {{ formatLastActive(item.lastActiveAt) }}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2">
            <label class="inline-flex items-center gap-2 text-sm text-stone-700">
              Role
              <select
                v-model="item.roleDraft"
                class="rounded border border-stone-300 bg-white px-2 py-1 text-sm text-stone-800"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(45,108,223,0.35)] transition-transform hover:scale-[1.01] disabled:opacity-60"
              :disabled="item.savingRole || item.roleDraft === item.role"
              @click="saveRole(item)"
            >
              <ShieldCheckIcon class="h-4 w-4" />
              {{ item.savingRole ? "Ukládám…" : "Uložit roli" }}
            </button>
            <NuxtLink
              :to="{ path: '/profile/edit', query: { userId: item.id } }"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800 shadow-pin transition-colors hover:bg-stone-200"
            >
              <PencilSquareIcon class="h-4 w-4" />
              Upravit
            </NuxtLink>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-pin transition-colors hover:bg-red-100 disabled:opacity-60"
              :disabled="item.deleting || isSelf(item)"
              @click="deleteUser(item)"
            >
              <TrashIcon class="h-4 w-4" />
              {{ item.deleting ? "Mažu…" : "Smazat" }}
            </button>
          </div>
        </div>
        <p v-if="isSelf(item)" class="mt-2 text-xs text-stone-500">
          Vlastní účet nejde smazat.
        </p>
        <p v-if="item.error" class="mt-2 text-sm text-red-600">{{ item.error }}</p>
      </article>

      <div v-if="users.length === 0" class="rounded-xl border border-dashed border-stone-400 p-6 text-center text-stone-700">
        V databázi zatím nejsou žádní uživatelé.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  TrashIcon,
  UsersIcon
} from "@heroicons/vue/24/outline";

definePageMeta({
  middleware: "admin"
});

type UserRole = "USER" | "ADMIN";
type AdminUser = {
  id: string;
  login: string;
  role: UserRole;
  shortName: string;
  bio: string;
  contact: string;
  profilePhotoPath: string;
  createdAt: number;
  lastActiveAt: number | null;
  updatedAt: number;
};

type UserRow = AdminUser & {
  roleDraft: UserRole;
  savingRole: boolean;
  deleting: boolean;
  error: string;
};

const auth = useAuth();
const authHeaders = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
const users = ref<UserRow[]>([]);
const loading = ref(false);
const error = ref("");

const mediaUrl = (path: string) => `/api/media/${path}`;
const formatLastActive = (stamp: number | null) => {
  if (!stamp) {
    return "zatím nezaznamenána";
  }
  return new Date(stamp).toLocaleString("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const enrich = (items: AdminUser[]) =>
  items.map((item) => ({
    ...item,
    roleDraft: item.role,
    savingRole: false,
    deleting: false,
    error: ""
  }));

const isSelf = (item: UserRow) => item.id === auth.user.value?.id;

const fetchUsers = async () => {
  loading.value = true;
  error.value = "";
  try {
    const result = await $fetch<{ users: AdminUser[] }>("/api/admin/users", {
      headers: authHeaders
    });
    users.value = enrich(result.users);
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.message || "Nepodařilo se načíst uživatele.";
  } finally {
    loading.value = false;
  }
};

const saveRole = async (item: UserRow) => {
  if (item.roleDraft === item.role) {
    return;
  }
  item.savingRole = true;
  item.error = "";
  try {
    await $fetch(`/api/admin/users/${item.id}/role`, {
      method: "PATCH",
      body: { role: item.roleDraft }
    });
    item.role = item.roleDraft;
    if (isSelf(item)) {
      await auth.refresh();
    }
  } catch (err: any) {
    item.error = err?.data?.statusMessage || err?.message || "Nepodařilo se uložit roli.";
    item.roleDraft = item.role;
  } finally {
    item.savingRole = false;
  }
};

const deleteUser = async (item: UserRow) => {
  if (isSelf(item)) {
    item.error = "Vlastní účet nelze smazat.";
    return;
  }
  if (!window.confirm(`Opravdu smazat uživatele ${item.shortName}?`)) {
    return;
  }
  item.deleting = true;
  item.error = "";
  try {
    await $fetch(`/api/profile/${item.id}`, { method: "DELETE" as any });
    users.value = users.value.filter((row) => row.id !== item.id);
  } catch (err: any) {
    item.error = err?.data?.statusMessage || err?.message || "Nepodařilo se smazat uživatele.";
  } finally {
    item.deleting = false;
  }
};

await auth.refresh();
await fetchUsers();
</script>
