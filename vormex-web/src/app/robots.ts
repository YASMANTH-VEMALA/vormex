import { MetadataRoute } from 'next';

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.vormex.in');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/messages/', '/profile/', '/more/', '/dashboard/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/login', '/find-people', '/reels', '/groups', '/jobs', '/learning', '/challenges'],
        disallow: ['/api/', '/messages/', '/profile/', '/more/', '/dashboard/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
