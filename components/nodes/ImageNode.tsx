import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import { NodeProps, Handle, Position, useEdges } from 'reactflow';
import { NodeData, NodeType, AspectRatio } from '../../types';
import { fileToBase64 } from '../../services/geminiService';
import { NodeIcon } from './NodeIcon';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

const ReplaceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);

const GenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.75L15.3536 6.10355L21.25 4.75L19.8964 10.6464L23.25 14L18.8964 15.3536L19.25 21.25L13.3536 19.8964L10 23.25L8.64645 17.3536L2.75 19.25L4.10355 13.3536L0.75 10L6.10355 8.64645L4.75 2.75L10.6464 4.10355L12 2.75Z" /></svg>
);

const RegenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const AspectRatioSelector: React.FC<{ selected: AspectRatio, onSelect: (ar: AspectRatio) => void }> = ({ selected, onSelect }) => {
    const ratios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    return (
        <div className="bg-[#111111] p-1 rounded-md flex items-center justify-center space-x-1">
            {ratios.map(r => (
                <button
                    key={r}
                    onClick={() => onSelect(r)}
                    className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${selected === r ? 'bg-gray-200 text-black font-bold' : 'text-gray-400 hover:bg-[#333]'}`}
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


export const ImageNode: React.FC<NodeProps<NodeData>> = ({ id, data, isConnectable }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const edges = useEdges();
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(data.aspectRatio || '1:1');
    const [isCopied, setIsCopied] = useState(false);
    const hasIncomingConnection = useMemo(() => edges.some(edge => edge.target === id), [edges, id]);

    useEffect(() => {
        if (data.aspectRatio) {
            setSelectedAspectRatio(data.aspectRatio);
        }
    }, [data.aspectRatio]);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && data.onUpdate) {
            try {
                const { dataUrl } = await fileToBase64(file);
                 data.onUpdate((nds) =>
                    nds.map((node) =>
                        node.id === id ? { ...node, data: { ...node.data, content: dataUrl, mimeType: file.type } } : node
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
    
    return (
         <div className="w-96 bg-[#1C1C1C] border border-[#3A3A3A] rounded-lg shadow-2xl shadow-black/30">
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
            <div className="w-full h-full rounded-lg flex flex-col">
                <div className="flex items-center text-gray-400 text-xs p-2 border-b border-[#3A3A3A] flex-shrink-0">
                    <NodeIcon type={NodeType.IMAGE} className="mr-2 text-gray-500" />
                    <span className="font-medium">{data.label}</span>
                </div>
                <div className="flex-grow min-h-0 bg-[#111111]">
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
                                className="relative w-full bg-black rounded-md"
                                style={{ paddingTop: aspectRatioToPadding[data.aspectRatio || '1:1'] }}
                            >
                                <img
                                    src={data.content}
                                    alt="Node content"
                                    className="absolute top-0 left-0 w-full h-full object-contain"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center p-4 text-center">
                            <button onClick={handleUploadClick} className="flex flex-col items-center justify-center text-gray-500 hover:text-white transition-colors p-4 space-y-2">
                               <UploadIcon />
                               <span className="text-xs font-medium">Upload Image</span>
                               <span className="text-xs text-gray-600">or connect nodes and click Generate</span>
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center justify-end p-2 border-t border-[#3A3A3A] bg-[#1C1C1C]/50 space-y-2">
                    {hasIncomingConnection && (
                        <AspectRatioSelector selected={selectedAspectRatio} onSelect={setSelectedAspectRatio} />
                    )}
                    <div className="w-full flex items-center space-x-2">
                        {hasIncomingConnection && (
                            <button onClick={handleGenerate} title={data.content ? "Regenerate image using this as a base" : "Generate new image"} className="flex items-center justify-center flex-grow bg-gray-200 hover:bg-white text-black text-sm font-bold py-2 px-3 rounded-md transition-colors">
                                {data.content ? <RegenerateIcon /> : <GenerateIcon />}
                                <span className="ml-2">{data.content ? "Regenerate" : "Generate"}</span>
                            </button>
                        )}
                        {data.content && (
                             <div className={`flex items-center justify-end space-x-1 ${!hasIncomingConnection ? 'w-full' : 'flex-shrink-0'}`}>
                                <button onClick={handleUploadClick} title="Replace Image" className="p-2 rounded-md text-gray-400 hover:bg-[#333] hover:text-white transition-colors">
                                    <ReplaceIcon />
                                </button>
                                 <button onClick={handleDownload} title="Download Image" className="p-2 rounded-md text-gray-400 hover:bg-[#333] hover:text-white transition-colors">
                                    <DownloadIcon />
                                </button>
                                <button onClick={handleCopyImage} title="Copy Image" className="p-2 rounded-md text-gray-400 hover:bg-[#333] hover:text-white transition-colors">
                                    {isCopied ? <CheckIcon/> : <CopyIcon />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    );
};