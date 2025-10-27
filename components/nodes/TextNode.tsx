import React, { useCallback, useState } from 'react';
import { NodeProps } from 'reactflow';
import { CustomNode } from './CustomNode';
import { NodeData, NodeType } from '../../types';
import { enhancePrompt } from '../../services/geminiService';

const EnhanceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.75L15.3536 6.10355L21.25 4.75L19.8964 10.6464L23.25 14L18.8964 15.3536L19.25 21.25L13.3536 19.8964L10 23.25L8.64645 17.3536L2.75 19.25L4.10355 13.3536L0.75 10L6.10355 8.64645L4.75 2.75L10.6464 4.10355L12 2.75Z" /></svg>
);

export const TextNode: React.FC<NodeProps<NodeData>> = ({ id, data, isConnectable }) => {
    const [isEnhancing, setIsEnhancing] = useState(false);

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
        if (!data.content || !data.onUpdate) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhancePrompt(data.content);
            if (enhanced) {
                data.onUpdate((nds) =>
                    nds.map((node) =>
                        node.id === id ? { ...node, data: { ...node.data, content: enhanced } } : node
                    )
                );
            }
        } catch (error) {
            console.error("Failed to enhance prompt:", error);
        } finally {
            setIsEnhancing(false);
        }
    }, [id, data]);

    return (
        <CustomNode type={NodeType.TEXT} label={data.label} isConnectable={isConnectable}>
            <div className="w-full h-40 bg-[#111111] flex flex-col">
                <textarea
                    value={data.content || ''}
                    onChange={onChange}
                    placeholder="Describe your vision..."
                    className="w-full flex-grow bg-transparent text-gray-300 text-sm p-2 resize-none focus:outline-none placeholder-gray-600"
                />
                <div className="flex justify-end p-2 border-t border-[#3A3A3A] bg-[#1C1C1C]/50">
                     <button
                        onClick={handleEnhance}
                        disabled={isEnhancing || !data.content}
                        className="flex items-center text-xs font-semibold text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                        title="Enhance prompt with AI"
                    >
                         {isEnhancing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Enhancing...
                            </>
                         ) : (
                            <>
                                <EnhanceIcon />
                                <span className="ml-1.5">Enhance Prompt</span>
                            </>
                         )}
                    </button>
                </div>
            </div>
        </CustomNode>
    );
};
