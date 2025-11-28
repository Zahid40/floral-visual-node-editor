
import React from 'react';

interface HeaderProps {
    onShareClick: () => void;
    onGalleryClick: () => void;
    onSettingsClick: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    tokenUsage: {
        last: number;
        sessionTotal: number;
    };
    onDownloadAllClick: () => void;
    imageCount: number;
}

const UndoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8c-3.5 0-7 2-7 7v4m0-11l-4 4 4 4"/></svg>
);

const RedoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8c3.5 0 7 2 7 7v4m0-11l4 4-4 4"/></svg>
);

const GalleryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
);

const TokenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);


export const Header: React.FC<HeaderProps> = ({ onShareClick, onGalleryClick, onSettingsClick, onUndo, onRedo, canUndo, canRedo, tokenUsage, onDownloadAllClick, imageCount }) => {
    return (
        <header className="py-4 px-6 md:px-8 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <a href="/" title="Floral - Visual Node AI">
                        <img src="./logo.svg" alt="Floral Logo" className="h-6" />
                    </a>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                     <div className="hidden md:flex items-center space-x-2 p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm">
                        <TokenIcon />
                        <div className="font-mono text-neutral-400 text-xs">
                            <span title="Tokens used this session">Session: <span className="text-neutral-200 font-semibold">{tokenUsage.sessionTotal.toLocaleString()}</span></span>
                            <span className="mx-2 text-neutral-700">|</span>
                            <span title="Tokens used in last generation">Last: <span className="text-neutral-200 font-semibold">{tokenUsage.last.toLocaleString()}</span></span>
                        </div>
                    </div>
                     <div className="flex items-center space-x-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <button 
                            onClick={onUndo}
                            disabled={!canUndo}
                            title="Undo (Ctrl+Z)"
                            className="p-2 rounded-md text-gray-300 hover:bg-neutral-700 disabled:text-neutral-600 disabled:cursor-not-allowed disabled:bg-transparent transition-colors"
                        >
                            <UndoIcon />
                        </button>
                        <button 
                            onClick={onRedo}
                            disabled={!canRedo}
                            title="Redo (Ctrl+Y)"
                            className="p-2 rounded-md text-gray-300 hover:bg-neutral-700 disabled:text-neutral-600 disabled:cursor-not-allowed disabled:bg-transparent transition-colors"
                        >
                            <RedoIcon />
                        </button>
                     </div>
                     <button 
                        onClick={onGalleryClick}
                        className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-medium text-gray-300 hover:bg-neutral-800 transition-colors"
                        title="Open Image Gallery"
                    >
                        <GalleryIcon />
                        <span className="hidden sm:inline">Gallery</span>
                    </button>
                    <button 
                        onClick={onSettingsClick}
                        className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-medium text-gray-300 hover:bg-neutral-800 transition-colors"
                        title="Settings"
                    >
                        <SettingsIcon />
                        <span className="hidden sm:inline">Settings</span>
                    </button>
                     <button 
                        onClick={onShareClick}
                        className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-medium text-gray-300 hover:bg-neutral-800 transition-colors"
                        title="Share or Import Workflow"
                    >
                        <ShareIcon />
                        <span className="hidden sm:inline">Share</span>
                    </button>
                    <button 
                        onClick={onDownloadAllClick}
                        disabled={imageCount === 0}
                        className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-medium text-gray-300 hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download All Images as .zip"
                    >
                        <DownloadIcon />
                        <span className="hidden sm:inline">Download All</span>
                    </button>
                    <a href="https://zahid.vercel.app/" target="_blank" rel="noopener noreferrer" title="Developer Portfolio" className="flex items-center gap-3 text-gray-400 transition-opacity hover:opacity-80">
                        <img src="https://zahid.vercel.app/images/zahid.png" alt="Developer Avatar" className="w-10 h-10 rounded-full border-2 border-neutral-700" />
                        <span className="hidden sm:inline text-sm font-medium">Developed by Zahid</span>
                    </a>
                </div>
            </div>
        </header>
    );
};
