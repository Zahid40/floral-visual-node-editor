
import React from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageModel: string;
    onImageModelChange: (model: string) => void;
    videoModel: string;
    onVideoModelChange: (model: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    imageModel, 
    onImageModelChange,
    videoModel,
    onVideoModelChange
}) => {
    if (!isOpen) return null;

    const imageModels = [
        { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (Fastest, Multimodal)' },
        { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (High Quality, Paid)' },
        { id: 'imagen-4.0-generate-001', name: 'Imagen 3 (Photorealistic, Text-to-Image)' },
    ];

    const videoModels = [
        { id: 'veo-3.1-fast-generate-preview', name: 'Veo Fast (Faster generation)' },
        { id: 'veo-3.1-generate-preview', name: 'Veo (Higher quality)' },
    ];

    const ensureApiKey = async () => {
        if ((window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                // If checking fails, prompt the user.
                await (window as any).aistudio.openSelectKey();
                // We re-check after the prompt. If they closed it without selecting, this should still be false.
                const hasKeyAfter = await (window as any).aistudio.hasSelectedApiKey();
                if (!hasKeyAfter) {
                    throw new Error("API Key selection required for this model.");
                }
            }
            return true;
        }
        return false;
    };

    const handleImageModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newModel = e.target.value;
        // Paid models require API key check
        if (newModel === 'gemini-3-pro-image-preview') {
            try {
                await ensureApiKey();
            } catch (err) {
                console.warn("User cancelled API key selection or failed.");
                // Do not change the model if key selection failed
                return;
            }
        }
        onImageModelChange(newModel);
    };

    const handleVideoModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newModel = e.target.value;
        // All Veo models are paid and require key
        try {
            await ensureApiKey();
        } catch (err) {
             console.warn("User cancelled API key selection or failed.");
             return;
        }
        onVideoModelChange(newModel);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-md bg-[#1C1C1C] border border-[#3A3A3A] rounded-lg shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-200">Settings</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none" aria-label="Close settings">&times;</button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Image Generation Model</label>
                        <select 
                            value={imageModel}
                            onChange={handleImageModelChange}
                            className="w-full bg-[#111] border border-[#333] rounded-md p-2.5 text-sm text-gray-200 focus:outline-none focus:border-vermilion-500 transition-colors"
                        >
                            {imageModels.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        {imageModel === 'gemini-3-pro-image-preview' && (
                            <p className="text-xs text-yellow-500/80 mt-2">
                                * Requires a paid API key with billing enabled.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Video Generation Model</label>
                         <select 
                            value={videoModel}
                            onChange={handleVideoModelChange}
                            className="w-full bg-[#111] border border-[#333] rounded-md p-2.5 text-sm text-gray-200 focus:outline-none focus:border-vermilion-500 transition-colors"
                        >
                            {videoModels.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                         <p className="text-xs text-yellow-500/80 mt-2">
                            * Veo models require a paid API key with billing enabled.
                        </p>
                    </div>

                    <div className="pt-2 border-t border-[#333]">
                         <p className="text-xs text-gray-500">
                             Need a key? <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">View Billing Docs</a>
                         </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-neutral-200 hover:bg-white text-black text-sm font-bold rounded-md transition-colors">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
