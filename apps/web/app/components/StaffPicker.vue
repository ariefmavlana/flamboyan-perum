<script setup lang="ts">
import type { Paginated, StaffAccount, InternalProperty } from '#shared/types'
const props = defineProps<{ kind: 'marketing' | 'property'; label: string }>()
const selectId = useId()
const model = defineModel<number | null>({ required: true })
const search = ref('')
const result = ref<Paginated<StaffAccount | InternalProperty> | null>(null)
const message = ref('')
const busy = ref(false)
const api = useStaffApi()
async function load(page = 1) {
  busy.value = true
  try {
    const query = new URLSearchParams({
      ...(search.value.trim() ? { q: search.value.trim() } : {}),
      page: String(page),
      per_page: '20',
      ...(props.kind === 'marketing'
        ? { role: 'MARKETING', is_active: '1' }
        : {}),
    })
    result.value = await api.request(
      `${props.kind === 'marketing' ? '/api/v1/internal/users' : '/api/v1/internal/properties'}?${query}`,
    )
    message.value = ''
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
onMounted(() => load())
</script>
<template>
  <fieldset class="picker">
    <legend>{{ label }}</legend>
    <div class="action-row">
      <label
        >Cari {{ kind === 'marketing' ? 'Marketing' : 'properti'
        }}<input
          v-model="search"
          maxlength="100"
          @keydown.enter.prevent="load()" /></label
      ><button
        type="button"
        class="button secondary"
        :disabled="busy"
        @click="load()"
      >
        Cari pilihan
      </button>
    </div>
    <label :for="selectId">{{ label }}</label>
    <select :id="selectId" v-model="model" required>
      <option :value="null" disabled>Pilih…</option>
      <option v-for="item in result?.data" :key="item.id" :value="item.id">
        {{ 'title' in item ? item.title : item.name }}
      </option>
    </select>
    <p v-if="result && !result.data.length" class="muted">
      Tidak ada pilihan sesuai pencarian.
    </p>
    <div v-if="result && result.meta.last_page > 1" class="action-row">
      <button
        type="button"
        :disabled="busy || result.meta.current_page === 1"
        @click="load(result.meta.current_page - 1)"
      >
        Sebelumnya</button
      ><span>{{ result.meta.current_page }} / {{ result.meta.last_page }}</span
      ><button
        type="button"
        :disabled="busy || result.meta.current_page === result.meta.last_page"
        @click="load(result.meta.current_page + 1)"
      >
        Berikutnya
      </button>
    </div>
    <p v-if="message" role="alert" class="error-text">{{ message }}</p>
  </fieldset>
</template>
