export const onRequestGet = async (context: any) => {
    const url = new URL(context.request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const robots = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-prompts.xml
Sitemap: ${baseUrl}/sitemap-categories.xml
Sitemap: ${baseUrl}/sitemap-topics.xml
Sitemap: ${baseUrl}/sitemap-authors.xml
Sitemap: ${baseUrl}/sitemap-tags.xml
Sitemap: ${baseUrl}/sitemap-library.xml
Sitemap: ${baseUrl}/sitemap-topic-directory.xml`;

    return new Response(robots, {
        headers: { "Content-Type": "text/plain" },
    });
};