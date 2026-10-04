<script setup lang="ts">
const props = defineProps<{
  name:
    | 'home'
    | 'grid'
    | 'users'
    | 'chart'
    | 'file'
    | 'shield'
    | 'settings'
    | 'user'
    | 'bell'
    | 'menu'
    | 'close'
    | 'arrow'
    | 'search'
    | 'pin'
    | 'compare'
    | 'logout'
}>()
const paths = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  chart: 'M3 3v18h18 M7 16v-4 M12 16V8 M17 16V5',
  file: 'M14 2H5v20h14V7z M14 2v6h5 M8 12h8 M8 16h8',
  shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7z m-4 9 3 3 5-6',
  settings: 'M3 6h18 M3 12h18 M3 18h18 M8 3v6 M16 9v6 M8 15v6',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  close: 'm6 6 12 12 M6 18 18 6',
  arrow: 'M4 12h16 m-6-6 6 6-6 6',
  search: 'm21 21-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  compare: 'M5 3v18 M19 3v18 M2 7h6 M16 17h6 M10 7h4 M10 17h4',
  logout: 'M9 4H3v16h6 M9 12h12 m-5-5 5 5-5 5',
}
</script>
<template>
  <svg
    class="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="paths[props.name]" />
  </svg>
</template>
