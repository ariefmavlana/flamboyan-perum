<script setup lang="ts">
const consent = useConsent()
const analytics = ref(false)
const marketing = ref(false)
const expanded = ref(false)
const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})
watchEffect(() => {
  if (!consent.open.value) return
  analytics.value = consent.state.value.analytics
  marketing.value = consent.state.value.marketing
})
const visible = computed(
  () =>
    hydrated.value &&
    consent.required.value &&
    (!consent.decided.value || consent.open.value),
)
function acceptAll() {
  consent.decide({ analytics: true, marketing: true })
}
function rejectOptional() {
  consent.decide({ analytics: false, marketing: false })
}
function save() {
  consent.decide({ analytics: analytics.value, marketing: marketing.value })
}
</script>
<template>
  <section
    v-if="visible"
    class="consent-banner"
    role="region"
    aria-label="Pilihan privasi"
  >
    <div class="consent-inner">
      <p class="eyebrow">PILIHAN PRIVASI</p>
      <p>
        Dengan persetujuan Anda, situs dapat memakai teknologi opsional untuk
        mengukur penggunaan halaman dan menilai hasil promosi. Anda dapat
        menerima, menolak, atau mengatur pilihan, dan mengubahnya kembali kapan
        saja. <NuxtLink to="/privasi">Informasi privasi</NuxtLink>
      </p>
      <fieldset v-if="expanded" class="consent-options">
        <legend class="muted">Pilih teknologi opsional</legend>
        <label
          ><input v-model="analytics" type="checkbox" />Analitik — mengukur
          kunjungan halaman dan interaksi katalog</label
        >
        <label
          ><input v-model="marketing" type="checkbox" />Marketing — menilai
          hasil promosi di Google dan Meta</label
        >
      </fieldset>
      <div class="consent-actions">
        <button class="button" type="button" @click="acceptAll">
          Terima semua
        </button>
        <button class="button secondary" type="button" @click="rejectOptional">
          Tolak opsional
        </button>
        <button
          v-if="!expanded"
          class="text-link"
          type="button"
          @click="expanded = true"
        >
          Atur pilihan
        </button>
        <button v-else class="button secondary" type="button" @click="save">
          Simpan pilihan
        </button>
      </div>
    </div>
  </section>
</template>
