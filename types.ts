
import React from 'react';
import { Node } from "reactflow";

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export enum NodeType {
    IMAGE = 'imageNode',
    TEXT = 'textNode',
    GROUP = 'groupNode',
}

export type GenerationRequestType = 'image-generate' | 'prompt-from-image' | 'output' | 'enhance-prompt';

export interface GenerationRequest {
    nodeId: string;
    type: GenerationRequestType;
    options?: any;
}

export interface NodeData {
    label: string;
    content?: string | null;
    mimeType?: string | null;
    aspectRatio?: AspectRatio;
    loading?: boolean;
    onUpdate?: React.Dispatch<React.SetStateAction<Node<NodeData, string | undefined>[]>>;
    onGenerate?: (nodeId: string, type: GenerationRequestType, options?: any) => void;
    onPreview?: (src: string) => void;
    onDelete?: (nodeId: string) => void;
    onUngroup?: (nodeId: string) => void;
}