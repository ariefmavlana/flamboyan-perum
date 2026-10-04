<script setup lang="ts">
import type { PublicContent } from '#shared/types'
defineProps<{ partners: NonNullable<PublicContent['bank_partners']> }>()
</script>
<template>
  <section
    v-if="partners.length"
    class="container section bank-partners"
    aria-labelledby="bank-partner-title"
  >
    <p class="eyebrow">MITRA PEMBIAYAAN</p>
    <h2 id="bank-partner-title">Pilihan untuk rencana hunian Anda.</h2>
    <p class="muted">
      Informasi kemitraan telah ditinjau oleh tim Flamboyan. Syarat pembiayaan
      dan persetujuan mengikuti ketentuan masing-masing bank.
    </p>
    <ul>
      <li v-for="partner in partners" :key="partner.id">
        <a :href="partner.website" target="_blank" rel="noopener noreferrer"
          ><img
            :src="partner.logo_url"
            :alt="`Logo ${partner.name}`"
            loading="lazy"
            width="180"
            height="72"
          /><span>{{ partner.name }} ↗</span></a
        >
      </li>
    </ul>
  </section>
</template>
<style scoped>
.bank-partners ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 24px;
  list-style: none;
  padding: 0;
  margin: 32px 0 0;
}
.bank-partners li {
  border-block: 1px solid var(--line);
}
.bank-partners a {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 28px 12px;
  text-align: center;
}
.bank-partners img {
  width: 180px;
  max-width: 100%;
  height: 72px;
  object-fit: contain;
}
.bank-partners span {
  font-size: 14px;
}
</style>
