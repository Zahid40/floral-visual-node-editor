import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { AspectRatio } from '../types';

interface ImageCropModalProps {
    src: string;
    initialAspectRatio: AspectRatio;
    onClose: () => void;
    onSave: (croppedImage: string, newAspectRatio: AspectRatio) => void;
}

const aspectRatioToNumber = (ratio: AspectRatio): number | undefined => {
    if (ratio === '1:1') return 1;
    const [w, h] = ratio.split(':').map(Number);
    if (!isNaN(w) && !isNaN(h) && h > 0) return w / h;
    return undefined;
};

const numberToAspectRatio = (num: number): AspectRatio => {
    if (num === 1) return '1:1';
    if (num > 1.7) return '16:9'; // 1.77
    if (num > 1.3) return '4:3'; // 1.33
    if (num < 0.6) return '9:16'; // 0.56
    if (num < 0.8) return '3:4'; // 0.75
    return '1:1';
}

const AspectRatioSelector: React.FC<{ selected: AspectRatio, onSelect: (ar: AspectRatio) => void }> = ({ selected, onSelect }) => {
    const ratios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    return (
        <div className="bg-neutral-900 p-1 rounded-lg flex items-center justify-center space-x-1">
            {ratios.map(r => (
                <button
                    key={r}
                    onClick={() => onSelect(r)}
                    className={`px-4 py-1.5 text-xs font-mono rounded-md transition-colors ${selected === r ? 'bg-neutral-300 text-black font-bold' : 'text-neutral-400 hover:bg-neutral-700'}`}
                >
                    {r}
                </button>
            ))}
        </div>
    );
};


export const ImageCropModal: React.FC<ImageCropModalProps> = ({ src, initialAspectRatio, onClose, onSave }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<AspectRatio>(initialAspectRatio);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const newCrop = centerCrop(
            makeAspectCrop(
                { unit: '%', width: 90 },
                aspectRatioToNumber(aspect)!,
                width,
                height,
            ),
            width,
            height,
        );
        setCrop(newCrop);
    }
    
    const handleSaveCrop = () => {
        const image = imgRef.current;
        if (!image || !completedCrop) {
            throw new Error('Crop details not available');
        }

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );
        
        const newAspectRatio = numberToAspectRatio(canvas.width / canvas.height);
        onSave(canvas.toDataURL('image/png'), newAspectRatio);
    };


    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[200] flex items-center justify-center p-4 sm:p-8"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-modal-title"
        >
            <div 
                className="w-full max-w-4xl bg-[#1C1C1C] border border-[#3A3A3A] rounded-lg shadow-2xl flex flex-col" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-[#3A3A3A]">
                    <h2 id="crop-modal-title" className="text-lg font-bold text-gray-200">Crop Image</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none" aria-label="Close modal">&times;</button>
                </div>
                
                <div className="p-6 flex-grow min-h-0 text-center bg-black/50">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspectRatioToNumber(aspect)}
                        className="max-h-[60vh]"
                    >
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={src}
                            onLoad={onImageLoad}
                            className="max-h-[60vh] object-contain mx-auto"
                        />
                    </ReactCrop>
                </div>

                <div className="flex items-center justify-between p-4 border-t border-[#3A3A3A] bg-neutral-900/50 rounded-b-lg">
                    <AspectRatioSelector selected={aspect} onSelect={setAspect} />
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={onClose}
                            className="px-5 py-2 bg-neutral-700 text-neutral-200 text-sm font-bold rounded-md hover:bg-neutral-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveCrop}
                            className="px-5 py-2 bg-neutral-200 text-black text-sm font-bold rounded-md hover:bg-white transition-colors"
                        >
                            Save Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
