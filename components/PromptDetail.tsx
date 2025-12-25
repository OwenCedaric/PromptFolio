
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { 
    RiArrowLeftLine, 
    RiFileCopyLine, 
    RiPencilLine, 
    RiCheckLine, 
    RiStarLine, 
    RiStarFill, 
    RiTimeLine,
    RiGlobalLine,
    RiPriceTag3Line,
    RiHistoryLine,
    RiDeleteBinLine,
    RiFileTextLine,
    RiInformationLine,
    RiCopyrightLine,
    RiShieldCheckLine,
    RiGitCommitLine,
    RiToggleLine,
    RiLockLine,
    RiEyeLine,
    RiLoginCircleLine,
    RiBookOpenLine,
    RiLoader4Line
} from '@remixicon/react';
import { PromptData, PromptStatus, Category, Copyright } from '../types';
import { getOptimizedImageUrl } from '../utils/image';

const MarkdownRenderer = React.lazy(() => import('./MarkdownRenderer'));

interface PromptDetailProps {
  prompt: PromptData;
  onBack: () => void;
  onEdit: (prompt: PromptData) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isAuthenticated: boolean;
  onLogin?: () => void;
  onTagClick?: (tag: string) => void;
  onAuthorClick?: (author: string) => void;
  onTopicClick?: (topic: string) => void;
}

