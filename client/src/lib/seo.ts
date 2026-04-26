import { useEffect } from "react";

const SITE_NAME = "Razlo Store";
const DEFAULT_DESCRIPTION =
  "Razlo Store sells Brawl Stars accounts, rank boosting, trophy boosting, and friend services with fast delivery and support.";

type SeoOptions = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const origin = window.location.origin;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${origin}${path}`;
}

function upsertMeta(selector: string, attribute: "name" | "property", value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  return element;
}

function setMeta(name: string, content: string) {
  upsertMeta(`meta[name="${name}"]`, "name", name).content = content;
}

function setProperty(property: string, content: string) {
  upsertMeta(`meta[property="${property}"]`, "property", property).content =
    content;
}

function setCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

function setStructuredData(data?: SeoOptions["structuredData"]) {
  const id = "seo-structured-data";
  document.getElementById(id)?.remove();

  if (!data) {
    return;
  }

  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function useSeo({
  title = `${SITE_NAME} | Brawl Stars Services`,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  image = "/favicon.png",
  noindex = false,
  structuredData,
}: SeoOptions) {
  useEffect(() => {
    const canonicalUrl = canonicalPath
      ? absoluteUrl(canonicalPath)
      : window.location.href.split("#")[0];
    const imageUrl = absoluteUrl(image);

    document.title = title;
    setMeta("description", description);
    setMeta("robots", noindex ? "noindex,nofollow" : "index,follow");
    setProperty("og:site_name", SITE_NAME);
    setProperty("og:type", "website");
    setProperty("og:title", title);
    setProperty("og:description", description);
    setProperty("og:url", canonicalUrl);
    setProperty("og:image", imageUrl);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", imageUrl);
    setCanonical(canonicalUrl);
    setStructuredData(structuredData);
  }, [canonicalPath, description, image, noindex, structuredData, title]);
}

export function buildSiteStructuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: window.location.origin,
      logo: absoluteUrl("/favicon.png"),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: window.location.origin,
    },
  ];
}

export { absoluteUrl };
