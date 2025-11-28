
import React, { useState, useRef, useEffect } from 'react';

const ZoomInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);
const ZoomOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);
const ResetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6M21 12A9 9 0 0 0 6 5.3L3 8M21 22v-6h-6M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>
);


interface ImagePreviewModalProps {
    src: string;
    onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ src, onClose }) => {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const updateZoom = (amount: number) => {
        setZoom(prevZoom => {
            const newZoom = Math.max(0.5, Math.min(5, prevZoom + amount));
            if (newZoom <= 1) {
                setPosition({ x: 0, y: 0 });
            }
            return newZoom;
        });
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        updateZoom(e.deltaY * -0.01);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            e.preventDefault();
            panStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
            setIsPanning(true);
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - panStart.current.x;
            const dy = e.clientY - panStart.current.y;
            setPosition({
                x: panStart.current.posX + dx,
                y: panStart.current.posY + dy,
            });
        }
    };

    const handleMouseUpOrLeave = () => {
        setIsPanning(false);
    };

    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const getCursor = () => {
        if (isPanning) return 'grabbing';
        if (zoom > 1) return 'grab';
        return 'default';
    }

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[200] flex items-center justify-center p-4 sm:p-8" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true"
        >
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white text-4xl leading-none hover:text-gray-300 transition-colors z-20"
                aria-label="Close image preview"
            >
                &times;
            </button>

            <div 
                ref={imageContainerRef}
                className="relative w-full h-full overflow-hidden flex items-center justify-center" 
                onClick={(e) => e.stopPropagation()}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
            >
                <img 
                    src={src} 
                    alt="Image Preview" 
                    className="block max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black/50"
                    style={{ 
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        cursor: getCursor(),
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                    }}
                />
            </div>
            
            <div 
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-neutral-900/70 backdrop-blur-md border border-neutral-700 rounded-lg flex items-center shadow-lg p-1"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={() => updateZoom(-0.2)} className="p-2 text-neutral-300 hover:text-white transition-colors" title="Zoom Out"><ZoomOutIcon /></button>
                <button onClick={handleReset} className="p-2 text-neutral-300 hover:text-white transition-colors" title="Reset Zoom"><ResetIcon /></button>
                <button onClick={() => updateZoom(0.2)} className="p-2 text-neutral-300 hover:text-white transition-colors" title="Zoom In"><ZoomInIcon /></button>
            </div>
        </div>
    );
};