const PromptDetail: React.FC<PromptDetailProps> = ({ prompt, onBack, onEdit, onDelete, onToggleFavorite, isAuthenticated, onLogin, onTagClick, onAuthorClick, onTopicClick }) => {
  const sortedVersions = [...prompt.versions].sort((a, b) => b.createdAt - a.createdAt);
  const [selectedVersionId, setSelectedVersionId] = useState<string>(prompt.currentVersionId);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'info' | 'prompt'>('info');

  const isPrivate = prompt.status === PromptStatus.PRIVATE;
  const isLocked = isPrivate && !isAuthenticated;

  useEffect(() => {
      setSelectedVersionId(prompt.currentVersionId);
  }, [prompt.currentVersionId]);

  // --- SEO Optimization ---
  useEffect(() => {
    if (prompt.title) {
        document.title = `${prompt.title} - AI Prompt Guide | ${process.env.SITE_NAME || 'PromptFolio'}`;
        
        // Update Meta Description
        const desc = prompt.description ? prompt.description.substring(0, 160) : `Check out this expert-crafted ${prompt.category} prompt on ${process.env.SITE_NAME}.`;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', desc);
        
        // OG tags
        const updateOg = (property: string, content: string) => {
            let el = document.querySelector(`meta[property="${property}"]`);
            if (el) el.setAttribute('content', content);
        };
        updateOg('og:title', prompt.title);
        updateOg('og:description', desc);
        if (prompt.imageUrl) updateOg('og:image', prompt.imageUrl);
    }
  }, [prompt.title, prompt.description, prompt.category, prompt.imageUrl]);

  const jsonLd = useMemo(() => {
    if (isLocked) return null;
    const baseUrl = process.env.SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://promptfolio.pages.dev');
    const datePublished = (sortedVersions.length > 0 && sortedVersions[sortedVersions.length - 1]?.createdAt) 
        ? new Date(sortedVersions[sortedVersions.length - 1].createdAt).toISOString()
        : new Date().toISOString();
    const dateModified = prompt.updatedAt ? new Date(prompt.updatedAt).toISOString() : new Date().toISOString();

    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": prompt.category === Category.CODING ? "TechArticle" : "CreativeWork",
      "headline": prompt.title,
      "description": prompt.description,
      "image": prompt.imageUrl ? [prompt.imageUrl] : [],
      "datePublished": datePublished,
      "dateModified": dateModified,
      "author": { "@type": "Person", "name": prompt.author || "PromptFolio Contributor" },
      "genre": prompt.category,
      "keywords": (prompt.tags || []).join(", ")
    });
  }, [prompt, sortedVersions, isLocked]);

  const canonicalUrl = useMemo(() => {
      if (typeof window === 'undefined') return '';
      return `${window.location.origin}/?id=${prompt.id}`;
  }, [prompt.id]);

  const viewedVersion = prompt.versions.find(v => v.id === selectedVersionId) || prompt.versions[prompt.versions.length - 1];

  const handleCopy = () => {
      navigator.clipboard.writeText(viewedVersion?.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget;
      if (img.src.includes('wsrv.nl') && prompt.imageUrl) {
          img.src = prompt.imageUrl;
      } else {
          img.style.display = 'none';
      }
  };

  const LockedPlaceholder = ({ title, message }: { title: string, message: string }) => (
      <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center">
          <RiLockLine size={24} className="text-zinc-400 mb-4" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[240px] mb-5">{message}</p>
          {onLogin && (
              <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-lg">
                  <RiLoginCircleLine size={14} /> Admin Login
              </button>
          )}
      </div>
  );

  return (
    <article className="h-full flex flex-col bg-zinc-50/50 dark:bg-zinc-950/50 relative overflow-hidden">
      {jsonLd && createPortal(<script type="application/ld+json">{jsonLd}</script>, document.head)}
      {canonicalUrl && createPortal(<link rel="canonical" href={canonicalUrl} />, document.head)}

      <div className="flex-1 overflow-hidden relative min-h-0">
        <div className="lg:hidden shrink-0 px-6 pt-6 pb-4 bg-zinc-50/95 dark:bg-zinc-950/95 border-b border-zinc-200/50 dark:border-zinc-800/50 z-20 sticky top-0">
             <div className="flex items-center justify-between">
                 <button onClick={onBack} className="p-2 -ml-2 text-zinc-500"><RiArrowLeftLine size={20} /></button>
                 <div className="flex items-center gap-2">
                    <button onClick={() => onToggleFavorite(prompt.id)} className={`p-2 ${prompt.isFavorite ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
                        {prompt.isFavorite ? <RiStarFill size={20} /> : <RiStarLine size={20} />}
                    </button>
                    {isAuthenticated && (
                        <button onClick={() => onEdit(prompt)} className="text-zinc-700 dark:text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-200/50 dark:bg-zinc-800">Edit</button>
                    )}
                 </div>
             </div>
             <h1 className="text-xl font-bold text-zinc-900 dark:text-white mt-2">{prompt.title}</h1>
        </div>

        <div className="h-full max-w-[1920px] mx-auto lg:grid lg:grid-cols-12 lg:divide-x lg:divide-zinc-200 dark:lg:divide-zinc-800">
            <section className={`lg:col-span-7 h-full flex flex-col overflow-hidden ${mobileTab === 'prompt' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="hidden lg:block shrink-0 px-10 pt-10 pb-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <div className="flex items-center justify-between mb-6">
                         <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <RiArrowLeftLine size={20} /> <span className="text-sm font-medium">Library</span>
                         </button>
                         <div className="flex items-center gap-3">
                            <button onClick={() => onToggleFavorite(prompt.id)} className={prompt.isFavorite ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}>
                                {prompt.isFavorite ? <RiStarFill size={20} /> : <RiStarLine size={20} />}
                            </button>
                            {isAuthenticated && (
                                <button onClick={() => onEdit(prompt)} className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-lg text-sm font-medium">Edit Prompt</button>
                            )}
                         </div>
                    </div>
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">{prompt.title}</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar">
                    {prompt.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <img src={getOptimizedImageUrl(prompt.imageUrl, 1200)} alt={`${prompt.title} Preview`} className="w-full h-auto block" onError={handleImageError}/>
                        </div>
                    )}

                    {isLocked ? (
                        <LockedPlaceholder title="Private Description" message="Content restricted to administrators." />
                    ) : prompt.description ? (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <RiInformationLine size={14} /> Description
                            </h3>
                            <Suspense fallback={<div className="h-20 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded"></div>}>
                                <MarkdownRenderer content={prompt.description} />
                            </Suspense>
                        </div>
                    ) : null}

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                         <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Tags</h3>
                         <div className="flex flex-wrap gap-2">
                            {prompt.tags.map(tag => (
                                <button key={tag} onClick={() => onTagClick?.(tag)} className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs px-3 py-1.5 rounded-lg hover:border-zinc-400">#{tag}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className={`lg:col-span-5 h-full bg-zinc-50 dark:bg-zinc-950/50 px-4 md:px-8 py-6 md:py-8 flex flex-col overflow-hidden ${mobileTab === 'info' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Prompt Source</h3>
                        {!isLocked && (
                            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <select value={selectedVersionId} onChange={(e) => setSelectedVersionId(e.target.value)} className="bg-transparent text-xs font-medium outline-none">
                                    {sortedVersions.map((v) => (
                                        <option key={v.id} value={v.id}>v{prompt.versions.findIndex(x => x.id === v.id) + 1}</option>
                                    ))}
                                </select>
                                <button onClick={handleCopy} className={`text-xs px-2 py-1 rounded transition-colors ${copied ? 'text-green-600' : 'text-zinc-500'}`}>
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {isLocked ? (
                        <LockedPlaceholder title="Private Prompt" message="Please login to view." />
                    ) : (
                        <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                {viewedVersion?.content}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-1.5 rounded-full bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur text-white flex border border-white/10">
             <button onClick={() => setMobileTab('info')} className={`px-6 py-2 rounded-full text-xs font-medium ${mobileTab === 'info' ? 'bg-white text-black' : 'text-zinc-400'}`}>Info</button>
             <button onClick={() => setMobileTab('prompt')} className={`px-6 py-2 rounded-full text-xs font-medium ${mobileTab === 'prompt' ? 'bg-white text-black' : 'text-zinc-400'}`}>Prompt</button>
      </nav>
    </article>
  );
};

export default PromptDetail;
