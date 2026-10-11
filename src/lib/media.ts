/**
 * Utility functions for handling media URLs (images, videos, PDFs)
 * between VPS storage and the Next.js frontend to avoid Mixed Content (HTTP/HTTPS) issues.
 */

export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return '';

  // If URL points to the VPS (with or without port), convert to relative /uploads/...
  // so the browser requests it securely over HTTPS via the Next.js rewrite (/uploads/*)
  if (url.includes('201.18.192.154')) {
    const uploadsIndex = url.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      return url.substring(uploadsIndex);
    }
  }

  return url;
}
