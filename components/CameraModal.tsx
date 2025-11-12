import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AspectRatio } from '../types';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (dataUrl: string) => void;
}

const CameraIconSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
);

const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;

const aspectRatioToNumber = (ratio: AspectRatio): number | undefined => {
    if (ratio === '1:1') return 1;
    const [w, h] = ratio.split(':').map(Number);
    if (!isNaN(w) && !isNaN(h) && h > 0) return w / h;
    return undefined;
};

const aspectRatioToPadding: Record<AspectRatio, string> = {
    '1:1': '100%',
    '16:9': '56.25%',
    '9:16': '177.78%',
    '4:3': '75%',
    '3:4': '133.33%',
};

const AspectRatioSelector: React.FC<{ selected: AspectRatio, onSelect: (ar: AspectRatio) => void }> = ({ selected, onSelect }) => {
    const ratios: AspectRatio[] = ['4:3', '16:9', '1:1', '9:16', '3:4'];
    return (
        <div className="bg-neutral-900 p-1 rounded-lg flex items-center justify-center space-x-1">
            {ratios.map(r => (
                <button
                    key={r}
                    onClick={() => onSelect(r)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${selected === r ? 'bg-neutral-300 text-black font-bold' : 'text-neutral-400 hover:bg-neutral-700'}`}
                    title={`Set aspect ratio to ${r}`}
                >
                    {r}
                </button>
            ))}
        </div>
    );
};

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
    const [aspect, setAspect] = useState<AspectRatio>('4:3');
    const [zoom, setZoom] = useState(1);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        const getDevices = async () => {
            try {
                // Dummy request to trigger permission prompt
                await navigator.mediaDevices.getUserMedia({ video: true });
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);
                if (videoDevices.length > 0 && !selectedDeviceId) {
                    setSelectedDeviceId(videoDevices[0].deviceId);
                }
            } catch (err) {
                 console.error("Error enumerating devices:", err);
                 if (err instanceof Error && err.name === 'NotAllowedError') {
                    setError("Camera permission denied. Please allow camera access in your browser settings.");
                } else {
                    setError("Could not access camera. Please ensure it's not being used by another application.");
                }
            }
        };

        if (isOpen) {
            getDevices();
        }
    }, [isOpen]);


    useEffect(() => {
        if (isOpen && selectedDeviceId) {
            stopCamera(); // Stop previous stream before starting a new one
            setError(null);
            
            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: { exact: selectedDeviceId },
                    aspectRatio: { ideal: aspectRatioToNumber(aspect) }
                }
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera:", err);
                    setError("Could not access the selected camera. It might be in use or disconnected.");
                });
        }

        return () => {
            if (!isOpen) {
                stopCamera();
            }
        };
    }, [isOpen, selectedDeviceId, aspect, stopCamera]);

    const handleCapture = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.readyState < video.HAVE_METADATA) return;

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const targetAR = aspectRatioToNumber(aspect) || 1;

        let sourceWidth = videoWidth / zoom;
        let sourceHeight = videoHeight / zoom;

        const sourceAR = sourceWidth / sourceHeight;
        if (sourceAR > targetAR) { // source is wider
            sourceWidth = sourceHeight * targetAR;
        } else { // source is taller
            sourceHeight = sourceWidth / targetAR;
        }

        const sourceX = (videoWidth - sourceWidth * zoom) / 2;
        const sourceY = (videoHeight - sourceHeight * zoom) / 2;
        
        const canvas = document.createElement('canvas');

        // Target a high-res output
        const outputWidth = targetAR >= 1 ? 1280 : Math.round(1280 * targetAR);
        const outputHeight = targetAR < 1 ? 1280 : Math.round(1280 / targetAR);
        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
             ctx.drawImage(
                video,
                sourceX,
                sourceY,
                sourceWidth * zoom,
                sourceHeight * zoom,
                0,
                0,
                outputWidth,
                outputHeight
            );
            const dataUrl = canvas.toDataURL('image/png');
            onCapture(dataUrl);
        }
        onClose();
    }, [zoom, aspect, onCapture, onClose]);
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[200] flex items-center justify-center p-4 sm:p-8" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true"
        >
            <div 
                className="w-full max-w-2xl bg-[#1C1C1C] border border-[#3A3A3A] rounded-lg shadow-2xl flex flex-col" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-[#3A3A3A]">
                    <h2 className="text-lg font-bold text-gray-200">Use Camera</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none" aria-label="Close modal">&times;</button>
                </div>

                <div className="p-2 sm:p-6 bg-black/50">
                    {error ? (
                        <div style={{ paddingTop: aspectRatioToPadding[aspect] }} className="w-full relative bg-neutral-900 rounded-md flex items-center justify-center text-center text-red-400 p-4">{error}</div>
                    ) : (
                         <div
                            className="w-full relative bg-neutral-900 rounded-md overflow-hidden"
                            style={{ paddingTop: aspectRatioToPadding[aspect] }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-200 ease-in-out"
                                style={{ transform: `scale(${zoom})` }}
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col space-y-4 p-4 border-t border-[#3A3A3A] bg-neutral-900/50 rounded-b-lg">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1">
                             <label htmlFor="camera-select" className="text-xs text-neutral-400 font-medium">Camera</label>
                             <select
                                id="camera-select"
                                value={selectedDeviceId}
                                onChange={e => setSelectedDeviceId(e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-vermilion-500"
                                disabled={devices.length === 0}
                            >
                                {devices.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${devices.indexOf(device) + 1}`}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col space-y-1">
                             <label className="text-xs text-neutral-400 font-medium">Aspect Ratio</label>
                             <AspectRatioSelector selected={aspect} onSelect={setAspect} />
                        </div>
                   </div>
                    <div className="flex flex-col space-y-1">
                        <label htmlFor="zoom-slider" className="text-xs text-neutral-400 font-medium">Zoom</label>
                        <div className="flex items-center space-x-2">
                             <ZoomOutIcon />
                             <input
                                id="zoom-slider"
                                type="range"
                                min="1"
                                max="5"
                                step="0.1"
                                value={zoom}
                                onChange={e => setZoom(parseFloat(e.target.value))}
                                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-vermilion-500"
                            />
                            <ZoomInIcon />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end p-4 border-t border-[#3A3A3A] bg-neutral-900/60 rounded-b-lg space-x-4">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2 bg-neutral-700 text-neutral-200 text-sm font-bold rounded-md hover:bg-neutral-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCapture}
                        disabled={!!error || !videoRef.current}
                        className="flex items-center space-x-2 px-5 py-2 bg-neutral-200 text-black text-sm font-bold rounded-md hover:bg-white transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
                    >
                        <CameraIconSvg />
                        <span>Take Picture</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
