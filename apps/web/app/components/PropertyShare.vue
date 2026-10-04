<script setup lang="ts">
const props = defineProps<{ title: string; url: string }>()
const ready = ref(false)
const busy = ref(false)
const message = ref('')
const manual = ref(false)
const link = ref<HTMLInputElement | null>(null)
onMounted(() => {
  ready.value = true
})
async function copy() {
  try {
    await navigator.clipboard.writeText(props.url)
    message.value = 'Tautan rumah disalin.'
    manual.value = false
  } catch {
    manual.value = true
    message.value = 'Salin tautan di bawah untuk membagikan rumah ini.'
    await nextTick()
    link.value?.focus()
    link.value?.select()
  }
}
async function share() {
  if (busy.value) return
  busy.value = true
  message.value = ''
  try {
    if (navigator.share) {
      await navigator.share({
        title: props.title,
        text: props.title,
        url: props.url,
      })
    } else await copy()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      message.value = 'Berbagi dibatalkan.'
    else await copy()
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="property-share">
    <button
      class="button secondary"
      type="button"
      :disabled="!ready || busy"
      @click="share"
    >
      Bagikan rumah ↗
    </button>
    <p v-if="message" role="status" class="muted">{{ message }}</p>
    <label v-if="manual"
      >Tautan rumah<input
        ref="link"
        :value="url"
        readonly
        @focus="link?.select()"
    /></label>
  </div>
</template>
