interface Env {
  DB: any;
  SITE_URL?: string;
}

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  // Use explicit SITE_URL if available, otherwise fallback to request origin
  const baseUrl = context.env.SITE_URL || `${url.protocol}//${url.host}`;
  const BATCH_SIZE = 500; // Safe limit for D1 queries and worker memory

  let lastMod = new Date().toISOString();
  let totalPrompts = 0;
  
  try {
    // 1. Get the latest update time from non-private prompts
    const latestResult = await context.env.DB.prepare(
      "SELECT MAX(updatedAt) as latest FROM prompts WHERE status != 'PRIVATE'"
    ).first();
    
    if (latestResult?.latest) {
      lastMod = new Date(latestResult.latest).toISOString();
    }

    // 2. Get total count of non-private prompts for pagination
    const countResult = await context.env.DB.prepare(
      "SELECT COUNT(*) as total FROM prompts WHERE status != 'PRIVATE'"
    ).first();

    if (countResult?.total) {
      totalPrompts = countResult.total as number;
    }

  } catch (e) {
    console.error("Error fetching sitemap index data:", e);
  }

  // Calculate number of prompt sitemap pages needed
  const totalPages = Math.max(1, Math.ceil(totalPrompts / BATCH_SIZE));
  
  let promptSitemaps = '';
  for (let i = 1; i <= totalPages; i++) {
    promptSitemaps += `
  <sitemap>
    <loc>${baseUrl}/sitemap-prompts.xml?page=${i}</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>`;
  }

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${promptSitemaps}
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-tags.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-authors.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: { 
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    },
  });
};