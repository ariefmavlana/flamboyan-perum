<script setup lang="ts">
import { staffGuide } from '#shared/content/staff-guide'
definePageMeta({ layout: 'backoffice' })
useSeoMeta({ title: 'Panduan kerja tim', robots: 'noindex, nofollow' })
const session = useStaffSession()
const route = useRoute()
const authorized = ref(false)
const message = ref('')
const topics = computed(() =>
  authorized.value && session.account.value
    ? staffGuide(session.account.value.role)
    : [],
)
const admin = computed(() => session.account.value?.role === 'ADMIN')
async function load() {
  authorized.value = false
  message.value = ''
  try {
    authorized.value = !!(await session.refresh())
  } catch (error) {
    message.value = staffError(error)
  }
}
watch([() => route.hash, authorized], async () => {
  if (!authorized.value || !route.hash) return
  await nextTick()
  document
    .getElementById(route.hash.slice(1))
    ?.scrollIntoView({ block: 'start' })
})
function printGuide() {
  window.print()
}
onMounted(load)
</script>
<template>
  <section v-if="authorized" class="container section staff-guide">
    <div class="section-heading">
      <div>
        <p class="eyebrow">
          PUSAT BANTUAN · {{ admin ? 'ADMINISTRATOR' : 'MARKETING' }}
        </p>
        <h1>Panduan kerja tim</h1>
        <p class="muted">
          {{
            admin
              ? 'Kelola pekerjaan tim dan informasi website dengan langkah yang terarah.'
              : 'Kenali penugasan Anda, tindak lanjuti pembeli, dan catat hasil dengan jelas.'
          }}
        </p>
      </div>
      <button
        class="button secondary staff-guide-print"
        type="button"
        @click="printGuide"
      >
        Cetak panduan
      </button>
    </div>
    <div class="staff-guide-intro">
      <div>
        <AppIcon name="shield" />
        <h2>
          {{
            admin
              ? 'Anda mengelola operasi tim.'
              : 'Anda mengelola penugasan sendiri.'
          }}
        </h2>
        <p>
          {{
            admin
              ? 'Admin mencatat dan membagi calon pembeli, mengawasi hasil, serta memverifikasi katalog dan konten publik.'
              : 'Marketing menindaklanjuti calon pembeli yang ditugaskan kepadanya dan mengelola properti miliknya. Penugasan, akun, dan konten publik dikelola Admin.'
          }}
        </p>
      </div>
      <NuxtLink class="button" to="/backoffice"
        >Mulai dari calon pembeli <AppIcon name="arrow"
      /></NuxtLink>
    </div>
    <div class="staff-guide-layout">
      <nav class="staff-guide-toc" aria-label="Daftar isi panduan">
        <p>DALAM PANDUAN INI</p>
        <NuxtLink
          v-for="topic in topics"
          :key="topic.id"
          :to="'#' + topic.id"
          :aria-current="route.hash === '#' + topic.id ? 'location' : undefined"
          >{{ topic.title }}</NuxtLink
        >
      </nav>
      <div class="staff-guide-chapters">
        <section
          v-for="(topic, index) in topics"
          :id="topic.id"
          :key="topic.id"
          class="staff-guide-chapter"
          :aria-labelledby="topic.id + '-title'"
        >
          <span class="staff-guide-number">{{
            String(index + 1).padStart(2, '0')
          }}</span>
          <h2 :id="topic.id + '-title'">{{ topic.title }}</h2>
          <p>{{ topic.intro }}</p>
          <ol>
            <li v-for="step in topic.steps" :key="step">{{ step }}</li>
          </ol>
          <p class="staff-guide-note">{{ topic.note }}</p>
        </section>
        <NuxtLink class="text-link" to="#mulai"
          >Kembali ke awal panduan ↑</NuxtLink
        >
      </div>
    </div>
  </section>
  <section v-else class="container section">
    <p v-if="message" role="alert">{{ message }}</p>
    <p v-else role="status">Memeriksa akses panduan…</p>
    <button v-if="message" class="button secondary" type="button" @click="load">
      Coba lagi
    </button>
  </section>
</template>
