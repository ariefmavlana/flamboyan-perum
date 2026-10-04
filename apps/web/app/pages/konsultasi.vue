<script setup lang="ts">
import type { Property } from '#shared/types'
import { consultationLink, propertyUrl } from '#shared/utils/catalog'
const config = useRuntimeConfig()
const route = useRoute()
const slug = computed(() =>
  typeof route.query.properti === 'string' &&
  /^[a-z0-9-]{1,160}$/.test(route.query.properti)
    ? route.query.properti
    : '',
)
const { data, error, status, refresh } = await useAsyncData(
  'consultation-property',
  () =>
    slug.value
      ? $fetch<{ data: Property }>(
          `/api/v1/properties/${encodeURIComponent(slug.value)}`,
        )
      : Promise.resolve(null),
  { watch: [slug] },
)
const property = computed(() => data.value?.data)
const purposes = {
  kunjungan: 'Kunjungan rumah',
  ketersediaan: 'Ketersediaan hunian',
  pembiayaan: 'Informasi pembiayaan',
} as const
const purpose = ref<keyof typeof purposes>('ketersediaan')
watch(
  () => route.query.tujuan,
  (value) => {
    purpose.value =
      value === 'kunjungan' || value === 'pembiayaan' ? value : 'ketersediaan'
  },
  { immediate: true },
)
const question = ref('')
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
const contextUrl = computed(() =>
  property.value
    ? propertyUrl(config.public.siteUrl, property.value.slug)
    : `${config.public.siteUrl.replace(/\/+$/, '')}/bandung-timur`,
)
const handoff = computed(() => {
  if (
    slug.value &&
    (!property.value || error.value || status.value === 'pending')
  )
    return null
  const link = consultationLink(
    config.public.whatsappNumber,
    purposes[purpose.value],
    property.value?.title ?? '',
    contextUrl.value,
  )
  if (!link) return null
  const url = new URL(link)
  if (question.value.trim())
    url.searchParams.set(
      'text',
      `${url.searchParams.get('text')}\n\nPertanyaan saya: ${question.value.trim()}`,
    )
  return url.href
})
const analytics = usePropertyAnalytics()
function record() {
  if (property.value) analytics.record(property.value.id, 'whatsapp_click')
}
useSeoMeta({
  title: 'Konsultasi hunian & kunjungan — Flamboyan Bandung Timur',
  description:
    'Siapkan percakapan tentang hunian, pembiayaan, atau rencana kunjungan bersama Admin Flamboyan.',
  robots: () =>
    route.query.properti || route.query.tujuan
      ? 'noindex, follow'
      : 'index, follow',
})
useHead({
  link: [
    {
      rel: 'canonical',
      href: `${config.public.siteUrl.replace(/\/+$/, '')}/konsultasi`,
    },
  ],
})
</script>
<template>
  <section class="container section consultation-layout">
    <div class="editorial-page-heading">
      <p class="eyebrow">KONSULTASI FLAMBOYAN · BANDUNG TIMUR</p>
      <h1>Mulai dari<br />percakapan.</h1>
      <p>
        Ceritakan hal yang ingin Anda ketahui. Admin membantu mengonfirmasi
        informasi rumah dan langkah berikutnya.
      </p>
      <ol class="consultation-steps">
        <li>
          <span>01</span>
          <div>
            <h3>Siapkan pertanyaan</h3>
            <p>Pilih topik dan tambahkan hal yang penting bagi Anda.</p>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <h3>Lanjutkan di WhatsApp</h3>
            <p>Pesan disiapkan untuk Anda tinjau dan kirim sendiri.</p>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <h3>Sepakati langkah berikutnya</h3>
            <p>
              Ketersediaan unit dan jadwal kunjungan dikonfirmasi bersama Admin.
            </p>
          </div>
        </li>
      </ol>
    </div>
    <div class="consultation-panel">
      <p class="eyebrow">RENCANA ANDA</p>
      <h2>Apa yang ingin dibicarakan?</h2>
      <div v-if="slug && status === 'pending'" role="status" class="notice">
        Memuat pilihan rumah…
      </div>
      <div v-else-if="slug && error" role="alert" class="notice">
        <p>
          Informasi rumah belum dapat dimuat. Pilihan mungkin sudah tidak
          tersedia.
        </p>
        <button class="button secondary" @click="refresh()">Coba lagi</button
        ><NuxtLink class="text-link" to="/konsultasi"
          >Konsultasi tanpa pilihan rumah →</NuxtLink
        >
      </div>
      <div v-else-if="property" class="consultation-property">
        <span class="muted">Rumah pilihan</span>
        <h3>{{ property.title }}</h3>
        <p>{{ property.location }}</p>
        <NuxtLink class="text-link" :to="'/properti/' + property.slug"
          >Lihat kembali rumah →</NuxtLink
        >
      </div>
      <label
        >Topik konsultasi<select v-model="purpose" :disabled="!ready">
          <option
            v-for="(label, value) in purposes"
            :key="value"
            :value="value"
          >
            {{ label }}
          </option>
        </select></label
      >
      <label
        >Pertanyaan Anda <span class="muted">(opsional)</span
        ><textarea
          v-model="question"
          :disabled="!ready"
          maxlength="600"
          rows="4"
          placeholder="Misalnya, saya ingin melihat denah dan mengetahui pilihan waktu kunjungan."
        />
      </label>
      <p class="muted consultation-note">
        Isian ini hanya menyiapkan pesan di perangkat Anda. Percakapan dimulai
        setelah Anda mengirimkannya di WhatsApp. Jadwal kunjungan belum
        terkonfirmasi.
      </p>
      <a
        v-if="handoff && ready"
        :href="handoff"
        class="button full"
        target="_blank"
        rel="noopener noreferrer"
        @click="record"
        >Lanjutkan ke WhatsApp ↗</a
      >
      <button v-else-if="handoff" class="button full" type="button" disabled>
        Lanjutkan ke WhatsApp ↗
      </button>
      <p v-else-if="!slug" role="status" class="notice">
        Kontak konsultasi belum tersedia.
      </p>
      <NuxtLink class="text-link consultation-back" to="/properti"
        >Masih ingin melihat pilihan? Jelajahi hunian →</NuxtLink
      >
    </div>
  </section>
</template>
