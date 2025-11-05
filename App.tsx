
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Background,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  MiniMap,
} from 'reactflow';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ShareModal } from './components/ShareModal';
import { GallerySheet } from './components/GallerySheet';
import { Controls } from './components/Controls';
import { generateFromNodes, generatePromptFromImage, fileToBase64, enhancePrompt } from './services/geminiService';
import { NodeData, NodeType, GenerationRequest, GenerationRequestType, AspectRatio } from './types';
import { ImageNode } from './components/nodes/ImageNode';
import { TextNode } from './components/nodes/TextNode';
import { CustomEdge } from './components/edges/CustomEdge';

let id = 0;
const setIdCounter = (newId: number) => { id = newId; };
const getId = () => `dnd-node_${id++}`;

type FlowState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
};

interface ImagePreviewModalProps {
    src: string;
    onClose: () => void;
}

const findUpstreamNodes = (startNodeId: string, allNodes: Node<NodeData>[], allEdges: Edge[], includeSelf: boolean = false): { images: Node<NodeData>[], texts: Node<NodeData>[] } => {
  const collectedImageNodes: Node<NodeData>[] = [];
  const collectedTextNodes: Node<NodeData>[] = [];
  const collectedIds = new Set<string>();

  const nodesMap = Object.fromEntries(allNodes.map(node => [node.id, node]));
  const visited = new Set<string>();
  const queue: string[] = [startNodeId];

  if (includeSelf) {
    const startNode = nodesMap[startNodeId];
    if (startNode && startNode.type === NodeType.IMAGE && startNode.data.content) {
      const base64Content = startNode.data.content.split(',')[1] || startNode.data.content;
      collectedImageNodes.push({ ...startNode, data: { ...startNode.data, content: base64Content }});
      collectedIds.add(startNode.id);
    }
  }

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    const incomingEdges = allEdges.filter(edge => edge.target === currentId);

    for (const edge of incomingEdges) {
      const sourceNode = nodesMap[edge.source];
      if (sourceNode) {
        if (!collectedIds.has(sourceNode.id)) {
           if (sourceNode.type === NodeType.IMAGE && sourceNode.data.content) {
              const base64Content = sourceNode.data.content.split(',')[1] || sourceNode.data.content;
              collectedImageNodes.push({ ...sourceNode, data: { ...sourceNode.data, content: base64Content }});
              collectedIds.add(sourceNode.id);
           }
           if (sourceNode.type === NodeType.TEXT && sourceNode.data.content) {
              collectedTextNodes.push(sourceNode);
              collectedIds.add(sourceNode.id);
           }
        }
        queue.push(sourceNode.id);
      }
    }
  }
  return { images: collectedImageNodes, texts: collectedTextNodes };
};


