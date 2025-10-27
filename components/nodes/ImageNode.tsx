import React, { useCallback, useRef } from 'react';
import { NodeProps } from 'reactflow';
import { CustomNode } from './CustomNode';
import { NodeData, NodeType } from '../../types';
import { fileToBase64 } from '../../services/geminiService';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

const ReplaceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);

export const ImageNode: React.FC<NodeProps<NodeData>> = ({ id, data, isConnectable }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && data.onUpdate) {
            try {
                const { base64, dataUrl } = await fileToBase64(file);
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
    
    return (
        <CustomNode type={NodeType.IMAGE} label={data.label} isConnectable={isConnectable}>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
            />
            <div className="bg-[#111111] flex flex-col">
                {data.content ? (
                    <>
                        <div className="p-2">
                           <img src={data.content} alt="Input" className="w-full h-auto object-contain rounded-md" />
                        </div>
                        <div className="flex items-center justify-end space-x-2 p-2 border-t border-[#3A3A3A] bg-[#1C1C1C]/50">
                            <button onClick={handleUploadClick} title="Replace Image" className="p-2 rounded-md text-gray-400 hover:bg-[#333] hover:text-white transition-colors">
                                <ReplaceIcon />
                            </button>
                             <button onClick={handleDownload} title="Download Image" className="p-2 rounded-md text-gray-400 hover:bg-[#333] hover:text-white transition-colors">
                                <DownloadIcon />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="h-40 flex items-center justify-center">
                        <button onClick={handleUploadClick} className="flex flex-col items-center justify-center text-gray-500 hover:text-white transition-colors p-4 space-y-2">
                           <UploadIcon />
                           <span className="text-xs font-medium">Upload Image</span>
                        </button>
                    </div>
                )}
            </div>
        </CustomNode>
    );
};
