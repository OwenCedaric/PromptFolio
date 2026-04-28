export const onRequestGet = async (context: any) => {
    const url = new URL(context.request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const robots = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemaps/sitemap-prompts.xml
Sitemap: ${baseUrl}/sitemaps/sitemap-categories.xml
Sitemap: ${baseUrl}/sitemaps/sitemap-topics.xml
Sitemap: ${baseUrl}/sitemaps/sitemap-authors.xml
Sitemap: ${baseUrl}/sitemaps/sitemap-tags.xml
Sitemap: ${baseUrl}/sitemaps/sitemap-pages.xml`;

    return new Response(robots, {
        headers: { "Content-Type": "text/plain" },
    });
};