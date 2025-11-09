
import React from 'react';
import { useReactFlow } from 'reactflow';

const ZoomInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);
const ZoomOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);
const FitViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
);
const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const UnlockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
);

const GroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4 2"></rect>
        <rect x="8" y="8" width="3" height="3" rx="1"></rect>
        <rect x="13" y="13" width="3" height="3" rx="1"></rect>
    </svg>
);

interface ControlsProps {
    isLocked: boolean;
    onLockToggle: () => void;
    onGroup: () => void;
    selectedNodesCount: number;
}

export const Controls: React.FC<ControlsProps> = ({ isLocked, onLockToggle, onGroup, selectedNodesCount }) => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    const controlButtonClass = "p-3 text-neutral-400 hover:text-white transition-colors w-full";
    const groupButtonShouldBeShown = selectedNodesCount >= 2;

    return (
        <div className="absolute top-1/2 -translate-y-1/2 right-5 z-10 bg-[#1C1C1C]/80 backdrop-blur-md border border-neutral-700/50 rounded-lg flex flex-col items-center shadow-lg">
            <button onClick={() => zoomIn({ duration: 300 })} className={`${controlButtonClass} border-b border-neutral-700/50`} title="Zoom In"><ZoomInIcon /></button>
            <button onClick={() => zoomOut({ duration: 300 })} className={`${controlButtonClass} border-b border-neutral-700/50`} title="Zoom Out"><ZoomOutIcon /></button>
            <button onClick={() => fitView({ duration: 300 })} className={`${controlButtonClass} ${groupButtonShouldBeShown ? '' : 'border-b border-neutral-700/50'}`} title="Fit View"><FitViewIcon /></button>
            {groupButtonShouldBeShown && (
                 <button onClick={onGroup} className={`${controlButtonClass} border-b border-neutral-700/50`} title="Group Selected Nodes"><GroupIcon /></button>
            )}
            <button onClick={onLockToggle} className={controlButtonClass} title={isLocked ? "Unlock Canvas" : "Lock Canvas"}>
                {isLocked ? <LockIcon /> : <UnlockIcon />}
            </button>
        </div>
    );
};