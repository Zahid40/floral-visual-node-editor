
import React from 'react';

interface HeaderProps {
    onShareClick: () => void;
    onGalleryClick: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    tokenUsage: {
        last: number;
        sessionTotal: number;
    };
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

export const Header: React.FC<HeaderProps> = ({ onShareClick, onGalleryClick, onUndo, onRedo, canUndo, canRedo, tokenUsage }) => {
    return (
        <header className="py-4 px-6 md:px-8 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center">
                    <h1 className="text-xl md:text-2xl font-bold tracking-wider text-gray-200">
                        Floral
                    </h1>
                    <span className="hidden sm:inline-block ml-3 text-sm text-gray-500 font-mono">— Visual Node AI</span>
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
                        onClick={onShareClick}
                        className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-medium text-gray-300 hover:bg-neutral-800 transition-colors"
                    >
                        <ShareIcon />
                        <span className="hidden sm:inline">Share</span>
                    </button>
                    <a href="https://zahid.vercel.app/" target="_blank" rel="noopener noreferrer" title="Developer Portfolio" className="transition-opacity hover:opacity-80">
                        <img src="https://zahid.vercel.app/images/zahid.jpg" alt="Developer Avatar" className="w-8 h-8 rounded-full border-2 border-neutral-700" />
                    </a>
                </div>
            </div>
        </header>
    );
};
