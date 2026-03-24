export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window === 'undefined') return
  window.gtag?.('event', eventName, eventParams)
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  })
}

declare global {
  interface Window {
    dataLayer: any[]
    gtag: any
  }
}
