
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getOptimizedImageUrl } from '../utils/image';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
      <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
              img: ({node, ...props}) => (
                  <div className="rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 my-6 shadow-md transition-transform hover:scale-[1.01]">
                      <img 
                          {...props} 
                          src={getOptimizedImageUrl(props.src as string, 1200)}
                          className="w-full h-auto m-0 block" 
                          alt={props.alt || 'Content Image'} 
                          loading="lazy" 
                      />
                      {props.alt && (
                          <div className="px-4 py-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                              {props.alt}
                          </div>
                      )}
                  </div>
              ),
              a: ({node, ...props}) => {
                  const isExternal = props.href?.startsWith('http');
                  return (
                    <a 
                        {...props} 
                        className="text-blue-600 dark:text-blue-400 font-medium underline decoration-blue-200 underline-offset-4 hover:decoration-blue-500 transition-colors"
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                    />
                  );
              },
              code: ({node, ...props}) => (
                  <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-900 dark:text-zinc-100 font-mono text-sm" {...props} />
              ),
              pre: ({node, ...props}) => (
                  <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl overflow-x-auto my-6 border border-white/10 shadow-lg" {...props} />
              )
          }}
      >
          {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
