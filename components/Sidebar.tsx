import React from 'react';
import { RiAddLine, RiCloseLine, RiLogoutBoxRLine, RiLoginBoxLine, RiApps2Line, RiStarLine, RiMoonLine, RiSunLine, RiSidebarFoldLine, RiSidebarUnfoldLine, RiDownloadLine } from '@remixicon/react';
import { Category } from '../types';

interface SidebarProps {
  siteName?: string;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onCreateNew: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onExport?: () => void;
}

// Inline Logo Component: Cedar "C" Fusion Design
const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Background Shape */}
    <rect x="0" y="0" width="64" height="64" rx="16" fill="currentColor" className="text-zinc-900 dark:text-zinc-100" />
    
    {/* Cedar "C" Monogram */}
    <g transform="translate(14, 14) scale(0.56)">
        {/* The Serif 'C' Shape */}
        <path 
            d="M48 16C44 12 38 10 32 10C19.85 10 10 19.85 10 32C10 44.15 19.85 54 32 54C38 54 44 52 48 48" 
            stroke="currentColor" 
            className="text-white dark:text-zinc-900" 
            strokeWidth="6" 
            strokeLinecap="square" 
        />
        
        {/* The Cedar Tree Lines (Integrating into the C) */}
        {/* Central Trunk Line */}
        <path d="M32 54V24" stroke="currentColor" className="text-white dark:text-zinc-900" strokeWidth="4" strokeLinecap="round" />
        
        {/* Branch Lines */}
        <path d="M32 28L20 40" stroke="currentColor" className="text-white dark:text-zinc-900" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 34L44 46" stroke="currentColor" className="text-white dark:text-zinc-900" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 24L26 30" stroke="currentColor" className="text-white dark:text-zinc-900" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 40L38 46" stroke="currentColor" className="text-white dark:text-zinc-900" strokeWidth="3" strokeLinecap="round" />
    </g>
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ 
    siteName, selectedCategory, onSelectCategory, onCreateNew, isOpen = false, onClose, isAuthenticated, onLogin, onLogout, isDarkMode, onToggleTheme, isCollapsed, toggleCollapse, onExport
}) => {
  
  return (
    <>
        <div className={`
            fixed md:relative z-50 flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
            transform transition-all duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64 pb-[env(safe-area-inset-bottom)]
        `}>
        
        {/* Brand */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'} shrink-0 border-b border-transparent`}>
            {!isCollapsed ? (
                <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap group">
                    <Logo className="w-8 h-8 shrink-0 group-hover:scale-105 transition-transform duration-300" />
                    <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white font-sans">{siteName || 'CedarPrompt'}</span>
                </div>
            ) : (
                 <div className="w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform" onClick={toggleCollapse} title="Expand">
                    <Logo className="w-full h-full" />
                </div>
            )}

            {/* Mobile Close */}
            <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                <RiCloseLine size={20} />
            </button>
        </div>

        {/* Primary Action (New Prompt) */}
        <div className={`px-3 my-2 transition-all duration-300 ${isCollapsed ? 'flex justify-center' : ''}`}>
            {isAuthenticated && (
                <button 
                    onClick={onCreateNew}
                    title="New Prompt"
                    className={`flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg transition-all shadow-sm ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full py-2.5 px-4'}`}
                >
                    <RiAddLine size={18} />
                    {!isCollapsed && <span className="text-sm font-medium">New</span>}
                </button>
            )}
        </div>

        {/* Navigation - Flex-1 ensures Footer stays at bottom */}
        <div className={`flex-1 px-3 overflow-y-auto no-scrollbar transition-all duration-300`}>
            
            <nav className="space-y-1 mt-4">
                <button
                    onClick={() => onSelectCategory('All')}
                    title={isCollapsed ? "All Prompts" : undefined}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 text-sm rounded-md transition-colors ${
                    selectedCategory === 'All'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <RiApps2Line size={18} />
                        {!isCollapsed && <span>All Prompts</span>}
                    </div>
                </button>

                <button
                    onClick={() => onSelectCategory('Favorites')}
                    title={isCollapsed ? "Favorites" : undefined}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 text-sm rounded-md transition-colors ${
                    selectedCategory === 'Favorites'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <RiStarLine size={18} />
                        {!isCollapsed && <span>Favorites</span>}
                    </div>
                </button>
            </nav>

            {/* Categories - Completely Hidden when collapsed */}
            {!isCollapsed && (
                <div className="animate-in fade-in duration-300 slide-in-from-left-2">
                    <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">Categories</div>
                    
                    <nav className="space-y-0.5">
                        {Object.values(Category).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => onSelectCategory(cat)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                                selectedCategory === cat
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedCategory === cat ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-600'}`}></span>
                                <span className="truncate">{cat}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className={`p-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1 ${isCollapsed ? 'items-center' : ''} shrink-0`}>
             {/* Collapse Toggle */}
             <button 
                onClick={toggleCollapse}
                className={`hidden md:flex items-center gap-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full'}`}
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <RiSidebarUnfoldLine size={18} /> : <RiSidebarFoldLine size={18} />}
                {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
            </button>

            <button 
                onClick={onToggleTheme}
                className={`flex items-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full'}`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDarkMode ? <RiSunLine size={18} /> : <RiMoonLine size={18} />}
                {!isCollapsed && <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>

             {/* Export Data Button */}
             {onExport && (
                <button 
                    onClick={onExport}
                    className={`flex items-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full'}`}
                    title="Export Data JSON"
                >
                    <RiDownloadLine size={18} />
                    {!isCollapsed && <span className="text-sm font-medium">Backup Data</span>}
                </button>
             )}

            {isAuthenticated ? (
                <button 
                    onClick={onLogout}
                    className={`flex items-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full'}`}
                    title="Sign out"
                >
                    <RiLogoutBoxRLine size={18} />
                    {!isCollapsed && <span className="text-sm font-medium">Sign out</span>}
                </button>
            ) : (
                <button 
                    onClick={onLogin}
                    className={`flex items-center gap-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full'}`}
                    title="Admin Login"
                >
                    <RiLoginBoxLine size={18} />
                    {!isCollapsed && <span className="text-sm font-medium">Login</span>}
                </button>
            )}
        </div>
        </div>
    </>
  );
};

export default Sidebar;