<script setup lang="ts">
const session = useStaffSession()
const message = ref('')
const route = useRoute()
const links = [
  {
    to: '/backoffice',
    label: 'Calon pembeli',
    icon: 'users',
    admin: false,
    group: 'Penjualan',
  },
  {
    to: '/backoffice/properti',
    label: 'Katalog properti',
    icon: 'home',
    admin: false,
    group: 'Website',
  },
  {
    to: '/backoffice/laporan',
    label: 'Laporan',
    icon: 'chart',
    admin: true,
    group: 'Penjualan',
  },
  {
    to: '/backoffice/konten',
    label: 'Konten publik',
    icon: 'file',
    admin: true,
    group: 'Website',
  },
  {
    to: '/backoffice/akun',
    label: 'Akun tim',
    icon: 'users',
    admin: true,
    group: 'Administrasi',
  },
  {
    to: '/backoffice/privasi',
    label: 'Privasi kontak',
    icon: 'shield',
    admin: true,
    group: 'Administrasi',
  },
  {
    to: '/backoffice/operasi',
    label: 'Kesehatan sistem',
    icon: 'settings',
    admin: true,
    group: 'Administrasi',
  },
  {
    to: '/backoffice/profil',
    label: 'Profil',
    icon: 'user',
    admin: false,
    group: 'Akun',
  },
] as const
const available = computed(() =>
  links.filter(
    (link) => !link.admin || session.account.value?.role === 'ADMIN',
  ),
)
const groups = computed(() =>
  ['Penjualan', 'Website', 'Administrasi', 'Akun']
    .map((label) => ({
      label,
      links: available.value.filter((link) => link.group === label),
    }))
    .filter((group) => group.links.length),
)
const current = computed(
  () => links.find((link) => link.to === route.path)?.label ?? 'Workspace',
)
async function logout() {
  try {
    await session.logout()
  } catch {
    message.value = 'Belum dapat keluar. Coba kembali.'
  }
}
onMounted(async () => {
  try {
    await session.refresh()
  } catch (error) {
    message.value = staffError(error)
  }
})
</script>
<template>
  <div class="workspace-shell">
    <a class="skip-link" href="#main">Lewati ke konten</a>
    <aside class="workspace-sidebar">
      <BrandLogo />
      <ResponsiveNav id="workspace-navigation" label="Workspace tim">
        <div v-for="group in groups" :key="group.label" class="nav-group">
          <p class="nav-label">{{ group.label }}</p>
          <NuxtLink v-for="link in group.links" :key="link.to" :to="link.to">
            <AppIcon :name="link.icon" />{{ link.label }}
          </NuxtLink>
        </div>
        <div class="sidebar-bottom">
          <NuxtLink to="/properti"
            ><AppIcon name="arrow" />Lihat website</NuxtLink
          ><button type="button" class="sidebar-logout" @click="logout">
            <AppIcon name="logout" />Keluar
          </button>
        </div>
      </ResponsiveNav>
    </aside>
    <div class="workspace-body">
      <header class="workspace-topbar">
        <p><span class="muted">Ruang kerja /</span> {{ current }}</p>
        <div class="staff-identity">
          <span class="avatar" aria-hidden="true">{{
            session.account.value?.name.slice(0, 1) ?? 'F'
          }}</span
          ><span
            >{{ session.account.value?.name
            }}<small>{{
              session.account.value?.role === 'ADMIN'
                ? 'Administrator'
                : 'Marketing'
            }}</small></span
          >
        </div>
      </header>
      <div class="workspace-inbox"><NotificationBell /></div>
      <main id="main" tabindex="-1">
        <p v-if="message" class="container error-text" role="alert">
          {{ message }}
        </p>
        <slot />
      </main>
    </div>
  </div>
</template>
