interface Env {
  DB: any;
  SITE_URL?: string;
}

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const baseUrl = context.env.SITE_URL || `${url.protocol}//${url.host}`;

  try {
    // Get distinct categories that actually have published prompts
    const { results } = await context.env.DB.prepare(
      "SELECT DISTINCT category, MAX(updatedAt) as latest FROM prompts WHERE status = 'PUBLISHED' GROUP BY category"
    ).all();

    const urls = results.map((row: any) => {
      const lastMod = new Date(row.latest).toISOString();
      const categoryEncoded = encodeURIComponent(row.category);
      return `
  <url>
    <loc>${baseUrl}/?category=${categoryEncoded}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }).join('');

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
    console.error("Sitemap categories error:", err);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { "Content-Type": "application/xml" },
    });
  }
};