<script setup lang="ts">
import type { FinancingProgram } from '#shared/types'
import { formatIdr } from '#shared/utils/catalog'
import { formatDate, formatNumber } from '#shared/utils/format'
const props = defineProps<{
  programs: FinancingProgram[]
  houseType?: string
  price?: string
}>()
const visiblePrograms = computed(() =>
  props.programs.filter((program) => {
    if (
      program.method === 'MURABAHAH_QUOTE' &&
      props.price &&
      program.price_idr !== Number(props.price)
    )
      return false
    if (
      program.method === 'FIXED_INSTALLMENT' &&
      (program.bank !== 'BSI' || program.house_types?.join(',') !== '36/60')
    )
      return false
    return (
      !props.houseType ||
      !program.house_types?.length ||
      program.house_types.includes(props.houseType)
    )
  }),
)
</script>
<template>
  <section v-if="visiblePrograms.length" aria-labelledby="financing-title">
    <p class="eyebrow">PEMBIAYAAN BUKIT FLAMBOYAN INDAH 2</p>
    <h2 id="financing-title">Pilihan KPR BSI & BNI</h2>
    <article
      v-for="program in visiblePrograms"
      :key="program.id"
      class="notice"
    >
      <h3>{{ program.bank }} · {{ program.product }}</h3>
      <p v-if="program.house_types?.length">
        Khusus tipe {{ program.house_types.join(', ') }}.
      </p>
      <dl v-if="program.method === 'FIXED_INSTALLMENT'" class="spec-list">
        <div>
          <dt>Angsuran tetap per bulan</dt>
          <dd>{{ formatIdr(program.monthly_idr) }}</dd>
        </div>
        <div>
          <dt>Tenor</dt>
          <dd>
            {{ formatNumber(program.tenor_months / 12) }} tahun ({{
              program.tenor_months
            }}
            bulan)
          </dd>
        </div>
        <div>
          <dt>Total {{ program.tenor_months }} angsuran</dt>
          <dd>{{ formatIdr(program.monthly_idr * program.tenor_months) }}</dd>
        </div>
      </dl>
      <dl v-else-if="program.method === 'MURABAHAH_QUOTE'" class="spec-list">
        <div>
          <dt>Harga rumah penawaran</dt>
          <dd>{{ formatIdr(program.price_idr) }}</dd>
        </div>
        <div>
          <dt>DP penawaran</dt>
          <dd>{{ formatIdr(program.down_payment_idr) }}</dd>
        </div>
        <div>
          <dt>Total margin akad</dt>
          <dd>{{ formatIdr(program.total_margin_idr) }}</dd>
        </div>
        <div>
          <dt>Tenor</dt>
          <dd>{{ program.tenor_months }} bulan</dd>
        </div>
        <div>
          <dt>Angsuran murabahah per bulan</dt>
          <dd>
            {{
              formatIdr(
                (program.price_idr -
                  program.down_payment_idr +
                  program.total_margin_idr) /
                  program.tenor_months,
              )
            }}
          </dd>
        </div>
      </dl>
      <p v-else class="notice">
        Angsuran {{ program.bank }} mengikuti harga tipe rumah, DP, tenor dan
        penawaran bank.
      </p>
      <p>{{ program.conditions }}</p>
      <p class="muted">
        Sumber: {{ program.source_name }} · diperiksa
        {{ formatDate(program.checked_date) }}.
        <a
          v-if="program.source_url"
          :href="program.source_url"
          target="_blank"
          rel="noopener noreferrer"
          >Informasi resmi bank ↗</a
        >
      </p>
    </article>
    <NuxtLink
      class="button secondary"
      to="/konsultasi?kawasan=bukit-flamboyan-indah-2&tujuan=pembiayaan"
      >Konsultasikan pembiayaan</NuxtLink
    >
  </section>
</template>
<style scoped>
@media (max-width: 540px) {
  .spec-list > div {
    flex-direction: column;
    gap: 4px;
  }
  .spec-list dd {
    max-width: 100%;
    text-align: left;
    white-space: nowrap;
  }
}
</style>
