
import React, { useCallback, useState, useMemo } from 'react';
import { NodeProps, Handle, Position, useNodes, useEdges } from 'reactflow';
import { NodeData, NodeType } from '../../types';

const EnhanceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
);

const GeneratePromptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M20 6L9 17l-5-5"/></svg>
);


export const TextNode: React.FC<NodeProps<NodeData>> = ({ id, data, isConnectable, selected }) => {
    const [isCopied, setIsCopied] = useState(false);
    const nodes = useNodes<NodeData>();
    const edges = useEdges();

    const hasImageInput = useMemo(() => {
        return edges.some(edge => {
            if (edge.target !== id) return false;
            const sourceNode = nodes.find(n => n.id === edge.source);
            return sourceNode?.type === NodeType.IMAGE || sourceNode?.type === NodeType.OUTPUT;
        });
    }, [id, edges, nodes]);

    const onChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (data.onUpdate) {
            data.onUpdate((nds) =>
                nds.map((node) =>
                    node.id === id ? { ...node, data: { ...node.data, content: evt.target.value } } : node
                )
            );
        }
    }, [id, data]);

    const handleEnhance = useCallback(async () => {
        if (!data.content || !data.onGenerate) return;
        data.onGenerate(id, 'enhance-prompt');
    }, [id, data]);

     const handleGeneratePrompt = useCallback(() => {
        if (data.onGenerate) {
            data.onGenerate(id, 'prompt-from-image');
        }
    }, [id, data]);

    const handleCopyText = useCallback(async () => {
        if (!data.content) return;
        try {
            await navigator.clipboard.writeText(data.content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }, [data.content]);

    return (
        <div className={`w-72 bg-neutral-900/80 backdrop-blur-md rounded-xl shadow-2xl shadow-black/40 border transition-all duration-300 relative ${selected ? 'border-vermilion-500/80 shadow-[0_0_20px_rgba(229,72,54,0.3)]' : 'border-neutral-700/50'}`}>
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
                    <div className={`w-2 h-2 rounded-full mr-2 ${data.label.toLowerCase().includes('negative') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="font-medium text-sm text-neutral-300">{data.label}</span>
                </div>
                <div className="w-full h-40 bg-neutral-950/50 flex flex-col">
                    <textarea
                        value={data.content || ''}
                        onChange={onChange}
                        placeholder="Type what you want to get..."
                        className="w-full flex-grow bg-transparent text-neutral-300 text-sm p-3 resize-none focus:outline-none placeholder-neutral-600"
                    />
                    <div className="flex justify-between items-center p-2 border-t border-neutral-800/80 bg-neutral-900/50 rounded-b-xl">
                        <button
                            onClick={handleCopyText}
                            disabled={!data.content}
                            className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-700 hover:text-white disabled:text-neutral-700 disabled:cursor-not-allowed transition-colors"
                            title="Copy Prompt"
                        >
                           {isCopied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                        <div className="flex items-center space-x-4">
                            {hasImageInput && (
                                <button
                                    onClick={handleGeneratePrompt}
                                    className="flex items-center text-xs font-semibold text-neutral-300 hover:text-white disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors"
                                    title="Generate prompt from connected image"
                                >
                                    <GeneratePromptIcon />
                                    <span className="ml-1.5">From Image</span>
                                </button>
                            )}
                            <button
                                onClick={handleEnhance}
                                disabled={data.loading || !data.content}
                                className="flex items-center text-xs font-semibold text-neutral-300 hover:text-white disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors"
                                title="Enhance prompt with AI"
                            >
                                {data.loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Enhancing...
                                    </>
                                ) : (
                                    <>
                                        <EnhanceIcon />
                                        <span className="ml-1.5">Enhance</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    );
};