const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ src, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[200] flex items-center justify-center p-4 sm:p-8" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true"
        >
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white text-4xl leading-none hover:text-gray-300 transition-colors"
                aria-label="Close image preview"
            >
                &times;
            </button>
            <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                <img 
                    src={src} 
                    alt="Image Preview" 
                    className="block max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl shadow-black/50"
                />
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationTrigger, setGenerationTrigger] = useState<GenerationRequest | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const copyingNodeRef = useRef<Node<NodeData> | null>(null);
  const [tokenUsage, setTokenUsage] = useState({ last: 0, sessionTotal: 0 });

  // Undo/Redo state
  const [history, setHistory] = useState<FlowState[]>([{ nodes: [], edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isRestoringRef = useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const deleteNode = useCallback((idToDelete: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== idToDelete));
    setEdges((eds) => eds.filter((edge) => edge.source !== idToDelete && edge.target !== idToDelete));
  }, [setNodes, setEdges]);

  // Save current flow state to history
  useEffect(() => {
    if (isRestoringRef.current) {
        isRestoringRef.current = false;
        return;
    }

    const isDragging = nodes.some((node) => node.dragging);
    if (isDragging) {
        return;
    }

    const currentState = { nodes, edges };
    const lastStateInHistory = history[historyIndex];

    if (JSON.stringify(currentState) === JSON.stringify(lastStateInHistory)) {
        return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges]);


  const undo = useCallback(() => {
    if (canUndo) {
        isRestoringRef.current = true;
        setHistoryIndex((prev) => prev - 1);
        const prevState = history[historyIndex - 1];
        setNodes(prevState.nodes);
        setEdges(prevState.edges);
    }
  }, [canUndo, history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (canRedo) {
        isRestoringRef.current = true;
        setHistoryIndex((prev) => prev + 1);
        const nextState = history[historyIndex + 1];
        setNodes(nextState.nodes);
        setEdges(nextState.edges);
    }
  }, [canRedo, history, historyIndex, setNodes, setEdges]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const undoKeyPressed = (isMac ? event.metaKey && !event.shiftKey : event.ctrlKey) && event.key === 'z';
        const redoKeyPressed = (isMac ? event.metaKey && event.shiftKey : event.ctrlKey) && event.key === 'y';
        const redoKeyPressedShift = (isMac ? event.metaKey && event.shiftKey : event.ctrlKey) && event.key.toLowerCase() === 'z';

        if (undoKeyPressed) {
            event.preventDefault();
            undo();
        } else if (redoKeyPressed || redoKeyPressedShift) {
            event.preventDefault();
            redo();
        }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  const nodeTypes = useMemo(() => ({
    [NodeType.IMAGE]: ImageNode,
    [NodeType.TEXT]: TextNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);
  
  const handlePreviewImage = useCallback((src: string) => {
    setPreviewImageSrc(src);
  }, []);

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({ ...params, type: 'custom', animated: true }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const requestGenerate = useCallback((nodeId: string, type: GenerationRequestType, options?: any) => {
    setGenerationTrigger({ nodeId, type, options });
  }, []);

  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    if (event.altKey) {
      copyingNodeRef.current = node;
    }
  }, []);

  const onNodeDragStop = useCallback((event: React.MouseEvent, droppedNode: Node<NodeData>) => {
      if (copyingNodeRef.current) {
          const originalNode = copyingNodeRef.current;
          const newNodeId = getId();

          const newNode: Node<NodeData> = {
              ...originalNode,
              id: newNodeId,
              position: droppedNode.position,
              selected: false,
              dragging: false,
              data: {
                  ...originalNode.data,
                  onDelete: deleteNode,
                  onUpdate: setNodes,
                  onGenerate: requestGenerate,
                  onPreview: handlePreviewImage,
              }
          };
          
          const connectedEdges = edges.filter(
              (edge) => edge.source === originalNode.id || edge.target === originalNode.id
          );

          const newEdges = connectedEdges.map((edge) => {
              const newEdge = { ...edge, id: `e_${getId()}` };
              if (edge.source === originalNode.id) {
                  newEdge.source = newNodeId;
              }
              if (edge.target === originalNode.id) {
                  newEdge.target = newNodeId;
              }
              return newEdge;
          });

          setNodes(nds => {
            const restoredNodes = nds.map(n => {
                if (n.id === originalNode.id) {
                    return { ...n, position: originalNode.position, dragging: false };
                }
                return n;
            });
            return restoredNodes.concat(newNode);
          });

          setEdges((eds) => eds.concat(newEdges));
          
          copyingNodeRef.current = null;
      }
  }, [setNodes, setEdges, requestGenerate, handlePreviewImage, deleteNode, edges]);

  const onDrop = useCallback((event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // 1. Check for node drop from sidebar
      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (type) {
        let newNode: Node<NodeData>;
        switch (type) {
          case NodeType.IMAGE:
            newNode = { id: getId(), type, position, data: { onUpdate: setNodes, onGenerate: requestGenerate, onPreview: handlePreviewImage, onDelete: deleteNode, label: 'Image', content: null, mimeType: null, aspectRatio: '1:1', loading: false } };
            break;
          case NodeType.TEXT:
            newNode = { id: getId(), type, position, data: { onUpdate: setNodes, onGenerate: requestGenerate, onDelete: deleteNode, label: 'Text Prompt', content: '', loading: false } };
            break;
          default:
            return;
        }
        setNodes((nds) => nds.concat(newNode));
        return;
      }
      
      // 2. Check for file drop
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
            fileToBase64(file).then(({ dataUrl }) => {
                const img = new Image();
                img.onload = () => {
                    const aspectRatio: AspectRatio = '1:1';
                    const newNode: Node<NodeData> = {
                        id: getId(),
                        type: NodeType.IMAGE,
                        position,
                        data: { onUpdate: setNodes, onGenerate: requestGenerate, onPreview: handlePreviewImage, onDelete: deleteNode, label: file.name, content: dataUrl, mimeType: file.type, aspectRatio, loading: false },
                    };
                    setNodes((nds) => nds.concat(newNode));
                };
                img.src = dataUrl;
            });
            return;
        }
    }

    // 3. Check for text drop
    const text = event.dataTransfer.getData('text/plain');
    if (text) {
        const newNode: Node<NodeData> = {
            id: getId(),
            type: NodeType.TEXT,
            position,
            data: { onUpdate: setNodes, onGenerate: requestGenerate, onDelete: deleteNode, label: 'Text Prompt', content: text, loading: false },
        };
        setNodes((nds) => nds.concat(newNode));
    }
    },
    [reactFlowInstance, setNodes, requestGenerate, handlePreviewImage, deleteNode]
  );

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
        if (!reactFlowInstance) return;

        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        const position = reactFlowInstance.project({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        if (event.clipboardData) {
            if (event.clipboardData.files.length > 0) {
                const file = event.clipboardData.files[0];
                if (file.type.startsWith('image/')) {
                    event.preventDefault();
                    fileToBase64(file).then(({ dataUrl }) => {
                        const newNode: Node<NodeData> = {
                            id: getId(), type: NodeType.IMAGE, position,
                            data: { onUpdate: setNodes, onGenerate: requestGenerate, onPreview: handlePreviewImage, onDelete: deleteNode, label: file.name, content: dataUrl, mimeType: file.type, aspectRatio: '1:1', loading: false }
                        };
                        setNodes((nds) => nds.concat(newNode));
                    });
                }
            } else {
                const text = event.clipboardData.getData('text');
                if (text) {
                    event.preventDefault();
                    const newNode: Node<NodeData> = {
                        id: getId(), type: NodeType.TEXT, position,
                        data: { onUpdate: setNodes, onGenerate: requestGenerate, onDelete: deleteNode, label: 'Text Prompt', content: text, loading: false }
                    };
                    setNodes((nds) => nds.concat(newNode));
                }
            }
        }
    };
    document.addEventListener('paste', handlePaste);
    return () => {
        document.removeEventListener('paste', handlePaste);
    };
}, [reactFlowInstance, requestGenerate, setNodes, handlePreviewImage, deleteNode]);

  useEffect(() => {
    if (!generationTrigger || !reactFlowInstance) return;

    const runGeneration = async () => {
      setError(null);
      const { nodeId, type, options } = generationTrigger;
      
      setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, loading: true } } : n));

      try {
        const currentNodes = reactFlowInstance.getNodes();
        const currentEdges = reactFlowInstance.getEdges();

        switch(type) {
            case 'image-generate': {
                const targetNode = currentNodes.find(n => n.id === nodeId);
                if (!targetNode) throw new Error("Target node not found.");
                const includeSelf = !!targetNode.data.content && targetNode.type === NodeType.IMAGE;
                const { images, texts } = findUpstreamNodes(nodeId, currentNodes, currentEdges, includeSelf);

                const validTexts = texts.filter(n => n.data.content?.trim());
                const prompt = validTexts.map(n => n.data.content!.trim()).join(' ');

                if (images.length === 0 && validTexts.length === 0) {
                    throw new Error('Please connect at least one Image or Text node to generate an image.');
                }
                const aspectRatio = options.aspectRatio || '1:1';
                const { b64, mimeType, usageMetadata } = await generateFromNodes(images, prompt, aspectRatio);
                setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, content: `data:${mimeType};base64,${b64}`, mimeType, aspectRatio } } : node));
                if (usageMetadata?.totalTokenCount) {
                  setTokenUsage(prev => ({ last: usageMetadata.totalTokenCount, sessionTotal: prev.sessionTotal + usageMetadata.totalTokenCount }));
                }
                break;
            }
            case 'prompt-from-image': {
                const { images } = findUpstreamNodes(nodeId, currentNodes, currentEdges);
                if (images.length === 0) {
                    throw new Error('Please connect an image node to generate a prompt.');
                }
                const { prompt, usageMetadata } = await generatePromptFromImage(images[0]);
                setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, content: prompt } } : node));
                if (usageMetadata?.totalTokenCount) {
                  setTokenUsage(prev => ({ last: usageMetadata.totalTokenCount, sessionTotal: prev.sessionTotal + usageMetadata.totalTokenCount }));
                }
                break;
            }
            case 'enhance-prompt': {
                const targetNode = currentNodes.find((n: Node<NodeData>) => n.id === nodeId);
                if (!targetNode || !targetNode.data.content) throw new Error("Target node or its content not found for enhancing.");
                
                const { enhanced, usageMetadata } = await enhancePrompt(targetNode.data.content);
                setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, content: enhanced } } : node));
                
                if (usageMetadata?.totalTokenCount) {
                  setTokenUsage(prev => ({ last: usageMetadata.totalTokenCount, sessionTotal: prev.sessionTotal + usageMetadata.totalTokenCount }));
                }
                break;
            }
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
            let { message } = e;
            if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
                message = 'API quota exceeded. Please check your billing details or try again later.';
            }
            setError(message);
        } else {
            setError('An unknown error occurred.');
        }
      } finally {
        setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, loading: false } } : n));
        setGenerationTrigger(null);
      }
    };

    runGeneration();
  }, [generationTrigger, reactFlowInstance, setNodes]);

  const exportWorkflow = useCallback((): string => {
    const serializableNodes = nodes.map(({ id, type, position, data }) => {
        const serializableData: any = {
            label: data.label,
            // content: data.content, // Omit large image data
            // mimeType: data.mimeType,
            aspectRatio: data.aspectRatio,
        };
        
        // Only include content for text nodes
        if (type === NodeType.TEXT) {
            serializableData.content = data.content;
        }

        return {
            id,
            type,
            position,
            data: serializableData,
        };
    });

    const serializableEdges = edges.map(({ id, source, target, type, animated }) => ({
        id,
        source,
        target,
        type,
        animated,
    }));

    const workflow = {
        nodes: serializableNodes,
        edges: serializableEdges,
    };

    return JSON.stringify(workflow, null, 2);
  }, [nodes, edges]);

  const importWorkflow = useCallback((json: string) => {
    try {
        const workflow = JSON.parse(json);

        if (!workflow.nodes || !workflow.edges || !Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) {
            throw new Error("Invalid workflow structure.");
        }

        let maxId = -1;
        const newNodes: Node<NodeData>[] = workflow.nodes.map((node: any) => {
            const nodeIdNum = parseInt(node.id.split('_')[1] || '0', 10);
            if (!isNaN(nodeIdNum) && nodeIdNum > maxId) {
                maxId = nodeIdNum;
            }
             // Backwards compatibility: convert old output nodes to image nodes
            if (node.type === 'outputNode') {
                node.type = NodeType.IMAGE;
                node.data.label = 'Output';
            }

            // Skip unknown node types
            if (!Object.values(NodeType).includes(node.type as NodeType)) {
                console.warn(`Unsupported node type during import: ${node.type}. Skipping.`);
                return null;
            }

            return {
                ...node,
                data: {
                    ...node.data,
                    onUpdate: setNodes,
                    onGenerate: requestGenerate,
                    onPreview: handlePreviewImage,
                    onDelete: deleteNode,
                    loading: false,
                },
            };
        }).filter((n: Node<NodeData> | null): n is Node<NodeData> => n !== null);

        const newEdges: Edge[] = workflow.edges.map((edge: any) => ({
            ...edge,
            type: 'custom',
        }));
        
        setNodes(newNodes);
        setEdges(newEdges);
        setIdCounter(maxId + 1);
        setIsShareModalOpen(false);
        
        setTimeout(() => {
            if (reactFlowInstance) {
                reactFlowInstance.fitView({ padding: 0.1 });
            }
        }, 100);

    } catch (e) {
        console.error("Failed to import workflow:", e);
        // The modal will show a generic error.
    }
  }, [reactFlowInstance, requestGenerate, setNodes, setEdges, handlePreviewImage, deleteNode]);

  const imageNodes = useMemo(() => {
    return nodes.filter(node => 
        node.type === NodeType.IMAGE && node.data.content
    );
  }, [nodes]);

  const locateNode = useCallback((nodeId: string) => {
    if (reactFlowInstance) {
        reactFlowInstance.fitView({
            nodes: [{ id: nodeId }],
            duration: 800,
            padding: 0.2,
            maxZoom: 1.5,
        });
    }
    setIsGalleryOpen(false);
  }, [reactFlowInstance]);


  return (
    <div className="w-screen h-screen bg-neutral-950 text-gray-200 font-sans flex flex-col antialiased">
      <Header 
        onShareClick={() => setIsShareModalOpen(true)}
        onGalleryClick={() => setIsGalleryOpen(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        tokenUsage={tokenUsage}
      />
      <main className="flex-grow flex">
        <ReactFlowProvider>
          <Sidebar />
          <div className="flex-grow h-full" ref={reactFlowWrapper}>
            {error && (
                 <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-900/70 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm z-50 backdrop-blur-sm" role="alert">
                    <p>{error}</p>
                 </div>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              nodesDraggable={!isLocked}
              nodesConnectable={!isLocked}
              elementsSelectable={!isLocked}
              fitView
              className="bg-transparent"
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} className="!bg-neutral-950" />
              <MiniMap
                  position="bottom-right"
                  nodeColor={(n) => {
                      switch (n.type) {
                          case NodeType.IMAGE: return '#ca8a04';
                          case NodeType.TEXT: return '#10b981';
                          default: return '#e5e5e5';
                      }
                  }}
                  nodeStrokeWidth={3}
                  maskColor="#1C1C1C"
                  maskStrokeColor="#555"
                  className="!bg-[#1C1C1C] !border !border-neutral-700/50"
                  pannable
                  zoomable
              />
              <Controls isLocked={isLocked} onLockToggle={() => setIsLocked(l => !l)} />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </main>
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        workflowJson={exportWorkflow()}
        onImport={importWorkflow}
      />
      <GallerySheet
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={imageNodes}
        onLocateNode={locateNode}
        onPreview={handlePreviewImage}
      />
      {previewImageSrc && (
        <ImagePreviewModal src={previewImageSrc} onClose={() => setPreviewImageSrc(null)} />
      )}
    </div>
  );
};

export default App;
