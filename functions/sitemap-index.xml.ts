interface Env {
  DB: any;
}

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  let lastMod = new Date().toISOString();
  
  try {
    // Get the latest update time from published prompts for the index lastmod
    const { results } = await context.env.DB.prepare(
      "SELECT MAX(updatedAt) as latest FROM prompts WHERE status = 'PUBLISHED'"
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
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: { 
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    },
  });
};