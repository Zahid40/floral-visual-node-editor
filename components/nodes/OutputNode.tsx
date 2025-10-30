import React, { useCallback, useState, useEffect } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { NodeData, NodeType, AspectRatio } from '../../types';
import { ImageCropModal } from '../ImageCropModal';

const NodeLoader: React.FC = () => (
    <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
        <div className="w-10 h-10 border-2 border-t-vermilion-500 border-r-vermilion-500/30 border-b-vermilion-500/30 border-l-vermilion-500/30 border-solid rounded-full animate-spin"></div>
        <p className="mt-3 text-neutral-300 text-xs font-medium tracking-wider">Generating...</p>
    </div>
);


const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

const RegenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
);

const CropIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>
);

const AspectRatioSelector: React.FC<{ selected: AspectRatio, onSelect: (ar: AspectRatio) => void }> = ({ selected, onSelect }) => {
    const ratios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    return (
        <div className="bg-neutral-950 p-1 rounded-md flex items-center justify-center space-x-1">
            {ratios.map(r => (
                <button
                    key={r}
                    onClick={() => onSelect(r)}
                    className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${selected === r ? 'bg-neutral-300 text-black font-bold' : 'text-neutral-400 hover:bg-neutral-800'}`}
                >
                    {r}
                </button>
            ))}
        </div>
    );
};

const aspectRatioToPadding: Record<AspectRatio, string> = {
    '1:1': '100%',
    '16:9': '56.25%',
    '9:16': '177.78%',
    '4:3': '75%',
    '3:4': '133.33%',
};

export const OutputNode: React.FC<NodeProps<NodeData>> = ({ id, data, isConnectable, selected }) => {
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(data.aspectRatio || '1:1');
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    
    useEffect(() => {
        if (data.aspectRatio) {
            setSelectedAspectRatio(data.aspectRatio);
        }
    }, [data.aspectRatio]);

    const handleGenerateClick = () => {
        if (data.onGenerate) {
            data.onGenerate(id, 'image-generate', { aspectRatio: selectedAspectRatio });
        }
    };

    const handleDownload = useCallback(() => {
        if (!data.content) return;
        const link = document.createElement('a');
        link.href = data.content;
        const fileExtension = data.content.substring(data.content.indexOf('/') + 1, data.content.indexOf(';'));
        link.download = `output-${id}.${fileExtension || 'png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [data.content, id]);
    
    const handleCropSave = (croppedImage: string, newAspectRatio: AspectRatio) => {
        data.onUpdate?.(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, content: croppedImage, mimeType: 'image/png', aspectRatio: newAspectRatio } } : n));
        setIsCropModalOpen(false);
    };

    return (
        <>
        <div className={`w-80 bg-neutral-900/80 backdrop-blur-md rounded-xl shadow-2xl shadow-black/40 border transition-all duration-300 relative ${selected ? 'border-vermilion-500/80 shadow-[0_0_20px_rgba(229,72,54,0.3)]' : 'border-neutral-700/50'}`}>
            <button
                onClick={() => data.onDelete && data.onDelete(id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-neutral-700 hover:bg-red-600 rounded-full text-white text-xs flex items-center justify-center cursor-pointer transition-all duration-200 leading-none opacity-50 hover:opacity-100 z-10"
                title="Delete Node"
            >
              &times;
            </button>
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
            
            <div className="w-full h-full rounded-xl flex flex-col">
                <div className="flex items-center text-gray-400 text-xs p-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                    <span className="font-medium text-sm text-neutral-300">{data.label}</span>
                </div>
                <div className="flex-grow min-h-0 bg-neutral-950/50 relative">
                    {data.loading && <NodeLoader />}
                    {data.content ? (
                        <div className="p-2">
                            <div
                                className="relative w-full bg-black rounded-md cursor-pointer group"
                                style={{ paddingTop: aspectRatioToPadding[data.aspectRatio || '1:1'] }}
                                onClick={() => data.onPreview && data.content && data.onPreview(data.content)}
                                title="Click to preview image"
                            >
                                <img
                                    src={data.content}
                                    alt="Output"
                                    className="absolute top-0 left-0 w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-center p-4">
                             <span className="text-neutral-500 text-xs">Connect inputs and click Generate.</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center justify-end p-2 border-t border-neutral-800/80 bg-neutral-900/50 rounded-b-xl space-y-2">
                    <AspectRatioSelector selected={selectedAspectRatio} onSelect={setSelectedAspectRatio} />
                    <div className="w-full">
                        {data.content ? (
                            <div className="flex w-full items-center justify-end space-x-2">
                                <button onClick={handleGenerateClick} title="Regenerate" className="flex items-center justify-center flex-grow bg-neutral-200 hover:bg-white text-black text-sm font-bold py-2 px-4 rounded-md transition-colors">
                                    <RegenerateIcon />
                                    <span className="ml-2">Regenerate</span>
                                </button>
                                 <button onClick={() => setIsCropModalOpen(true)} title="Crop Image" className="p-2.5 rounded-md text-neutral-400 bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors">
                                    <CropIcon />
                                </button>
                                <button onClick={handleDownload} title="Download Image" className="p-2.5 rounded-md text-neutral-400 bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors">
                                    <DownloadIcon />
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={handleGenerateClick}
                                className="w-full bg-neutral-200 hover:bg-white text-black text-sm font-bold py-2 px-4 rounded-md transition-colors"
                            >
                                Generate
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
        {isCropModalOpen && data.content && (
            <ImageCropModal 
                src={data.content}
                initialAspectRatio={data.aspectRatio || '1:1'}
                onClose={() => setIsCropModalOpen(false)}
                onSave={handleCropSave}
            />
        )}
        </>
    );
};