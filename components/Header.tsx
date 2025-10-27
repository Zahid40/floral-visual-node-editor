
import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="py-4 px-6 md:px-8 border-b border-[#3A3A3A]/50 bg-[#0a0a0a]/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center">
                    <h1 className="text-xl md:text-2xl font-bold tracking-wider text-gray-200">
                        Floral
                    </h1>
                    <span className="hidden sm:inline-block ml-3 text-sm text-gray-500 font-mono">— Visual Node AI</span>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                    Powered by Gemini
                </div>
            </div>
        </header>
    );
};
