
import React from 'react';
import { NodeType } from '../../types';

export const NodeIcon: React.FC<{ type: NodeType, className?: string }> = ({ type, className }) => {
    const baseClasses = `w-4 h-4 ${className || ''}`;
    switch (type) {
        case NodeType.IMAGE:
            return <svg xmlns="http://www.w3.org/2000/svg" className={baseClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
        case NodeType.TEXT:
            return <svg xmlns="http://www.w3.org/2000/svg" className={baseClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
        default:
            return null;
    }
};