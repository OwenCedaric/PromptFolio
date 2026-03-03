interface Env {
  DB: any;
  SITE_URL?: string;
}

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const baseUrl = context.env.SITE_URL || `${url.protocol}//${url.host}`;
  const ITEMS_PER_PAGE = 12; // Must match TopicList.tsx

  try {
    // 1. Get total distinct topics
    const countResult = await context.env.DB.prepare(
      "SELECT COUNT(DISTINCT topic) as total FROM prompts WHERE status != 'PRIVATE' AND topic IS NOT NULL AND topic != ''"
    ).first();

    const totalTopics = (countResult?.total as number) || 0;
    const totalPages = Math.ceil(totalTopics / ITEMS_PER_PAGE);

    // 2. Get latest update time overall
    const latestResult = await context.env.DB.prepare(
      "SELECT MAX(updatedAt) as latest FROM prompts WHERE status != 'PRIVATE'"
    ).first();
    const lastMod = latestResult?.latest ? new Date(latestResult.latest).toISOString() : new Date().toISOString();

    let urls = '';
    
    // Page 1 of topics is usually accessed via /?view=topics
    urls += `
  <url>
    <loc>${baseUrl}/?view=topics</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;

    // Pagination (Page 2+)
    for (let i = 2; i <= totalPages; i++) {
      urls += `
  <url>
    <loc>${baseUrl}/?view=topics&amp;page=${i}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: { 
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600"
      },
    });

  } catch (err: any) {
    console.error("Sitemap topic directory error:", err);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { "Content-Type": "application/xml" },
    });
  }
};