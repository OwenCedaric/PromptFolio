interface Env {
  DB: any;
  SITE_URL?: string;
}

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  // Use explicit SITE_URL if available, otherwise fallback to request origin
  const baseUrl = context.env.SITE_URL || `${url.protocol}//${url.host}`;

  let lastMod = new Date().toISOString();
  
  try {
    // Get the latest update time from non-private prompts (includes Drafts)
    const { results } = await context.env.DB.prepare(
      "SELECT MAX(updatedAt) as latest FROM prompts WHERE status != 'PRIVATE'"
    ).all();
    
    if (results?.[0]?.latest) {
      lastMod = new Date(results[0].latest).toISOString();
    }
  } catch (e) {
    console.error("Error fetching latest date for sitemap index:", e);
  }

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-prompts.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-tags.xml</loc>
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