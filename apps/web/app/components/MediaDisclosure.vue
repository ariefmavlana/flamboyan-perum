<script setup lang="ts">
defineProps<{ alt?: string }>()
</script>
<template>
  <span v-if="alt?.startsWith('Ilustrasi')" class="media-disclosure">
    Foto ilustrasi
  </span>
</template>
