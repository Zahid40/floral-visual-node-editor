import { Node } from "reactflow";

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export enum NodeType {
    IMAGE = 'imageNode',
    TEXT = 'textNode',
    MERGE = 'mergeNode',
    OUTPUT = 'outputNode',
}

export interface NodeData {
    label: string;
    content?: string | null;
    mimeType?: string | null;
    aspectRatio?: AspectRatio;
    onUpdate?: React.Dispatch<React.SetStateAction<Node<NodeData, string | undefined>[]>>;
    onGenerate?: (nodeId: string, aspectRatio: AspectRatio) => void;
}
