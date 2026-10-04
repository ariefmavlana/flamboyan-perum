<script setup lang="ts">
defineProps<{ label: string; id: string }>()
const open = ref(false)
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
const trigger = ref<HTMLButtonElement | null>(null)
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
function close(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    open.value = false
    trigger.value?.focus()
  }
}
</script>
<template>
  <div class="responsive-nav" :class="{ 'is-open': open }" @keydown="close">
    <button
      ref="trigger"
      class="nav-toggle button secondary"
      type="button"
      :disabled="!ready"
      :aria-expanded="open"
      :aria-controls="id"
      @click="open = !open"
    >
      <AppIcon :name="open ? 'close' : 'menu'" />{{
        open ? 'Tutup menu' : 'Menu'
      }}
    </button>
    <nav :id="id" :aria-label="label"><slot /></nav>
  </div>
</template>
