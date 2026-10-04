<script setup lang="ts">
const inbox = useNotificationInbox()
const session = useStaffSession()
const realtime = useRealtimeNotifications(
  () => inbox.refresh(),
  async () => {
    inbox.clear()
    await navigateTo('/login')
  },
)
onMounted(async () => {
  try {
    await session.refresh()
    if (!session.account.value) return
    await inbox.refresh(1)
    await realtime.start(session.account.value.id)
  } catch {
    realtime.state.value = 'Notifikasi belum dapat dimuat'
  }
})
onBeforeUnmount(() => {
  inbox.clear()
})
</script>
<template>
  <div class="notification-bell">
    <NuxtLink
      to="/backoffice#notifications"
      :aria-label="`Notifikasi, ${inbox.notices.value?.unread_count ?? 0} belum dibaca`"
      ><AppIcon name="bell" />
      {{ inbox.notices.value?.unread_count ?? 0 }} belum dibaca</NuxtLink
    ><small role="status">{{ realtime.state.value }}</small>
  </div>
</template>
