<script setup lang="ts">
const props = defineProps<{ alt?: string }>()
const isIllustration = computed(() => {
  const alt = props.alt?.toLowerCase() ?? ''
  return alt.includes('ilustrasi') || alt.includes('inspirasi')
})
</script>
<template>
  <span v-if="isIllustration" class="media-disclosure">Ilustrasi</span>
</template>
