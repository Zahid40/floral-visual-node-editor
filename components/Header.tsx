import { HuobiToken } from "iconsax-reactjs";
import { Image, Redo2, Share, Share2Icon, Undo2 } from "lucide-react";
import React from "react";

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

export const Header: React.FC<HeaderProps> = ({
  onShareClick,
  onGalleryClick,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  tokenUsage,
}) => {
  return (
    <header className="py-4 px-6 md:px-8 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-wider text-gray-200">
            Floral
          </h1>
          <span className="hidden sm:inline-block ml-3 text-sm text-gray-500 font-mono">
            — Visual Node AI
          </span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-2 p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm">
            <HuobiToken />
            <div className="font-mono text-neutral-400 text-xs">
              <span title="Tokens used this session">
                Session:{" "}
                <span className="text-neutral-200 font-semibold">
                  {tokenUsage.sessionTotal.toLocaleString()}
                </span>
              </span>
              <span className="mx-2 text-neutral-700">|</span>
              <span title="Tokens used in last generation">
                Last:{" "}
                <span className="text-neutral-200 font-semibold">
                  {tokenUsage.last.toLocaleString()}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded-md text-gray-300 hover:bg-neutral-700 disabled:text-neutral-600 disabled:cursor-not-allowed disabled:bg-transparent transition-colors"
            >
              <Undo2 />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="p-2 rounded-md text-gray-300 hover:bg-neutral-700 disabled:text-neutral-600 disabled:cursor-not-allowed disabled:bg-transparent transition-colors"
            >
              <Redo2 />
            </button>
          </div>
          <button
            onClick={onGalleryClick}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-medium text-gray-300 hover:bg-neutral-800 transition-colors"
            title="Open Image Gallery"
          >
            <Image />
            <span className="hidden sm:inline">Gallery</span>
          </button>
          <button
            onClick={onShareClick}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-medium text-gray-300 hover:bg-neutral-800 transition-colors"
          >
            <Share2Icon />
            <span className="hidden sm:inline">Share</span>
          </button>
          <a
            href="https://zahid.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            title="Developer Portfolio"
            className="transition-opacity hover:opacity-80"
          >
            <img
              src="https://zahid.vercel.app/images/zahid.jpg"
              alt="Developer Avatar"
              className="w-8 h-8 rounded-full border-2 border-neutral-700"
            />
          </a>
        </div>
      </div>
    </header>
  );
};
