
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getOptimizedImageUrl } from '../utils/image';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none animate-in fade-in duration-500 selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
              // 图片渲染优化：支持点击放大（通过基础样式支持）和自动 WebP 转换
              img: ({node, ...props}) => (
                  <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 my-6 shadow-md group relative">
                      <img 
                          {...props} 
                          src={getOptimizedImageUrl(props.src as string, 1200)}
                          className="w-full h-auto m-0 transition-transform duration-500 group-hover:scale-[1.02]" 
                          alt={props.alt || 'Content Image'} 
                          loading="lazy" 
                          decoding="async"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (img.src.includes('wsrv.nl')) {
                                img.src = props.src as string;
                            }
                          }}
                      />
                  </div>
              ),
              // 链接处理：外部链接自动新窗口打开
              a: ({node, ...props}) => (
                  <a 
                    {...props} 
                    className="text-blue-600 dark:text-blue-400 font-semibold no-underline hover:underline underline-offset-4 transition-all" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                  />
              ),
              // 引用块样式
              blockquote: ({node, ...props}) => (
                  <blockquote {...props} className="border-l-4 border-zinc-300 dark:border-zinc-700 italic text-zinc-600 dark:text-zinc-400 pl-4 py-1" />
              ),
              // 代码块样式
              code: ({node, ...props}) => (
                  <code {...props} className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-900 dark:text-zinc-100 font-mono text-[0.9em]" />
              )
          }}
      >
          {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
