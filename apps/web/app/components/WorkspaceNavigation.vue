<script setup lang="ts">
import type { StaffAccount } from '#shared/types'
import { logo } from '#shared/content/flamboyan-assets'
import { workspaceNavigation } from '#shared/utils/workspace'
const props = defineProps<{
  account: StaffAccount | null
  loggingOut: boolean
}>()
const emit = defineEmits<{ navigate: []; logout: [] }>()
const route = useRoute()
const groups = computed(() => workspaceNavigation(props.account?.role))
const role = computed(() =>
  props.account?.role === 'ADMIN'
    ? 'Administrator'
    : props.account?.role === 'MARKETING'
      ? 'Marketing'
      : 'Memeriksa akses…',
)
</script>
<template>
  <div class="staff-navigation">
    <div class="staff-brand-block">
      <NuxtLink
        to="/backoffice"
        class="staff-brand"
        aria-label="Flamboyan ruang kerja"
        @click="emit('navigate')"
      >
        <img
          :src="logo.src"
          :width="logo.width"
          :height="logo.height"
          alt="Bukit Flamboyan Indah"
        />
      </NuxtLink>
      <div class="staff-role"><span aria-hidden="true" />{{ role }}</div>
    </div>
    <nav class="staff-nav" aria-label="Ruang kerja tim">
      <section
        v-for="group in groups"
        :key="group.label"
        class="staff-nav-group"
        :aria-label="group.label"
      >
        <p class="staff-nav-label">{{ group.label }}</p>
        <NuxtLink
          v-for="link in group.links"
          :key="link.to"
          :to="link.to"
          class="staff-nav-link"
          :aria-current="route.path === link.to ? 'page' : undefined"
          @click="emit('navigate')"
        >
          <AppIcon :name="link.icon" /><span>{{ link.label }}</span
          ><span
            v-if="route.path === link.to"
            class="staff-active-dot"
            aria-hidden="true"
          />
        </NuxtLink>
      </section>
    </nav>
    <div class="staff-rail-footer">
      <NuxtLink to="/" class="staff-website-link" @click="emit('navigate')"
        ><AppIcon name="external" />Lihat website publik</NuxtLink
      >
      <div v-if="account" class="staff-account">
        <NuxtLink
          to="/backoffice/profil"
          class="staff-account-link"
          @click="emit('navigate')"
        >
          <span class="avatar" aria-hidden="true">{{
            account.name.slice(0, 1).toUpperCase()
          }}</span>
          <span
            ><strong>{{ account.name }}</strong
            ><small>Kelola profil Anda</small></span
          >
        </NuxtLink>
        <button
          class="staff-exit"
          type="button"
          :disabled="loggingOut"
          :aria-label="loggingOut ? 'Mengakhiri sesi…' : 'Keluar'"
          title="Keluar dari ruang kerja"
          @click="emit('logout')"
        >
          <AppIcon name="logout" />
        </button>
      </div>
    </div>
  </div>
</template>
