<script setup lang="ts">
import { workspaceNavigation } from '#shared/utils/workspace'
const session = useStaffSession()
const route = useRoute()
const message = ref('')
const loggingOut = ref(false)
const ready = ref(false)
const menu = ref<HTMLDialogElement | null>(null)
const menuOpen = ref(false)
let desktop: MediaQueryList | undefined
const current = computed(() =>
  workspaceNavigation(session.account.value?.role)
    .flatMap((group) => group.links)
    .find((link) => link.to === route.path),
)
const role = computed(() =>
  session.account.value?.role === 'ADMIN'
    ? 'Administrator'
    : session.account.value?.role === 'MARKETING'
      ? 'Marketing'
      : 'Ruang kerja tim',
)
const help = computed(
  () => '/backoffice/panduan#' + (current.value?.guide ?? 'mulai'),
)
function closeMenu() {
  menu.value?.close()
}
function openMenu() {
  menu.value?.showModal()
  menuOpen.value = true
}
function keepMenuFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !menu.value) return
  const controls = Array.from(
    menu.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
  )
  const first = controls[0]
  const last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
function backdrop(event: MouseEvent) {
  if (event.target !== menu.value || !menu.value) return
  const bounds = menu.value.getBoundingClientRect()
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    closeMenu()
}
function resized() {
  if (desktop?.matches) closeMenu()
}
async function navigated() {
  if (!menu.value?.open) return
  closeMenu()
  await nextTick()
  document.getElementById('main')?.focus()
}
watch(() => route.fullPath, navigated)
async function logout() {
  if (loggingOut.value) return
  closeMenu()
  loggingOut.value = true
  message.value = ''
  try {
    await session.logout()
  } catch {
    message.value =
      'Sesi Anda belum dapat diakhiri. Pilih Keluar untuk mencoba kembali.'
  } finally {
    loggingOut.value = false
  }
}
onMounted(async () => {
  ready.value = true
  desktop = window.matchMedia('(min-width: 901px)')
  desktop.addEventListener('change', resized)
  try {
    await session.refresh()
  } catch (error) {
    message.value = staffError(error)
  }
})
onBeforeUnmount(() => desktop?.removeEventListener('change', resized))
</script>
<template>
  <div class="workspace-shell">
    <a class="skip-link" href="#main">Lewati ke konten</a>
    <aside class="staff-rail" aria-label="Navigasi workspace">
      <WorkspaceNavigation
        :account="session.account.value"
        :logging-out="loggingOut"
        @logout="logout"
      />
    </aside>
    <dialog
      id="workspace-menu"
      ref="menu"
      class="staff-menu"
      aria-labelledby="workspace-menu-title"
      @close="menuOpen = false"
      @click="backdrop"
      @keydown="keepMenuFocus"
    >
      <div class="staff-menu-heading">
        <h2 id="workspace-menu-title">Menu ruang kerja</h2>
        <button
          type="button"
          class="staff-menu-close"
          autofocus
          aria-label="Tutup menu"
          @click="closeMenu"
        >
          <AppIcon name="close" />
        </button>
      </div>
      <WorkspaceNavigation
        :account="session.account.value"
        :logging-out="loggingOut"
        @navigate="navigated"
        @logout="logout"
      />
    </dialog>
    <div class="workspace-body">
      <header class="workspace-topbar staff-topbar">
        <button
          class="staff-menu-trigger"
          type="button"
          :disabled="!ready"
          aria-label="Menu"
          aria-controls="workspace-menu"
          :aria-expanded="menuOpen"
          @click="openMenu"
        >
          <AppIcon name="menu" />
        </button>
        <div class="staff-page-context">
          <p>
            {{ role }}<span aria-hidden="true"> / </span
            ><strong>{{ current?.label ?? 'Ruang kerja' }}</strong>
          </p>
          <small>{{
            current?.description ?? 'Selamat datang di ruang kerja Flamboyan.'
          }}</small>
        </div>
        <NuxtLink
          :to="help"
          class="staff-context-help"
          aria-label="Panduan halaman ini"
          ><AppIcon name="book" /><span>Panduan halaman ini</span></NuxtLink
        >
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
