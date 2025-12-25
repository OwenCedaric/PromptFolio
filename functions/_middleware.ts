
interface Env {
  DB: any;
  SITE_PASSWORD?: string;
}

// Fixed: Removed the PagesFunction type which was causing a compilation error.
// Using any for context to avoid dependency on global PagesFunction type.
export const onRequest = async (context: any) => {
  const { request, next, env } = context;
  const url = new URL(request.url);
  
  // 如果是 API、静态资源或现有的 sitemap，直接跳过
  if (
    url.pathname.startsWith('/api/') || 
    url.pathname.includes('.') || 
    url.pathname.startsWith('/functions/')
  ) {
    return next();
  }

  // 捕获类似 /p/id 或 /topic/name 的路径，并让它渲染 index.html
  // 这允许 SPA 在客户端接管路由
  const response = await next();
  
  // 如果是 HTML 请求，可以考虑在此注入一些基础 Meta 信息（可选的高级 SEO 手段）
  return response;
};
