interface Env {
  DB: any;
  SITE_URL?: string;
}

// Fix: Replaced PagesFunction<Env> with any to resolve "Cannot find name 'PagesFunction'" error
export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  const response = await context.next();
  
  // 仅处理 HTML 请求
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("text/html")) {
    return response;
  }

  const promptId = url.searchParams.get("id");
  const baseUrl = context.env.SITE_URL || `${url.protocol}//${url.host}`;

  if (promptId) {
    try {
      // 在边缘侧直接查询 D1 数据库
      const prompt = await context.env.DB.prepare(
        "SELECT title, description, imageUrl, category, author, updatedAt FROM prompts WHERE id = ? AND status != 'PRIVATE'"
      )
      .bind(promptId)
      .first();

      if (prompt) {
        const title = `${prompt.title} - PromptFolio`;
        const description = prompt.description || "一个精选的 AI 提示词。";
        const image = prompt.imageUrl || `${baseUrl}/favicon.svg`;
        
        // 生成 JSON-LD
        const jsonLd = {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "headline": prompt.title,
          "description": description,
          "image": image,
          "author": { "@type": "Person", "name": prompt.author || "Anonymous" },
          "dateModified": new Date(prompt.updatedAt).toISOString(),
          "genre": prompt.category
        };

        // Fix: Accessed HTMLRewriter through globalThis and used any type to resolve "Cannot find name 'HTMLRewriter'" error
        return new (globalThis as any).HTMLRewriter()
          .on("title", {
            element(el: any) { el.setInnerContent(title); }
          })
          .on('meta[name="description"]', {
            element(el: any) { el.setAttribute("content", description); }
          })
          .on('meta[property="og:title"]', {
            element(el: any) { el.setAttribute("content", title); }
          })
          .on('meta[property="og:description"]', {
            element(el: any) { el.setAttribute("content", description); }
          })
          .on('meta[property="og:image"]', {
            element(el: any) { el.setAttribute("content", image); }
          })
          .on('#seo-json-ld', {
            element(el: any) { el.setInnerContent(JSON.stringify(jsonLd)); }
          })
          .transform(response);
      }
    } catch (e) {
      console.error("Edge SEO injection failed:", e);
    }
  }

  return response;
};
