import React from 'react';
import { NodeType } from '../types';

const DraggableNode: React.FC<{ type: NodeType, label: string, icon: React.ReactNode }> = ({ type, label, icon }) => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            onDragStart={(event) => onDragStart(event, type)}
            draggable
            className="flex items-center p-3 bg-[#1C1C1C] rounded-lg border border-[#3A3A3A] cursor-grab hover:bg-[#2d2d2d] transition-all duration-200"
        >
            <div className="text-gray-300">{icon}</div>
            <span className="ml-3 font-medium text-sm text-gray-300">{label}</span>
        </div>
    );
};

const Icon: React.FC<{ type: NodeType }> = ({ type }) => {
    const baseClasses = "w-6 h-6";
    switch (type) {
        case NodeType.IMAGE:
            return <svg xmlns="http://www.w3.org/2000/svg" className={baseClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
        case NodeType.TEXT:
            return <svg xmlns="http://www.w3.org/2000/svg" className={baseClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
        default:
            return null;
    }
};

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-black/50 border-r border-[#3A3A3A]/50 p-4 space-y-4 z-10">
            <h2 className="text-lg font-semibold text-gray-400 px-2">Nodes</h2>
            <DraggableNode type={NodeType.IMAGE} label="Image" icon={<Icon type={NodeType.IMAGE}/>} />
            <DraggableNode type={NodeType.TEXT} label="Text Prompt" icon={<Icon type={NodeType.TEXT}/>} />
        </aside>
    );
};