import React, { useCallback, useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { CustomNode } from './CustomNode';
import { NodeData, NodeType, AspectRatio } from '../../types';
import { NodeIcon } from './NodeIcon';

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

const RegenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
);

const AspectRatioSelector: React.FC<{ selected: AspectRatio, onSelect: (ar: AspectRatio) => void }> = ({ selected, onSelect }) => {
    const ratios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    return (
        <div className="p-2">
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
        </div>
    );
};

export const OutputNode: React.FC<NodeProps<NodeData>> = ({ id, data, isConnectable }) => {
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(data.aspectRatio || '1:1');
    
    const handleGenerateClick = () => {
        if (data.onGenerate) {
            data.onGenerate(id, selectedAspectRatio);
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

    return (
        <div className="w-auto max-w-xs md:max-w-sm bg-[#1C1C1C] border border-[#3A3A3A] rounded-lg shadow-2xl shadow-black/30">
            <Handle type="target" position={Position.Left} id="a" isConnectable={isConnectable} style={{ top: '35%' }} />
            <Handle type="target" position={Position.Left} id="b" isConnectable={isConnectable} style={{ top: '65%' }} />
            
            <div className="w-full h-full rounded-lg flex flex-col">
                <div className="flex items-center text-gray-400 text-xs p-2 border-b border-[#3A3A3A] flex-shrink-0">
                    <NodeIcon type={NodeType.OUTPUT} className="mr-2 text-gray-500" />
                    <span className="font-medium">{data.label}</span>
                </div>
                <div className="flex-grow min-h-0">
                     <div className="bg-[#111111] flex flex-col">
                        {data.content ? (
                            <>
                                <div className="p-2">
                                    <img src={data.content} alt="Output" className="w-full h-auto object-contain rounded-md" />
                                </div>
                                <div className="flex items-center justify-end space-x-2 p-2 border-t border-[#3A3A3A] bg-[#1C1C1C]/50">
                                    <button onClick={handleGenerateClick} title="Regenerate" className="p-2 rounded-md text-gray-400 hover:bg-[#333] hover:text-white transition-colors">
                                        <RegenerateIcon />
                                    </button>
                                     <button onClick={handleDownload} title="Download Image" className="p-2 rounded-md text-gray-400 hover:bg-[#333] hover:text-white transition-colors">
                                        <DownloadIcon />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-2 space-y-2">
                                <AspectRatioSelector selected={selectedAspectRatio} onSelect={setSelectedAspectRatio} />
                                <button 
                                    onClick={handleGenerateClick}
                                    className="w-full bg-gray-200 hover:bg-white text-black text-sm font-bold py-2 px-4 rounded-md transition-colors"
                                >
                                    Generate
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