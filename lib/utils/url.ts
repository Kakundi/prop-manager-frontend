export function getSiteUrl(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000';

  // Include http:// or https://
  url = url.includes('http') ? url : `https://${url}`;
  // Remove trailing slash if present
  return url.replace(/\/$/, '');
}