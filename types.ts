import { Node } from "reactflow";

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export enum NodeType {
    IMAGE = 'imageNode',
    TEXT = 'textNode',
    // FIX: Add OUTPUT node type to resolve type errors in OutputNode and TextNode.
    OUTPUT = 'outputNode',
}

// FIX: Add 'output' to support generation requests from OutputNode.
export type GenerationRequestType = 'image-generate' | 'prompt-from-image' | 'output';

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
    onUpdate?: React.Dispatch<React.SetStateAction<Node<NodeData, string | undefined>[]>>;
    onGenerate?: (nodeId: string, type: GenerationRequestType, options?: any) => void;
}