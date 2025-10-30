import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import { NodeProps, Handle, Position, useEdges } from 'reactflow';
import { NodeData, NodeType, AspectRatio } from '../../types';
import { fileToBase64 } from '../../services/geminiService';
import { ImageCropModal } from '../ImageCropModal';

const NodeLoader: React.FC = () => (
    <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
        <div className="w-10 h-10 border-2 border-t-vermilion-500 border-r-vermilion-500/30 border-b-vermilion-500/30 border-l-vermilion-500/30 border-solid rounded-full animate-spin"></div>
    </div>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

const ReplaceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path><path d="M21 12.79V18M21 12.79H15.21"></path></svg>
);

const GenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
);

const RegenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M20 6L9 17l-5-5"/></svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
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


export const ImageNode: React.FC<NodeProps<NodeData>> = ({ id, data, isConnectable, selected }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const edges = useEdges();
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(data.aspectRatio || '1:1');
    const [isCopied, setIsCopied] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const hasIncomingConnection = useMemo(() => edges.some(edge => edge.target === id), [edges, id]);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (data.aspectRatio) {
            setSelectedAspectRatio(data.aspectRatio);
        }
    }, [data.aspectRatio]);

    useEffect(() => {
        if (isRenaming) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isRenaming]);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && data.onUpdate) {
            try {
                const { dataUrl } = await fileToBase64(file);
                 data.onUpdate((nds) =>
                    nds.map((node) =>
                        node.id === id ? { ...node, data: { ...node.data, content: dataUrl, mimeType: file.type, label: file.name } } : node
                    )
                );
            } catch (err) {
                console.error("Failed to read image file", err);
            }
        }
    }, [id, data]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleDownload = useCallback(() => {
        if (!data.content || !data.mimeType) return;
        const link = document.createElement('a');
        link.href = data.content;
        const fileExtension = data.mimeType.split('/')[1] || 'png';
        link.download = `image-node-${id}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [data.content, data.mimeType, id]);

    const handleGenerate = () => {
        if (data.onGenerate) {
            data.onGenerate(id, 'image-generate', { aspectRatio: selectedAspectRatio });
        }
    }

    const handleCopyImage = useCallback(async () => {
        if (!data.content || !navigator.clipboard.write) return;
        try {
            const response = await fetch(data.content);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob, }),
            ]);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy image: ', err);
        }
    }, [data.content]);

    const handleNameChange = (newName: string) => {
        data.onUpdate?.(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label: newName } } : n));
    };
    
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
                <div className="flex items-center text-gray-400 text-xs p-2.5 space-x-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0"></div>
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
                        <>
                            <span className="font-medium text-sm text-neutral-300 truncate" title={data.label}>{data.label}</span>
                            <button onClick={() => setIsRenaming(true)} className="text-neutral-500 hover:text-white transition-colors" title="Rename"><EditIcon /></button>
                        </>
                    )}
                </div>
                <div className="flex-grow min-h-0 bg-neutral-950/50 relative">
                     {data.loading && <NodeLoader />}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                    />
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
                                    alt="Node content"
                                    className="absolute top-0 left-0 w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center p-4 text-center">
                            <button onClick={handleUploadClick} className="flex flex-col items-center justify-center text-neutral-500 hover:text-white transition-colors p-4 space-y-2">
                               <UploadIcon />
                               <span className="text-xs font-medium mt-2">Upload Image</span>
                               <span className="text-xs text-neutral-600">or connect nodes &amp; generate</span>
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center justify-end p-2 border-t border-neutral-800/80 bg-neutral-900/50 rounded-b-xl space-y-2">
                    {hasIncomingConnection && (
                        <AspectRatioSelector selected={selectedAspectRatio} onSelect={setSelectedAspectRatio} />
                    )}
                    <div className="w-full flex items-center space-x-2">
                        {hasIncomingConnection && (
                            <button onClick={handleGenerate} title={data.content ? "Regenerate image using this as a base" : "Generate new image"} className="flex items-center justify-center flex-grow bg-neutral-200 hover:bg-white text-black text-sm font-bold py-2 px-3 rounded-md transition-colors">
                                {data.content ? <RegenerateIcon /> : <GenerateIcon />}
                                <span className="ml-2">{data.content ? "Regenerate" : "Generate"}</span>
                            </button>
                        )}
                        {data.content && (
                             <div className={`flex items-center justify-end space-x-1 ${!hasIncomingConnection ? 'w-full' : 'flex-shrink-0'}`}>
                                <button onClick={handleUploadClick} title="Replace Image" className="p-2 rounded-md text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors">
                                    <ReplaceIcon />
                                </button>
                                <button onClick={() => setIsCropModalOpen(true)} title="Crop Image" className="p-2 rounded-md text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors">
                                    <CropIcon />
                                </button>
                                 <button onClick={handleDownload} title="Download Image" className="p-2 rounded-md text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors">
                                    <DownloadIcon />
                                </button>
                                <button onClick={handleCopyImage} title="Copy Image" className="p-2 rounded-md text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors">
                                    {isCopied ? <CheckIcon/> : <CopyIcon />}
                                </button>
                            </div>
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