import React, { useState, useEffect } from 'react';
import { RiSave3Line, RiArrowLeftLine, RiMagicLine, RiCloseLine, RiImage2Line, RiLoader4Line, RiCheckboxBlankCircleLine, RiCheckboxCircleFill, RiHistoryLine, RiDeleteBinLine, RiErrorWarningLine, RiSettings3Line, RiFileTextLine } from '@remixicon/react';
import { PromptData, PromptStatus, Category, PromptVersion } from '../types';
import { geminiService } from '../services/geminiService';

interface PromptEditorProps {
  initialData?: PromptData | null;
  onSave: (data: PromptData) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

// Safer ID generator
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const PromptEditor: React.FC<PromptEditorProps> = ({ initialData, onSave, onDelete, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<Category>(initialData?.category || Category.OTHER);
  const [status, setStatus] = useState<PromptStatus>(initialData?.status || PromptStatus.DRAFT);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [versions, setVersions] = useState<PromptVersion[]>(initialData?.versions || []);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAiTask, setActiveAiTask] = useState<string | null>(null);
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'settings' | 'prompt'>('settings');

  // Versioning State
  const [saveAsNewVersion, setSaveAsNewVersion] = useState(false);

  // Delete Confirmation State for Version
  const [confirmDeleteVersionId, setConfirmDeleteVersionId] = useState<string | null>(null);

  // Initialize state
  useEffect(() => {
    if (initialData && initialData.versions && initialData.versions.length > 0) {
      // Load Current Version by default
      const current = initialData.versions.find(v => v.id === initialData.currentVersionId) || initialData.versions[initialData.versions.length - 1];
      
      setContent(current.content);
      setActiveVersionId(current.id);
      setVersions(initialData.versions);
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setStatus(initialData.status);
      setTags(initialData.tags);
      setImageUrl(initialData.imageUrl || '');
    } else {
      // New Prompt Defaults
      const newId = generateId();
      setVersions([{ id: newId, content: '', createdAt: Date.now(), note: 'Initial Draft' }]);
      setActiveVersionId(newId);
      setContent('');
      setTitle('');
      setDescription('');
      setCategory(Category.OTHER);
      setStatus(PromptStatus.DRAFT);
      setTags([]);
      setImageUrl('');
    }
  }, [initialData]);

  // Handle switching versions in the editor
  const handleVersionChange = (versionId: string) => {
      const targetVersion = versions.find(v => v.id === versionId);
      if (targetVersion) {
          setActiveVersionId(versionId);
          setContent(targetVersion.content);
      }
  };

  const handleDeleteVersion = (versionId: string) => {
    const newVersions = versions.filter(v => v.id !== versionId);
    
    // Switch to the newest version remaining
    const sortedRemaining = [...newVersions].sort((a, b) => b.createdAt - a.createdAt);
    const newest = sortedRemaining[0];
    
    setVersions(newVersions);
    if (newest) {
        setActiveVersionId(newest.id);
        setContent(newest.content);
    } else {
        // If all deleted (shouldn't happen due to check), create empty
        const newId = generateId();
        setVersions([{ id: newId, content: '', createdAt: Date.now(), note: 'Restart' }]);
        setActiveVersionId(newId);
        setContent('');
    }
    setConfirmDeleteVersionId(null);
  };

  const handleDeletePrompt = () => {
    if (initialData) {
        onDelete(initialData.id);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
        alert('Please enter a title for your prompt.');
        return;
    }

    let finalVersions = [...versions];
    let finalCurrentVersionId = activeVersionId;

    if (saveAsNewVersion) {
        // Create new version entry (branching off current content)
        const newVersionId = generateId();
        const newVersion: PromptVersion = {
            id: newVersionId,
            content: content,
            createdAt: Date.now(),
            note: `v${versions.length + 1}`
        };
        finalVersions = [...versions, newVersion];
        finalCurrentVersionId = newVersionId;
    } else {
        // Update existing active version (Overwrite history)
        finalVersions = versions.map(v => 
            v.id === activeVersionId ? { ...v, content: content } : v
        );
    }

    const payload: PromptData = {
      id: initialData?.id || generateId(),
      title,
      description,
      category,
      status,
      tags,
      imageUrl, 
      versions: finalVersions,
      currentVersionId: finalCurrentVersionId!,
      updatedAt: Date.now(),
      isFavorite: initialData?.isFavorite || false
    };
    onSave(payload);
  };

  const handleAI = async (action: 'optimize' | 'tags' | 'desc') => {
    setIsProcessing(true);
    setActiveAiTask(action);
    try {
        if (action === 'optimize' && content) {
            const res = await geminiService.optimizePrompt(content);
            setContent(res);
        } else if (action === 'tags' && (title || description)) {
            const res = await geminiService.suggestTags(title, description);
            setTags(Array.from(new Set([...tags, ...res])));
        } else if (action === 'desc' && content) {
            const res = await geminiService.generateDescription(content);
            setDescription(res);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsProcessing(false);
        setActiveAiTask(null);
    }
  };

  // Sort versions for dropdown (Newest first)
  const sortedVersions = [...versions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="h-full flex flex-col bg-zinc-50/50 dark:bg-zinc-950/50 relative overflow-hidden">
      
      {/* Version Delete Modal (Local) */}
      {confirmDeleteVersionId && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 max-w-xs w-full mx-4">
                  <div className="flex flex-col items-center text-center">
                        <RiErrorWarningLine className="text-red-500 mb-3" size={32} />
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Delete Version?</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                            This will remove this specific version from the history list. You must click "Save" afterwards to persist changes.
                        </p>
                        <div className="flex gap-2 w-full">
                            <button 
                                onClick={() => setConfirmDeleteVersionId(null)}
                                className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDeleteVersion(confirmDeleteVersionId)}
                                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                  </div>
              </div>
          </div>
      )}

      {/* GLOBAL HEADER - VISIBLE ON BOTH TABS */}
      <div className="shrink-0 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/50 z-10">
            <div className="px-6 md:px-10 pt-6 md:pt-8 pb-2 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 shrink-0">
                    <button onClick={onCancel} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <RiArrowLeftLine size={20} />
                    </button>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hidden md:block">{initialData ? 'Edit Prompt' : 'Create New Prompt'}</span>
                </div>

                <div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar">
                    {initialData && (
                        <>
                            <button 
                                type="button"
                                onClick={handleDeletePrompt}
                                className="flex items-center shrink-0 gap-1 text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors px-2 py-1"
                            >
                                <RiDeleteBinLine size={14} />
                                <span className="hidden sm:inline">Delete Prompt</span>
                            </button>
                            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>
                        </>
                    )}

                    <label className="hidden md:flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shrink-0">
                        <input 
                            type="checkbox" 
                            checked={saveAsNewVersion} 
                            onChange={(e) => setSaveAsNewVersion(e.target.checked)}
                            className="hidden"
                        />
                        {saveAsNewVersion ? (
                            <RiCheckboxCircleFill className="text-black dark:text-white" size={18} />
                        ) : (
                            <RiCheckboxBlankCircleLine className="text-zinc-400 dark:text-zinc-600" size={18} />
                        )}
                        Save as new version
                    </label>

                    <button 
                        onClick={handleSave}
                        className="flex items-center shrink-0 gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black px-4 md:px-5 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <RiSave3Line size={16} />
                        <span>Save</span>
                    </button>
                </div>
            </div>

            {/* Title Input Fixed */}
            <div className="px-6 md:px-10 pb-6 md:pb-8 pt-4">
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter Prompt Title..."
                    className="w-full text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 border-none outline-none bg-transparent p-0 focus:ring-0"
                />
            </div>
        </div>

      {/* Main Content Area - Independent Columns */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        <div className="h-full max-w-[1920px] mx-auto lg:grid lg:grid-cols-12 lg:divide-x lg:divide-zinc-200 dark:lg:divide-zinc-800">
        
            {/* LEFT COLUMN (60%): Settings Body (Properties, Tags, Desc) */}
            <div className={`lg:col-span-7 h-full overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar ${mobileTab === 'prompt' ? 'hidden lg:block' : 'block'}`}>
                    {/* Properties Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-5">
                            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Properties</h3>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold">Category</label>
                                <div className="relative">
                                    <select 
                                        value={category} 
                                        onChange={(e) => setCategory(e.target.value as Category)}
                                        className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-zinc-900 dark:text-zinc-100 transition-colors appearance-none"
                                    >
                                        {Object.values(Category).map(c => (
                                            <option key={c} value={c} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Custom Chevron */}
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold">Status</label>
                                <div className="relative">
                                    <select 
                                        value={status} 
                                        onChange={(e) => setStatus(e.target.value as PromptStatus)}
                                        className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-zinc-900 dark:text-zinc-100 transition-colors appearance-none"
                                    >
                                        {Object.values(PromptStatus).map(s => (
                                            <option key={s} value={s} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags Card */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tags</h3>
                                <button 
                                    onClick={() => handleAI('tags')} 
                                    disabled={isProcessing}
                                    className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
                                >
                                    {activeAiTask === 'tags' ? <RiLoader4Line className="animate-spin" size={10} /> : <RiMagicLine size={10} />} Auto
                                </button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {tags.map(t => (
                                    <span key={t} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-2 py-1 rounded-md flex items-center gap-1 group">
                                        {t} 
                                        <button onClick={() => setTags(tags.filter(x => x !== t))} className="text-zinc-400 hover:text-red-500 transition-colors"><RiCloseLine size={12}/></button>
                                    </span>
                                ))}
                            </div>
                            
                            <input 
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && tagInput) {
                                        e.preventDefault();
                                        setTags([...tags, tagInput]);
                                        setTagInput('');
                                    }
                                }}
                                placeholder="Type tag & hit Enter..."
                                className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-zinc-900 dark:text-zinc-100 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            />
                        </div>
                    </div>
                    
                    {/* Cover Image Input */}
                     <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 px-4 shadow-sm">
                        <RiImage2Line size={16} className="text-zinc-400" />
                        <input 
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="Cover Image URL (Optional)"
                            className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-0 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        />
                    </div>

                     {/* Description Area */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col min-h-[300px]">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Description / Context</label>
                            <button 
                                onClick={() => handleAI('desc')} 
                                disabled={isProcessing || !content}
                                className="flex items-center gap-1.5 text-[10px] font-medium bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-300 px-2 py-1 rounded transition-colors"
                            >
                            {activeAiTask === 'desc' ? <RiLoader4Line className="animate-spin" size={12} /> : <RiMagicLine size={12} />}
                            Auto-Generate
                            </button>
                        </div>
                        
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the purpose, goals, or context of this prompt. Support Markdown for images..."
                            className="flex-1 w-full text-sm text-zinc-700 dark:text-zinc-300 bg-transparent border-none p-0 focus:ring-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 resize-none leading-relaxed font-mono"
                        />
                        <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-600 shrink-0">
                            Tip: Use Markdown to embed images or videos directly.
                        </p>
                    </div>
            </div>

            {/* RIGHT COLUMN (40%): Prompt Editor */}
            <div className={`lg:col-span-5 h-full bg-zinc-50 dark:bg-zinc-950/50 px-4 md:px-8 py-6 md:py-8 flex flex-col overflow-hidden ${mobileTab === 'settings' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex flex-col h-full">
                     <div className="flex justify-between items-center mb-3 shrink-0">
                         <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-2 bg-zinc-900 dark:bg-white rounded-full"></div>
                            Prompt Content
                        </h3>
                         <button 
                            onClick={() => handleAI('optimize')} 
                            disabled={isProcessing || !content}
                            className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {activeAiTask === 'optimize' ? <RiLoader4Line className="animate-spin" size={14} /> : <RiMagicLine size={14} />}
                            AI Refine
                        </button>
                     </div>
                     
                     {/* Editor Container */}
                     <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-all flex flex-col">
                         {/* Editor Header - Stays fixed inside the column */}
                        <div className="h-10 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-4 justify-between shrink-0">
                             
                             {/* Version Control */}
                             <div className="flex items-center gap-2">
                                <div className="relative group flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1">
                                    <RiHistoryLine size={12} className="text-zinc-400 dark:text-zinc-500" />
                                    <select 
                                        value={activeVersionId || ''}
                                        onChange={(e) => handleVersionChange(e.target.value)}
                                        className="bg-transparent text-[11px] font-medium text-zinc-700 dark:text-zinc-300 ml-2 outline-none cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 appearance-none pr-4"
                                    >
                                        {sortedVersions.map((v, idx) => {
                                            const originalIndex = versions.findIndex(ver => ver.id === v.id);
                                            return (
                                                <option key={v.id} value={v.id} className="text-zinc-900 dark:text-white bg-white dark:bg-zinc-900">
                                                    Editing: v{originalIndex + 1} {v.note ? `(${v.note})` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Delete Version Button */}
                                {versions.length > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => activeVersionId && setConfirmDeleteVersionId(activeVersionId)}
                                        className="p-1.5 flex items-center gap-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                                        title="Delete this specific version"
                                    >
                                        <RiDeleteBinLine size={14} />
                                    </button>
                                )}
                             </div>

                             <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                                EDITOR
                             </span>
                        </div>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your prompt here..."
                            className="w-full flex-1 bg-transparent text-zinc-800 dark:text-zinc-200 font-mono text-sm p-6 border-none focus:ring-0 resize-none leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-600 selection:bg-zinc-100 dark:selection:bg-zinc-800"
                        />
                     </div>
                </div>
            </div>

        </div>
      </div>

      {/* Mobile Floating Navigation */}
      <div className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur-md text-white p-1.5 rounded-full flex shadow-2xl border border-white/10 dark:border-black/10">
             <button 
                onClick={() => setMobileTab('settings')}
                className={`px-6 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
                    mobileTab === 'settings' 
                    ? 'bg-white text-black shadow-sm scale-105' 
                    : 'text-zinc-400 hover:text-white'
                }`}
             >
                <RiSettings3Line size={16} />
                Settings
             </button>
             <button 
                onClick={() => setMobileTab('prompt')}
                className={`px-6 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
                    mobileTab === 'prompt' 
                    ? 'bg-white text-black shadow-sm scale-105' 
                    : 'text-zinc-400 hover:text-white'
                }`}
             >
                <RiFileTextLine size={16} />
                Prompt
             </button>
        </div>
      </div>

    </div>
  );
};

export default PromptEditor;