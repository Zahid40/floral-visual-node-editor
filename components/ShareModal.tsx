
import React, { useState, useEffect } from 'react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    workflowJson: string;
    onImport: (json: string) => void;
}

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M20 6L9 17l-5-5"/></svg>
);


export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, workflowJson, onImport }) => {
    const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
    const [importJson, setImportJson] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('export'); // Default to export tab when opened
        } else {
            setImportJson('');
            setImportError(null);
            setIsCopied(false);
        }
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(workflowJson).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleImportClick = () => {
        setImportError(null);
        if (!importJson.trim()) {
            setImportError('Please paste a workflow to import.');
            return;
        }
        try {
            JSON.parse(importJson); // Test if it's valid JSON
            onImport(importJson);
        } catch (error) {
            setImportError('Invalid workflow format. Please check the JSON and try again.');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
            <div className="w-full max-w-2xl bg-[#1C1C1C] border border-[#3A3A3A] rounded-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[#3A3A3A]">
                    <h2 id="share-modal-title" className="text-lg font-bold text-gray-200">Share Workflow</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none" aria-label="Close modal">&times;</button>
                </div>

                <div className="p-4 border-b border-[#3A3A3A]">
                    <div className="flex bg-[#111] rounded-lg p-1" role="tablist">
                        <button onClick={() => setActiveTab('export')} className={`w-1/2 py-2 text-sm font-medium rounded-md ${activeTab === 'export' ? 'bg-[#333] text-white' : 'text-gray-400'}`} role="tab" aria-selected={activeTab === 'export'}>Export</button>
                        <button onClick={() => setActiveTab('import')} className={`w-1/2 py-2 text-sm font-medium rounded-md ${activeTab === 'import' ? 'bg-[#333] text-white' : 'text-gray-400'}`} role="tab" aria-selected={activeTab === 'import'}>Import</button>
                    </div>
                </div>

                <div className="p-6 flex-grow min-h-0">
                    {activeTab === 'export' ? (
                        <div className="flex flex-col h-[400px]" role="tabpanel">
                            <p className="text-sm text-gray-400 mb-2">Copy this code to share your current node workflow.</p>
                            <div className="relative flex-grow">
                                <label htmlFor="export-textarea" className="sr-only">Workflow JSON</label>
                                <textarea
                                    id="export-textarea"
                                    readOnly
                                    value={workflowJson}
                                    className="w-full h-full bg-[#111111] text-gray-300 text-xs p-3 resize-none focus:outline-none placeholder-gray-600 rounded-md font-mono"
                                ></textarea>
                                <button onClick={handleCopy} className="absolute top-2 right-2 p-2 rounded-md text-gray-400 bg-[#333]/50 hover:bg-[#444] hover:text-white transition-colors" aria-label="Copy workflow to clipboard">
                                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-[400px]" role="tabpanel">
                             <p className="text-sm text-gray-400 mb-2">Paste a workflow code here to load it onto your canvas.</p>
                             <label htmlFor="import-textarea" className="sr-only">Paste Workflow JSON</label>
                             <textarea
                                id="import-textarea"
                                value={importJson}
                                onChange={(e) => setImportJson(e.target.value)}
                                placeholder='{"nodes": [...], "edges": [...] }'
                                className="w-full flex-grow bg-[#111111] text-gray-300 text-sm p-3 resize-none focus:outline-none placeholder-gray-600 rounded-md font-mono"
                                aria-invalid={!!importError}
                                aria-describedby="import-error"
                            ></textarea>
                            {importError && <p id="import-error" className="text-red-400 text-xs mt-2">{importError}</p>}
                             <button onClick={handleImportClick} className="mt-4 w-full bg-gray-200 hover:bg-white text-black text-sm font-bold py-2 px-4 rounded-md transition-colors">
                                Load Workflow
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
