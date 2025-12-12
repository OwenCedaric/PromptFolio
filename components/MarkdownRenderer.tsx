
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getOptimizedImageUrl } from '../utils/image';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none animate-in fade-in duration-500">
      <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
              img: ({node, ...props}) => (
                  <div className="rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 my-4 shadow-sm">
                      <img 
                          {...props} 
                          src={getOptimizedImageUrl(props.src as string, 1200)}
                          className="w-full h-auto m-0" 
                          alt={props.alt || 'content'} 
                          loading="lazy" 
                          decoding="async"
                          onError={(e) => {
                            const img = e.currentTarget;
                            const originalSrc = props.src as string;
                            if (img.src.includes('wsrv.nl') && originalSrc) {
                                img.src = originalSrc;
                            } else {
                                img.style.display = 'none';
                                img.parentElement?.style.setProperty('display', 'none');
                            }
                          }}
                      />
                  </div>
              ),
              a: ({node, ...props}) => (
                  <a {...props} className="text-zinc-900 dark:text-zinc-100 font-medium underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-2 hover:decoration-zinc-500 dark:hover:decoration-zinc-400 transition-colors" target="_blank" rel="noopener noreferrer" />
              )
          }}
      >
          {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
