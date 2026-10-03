<script setup lang="ts">
import type { Property } from '#shared/types'
const props = defineProps<{ property: Property }>()
const consent = ref(false)
const interactive = ref(false)
onMounted(() => {
  interactive.value = true
})
const coordinates = computed(() =>
  props.property.latitude != null && props.property.longitude != null
    ? `${props.property.latitude},${props.property.longitude}`
    : null,
)
const mapUrl = computed(() => {
  if (!coordinates.value) return null
  const latitude = Math.max(
    -84.99,
    Math.min(84.99, Number(props.property.latitude)),
  )
  const longitude = Math.max(
    -179.99,
    Math.min(179.99, Number(props.property.longitude)),
  )
  const bbox = [
    Math.max(-180, longitude - 0.01),
    Math.max(-85, Math.min(85, latitude - 0.01)),
    Math.min(180, longitude + 0.01),
    Math.max(-85, Math.min(85, latitude + 0.01)),
  ].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(coordinates.value)}`
})
const categories = {
  TRANSPORT: 'Transportasi',
  EDUCATION: 'Pendidikan',
  HEALTH: 'Kesehatan',
  SHOPPING: 'Belanja',
  OTHER: 'Lainnya',
}
</script>
<template>
  <section class="location-panel">
    <h2>Lokasi dan fasilitas sekitar</h2>
    <p>{{ property.address }}</p>
    <template v-if="mapUrl"
      ><p class="muted">
        Peta OpenStreetMap dimuat setelah persetujuan Anda dan dapat mengirim
        data ke penyedia peta.
      </p>
      <button
        v-if="!consent"
        class="button secondary"
        :disabled="!interactive"
        @click="consent = true"
      >
        Muat peta OpenStreetMap</button
      ><iframe
        v-else
        class="map-frame"
        :src="mapUrl"
        title="Peta lokasi properti"
        loading="lazy"
        referrerpolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-popups"
      /><a
        class="text-link"
        :href="`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=15/${property.latitude}/${property.longitude}`"
        target="_blank"
        rel="noopener noreferrer"
        >Buka peta di tab baru ↗</a
      ></template
    >
    <p v-else class="muted">
      Koordinat belum tersedia. Konfirmasikan titik lokasi bersama Admin.
    </p>
    <ul v-if="property.pois?.length" class="poi-list">
      <li v-for="(poi, index) in property.pois" :key="index">
        <strong>{{ poi.name }}</strong> · {{ categories[poi.category] }} ·
        {{ new Intl.NumberFormat('id-ID').format(poi.distance_m) }} m
        <p class="muted">
          Jarak editorial, bukan waktu tempuh. Sumber {{ poi.source_date }}:
          <a :href="poi.source_url" target="_blank" rel="noopener noreferrer"
            >referensi ↗</a
          >
        </p>
      </li>
    </ul>
    <p v-else class="muted">Referensi fasilitas sekitar belum diverifikasi.</p>
  </section>
</template>
