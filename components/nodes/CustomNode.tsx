import React, { ReactNode } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeType } from '../../types';
import { NodeIcon } from './NodeIcon';

interface CustomNodeProps {
    children: ReactNode;
    type: NodeType;
    label: string;
    isConnectable: boolean;
}

export const CustomNode: React.FC<CustomNodeProps> = ({ children, type, label, isConnectable }) => {
    const hasSource = type !== NodeType.OUTPUT;
    const hasTarget = type !== NodeType.IMAGE && type !== NodeType.TEXT;

    return (
        <div className="w-64 md:w-72 bg-[#1C1C1C] border border-[#3A3A3A] rounded-lg shadow-2xl shadow-black/30">
            {hasTarget && <Handle type="target" position={Position.Left} isConnectable={isConnectable} />}
            <div className="w-full h-full rounded-lg flex flex-col">
                <div className="flex items-center text-gray-400 text-xs p-2 border-b border-[#3A3A3A] flex-shrink-0">
                    <NodeIcon type={type} className="mr-2 text-gray-500" />
                    <span className="font-medium">{label}</span>
                </div>
                <div className="flex-grow min-h-0">
                    {children}
                </div>
            </div>
            {hasSource && <Handle type="source" position={Position.Right} isConnectable={isConnectable} />}
        </div>
    );
};