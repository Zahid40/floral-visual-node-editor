import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { NodeData, NodeType } from '../../types';
import { NodeIcon } from './NodeIcon';

export const MergeNode: React.FC<NodeProps<NodeData>> = ({ data, isConnectable }) => {
    return (
        <div className="w-64 md:w-72 bg-[#1C1C1C] border border-[#3A3A3A] rounded-lg shadow-2xl shadow-black/30">
            <Handle type="target" position={Position.Left} id="a" isConnectable={isConnectable} style={{ top: '35%' }} />
            <Handle type="target" position={Position.Left} id="b" isConnectable={isConnectable} style={{ top: '65%' }} />
            
            <div className="w-full h-full rounded-lg flex flex-col">
                 <div className="flex items-center text-gray-400 text-xs p-2 border-b border-[#3A3A3A] flex-shrink-0">
                    <NodeIcon type={NodeType.MERGE} className="mr-2 text-gray-500" />
                    <span className="font-medium">{data.label}</span>
                </div>
                 <div className="w-full h-32 bg-[#111111] flex items-center justify-center">
                    <span className="text-gray-400 font-bold text-3xl">
                        ⚙️
                    </span>
                </div>
            </div>

            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    );
};