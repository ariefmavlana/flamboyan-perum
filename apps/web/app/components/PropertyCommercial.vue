<script setup lang="ts">
import type { PublicCommercial } from '#shared/types'
import { formatIdr } from '#shared/utils/catalog'
import { formatDate, formatDateRange } from '#shared/utils/format'
defineProps<{ commercial: PublicCommercial }>()
</script>
<template>
  <section class="section">
    <p class="eyebrow">SPESIFIKASI & PEMBAYARAN</p>
    <h2>Rencanakan pilihan Anda.</h2>
    <dl class="spec-list">
      <div>
        <dt>Lantai</dt>
        <dd>{{ commercial.floors }}</dd>
      </div>
      <div>
        <dt>Dimensi tanah</dt>
        <dd>{{ commercial.lot_dimensions }}</dd>
      </div>
      <div>
        <dt>Rencana unit tipe ini</dt>
        <dd>
          {{ commercial.planned_units }} unit · ketersediaan dikonfirmasi ke
          Admin
        </dd>
      </div>
      <div v-if="commercial.offer_until">
        <dt>Harga program</dt>
        <dd>
          Berlaku sampai {{ formatDate(commercial.offer_until) }}; harga normal
          {{ formatIdr(commercial.normal_price_idr) }}
        </dd>
      </div>
      <div v-if="commercial.program_fee_idr !== null">
        <dt>Biaya program pengembang</dt>
        <dd>{{ formatIdr(commercial.program_fee_idr) }}</dd>
      </div>
    </dl>
    <ul>
      <li v-for="feature in commercial.features" :key="feature">
        {{ feature }}
      </li>
    </ul>
    <p>{{ commercial.fee_notes }}</p>
    <div v-for="plan in commercial.payment_plans" :key="plan.title">
      <h3>{{ plan.title }}</h3>
      <p>
        Awal {{ formatIdr(plan.upfront_idr)
        }}<template v-if="plan.months">
          + {{ plan.months }} × {{ formatIdr(plan.monthly_idr) }}</template
        >. Total {{ formatIdr(plan.total_idr) }}. Periode
        {{ formatDateRange(plan.valid_from, plan.valid_until) }}.
      </p>
      <p>{{ plan.notes }}</p>
    </div>
    <p class="muted">{{ commercial.notes }}</p>
    <p class="muted">
      Sumber: {{ commercial.source_name }} ·
      {{ formatDate(commercial.source_date) }}. Harga dan ketersediaan
      dikonfirmasi sebelum transaksi.
    </p>
  </section>
</template>
