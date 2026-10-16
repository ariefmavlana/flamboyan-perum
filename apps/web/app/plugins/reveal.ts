export default defineNuxtPlugin((app) => {
  const observers = new WeakMap<HTMLElement, IntersectionObserver>()
  const animations = new WeakMap<HTMLElement, Animation>()
  app.vueApp.directive('reveal', {
    getSSRProps() {
      return {}
    },
    mounted(element: HTMLElement) {
      if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        element.getBoundingClientRect().top < innerHeight
      )
        return
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return
          observer.disconnect()
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return
          animations.set(
            element,
            element.animate(
              [
                { opacity: 0, transform: 'translateY(20px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 650, easing: 'cubic-bezier(.2,.65,.3,1)' },
            ),
          )
        },
        { threshold: 0.08 },
      )
      observers.set(element, observer)
      observer.observe(element)
    },
    unmounted(element: HTMLElement) {
      observers.get(element)?.disconnect()
      animations.get(element)?.cancel()
    },
  })
})
