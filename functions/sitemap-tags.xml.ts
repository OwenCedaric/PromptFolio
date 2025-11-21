interface Env {
  DB: any;
}

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    // Fetch all tags from published prompts. 
    // Note: Since tags are stored as JSON strings in SQLite, we fetch them and parse in JS.
    const { results } = await context.env.DB.prepare(
      "SELECT tags, updatedAt FROM prompts WHERE status = 'PUBLISHED'"
    ).all();

    // Map to store latest update time per tag
    const tagMap = new Map<string, number>();

    results.forEach((row: any) => {
        try {
            const tags = JSON.parse(row.tags as string);
            const updatedAt = row.updatedAt;
            
            if (Array.isArray(tags)) {
                tags.forEach((tag: string) => {
                    const currentMax = tagMap.get(tag) || 0;
                    if (updatedAt > currentMax) {
                        tagMap.set(tag, updatedAt);
                    }
                });
            }
        } catch (e) {
            // Ignore parsing errors
        }
    });

    const urls = Array.from(tagMap.entries()).map(([tag, timestamp]) => {
      const lastMod = new Date(timestamp).toISOString();
      const tagEncoded = encodeURIComponent(tag);
      return `
  <url>
    <loc>${baseUrl}/?tag=${tagEncoded}</loc>
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
    console.error("Sitemap tags error:", err);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { "Content-Type": "application/xml" },
    });
  }
};