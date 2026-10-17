<script setup lang="ts">
import { useId } from 'vue'
defineOptions({ inheritAttrs: false })
const props = defineProps<{ label: string }>()
const model = defineModel<string>({ required: true })
const id = useId()
const visible = ref(false)
</script>
<template>
  <label class="password-label" :for="id">{{ props.label }}</label>
  <span class="password-field">
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :type="visible ? 'text' : 'password'"
    />
    <button
      type="button"
      class="password-toggle"
      :aria-label="visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
      @click="visible = !visible"
    >
      <AppIcon :name="visible ? 'eye-off' : 'eye'" />
    </button>
  </span>
</template>
