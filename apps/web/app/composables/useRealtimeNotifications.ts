import type Echo from 'laravel-echo'
import type Pusher from 'pusher-js'

export function useRealtimeNotifications(
  onUpdate: () => Promise<void>,
  onUnauthorized: () => Promise<void>,
) {
  const state = ref('Pembaruan berkala setiap 60 detik')
  const api = useStaffApi()
  let echo: Echo<'pusher'> | null = null
  let client: Pusher | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let stopped = true
  let updating = false
  let pending = false
  let generation = 0
  const seen = new Set<string>()
  async function reconcile() {
    if (stopped) return
    if (updating) {
      pending = true
      return
    }
    updating = true
    try {
      await onUpdate()
    } catch (error) {
      const code = (error as { statusCode?: number }).statusCode
      if (code === 401 || code === 403) {
        stop()
        await onUnauthorized()
      } else state.value = 'Pembaruan tertunda; coba muat ulang'
    } finally {
      updating = false
      if (pending && !stopped) {
        pending = false
        void reconcile()
      }
    }
  }
  function stop() {
    generation++
    stopped = true
    pending = false
    if (timer) clearInterval(timer)
    timer = null
    echo?.disconnect()
    echo = null
    client = null
    seen.clear()
  }
  async function start(userId: number) {
    stop()
    stopped = false
    const currentGeneration = generation
    timer = setInterval(() => {
      void reconcile()
    }, 60000)
    try {
      const config = (
        await api.request<{
          data: { enabled: boolean; key: string | null; cluster: string | null }
        }>('/api/v1/realtime')
      ).data
      if (
        stopped ||
        generation !== currentGeneration ||
        !config.enabled ||
        !config.key ||
        !config.cluster
      )
        return
      const [{ default: EchoClient }, { default: PusherClient }] =
        await Promise.all([import('laravel-echo'), import('pusher-js')])
      if (stopped || generation !== currentGeneration) return
      client = new PusherClient(config.key, {
        cluster: config.cluster,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        channelAuthorization: {
          endpoint: '/api/v1/realtime/auth',
          transport: 'ajax',
          customHandler: (params, callback) => {
            void api
              .request<{ auth: string }>('/api/v1/realtime/auth', {
                method: 'POST',
                body: {
                  socket_id: params.socketId,
                  channel_name: params.channelName,
                },
              })
              .then((response) => callback(null, response))
              .catch((error: unknown) => {
                callback(new Error('Otorisasi channel gagal'), null)
                state.value =
                  'Channel belum tersambung; pembaruan berkala aktif'
                const code = (error as { statusCode?: number }).statusCode
                if (code === 401 || code === 403) {
                  stop()
                  void onUnauthorized()
                }
              })
          },
        },
      })
      echo = new EchoClient<'pusher'>({ broadcaster: 'pusher', client })
      client.connection.bind(
        'state_change',
        (connection: { current: string }) => {
          state.value =
            connection.current === 'connected'
              ? 'Mengotorisasi channel · sinkronisasi berkala aktif'
              : 'Koneksi terputus · pembaruan berkala aktif'
          if (connection.current === 'connected') void reconcile()
        },
      )
      echo
        .private(`users.${userId}`)
        .subscribed(() => {
          state.value = 'Real-time tersambung · sinkronisasi berkala aktif'
          void reconcile()
        })
        .listen('.notification.created', (event: unknown) => {
          if (
            !event ||
            typeof event !== 'object' ||
            !('id' in event) ||
            typeof event.id !== 'string' ||
            !/^[0-9a-f-]{36}$/i.test(event.id) ||
            seen.has(event.id)
          )
            return
          seen.add(event.id)
          if (seen.size > 500) seen.delete(seen.values().next().value!)
          void reconcile()
        })
        .error(() => {
          state.value = 'Channel belum tersambung; pembaruan berkala aktif'
        })
    } catch (error) {
      const code = (error as { statusCode?: number }).statusCode
      if (code === 401 || code === 403) {
        stop()
        await onUnauthorized()
      } else state.value = 'Real-time belum tersedia; pembaruan berkala aktif'
    }
  }
  onBeforeUnmount(stop)
  return { state, start, stop, reconcile }
}
