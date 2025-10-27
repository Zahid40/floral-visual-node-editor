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
  Controls as ReactFlowControls,
} from 'reactflow';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Loader } from './components/Loader';
import { generateFromNodes, generatePromptFromImage, fileToBase64 } from './services/geminiService';
import { NodeData, NodeType, GenerationRequest, GenerationRequestType, AspectRatio } from './types';
import { ImageNode } from './components/nodes/ImageNode';
import { TextNode } from './components/nodes/TextNode';
import { OutputNode } from './components/nodes/OutputNode';
import { CustomEdge } from './components/edges/CustomEdge';

let id = 0;
const getId = () => `dnd-node_${id++}`;

const App: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationTrigger, setGenerationTrigger] = useState<GenerationRequest | null>(null);

  const nodeTypes = useMemo(() => ({
    [NodeType.IMAGE]: ImageNode,
    [NodeType.TEXT]: TextNode,
    [NodeType.OUTPUT]: OutputNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

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
            newNode = { id: getId(), type, position, data: { onUpdate: setNodes, onGenerate: requestGenerate, label: 'Image', content: null, mimeType: null, aspectRatio: '1:1' } };
            break;
          case NodeType.TEXT:
            newNode = { id: getId(), type, position, data: { onUpdate: setNodes, onGenerate: requestGenerate, label: 'Text Prompt', content: '' } };
            break;
          case NodeType.OUTPUT:
             newNode = { id: getId(), type, position, data: { onUpdate: setNodes, onGenerate: requestGenerate, label: 'Output', content: null, aspectRatio: '1:1' } };
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
                        data: { onUpdate: setNodes, onGenerate: requestGenerate, label: file.name, content: dataUrl, mimeType: file.type, aspectRatio },
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
            data: { onUpdate: setNodes, onGenerate: requestGenerate, label: 'Text Prompt', content: text },
        };
        setNodes((nds) => nds.concat(newNode));
    }
    },
    [reactFlowInstance, setNodes, requestGenerate]
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
                            data: { onUpdate: setNodes, onGenerate: requestGenerate, label: file.name, content: dataUrl, mimeType: file.type, aspectRatio: '1:1' }
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
                        data: { onUpdate: setNodes, onGenerate: requestGenerate, label: 'Text Prompt', content: text }
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
}, [reactFlowInstance, requestGenerate, setNodes]);


  const findUpstreamNodes = useCallback((startNodeId: string, includeSelf: boolean = false): { images: Node<NodeData>[], texts: Node<NodeData>[] } => {
    const collectedImageNodes: Node<NodeData>[] = [];
    const collectedTextNodes: Node<NodeData>[] = [];
    const collectedIds = new Set<string>();

    const nodesMap = Object.fromEntries(nodes.map(node => [node.id, node]));
    const visited = new Set<string>();
    const queue: string[] = [startNodeId];

    if (includeSelf) {
      const startNode = nodesMap[startNodeId];
      if (startNode && (startNode.type === NodeType.IMAGE) && startNode.data.content) {
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

      const incomingEdges = edges.filter(edge => edge.target === currentId);

      for (const edge of incomingEdges) {
        const sourceNode = nodesMap[edge.source];
        if (sourceNode) {
          if (!collectedIds.has(sourceNode.id)) {
             if ((sourceNode.type === NodeType.IMAGE) && sourceNode.data.content) {
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
  }, [nodes, edges]);

  useEffect(() => {
    if (!generationTrigger) return;

    const runGeneration = async () => {
      setError(null);
      setIsLoading(true);

      const { nodeId, type, options } = generationTrigger;

      try {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (!targetNode) throw new Error("Target node not found.");

        switch(type) {
            case 'image-generate': {
                const includeSelf = !!targetNode.data.content && targetNode.type === NodeType.IMAGE;
                const { images, texts } = findUpstreamNodes(nodeId, includeSelf);

                const validTexts = texts.filter(n => n.data.content?.trim());
                const prompt = validTexts.map(n => n.data.content!.trim()).join(' ');

                if (images.length === 0 && validTexts.length === 0) {
                    throw new Error('Please connect at least one Image or Text node to generate an image.');
                }
                const aspectRatio = options.aspectRatio || '1:1';
                const { b64, mimeType } = await generateFromNodes(images, prompt, aspectRatio);
                setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, content: `data:${mimeType};base64,${b64}`, mimeType, aspectRatio } } : node));
                break;
            }
            case 'prompt-from-image': {
                const { images } = findUpstreamNodes(nodeId);
                if (images.length === 0) {
                    throw new Error('Please connect an image node to generate a prompt.');
                }
                const prompt = await generatePromptFromImage(images[0]);
                setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, content: prompt } } : node));
                break;
            }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
        setGenerationTrigger(null);
      }
    };

    runGeneration();
  }, [generationTrigger, findUpstreamNodes, setNodes, nodes]);


  return (
    <div className="w-screen h-screen bg-[#0a0a0a] text-gray-200 font-sans flex flex-col antialiased">
       <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="animated-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A855F7">
              <animate attributeName="offset" values="-1; 2" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#F0F0F0">
              <animate attributeName="offset" values="-0.5; 1.5" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#A855F7">
              <animate attributeName="offset" values="0; 3" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
      </svg>
      <Header />
      <main className="flex-grow flex">
        <ReactFlowProvider>
          <Sidebar />
          <div className="flex-grow h-full" ref={reactFlowWrapper}>
            {isLoading && <Loader />}
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
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
            >
              <Background gap={24} color="#2d2d2d" />
              <ReactFlowControls />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </main>
    </div>
  );
};

export default App;