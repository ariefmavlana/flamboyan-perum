<script setup lang="ts">
defineProps<{ alt?: string }>()
</script>
<template>
  <span v-if="alt?.startsWith('Ilustrasi demo ·')" class="media-disclosure">
    Foto ilustrasi demo
  </span>
</template>
