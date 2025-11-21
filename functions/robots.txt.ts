export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap-index.xml`;

  return new Response(robots, {
    headers: { "Content-Type": "text/plain" },
  });
};