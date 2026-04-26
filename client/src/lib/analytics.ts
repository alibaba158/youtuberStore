const GA_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function initGoogleAnalytics() {
  if (!GA_ID || window.gtag) {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });
}

export function trackPageView(path: string) {
  if (!GA_ID || !window.gtag) {
    return;
  }

  window.gtag("config", GA_ID, {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
