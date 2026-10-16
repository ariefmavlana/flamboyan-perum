<script setup lang="ts" generic="T extends string | number | null | undefined">
import {
  displayNumberInput,
  parseNumberInput,
  numberInputError,
} from '#shared/utils/number-input'
const props = defineProps<{
  modelValue: T
  modelModifiers?: { number?: boolean }
  min?: number | string
  max?: number | string
  step?: number | string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
const input = ref<HTMLInputElement | null>(null)
const text = ref(displayNumberInput(props.modelValue))
const raw = ref(props.modelValue == null ? '' : String(props.modelValue))
const syntaxError = ref('')
const error = computed(
  () =>
    syntaxError.value ||
    numberInputError(raw.value, props.min, props.max, props.step),
)
const numberModel = computed(
  () => props.modelModifiers?.number || typeof props.modelValue === 'number',
)
let emitted: string | number | undefined
watch(
  () => props.modelValue,
  (value) => {
    if (Object.is(value, emitted)) return
    text.value = displayNumberInput(value)
    raw.value = value == null ? '' : String(value)
    syntaxError.value = ''
  },
)
watch(error, (value) => input.value?.setCustomValidity(value), {
  flush: 'post',
})
onMounted(() => input.value?.setCustomValidity(error.value))
function update(event: Event) {
  const element = event.target as HTMLInputElement
  const meaningful = element.value
    .slice(0, element.selectionStart ?? element.value.length)
    .replace(/[^\d,-]/g, '').length
  const change = event as InputEvent
  const rebalanceGroups =
    text.value.includes('.') &&
    !syntaxError.value &&
    !change.data?.includes('.') &&
    [
      'insertText',
      'deleteContentBackward',
      'deleteContentForward',
      'deleteByCut',
    ].includes(change.inputType)
  const parsed = parseNumberInput(element.value, rebalanceGroups)
  text.value = parsed.text
  raw.value = parsed.raw
  syntaxError.value = parsed.error
  emitted =
    error.value || parsed.raw === ''
      ? ''
      : numberModel.value
        ? Number(parsed.raw)
        : parsed.raw
  emit('update:modelValue', emitted as T)
  element.value = parsed.text
  element.setCustomValidity(error.value)
  if (!parsed.error) {
    let position = 0
    let seen = 0
    while (position < parsed.text.length && seen < meaningful) {
      if (/[\d,-]/.test(parsed.text[position]!)) seen++
      position++
    }
    element.setSelectionRange(position, position)
  }
}
function deleteSeparator(event: KeyboardEvent) {
  const element = event.target as HTMLInputElement
  const position = element.selectionStart
  if (position === null || position !== element.selectionEnd) return
  if (event.key === 'Backspace' && element.value[position - 1] === '.')
    element.setSelectionRange(Math.max(0, position - 2), position)
  else if (event.key === 'Delete' && element.value[position] === '.')
    element.setSelectionRange(position, position + 2)
}
</script>
<template>
  <input
    ref="input"
    type="text"
    :inputmode="
      Number(min) < 0
        ? 'text'
        : step && step !== '1' && step !== 1
          ? 'decimal'
          : 'numeric'
    "
    :value="text"
    :aria-invalid="error ? true : undefined"
    :title="error || 'Titik ribuan otomatis; gunakan koma untuk desimal.'"
    :aria-description="
      error || 'Titik ribuan otomatis; gunakan koma untuk desimal.'
    "
    @input="update"
    @keydown="deleteSeparator"
  />
</template>
