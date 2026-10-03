<script setup lang="ts">
import type { InternalProperty, PointOfInterest } from '#shared/types'
const props = defineProps<{ property: InternalProperty }>()
const emit = defineEmits<{ saved: [property: InternalProperty] }>()
const api = useStaffApi()
const latitude = ref(props.property.latitude ?? '')
const longitude = ref(props.property.longitude ?? '')
const pois = ref<PointOfInterest[]>(
  JSON.parse(JSON.stringify(props.property.pois ?? [])),
)
const message = ref('')
const busy = ref(false)
function addPoi() {
  if (pois.value.length < 20)
    pois.value.push({
      name: '',
      category: 'OTHER',
      distance_m: 0,
      source_url: '',
      source_date: '',
    })
}
async function save() {
  busy.value = true
  message.value = ''
  try {
    const response = await api.request<{ data: InternalProperty }>(
      `/api/v1/internal/properties/${props.property.id}/location`,
      {
        method: 'PATCH',
        body: {
          version: props.property.version,
          latitude: latitude.value === '' ? null : Number(latitude.value),
          longitude: longitude.value === '' ? null : Number(longitude.value),
          pois: pois.value,
        },
      },
    )
    emit('saved', response.data)
    message.value = 'Lokasi dan referensi tersimpan.'
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="location-editor">
    <h3>Lokasi dan POI editorial</h3>
    <p class="muted">
      Isi koordinat yang diverifikasi. Jarak dalam meter perlu sumber dan
      tanggal; maksimal20 referensi. Tidak menghitung radius otomatis.
    </p>
    <form @submit.prevent="save">
      <div class="form-grid">
        <label
          >Latitude<input
            v-model="latitude"
            type="number"
            min="-90"
            max="90"
            step="0.0000001" /></label
        ><label
          >Longitude<input
            v-model="longitude"
            type="number"
            min="-180"
            max="180"
            step="0.0000001"
        /></label>
      </div>
      <fieldset v-for="(poi, index) in pois" :key="index" class="poi-editor">
        <legend>Referensi {{ index + 1 }}</legend>
        <div class="form-grid">
          <label
            >Nama fasilitas<input
              v-model="poi.name"
              required
              maxlength="160" /></label
          ><label
            >Kategori<select v-model="poi.category">
              <option value="TRANSPORT">Transportasi</option>
              <option value="EDUCATION">Pendidikan</option>
              <option value="HEALTH">Kesehatan</option>
              <option value="SHOPPING">Belanja</option>
              <option value="OTHER">Lainnya</option>
            </select></label
          ><label
            >Jarak (meter)<input
              v-model.number="poi.distance_m"
              type="number"
              required
              min="0"
              max="1000000"
              step="1" /></label
          ><label
            >Sumber HTTPS<input
              v-model="poi.source_url"
              type="url"
              required
              maxlength="2048" /></label
          ><label
            >Tanggal sumber<input
              v-model="poi.source_date"
              type="date"
              required
          /></label>
        </div>
        <button
          class="button secondary"
          type="button"
          @click="pois.splice(index, 1)"
        >
          Hapus referensi {{ index + 1 }}
        </button>
      </fieldset>
      <div class="editor-actions">
        <button
          class="button secondary"
          type="button"
          :disabled="pois.length >= 20 || busy"
          @click="addPoi"
        >
          Tambah referensi fasilitas</button
        ><button class="button" :disabled="busy" type="submit">
          Simpan lokasi
        </button>
      </div>
    </form>
    <p v-if="message" role="status">{{ message }}</p>
  </section>
</template>
