<script setup lang="ts">
defineProps<{ id: number }>()
const comparison = useComparison()
</script>
<template>
  <button
    class="button secondary"
    :disabled="!comparison.ready.value"
    :aria-pressed="comparison.ids.value.includes(id)"
    @click="comparison.toggle(id)"
  >
    {{
      comparison.ids.value.includes(id)
        ? 'Hapus perbandingan'
        : 'Bandingkan properti'
    }}
  </button>
</template>
