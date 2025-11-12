
import React from 'react';
import { Node } from 'reactflow';
import { NodeData } from '../types';

interface GallerySheetProps {
    isOpen: boolean;
    onClose: () => void;
    images: Node<NodeData>[];
    onLocateNode: (nodeId: string) => void;
    onPreview: (src: string) => void;
}

const LocateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);
const PreviewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

export const GallerySheet: React.FC<GallerySheetProps> = ({ isOpen, onClose, images, onLocateNode, onPreview }) => {
    return (
        <>
            {/* Overlay */}
            <div 
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Sheet */}
            <div 
                className={`fixed top-0 right-0 h-full w-full max-w-sm bg-neutral-950/80 backdrop-blur-xl border-l border-neutral-800 z-[70] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="gallery-title"
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                        <h2 id="gallery-title" className="text-lg font-bold text-gray-200">Image Gallery</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none" aria-label="Close gallery" title="Close">&times;</button>
                    </div>
                    {images.length > 0 ? (
                        <div className="flex-grow p-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                {images.map(node => (
                                    <div key={node.id} className="group relative rounded-lg overflow-hidden border border-neutral-800">
                                        <img src={node.data.content!} alt={node.data.label} className="w-full h-full object-cover aspect-square" />
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                            <p className="text-xs text-white text-center font-bold mb-2 truncate w-full px-1">{node.data.label}</p>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => onPreview(node.data.content!)} className="flex items-center space-x-1.5 bg-neutral-700/80 hover:bg-neutral-600 text-white text-xs px-2 py-1.5 rounded-md" title="Preview Image">
                                                    <PreviewIcon />
                                                    <span>Preview</span>
                                                </button>
                                                <button onClick={() => onLocateNode(node.id)} className="flex items-center space-x-1.5 bg-neutral-700/80 hover:bg-neutral-600 text-white text-xs px-2 py-1.5 rounded-md" title="Locate Node">
                                                    <LocateIcon />
                                                    <span>Locate</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                         <div className="flex-grow flex items-center justify-center">
                            <p className="text-neutral-500 text-sm">No images on the canvas yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
