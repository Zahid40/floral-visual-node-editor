
import React, { useState, useEffect, useRef } from 'react';
import { NodeProps } from 'reactflow';
import { NodeData } from '../../types';

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);

const UngroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16l6-6-6-6M8 8l-6 6 6 6M15 22H9M15 2H9"/></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);


export const GroupNode: React.FC<NodeProps<NodeData>> = ({ id, data, selected }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isRenaming]);

    const handleNameChange = (newName: string) => {
        data.onUpdate?.(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label: newName } } : n));
    };

    return (
        <div 
            className={`
                rounded-xl shadow-2xl shadow-black/40 border-2 transition-all duration-300
                ${selected ? 'border-vermilion-500/80' : 'border-neutral-700/50 border-dashed'}
                bg-neutral-800/10
            `}
            style={{ width: '100%', height: '100%' }}
        >
            <div className="absolute -top-10 left-0 w-full flex items-center p-1">
                <div className="flex items-center bg-neutral-900/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-neutral-700/50">
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
                            <span className="font-bold text-sm text-neutral-300 truncate" title={data.label}>{data.label}</span>
                            <button onClick={() => setIsRenaming(true)} className="ml-2 text-neutral-500 hover:text-white transition-colors" title="Rename Group"><EditIcon /></button>
                        </>
                    )}
                    <div className="w-px h-4 bg-neutral-700 mx-2"></div>
                    <button 
                        onClick={() => data.onUngroup?.(id)}
                        className="text-neutral-500 hover:text-white transition-colors"
                        title="Ungroup"
                    >
                       <UngroupIcon />
                    </button>
                    <button
                        onClick={() => data.onDelete?.(id)}
                        className="ml-2 text-neutral-500 hover:text-red-500 transition-colors"
                        title="Delete Group and Contents"
                    >
                      <TrashIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};