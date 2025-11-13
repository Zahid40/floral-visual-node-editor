
import React, { useCallback } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { NodeData } from '../../types';

export const SeedNode: React.FC<NodeProps<NodeData>> = ({ id, data, isConnectable, selected }) => {

    const updateNodeData = useCallback((key: keyof NodeData, value: any) => {
        if (data.onUpdate) {
            data.onUpdate((nds) =>
                nds.map((node) =>
                    node.id === id ? { ...node, data: { ...node.data, [key]: value } } : node
                )
            );
        }
    }, [id, data]);

    return (
        <div className={`w-60 bg-neutral-900/80 backdrop-blur-md rounded-xl shadow-2xl shadow-black/40 border transition-all duration-300 relative ${selected ? 'border-vermilion-500/80 shadow-[0_0_20px_rgba(229,72,54,0.3)]' : 'border-neutral-700/50'}`}>
            <button
                onClick={() => data.onDelete && data.onDelete(id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-neutral-700 hover:bg-red-600 rounded-full text-white text-xs flex items-center justify-center cursor-pointer transition-all duration-200 leading-none opacity-50 hover:opacity-100 z-10"
                title="Delete Node"
            >
              &times;
            </button>
            <div className="w-full h-full rounded-xl flex flex-col p-3 space-y-3">
                <div className="flex items-center text-gray-400 text-xs">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mr-2"></div>
                    <span className="font-medium text-sm text-neutral-300">{data.label}</span>
                </div>
                <div className="space-y-3">
                    <div>
                        <label htmlFor={`seed-start-${id}`} className="block text-xs font-medium text-neutral-400 mb-1">Starting Seed</label>
                        <input
                            id={`seed-start-${id}`}
                            type="number"
                            value={data.seed ?? ''}
                            onChange={(e) => updateNodeData('seed', parseInt(e.target.value, 10))}
                            placeholder="e.g., 12345"
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-vermilion-500"
                        />
                    </div>
                    <div>
                         <label htmlFor={`num-images-${id}`} className="block text-xs font-medium text-neutral-400 mb-1">Number of Images (1-10)</label>
                        <input
                            id={`num-images-${id}`}
                            type="number"
                            value={data.numImages ?? ''}
                            onChange={(e) => updateNodeData('numImages', Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                            min="1"
                            max="10"
                            placeholder="e.g., 4"
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-vermilion-500"
                        />
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    );
};
