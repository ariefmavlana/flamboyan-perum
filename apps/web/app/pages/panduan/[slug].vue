<script setup lang="ts">
import { buyerGuides } from '#shared/content/buyer-guides'
import { absoluteUrl, canonicalUrl } from '#shared/utils/seo'
import { breadcrumbSchema, jsonLdText } from '#shared/utils/structured-data'
const route = useRoute()
const config = useRuntimeConfig()
const guide = buyerGuides.find((item) => item.slug === route.params.slug)
if (!guide)
  throw createError({
    statusCode: 404,
    statusMessage: 'Panduan tidak ditemukan',
  })
const canonical = canonicalUrl(
  String(config.public.siteUrl),
  `/panduan/${guide.slug}`,
)
useSeoMeta({
  title: guide.title,
  description: guide.summary,
  ogTitle: guide.title,
  ogDescription: guide.summary,
  ogImage: absoluteUrl(String(config.public.siteUrl), guide.image),
  ogImageAlt: guide.imageAlt,
  twitterCard: 'summary_large_image',
})
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      textContent: jsonLdText(
        breadcrumbSchema([
          {
            name: 'Beranda',
            url: canonicalUrl(String(config.public.siteUrl)),
          },
          {
            name: 'Panduan',
            url: canonicalUrl(String(config.public.siteUrl), '/panduan'),
          },
          { name: guide.title, url: canonical },
        ]),
      ),
    },
  ],
})
</script>
<template>
  <article v-if="guide" class="container section guide-article">
    <NuxtLink class="text-link" to="/panduan">← Seluruh panduan</NuxtLink>
    <header class="editorial-page-heading">
      <p class="eyebrow">{{ guide.category }} · PANDUAN FLAMBOYAN</p>
      <h1>{{ guide.title }}</h1>
      <p>{{ guide.summary }}</p>
    </header>
    <figure class="guide-cover">
      <img
        :src="guide.image"
        :alt="guide.imageAlt"
        width="960"
        height="640"
        fetchpriority="high"
      />
      <figcaption>
        Foto ilustrasi ·
        <a :href="guide.source" target="_blank" rel="noopener noreferrer"
          >{{ guide.credit }} ↗</a
        >
      </figcaption>
    </figure>
    <div class="guide-reading">
      <section v-for="(section, index) in guide.sections" :key="section.title">
        <p class="eyebrow">0{{ index + 1 }}</p>
        <h2>{{ section.title }}</h2>
        <p>{{ section.text }}</p>
        <ul>
          <li v-for="item in section.checklist" :key="item">{{ item }}</li>
        </ul>
      </section>
      <p v-if="guide.reference" class="guide-reference">
        Bacaan pendukung:
        <a :href="guide.reference.url" target="_blank" rel="noopener noreferrer"
          >{{ guide.reference.title }} ↗</a
        >. Rujukan informasi, bukan pernyataan kerja sama.
      </p>
      <div class="guide-help">
        <h2>Dari catatan ke pilihan.</h2>
        <div class="action-row">
          <NuxtLink to="/properti" class="button">Jelajahi hunian →</NuxtLink
          ><NuxtLink to="/konsultasi" class="text-link"
            >Bicarakan kebutuhan Anda →</NuxtLink
          >
        </div>
      </div>
    </div>
  </article>
</template>
