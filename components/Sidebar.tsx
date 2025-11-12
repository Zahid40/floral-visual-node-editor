
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
            className="flex items-center p-3 bg-neutral-900 rounded-lg border border-neutral-700/80 cursor-grab hover:bg-neutral-800 hover:border-neutral-700 transition-all duration-200"
            title={`Drag to add a ${label} node to the canvas`}
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
            return <svg xmlns="http://www.w3.org/2000/svg" className={baseClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
        case NodeType.TEXT:
            return <svg xmlns="http://www.w3.org/2000/svg" className={baseClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
        default:
            return null;
    }
};

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-neutral-950/30 border-r border-neutral-800 p-4 space-y-4 z-10 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-gray-400 px-2">Nodes</h2>
            <DraggableNode type={NodeType.IMAGE} label="Image" icon={<Icon type={NodeType.IMAGE}/>} />
            <DraggableNode type={NodeType.TEXT} label="Text Prompt" icon={<Icon type={NodeType.TEXT}/>} />
        </aside>
    );
};
