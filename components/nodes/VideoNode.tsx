
import React, { useState, useEffect, useRef } from 'react';
import { NodeProps, Handle, Position, useEdges } from 'reactflow';
import { NodeData, AspectRatio } from '../../types';

const NodeLoader: React.FC = () => (
    <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
        <div className="w-10 h-10 border-2 border-t-vermilion-500 border-r-vermilion-500/30 border-b-vermilion-500/30 border-l-vermilion-500/30 border-solid rounded-full animate-spin"></div>
        <p className="mt-3 text-neutral-300 text-xs font-medium tracking-wider animate-pulse">Generating Video...</p>
    </div>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

const GenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);

const VideoAspectRatioSelector: React.FC<{ selected: AspectRatio, onSelect: (ar: AspectRatio) => void }> = ({ selected, onSelect }) => {
    // Veo mostly supports these
    const ratios: AspectRatio[] = ['16:9', '9:16'];
    return (
        <div className="bg-neutral-950 p-1 rounded-md flex items-center justify-center space-x-1">
            {ratios.map(r => (
                <button
                    key={r}
                    onClick={() => onSelect(r)}
                    className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${selected === r ? 'bg-neutral-300 text-black font-bold' : 'text-neutral-400 hover:bg-neutral-800'}`}
                    title={`Set aspect ratio to ${r}`}
                >
                    {r}
                </button>
            ))}
        </div>
    );
};

const aspectRatioToPadding: Record<string, string> = {
    '16:9': '56.25%',
    '9:16': '177.78%',
};

export const VideoNode: React.FC<NodeProps<NodeData>> = ({ id, data, isConnectable, selected }) => {
    const edges = useEdges();
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('16:9');
    const [isRenaming, setIsRenaming] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const hasIncomingConnection = edges.some(edge => edge.target === id);

    useEffect(() => {
        if (data.aspectRatio && (data.aspectRatio === '16:9' || data.aspectRatio === '9:16')) {
            setSelectedAspectRatio(data.aspectRatio);
        }
    }, [data.aspectRatio]);

    useEffect(() => {
        if (isRenaming) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isRenaming]);

    const handleGenerate = () => {
        if (data.onGenerate) {
            data.onGenerate(id, 'video-generate', { aspectRatio: selectedAspectRatio });
        }
    }

    const handleDownload = () => {
        if (!data.content) return;
        const link = document.createElement('a');
        link.href = data.content;
        link.download = `video-${id}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleNameChange = (newName: string) => {
        data.onUpdate?.(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label: newName } } : n));
    };

    return (
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
                <div className="flex items-center text-gray-400 text-xs p-2.5 space-x-2">
                    <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0"></div>
                     {isRenaming ? (
                         <input
                            ref={nameInputRef}
                            type="text"
                            defaultValue={data.label}
                            onBlur={(e) => {
                                handleNameChange(e.target.value);
                                setIsRenaming(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleNameChange(e.currentTarget.value);
                                    setIsRenaming(false);
                                } else if (e.key === 'Escape') {
                                    setIsRenaming(false);
                                }
                            }}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded p-1 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-vermilion-500"
                        />
                    ) : (
                         <span 
                            className="font-medium text-sm text-neutral-300 truncate cursor-pointer hover:text-white" 
                            title="Click to rename"
                            onClick={() => setIsRenaming(true)}
                        >
                            {data.label}
                        </span>
                    )}
                </div>
                
                <div className="flex-grow min-h-0 bg-neutral-950/50 relative">
                     {data.loading && <NodeLoader />}
                     {data.content ? (
                        <div className="p-2">
                            <div 
                                className="relative w-full bg-black rounded-md overflow-hidden"
                                style={{ paddingTop: aspectRatioToPadding[data.aspectRatio || '16:9'] || '56.25%' }}
                            >
                                <video 
                                    src={data.content} 
                                    controls 
                                    className="absolute top-0 left-0 w-full h-full object-cover"
                                />
                            </div>
                        </div>
                     ) : (
                        <div className="h-40 flex items-center justify-center p-4 text-center">
                            <p className="text-neutral-500 text-xs">Connect prompt/image & generate.</p>
                        </div>
                     )}
                </div>

                <div className="flex flex-col items-center justify-end p-2 border-t border-neutral-800/80 bg-neutral-900/50 rounded-b-xl space-y-2">
                    <VideoAspectRatioSelector selected={selectedAspectRatio} onSelect={setSelectedAspectRatio} />
                    <div className="w-full flex items-center space-x-2">
                         {hasIncomingConnection && (
                            <button onClick={handleGenerate} title="Generate Video" className="flex items-center justify-center flex-grow bg-neutral-200 hover:bg-white text-black text-sm font-bold py-2 px-3 rounded-md transition-colors">
                                <GenerateIcon />
                                <span className="ml-2">Generate</span>
                            </button>
                        )}
                        {data.content && (
                            <button onClick={handleDownload} title="Download Video" className="p-2 rounded-md text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors">
                                <DownloadIcon />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    );
};
