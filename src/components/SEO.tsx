import { useEffect } from "react";

type SEOProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
};

const BRAND = "Apex Ledger";
const DEFAULT_DESC = "Master the markets with premium crypto, forex & trading books from Apex Ledger.";
const DEFAULT_IMAGE = "/og-image.png";

/**
 * Dynamically updates document head meta tags for SEO & social sharing.
 * Works in SPAs by updating tags on route change via useEffect.
 */
export function SEO({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noIndex = false,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${BRAND}` : `${BRAND} — Premium Crypto, Forex & Trading Education`;

    // Title
    document.title = fullTitle;

    // Helper to set/create meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Standard meta
    setMeta("name", "description", description);

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:image", image.startsWith("http") ? image : `${window.location.origin}${image}`);
    if (url) setMeta("property", "og:url", url);

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image.startsWith("http") ? image : `${window.location.origin}${image}`);

    // Robots
    if (noIndex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      const robotsEl = document.querySelector('meta[name="robots"]');
      if (robotsEl) robotsEl.remove();
    }

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = `${BRAND} — Premium Crypto, Forex & Trading Education`;
    };
  }, [title, description, image, url, type, noIndex]);

  return null;
}
