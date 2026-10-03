<script setup lang="ts">
import type { StaffAccount, Paginated } from '#shared/types'
definePageMeta({ layout: 'backoffice' })
useSeoMeta({ title: 'Akun tim — Flamboyan', robots: 'noindex, nofollow' })
const api = useStaffApi()
const actions: Record<string, string> = {
  CREATED: 'Akun dibuat',
  UPDATED: 'Akun diperbarui',
  PROFILE_UPDATED: 'Profil diperbarui',
  PASSWORD_RESET: 'Kata sandi dipulihkan',
}
const changeLabels: Record<string, string> = {
  profile_changed: 'Nama diperbarui',
  email_changed: 'Email diperbarui',
  password_changed: 'Kata sandi diperbarui',
  sessions_revoked: 'Sesi dicabut',
  identity_verified: 'Identitas diverifikasi',
}
function describeChanges(changes: Record<string, unknown>) {
  return Object.entries(changes)
    .flatMap(([key, value]) =>
      key === 'role'
        ? [`Peran: ${value === 'ADMIN' ? 'Admin' : 'Marketing'}`]
        : key === 'is_active'
          ? [value ? 'Akun aktif' : 'Akun dinonaktifkan']
          : value === true && changeLabels[key]
            ? [changeLabels[key]]
            : [],
    )
    .join(' · ')
}
const session = useStaffSession()
const result = ref<Paginated<StaffAccount> | null>(null)
const q = ref('')
const role = ref('')
const active = ref('')
const message = ref('')
const busy = ref(false)
const selected = ref<StaffAccount | null>(null)
const editor = ref<HTMLDialogElement | null>(null)
const form = reactive({
  name: '',
  email: '',
  role: 'MARKETING' as StaffAccount['role'],
  is_active: true,
  identity_verified: false,
  password: '',
  password_confirmation: '',
})
watch(
  () => form.email,
  () => {
    form.identity_verified = false
  },
  { flush: 'sync' },
)
const audit = ref<Paginated<{
  id: number
  action: string
  created_at: string
  actor: { name: string }
  changes: Record<string, unknown>
}> | null>(null)
async function load(page = 1) {
  busy.value = true
  try {
    await session.refresh()
    if (session.account.value?.role !== 'ADMIN') {
      message.value = 'Halaman ini hanya untuk Admin.'
      return
    }
    const query = new URLSearchParams({
      page: String(page),
      ...(q.value ? { q: q.value } : {}),
      ...(role.value ? { role: role.value } : {}),
      ...(active.value ? { is_active: active.value } : {}),
    })
    result.value = await api.request(`/api/v1/internal/users?${query}`)
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
async function loadAudit(page = 1) {
  if (!selected.value) return
  try {
    audit.value = await api.request(
      `/api/v1/internal/audit?subject_type=USER&subject_id=${selected.value.id}&page=${page}`,
    )
  } catch (error) {
    message.value = staffError(error)
  }
}
function open(account?: StaffAccount) {
  selected.value = account ?? null
  audit.value = null
  Object.assign(form, {
    name: account?.name ?? '',
    email: account?.email ?? '',
    role: account?.role ?? 'MARKETING',
    is_active: account?.is_active ?? true,
    identity_verified: !!account?.email_verified_at,
    password: '',
    password_confirmation: '',
  })
  message.value = ''
  editor.value?.showModal()
  if (account) void loadAudit()
}
async function save() {
  busy.value = true
  try {
    const { password, password_confirmation, ...fields } = form
    await api.request(
      `/api/v1/internal/users${selected.value ? `/${selected.value.id}` : ''}`,
      {
        method: selected.value ? 'PATCH' : 'POST',
        body: {
          ...fields,
          ...(selected.value
            ? { version: selected.value.version }
            : { password, password_confirmation }),
        },
      },
    )
    const self = selected.value?.id === session.account.value?.id
    editor.value?.close()
    form.password = ''
    form.password_confirmation = ''
    if (self) {
      session.account.value = null
      await navigateTo('/login')
    } else {
      await load()
      message.value = 'Akun tersimpan.'
    }
  } catch (error) {
    message.value = staffError(error)
  } finally {
    busy.value = false
  }
}
onMounted(() => load())
</script>
<template>
  <section class="container section">
    <div class="section-heading">
      <h1>Akun tim</h1>
      <button
        v-if="session.account.value?.role === 'ADMIN'"
        class="button"
        @click="open()"
      >
        Tambah akun
      </button>
    </div>
    <p v-if="message && !editor?.open" role="alert">{{ message }}</p>
    <template v-if="session.account.value?.role === 'ADMIN'"
      ><form class="action-row" @submit.prevent="load()">
        <label>Cari nama / email<input v-model="q" maxlength="100" /></label
        ><label
          >Peran<select v-model="role">
            <option value="">Semua</option>
            <option value="ADMIN">Admin</option>
            <option value="MARKETING">Marketing</option>
          </select></label
        ><label
          >Aktivasi<select v-model="active">
            <option value="">Semua</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select></label
        ><button class="button secondary" :disabled="busy">
          Cari / muat ulang
        </button>
      </form>
      <div class="table-scroll">
        <table>
          <caption class="sr-only">
            Akun internal
          </caption>
          <thead>
            <tr>
              <th>Nama / email</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in result?.data" :key="account.id">
              <td>{{ account.name }}<br />{{ account.email }}</td>
              <td>{{ account.role }}</td>
              <td>
                {{ account.is_active ? 'Aktif' : 'Nonaktif' }} ·
                {{
                  account.email_verified_at
                    ? 'Email terverifikasi'
                    : 'Belum diverifikasi'
                }}
              </td>
              <td>
                <button class="text-button" @click="open(account)">
                  Kelola akun
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="result && !result.data.length">Tidak ada akun sesuai pilihan.</p>
      <nav
        v-if="result && result.meta.last_page > 1"
        class="pagination"
        aria-label="Halaman akun"
      >
        <button
          :disabled="busy || result.meta.current_page === 1"
          @click="load(result.meta.current_page - 1)"
        >
          Sebelumnya</button
        ><span
          >{{ result.meta.current_page }} / {{ result.meta.last_page }}</span
        ><button
          :disabled="busy || result.meta.current_page === result.meta.last_page"
          @click="load(result.meta.current_page + 1)"
        >
          Berikutnya
        </button>
      </nav></template
    >
    <dialog ref="editor" class="history-drawer" aria-labelledby="account-title">
      <div class="section-heading">
        <h2 id="account-title">
          {{ selected ? 'Kelola akun' : 'Tambah akun' }}
        </h2>
        <button class="button secondary" @click="editor?.close()">Tutup</button>
      </div>
      <p v-if="message" role="alert">{{ message }}</p>
      <form @submit.prevent="save">
        <label
          >Nama<input
            v-model="form.name"
            required
            maxlength="160"
            autocomplete="name" /></label
        ><label
          >Email<input
            v-model="form.email"
            required
            type="email"
            maxlength="254"
            autocomplete="off" /></label
        ><label
          >Peran<select v-model="form.role">
            <option value="MARKETING">Marketing</option>
            <option value="ADMIN">Admin</option>
          </select></label
        ><label v-if="selected" class="checkbox-label"
          ><input v-model="form.is_active" type="checkbox" />Akun aktif</label
        ><label class="checkbox-label"
          ><input v-model="form.identity_verified" type="checkbox" />Saya telah
          memverifikasi identitas pemilik email ini melalui prosedur tim</label
        ><template v-if="!selected"
          ><label
            >Kata sandi awal<input
              v-model="form.password"
              type="password"
              required
              minlength="12"
              maxlength="1024"
              autocomplete="new-password" /></label
          ><label
            >Ulangi kata sandi<input
              v-model="form.password_confirmation"
              type="password"
              required
              autocomplete="new-password"
          /></label>
          <p class="muted">
            Sampaikan kata sandi awal melalui saluran privat yang disepakati
            tim.
          </p></template
        >
        <p v-else class="muted">
          Perubahan email, peran, dan aktivasi mengakhiri sesi akun. Alihkan
          katalog serta lead aktif sebelum menonaktifkan Marketing. Admin aktif
          terakhir dilindungi.
        </p>
        <button class="button" :disabled="busy">Simpan akun</button>
      </form>
      <h3>Audit akun</h3>
      <ol class="timeline">
        <li v-for="event in audit?.data" :key="event.id">
          {{
            new Date(event.created_at).toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta',
            })
          }}
          · {{ event.actor.name }} ·
          {{ actions[event.action] ?? 'Aktivitas akun' }}
          <p>{{ describeChanges(event.changes) }}</p>
        </li>
      </ol>
      <button
        v-if="audit && audit.meta.current_page < audit.meta.last_page"
        class="text-button"
        @click="loadAudit(audit.meta.current_page + 1)"
      >
        Audit lebih lama
      </button>
    </dialog>
  </section>
</template>
