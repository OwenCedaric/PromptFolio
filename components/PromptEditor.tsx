
import React, { useState, useEffect, useRef } from 'react';
import { RiSave3Line, RiArrowLeftLine, RiMagicLine, RiCloseLine, RiImage2Line, RiLoader4Line, RiCheckboxBlankCircleLine, RiCheckboxCircleFill, RiHistoryLine, RiDeleteBinLine, RiErrorWarningLine, RiSettings3Line, RiFileTextLine, RiCopyrightLine, RiHashtag, RiArrowDownSLine, RiCheckLine, RiToggleLine, RiShieldCheckLine, RiPriceTag3Line, RiUser3Line } from '@remixicon/react';
import { PromptData, PromptStatus, Category, PromptVersion, Copyright } from '../types';
import { geminiService } from '../services/geminiService';

interface PromptEditorProps {
  initialData?: PromptData | null;
  onSave: (data: PromptData) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  existingAuthors?: string[];
  existingTags?: string[];
  existingTopics?: string[];
}

// Safer ID generator
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper Hook for Click Outside
function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// Reusable Custom Select Component
const CustomSelect = ({ 
    label, 
    value, 
    options, 
    onChange, 
    icon: Icon 
}: { 
    label: string, 
    value: string, 
    options: { label: string, value: string }[], 
    onChange: (val: string) => void, 
    icon?: any 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, () => setIsOpen(false));

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div className="space-y-1 relative" ref={ref}>
            <label className="text-xs text-zinc-500 dark:text-zinc-500 uppercase font-semibold">{label}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-sm bg-zinc-50 dark:bg-zinc-800 border ${isOpen ? 'border-zinc-400 dark:border-zinc-500 ring-1 ring-zinc-200 dark:ring-zinc-700' : 'border-zinc-200 dark:border-zinc-700'} rounded-lg px-3 py-2 outline-none text-zinc-900 dark:text-zinc-100 transition-all flex items-center justify-between cursor-pointer select-none`}
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon size={16} className="text-zinc-400 shrink-0" />}
                    <span className="truncate">{selectedLabel}</span>
                </div>
                <RiArrowDownSLine size={16} className={`text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700 animate-in fade-in zoom-in-95 duration-100 origin-top flex flex-col p-1">
                    {options.map((opt) => (
                        <div 
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={`px-3 py-2 text-sm rounded-md cursor-pointer flex items-center justify-between transition-colors ${value === opt.value ? 'bg-zinc-100 dark:bg-zinc-700/50 font-medium text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}
                        >
                            <span className="truncate mr-2">{opt.label}</span>
                            {value === opt.value && <RiCheckLine size={14} className="text-zinc-900 dark:text-white shrink-0" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PromptEditor: React.FC<PromptEditorProps> = ({ initialData, onSave, onDelete, onCancel, existingAuthors = [], existingTags = [], existingTopics = [] }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<Category>(initialData?.category || Category.OTHER);
  const [status, setStatus] = useState<PromptStatus>(initialData?.status || PromptStatus.PUBLISHED);
  const [copyright, setCopyright] = useState<Copyright>(initialData?.copyright || Copyright.CC_BY_NC);
  const [author, setAuthor] = useState(initialData?.author || '');
  const [topic, setTopic] = useState(initialData?.topic || '');
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

  // Suggestion Visibility Refs
  const authorRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  useClickOutside(authorRef, () => setShowAuthorSuggestions(false));
  useClickOutside(topicRef, () => setShowTopicSuggestions(false));
  useClickOutside(tagsRef, () => setShowTagSuggestions(false));

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
      setCopyright(initialData.copyright || Copyright.NONE);
      setAuthor(initialData.author || '');
      setTopic(initialData.topic || '');
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
      setStatus(PromptStatus.PUBLISHED);
      setCopyright(Copyright.CC_BY_NC);
      setAuthor('');
      setTopic('');
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

    // Sanitize data: Trim whitespace to avoid duplicates like "ABC" vs " ABC"
    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    const cleanTopic = topic.trim();
    const cleanTags = tags.map(t => t.trim()).filter(t => t !== '');

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
      title: cleanTitle,
      description,
      category,
      status,
      copyright,
      author: cleanAuthor,
      topic: cleanTopic,
      tags: cleanTags,
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
            // Deduplicate incoming AI tags against existing ones
            const currentTagsLower = tags.map(t => t.toLowerCase().trim());
            const newTags = res.filter(t => !currentTagsLower.includes(t.toLowerCase().trim()));
            setTags([...tags, ...newTags]);
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

  // Add tag with duplication check
  const handleAddTag = (tagToAdd: string) => {
      const cleanTag = tagToAdd.trim();
      if (!cleanTag) return;
      
      // Case-insensitive check
      const exists = tags.some(t => t.toLowerCase() === cleanTag.toLowerCase());
      if (exists) {
          setTagInput('');
          setShowTagSuggestions(false);
          return;
      }
      
      setTags([...tags, cleanTag]);
      setTagInput('');
      setShowTagSuggestions(false);
  };

  // Filtered tag suggestions
  const filteredTagSuggestions = existingTags.filter(t => 
      t.toLowerCase().includes(tagInput.toLowerCase()) && 
      !tags.some(existing => existing.toLowerCase() === t.toLowerCase())
  );

  // Filtered author suggestions
  const filteredAuthors = existingAuthors.filter(a => 
    a.toLowerCase().includes(author.toLowerCase()) && a !== author
  );

  // Filtered topic suggestions
  const filteredTopics = existingTopics.filter(t => 
    t.toLowerCase().includes(topic.toLowerCase()) && t !== topic
  );

  // Sort versions for dropdown (Newest first)
  const sortedVersions = [...versions].sort((a, b) => b.createdAt - a.createdAt);

  // Common Input Styles for Author/Topic to match CustomSelect
  const commonInputClass = "w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 text-zinc-900 dark:text-zinc-100 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-0";

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

      {/* Main Content Area - Independent Columns */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
        
        {/* COMMON TOOLBAR */}
        <div className="shrink-0 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/50 z-20">
            <div className="max-w-[1920px] mx-auto px-4 md:px-10 py-3 md:py-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={onCancel} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors flex-shrink-0">
                        <RiArrowLeftLine size={20} />
                    </button>
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hidden lg:block">{initialData ? 'Edit Prompt' : 'Create New Prompt'}</span>
                </div>

                <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                    {initialData && (
                        <>
                            <button 
                                type="button"
                                onClick={handleDeletePrompt}
                                className="flex items-center shrink-0 justify-center w-8 h-8 md:w-auto md:h-auto md:px-2 md:py-1 gap-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete Prompt"
                            >
                                <RiDeleteBinLine size={16} className="md:w-[14px] md:h-[14px]" />
                                <span className="hidden md:inline text-xs font-medium">Delete</span>
                            </button>
                            <div className="h-4 md:h-6 w-px bg-zinc-200 dark:bg-zinc-800"></div>
                        </>
                    )}

                    <label className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs font-medium text-zinc-600 dark:text-zinc-300 cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shrink-0 bg-white/60 dark:bg-zinc-800/60 md:bg-transparent px-2 py-1.5 md:px-0 md:py-0 rounded-md border border-zinc-200 dark:border-zinc-700 md:border-transparent">
                        <input 
                            type="checkbox" 
                            checked={saveAsNewVersion} 
                            onChange={(e) => setSaveAsNewVersion(e.target.checked)}
                            className="hidden"
                        />
                        {saveAsNewVersion ? (
                            <RiCheckboxCircleFill className="text-black dark:text-white" size={16} />
                        ) : (
                            <RiCheckboxBlankCircleLine className="text-zinc-400 dark:text-zinc-600" size={16} />
                        )}
                        <span className="hidden sm:inline">Save as new version</span>
                        <span className="sm:hidden">New Ver.</span>
                    </label>

                    <button 
                        onClick={handleSave}
                        className="flex items-center shrink-0 gap-1.5 md:gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black px-3 md:px-5 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors shadow-sm ml-0.5 md:ml-1"
                    >
                        <RiSave3Line size={16} />
                        <span>Save</span>
                    </button>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-hidden relative min-h-0">
            <div className="h-full max-w-[1920px] mx-auto lg:grid lg:grid-cols-12 lg:divide-x lg:divide-zinc-200 dark:lg:divide-zinc-800">
            
                {/* LEFT COLUMN (60%): Settings (Title, Desc, Meta) */}
                <div className={`lg:col-span-7 h-full flex flex-col overflow-hidden ${mobileTab === 'prompt' ? 'hidden lg:flex' : 'flex'}`}>
                    
                     {/* Fixed Header: Title */}
                     <div className="shrink-0 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/50 z-10">
                        {/* Title Input Fixed */}
                        <div className="px-5 md:px-10 pb-4 md:pb-8 pt-5 md:pt-8">
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter Prompt Title..."
                            className="w-full text-2xl md:text-4xl font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 border-none outline-none bg-transparent p-0 focus:ring-0"
                        />
                        </div>
                     </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-8 pb-32 lg:pb-10 space-y-8 scrollbar-hide">
                    {/* Properties Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-5">
                        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Properties</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Author Input with Unified Dropdown */}
                            <div className="space-y-1 relative" ref={authorRef}>
                                <label className="text-xs text-zinc-500 dark:text-zinc-500 uppercase font-semibold">Author</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-3 text-zinc-400 pointer-events-none"><RiUser3Line size={14} /></div>
                                    <input 
                                        type="text" 
                                        value={author}
                                        onChange={(e) => {
                                            setAuthor(e.target.value);
                                            setShowAuthorSuggestions(true);
                                        }}
                                        onFocus={() => setShowAuthorSuggestions(true)}
                                        placeholder="Creator Name"
                                        className={`pl-9 ${commonInputClass}`}
                                    />
                                </div>
                                {showAuthorSuggestions && filteredAuthors.length > 0 && (
                                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700 animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1">
                                        {filteredAuthors.map((auth) => (
                                            <div 
                                                key={auth}
                                                onClick={() => {
                                                    setAuthor(auth);
                                                    setShowAuthorSuggestions(false);
                                                }}
                                                className="px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md cursor-pointer transition-colors"
                                            >
                                                {auth}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Topic Input with Unified Dropdown */}
                            <div className="space-y-1 relative" ref={topicRef}>
                                <label className="text-xs text-zinc-500 dark:text-zinc-500 uppercase font-semibold">Topic (Optional)</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-3 text-zinc-400 pointer-events-none"><RiHashtag size={14} /></div>
                                    <input 
                                        type="text" 
                                        value={topic}
                                        onChange={(e) => {
                                            setTopic(e.target.value);
                                            setShowTopicSuggestions(true);
                                        }}
                                        onFocus={() => setShowTopicSuggestions(true)}
                                        placeholder="e.g. Portrait, Landscape"
                                        className={`pl-9 ${commonInputClass}`}
                                    />
                                </div>
                                {showTopicSuggestions && filteredTopics.length > 0 && (
                                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700 animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1">
                                        {filteredTopics.map((t) => (
                                            <div 
                                                key={t}
                                                onClick={() => {
                                                    setTopic(t);
                                                    setShowTopicSuggestions(false);
                                                }}
                                                className="px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md cursor-pointer transition-colors"
                                            >
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Select */}
                        <CustomSelect 
                            label="Category"
                            value={category}
                            options={Object.values(Category).map(c => ({ label: c, value: c }))}
                            onChange={(val) => setCategory(val as Category)}
                            icon={RiPriceTag3Line}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Status Select */}
                            <CustomSelect 
                                label="Status"
                                value={status}
                                options={Object.values(PromptStatus).map(s => ({ label: s, value: s }))}
                                onChange={(val) => setStatus(val as PromptStatus)}
                                icon={RiToggleLine}
                            />

                            {/* License Select */}
                            <CustomSelect 
                                label="License"
                                value={copyright}
                                options={Object.values(Copyright).map(c => ({ label: c, value: c }))}
                                onChange={(val) => setCopyright(val as Copyright)}
                                icon={RiShieldCheckLine}
                            />
                        </div>
                    </div>
                    
                    {/* Case / Example Image Input */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors rounded-xl p-2 px-4 shadow-sm">
                            <RiImage2Line size={16} className="text-zinc-400" />
                            <input 
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="Case / Example Image URL (Optional) - e.g. Result screenshot"
                                className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-0 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            />
                        </div>
                        {imageUrl && (
                            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm w-full bg-zinc-100 dark:bg-zinc-900">
                                <img 
                                    src={imageUrl} 
                                    alt="Case Example Preview" 
                                    className="w-full h-auto block"
                                    onError={(e) => e.currentTarget.style.display='none'} 
                                />
                            </div>
                        )}
                    </div>

                     {/* Description Area */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors rounded-2xl p-6 shadow-sm flex flex-col min-h-[300px]">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Description / Context</label>
                            <button 
                                onClick={() => handleAI('desc')} 
                                disabled={isProcessing || !content}
                                className="flex items-center gap-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-300 px-2 py-1 rounded transition-colors"
                            >
                            {activeAiTask === 'desc' ? <RiLoader4Line className="animate-spin" size={12} /> : <RiMagicLine size={12} />}
                            Auto-Generate
                            </button>
                        </div>
                        
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the purpose, goals, or context of this prompt. Support Markdown for images..."
                            className="flex-1 w-full text-sm text-zinc-700 dark:text-zinc-300 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 resize-none leading-relaxed font-mono"
                        />
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-600 shrink-0">
                            Tip: Use Markdown to embed images or videos directly.
                        </p>
                    </div>

                    {/* Tags Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Tags</h3>
                            <button 
                                onClick={() => handleAI('tags')} 
                                disabled={isProcessing}
                                className="text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
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
                        
                        <div className="relative" ref={tagsRef}>
                            <input 
                                value={tagInput}
                                onChange={(e) => {
                                    setTagInput(e.target.value);
                                    setShowTagSuggestions(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && tagInput) {
                                        e.preventDefault();
                                        handleAddTag(tagInput);
                                    }
                                }}
                                onFocus={() => setShowTagSuggestions(true)}
                                placeholder="Type tag & hit Enter..."
                                className={commonInputClass}
                            />
                            
                            {/* Unified Dropdown for Tags */}
                            {showTagSuggestions && tagInput && filteredTagSuggestions.length > 0 && (
                                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700 animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1">
                                    {filteredTagSuggestions.map((suggestion) => (
                                        <div 
                                            key={suggestion}
                                            onClick={() => {
                                                handleAddTag(suggestion);
                                            }}
                                            className="px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md cursor-pointer flex items-center justify-between transition-colors"
                                        >
                                            <span>{suggestion}</span>
                                            <span className="text-xs text-zinc-400">Add</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

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
                            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {activeAiTask === 'optimize' ? <RiLoader4Line className="animate-spin" size={14} /> : <RiMagicLine size={14} />}
                            AI Refine
                        </button>
                     </div>
                     
                     {/* Editor Container */}
                     <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors rounded-xl overflow-hidden shadow-sm flex flex-col">
                         {/* Editor Header */}
                        <div className="h-10 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-4 justify-between shrink-0">
                             
                             {/* Version Control */}
                             <div className="flex items-center gap-2">
                                <div className="relative group flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1">
                                    <RiHistoryLine size={12} className="text-zinc-400 dark:text-zinc-500 ml-1" />
                                    <select 
                                        value={activeVersionId || ''}
                                        onChange={(e) => handleVersionChange(e.target.value)}
                                        className="bg-transparent text-xs font-medium text-zinc-700 dark:text-zinc-300 ml-1.5 outline-none cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 appearance-none pr-6 py-0.5"
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
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500">
                                        <RiArrowDownSLine size={12} />
                                    </div>
                                </div>

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

                             <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                                EDITOR
                             </span>
                        </div>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your prompt here..."
                            className="w-full flex-1 bg-transparent text-zinc-800 dark:text-zinc-200 font-mono text-sm p-6 pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-6 border-none focus:ring-0 focus:outline-none resize-none leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-600 selection:bg-zinc-100 dark:selection:bg-zinc-800"
                        />
                     </div>
                </div>
            </div>

        </div>
      </div>
      </div>

      {/* Mobile Floating Navigation */}
      <div className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-[env(safe-area-inset-bottom)]">
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
