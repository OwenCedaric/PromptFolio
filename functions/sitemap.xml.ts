export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return Response.redirect(`${baseUrl}/sitemap-index.xml`, 301);
};