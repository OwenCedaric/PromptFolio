
interface Env {
  DB: any;
  SITE_URL?: string;
}

// Fixed error: Cannot find name 'PagesFunction'.
// Removed the explicit type to rely on inferred signature since PagesFunction is unavailable in this context.
export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  const response = await context.next();
  
  // 只处理 HTML 请求
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("text/html")) {
    return response;
  }

  const id = url.searchParams.get('id');
  const topic = url.searchParams.get('topic');
  
  let seoTitle = "PromptFolio - 专业的 AI Prompt 分享平台";
  let seoDescription = "发现并管理高质量的 AI 提示词。支持版本控制、Markdown 媒体描述和 AI 自动优化。";
  let jsonLd = "";

  try {
    if (id) {
      // 查询单个 Prompt 的数据
      const prompt = await context.env.DB.prepare(
        "SELECT title, description, category, author, updatedAt, imageUrl FROM prompts WHERE id = ? AND status != 'PRIVATE'"
      ).bind(id).first();

      if (prompt) {
        seoTitle = `${prompt.title} | PromptFolio`;
        seoDescription = prompt.description ? prompt.description.substring(0, 160) : seoDescription;
        
        const siteUrl = context.env.SITE_URL || `${url.protocol}//${url.host}`;
        const schema = {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "name": prompt.title,
          "headline": prompt.title,
          "description": seoDescription,
          "image": prompt.imageUrl ? [prompt.imageUrl] : [],
          "author": { "@type": "Person", "name": prompt.author || "PromptFolio" },
          "datePublished": new Date(prompt.updatedAt).toISOString(),
          "genre": prompt.category,
          "mainEntityOfPage": { "@type": "WebPage", "@id": `${siteUrl}/?id=${id}` }
        };
        jsonLd = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
      }
    } else if (topic) {
      seoTitle = `${topic} 主题集合 | PromptFolio`;
      seoDescription = `探索关于 ${topic} 的精选 AI 提示词集合。`;
    }
  } catch (e) {
    console.error("SSR Middleware Error:", e);
  }

  // Fixed error: Cannot find name 'HTMLRewriter'.
  // Accessing HTMLRewriter through globalThis and casting to any to bypass compilation error.
  return new (globalThis as any).HTMLRewriter()
    .on('title', {
      element(element: any) {
        element.setInnerContent(seoTitle);
      }
    })
    .on('meta[name="description"]', {
      element(element: any) {
        element.setAttribute('content', seoDescription);
      }
    })
    .on('head', {
      element(element: any) {
        if (jsonLd) {
          element.append(jsonLd, { html: true });
        }
      }
    })
    .transform(response);
};
