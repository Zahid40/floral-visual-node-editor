
import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-2xl">
            <div className="w-16 h-16 border-4 border-t-red-500 border-r-red-500/50 border-b-red-500/50 border-l-red-500/50 border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-300 font-medium tracking-wider">Generating with Gemini...</p>
        </div>
    );
};